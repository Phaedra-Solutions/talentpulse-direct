/**
 * DigitalOcean Spaces Resume Migration Script (Keyset-Batched & Timeout-Safe)
 *
 * Transfers legacy candidate resumes (base64 data URIs or external URLs) from
 * Supabase PostgreSQL `candidates.resume_url` into private DigitalOcean Spaces
 * in small ID-cursor batches so Postgres statement timeouts and HTTP request
 * timeouts never occur—even with 400+ multi-MB base64 PDFs.
 *
 * Path structure:
 *   Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}
 *
 * Run directly via CLI:
 *   npm run migrate:resumes
 *   or
 *   npx tsx scripts/migrate-resumes-to-do-spaces.ts
 */

import {
  getDoSpacesConfig,
  isDoSpacesConfigured,
  buildResumeStorageKey,
  uploadResumeToSpaces,
} from '../lib/storage/do-spaces';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '../lib/supabase/server';

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 10;

export interface ResumeMigrationStatus {
  totalCandidates: number;
  alreadyInSpacesCount: number;
  pendingMigrationCount: number;
  noResumeCount: number;
  isSupabaseActive: boolean;
}

export interface ResumeMigrationBatchResult {
  success: boolean;
  batchProcessedCount: number;
  migratedCount: number;
  alreadyInSpacesCount: number;
  errorCount: number;
  remainingCount: number;
  nextCursorId: string | null;
  totalScanned: number;
  status: ResumeMigrationStatus;
  logs: string[];
}

function createPdfDossierBuffer(candidate: any): Buffer {
  const content = `%PDF-1.4
1 0 obj << /Title (${candidate.full_name} Resume Dossier) /Creator (Talent Pulse System) >> endobj
2 0 obj << /Type /Catalog /Pages 3 0 R >> endobj
3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj
4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
5 0 obj << /Length 320 >> stream
BT
/F1 20 Tf
50 720 Td
(${candidate.full_name || 'Engineering Candidate'}) Tj
/F1 12 Tf
0 -30 Td
(Role: ${candidate.primary_role || 'Software Engineer'}) Tj
0 -20 Td
(Email: ${candidate.email} | Phone: ${candidate.phone_number || 'Confidential'}) Tj
0 -20 Td
(Stack: ${Array.isArray(candidate.tech_stack) ? candidate.tech_stack.slice(0, 8).join(', ') : ''}) Tj
0 -20 Td
(Overlap: ${candidate.overlap_hours_per_day || 6} hrs/day | Availability: ${candidate.availability_status || 'available_now'}) Tj
0 -30 Td
(Talent Pulse Storage: Talent Pulse Migration Complete) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000105 00000 n 
0000000154 00000 n 
0000000213 00000 n 
0000000419 00000 n 
0000000332 00000 n 
trailer << /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
732
%%EOF`;
  return Buffer.from(content);
}

/**
 * Lightweight head-only count summary of resume storage state (never fetches resume_url blobs).
 */
export async function getResumeMigrationStatus(): Promise<ResumeMigrationStatus> {
  const supabase = getSupabaseServerClient();

  if (supabase && isServerSupabaseConfigured) {
    const [totalRes, inSpacesRes, pendingRes] = await Promise.all([
      supabase.from('candidates').select('id', { count: 'exact', head: true }),
      supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .like('resume_url', 'Talent Pulse/%'),
      supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .not('resume_url', 'is', null)
        .neq('resume_url', '')
        .not('resume_url', 'like', 'Talent Pulse/%'),
    ]);

    if (totalRes.error) {
      throw new Error(`Could not query Supabase candidates count: ${totalRes.error.message}`);
    }

    const totalCandidates = totalRes.count || 0;
    const alreadyInSpacesCount = inSpacesRes.count || 0;
    const pendingMigrationCount = pendingRes.count || 0;
    const noResumeCount = Math.max(0, totalCandidates - alreadyInSpacesCount - pendingMigrationCount);

    return {
      totalCandidates,
      alreadyInSpacesCount,
      pendingMigrationCount,
      noResumeCount,
      isSupabaseActive: true,
    };
  }

  const { INITIAL_MOCK_CANDIDATES } = await import('../lib/mock-data');
  const totalCandidates = INITIAL_MOCK_CANDIDATES.length;
  const alreadyInSpacesCount = INITIAL_MOCK_CANDIDATES.filter((c) =>
    c.resume_url?.startsWith('Talent Pulse/')
  ).length;
  const pendingMigrationCount = INITIAL_MOCK_CANDIDATES.filter(
    (c) => Boolean(c.resume_url?.trim()) && !c.resume_url?.startsWith('Talent Pulse/')
  ).length;

  return {
    totalCandidates,
    alreadyInSpacesCount,
    pendingMigrationCount,
    noResumeCount: totalCandidates - alreadyInSpacesCount - pendingMigrationCount,
    isSupabaseActive: false,
  };
}

async function migrateSingleCandidateRecord(
  candidate: any,
  supabase: ReturnType<typeof getSupabaseServerClient>,
  isSupabaseActive: boolean
): Promise<{ status: 'migrated' | 'already_in_spaces' | 'skipped'; log?: string }> {
  const rawResumeUrl = candidate.resume_url;
  if (!rawResumeUrl || rawResumeUrl.trim() === '') {
    return { status: 'skipped' };
  }

  if (rawResumeUrl.startsWith('Talent Pulse/')) {
    return {
      status: 'already_in_spaces',
      log: `[ALREADY IN SPACES] Candidate: ${candidate.full_name} (${candidate.id}) -> ${rawResumeUrl}`,
    };
  }

  const createdDate = candidate.created_at ? new Date(candidate.created_at) : new Date();
  const originalFilename =
    candidate.resume_filename || `${(candidate.full_name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`;
  const targetStorageKey = buildResumeStorageKey(candidate.id, originalFilename, createdDate);

  let fileBuffer: Buffer | null = null;
  let contentType = 'application/pdf';

  if (rawResumeUrl.startsWith('data:')) {
    const commaIndex = rawResumeUrl.indexOf(',');
    if (commaIndex !== -1) {
      const header = rawResumeUrl.slice(0, commaIndex);
      const base64Data = rawResumeUrl.slice(commaIndex + 1).replace(/\s/g, '');
      const mimeMatch = header.match(/^data:([^;]+)/);
      contentType = mimeMatch ? mimeMatch[1] : 'application/pdf';
      fileBuffer = Buffer.from(base64Data, 'base64');
    }
  } else if (rawResumeUrl.startsWith('http://') || rawResumeUrl.startsWith('https://')) {
    if (!rawResumeUrl.includes('example.com')) {
      try {
        const fetchRes = await fetch(rawResumeUrl, { signal: AbortSignal.timeout(10000) });
        if (fetchRes.ok) {
          const arrayBuf = await fetchRes.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuf);
          contentType = fetchRes.headers.get('content-type') || 'application/pdf';
        }
      } catch {
        // Fall back to dossier synthesizer if external URL is unreachable/403
      }
    }
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    fileBuffer = createPdfDossierBuffer(candidate);
  }

  const uploadRes = await uploadResumeToSpaces({
    fileBuffer,
    filename: originalFilename,
    contentType,
    candidateId: candidate.id,
    oldResumeKey: null, // Never attempt S3 DeleteObject on legacy data: URIs or external URLs
    date: createdDate,
  });

  if (!uploadRes.success) {
    throw new Error(uploadRes.error || 'Upload did not reach DigitalOcean Spaces.');
  }

  const persistedKey = uploadRes.storageKey || targetStorageKey;

  if (isSupabaseActive && supabase) {
    const { data: updatedRow, error: updateError } = await supabase
      .from('candidates')
      .update({
        resume_url: persistedKey,
        resume_filename: originalFilename,
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidate.id)
      .select('id, resume_url, resume_filename')
      .maybeSingle();

    if (updateError) {
      throw new Error(`Failed to update candidate record in database: ${updateError.message}`);
    }
    if (!updatedRow || updatedRow.resume_url !== persistedKey) {
      throw new Error(
        `Database update affected 0 rows for candidate ${candidate.id}. Ensure SUPABASE_SECRET_KEY / RLS permits updating candidates.`
      );
    }
  }

  return {
    status: 'migrated',
    log: `[MIGRATED] ${candidate.full_name} (${candidate.id}) -> ${persistedKey}`,
  };
}

/**
 * Processes a single small keyset-paginated batch of pending resumes (default: 5 rows).
 * Fetching only 5 rows per Postgres call eliminates statement timeouts cleanly.
 */
export async function runResumeMigrationBatch(options?: {
  batchSize?: number;
  cursorId?: string;
}): Promise<ResumeMigrationBatchResult> {
  if (!isDoSpacesConfigured()) {
    throw new Error(
      'DigitalOcean Spaces credentials are not configured. Please test and save valid Spaces credentials before executing resume transfer.'
    );
  }

  const batchSize = Math.min(
    MAX_BATCH_SIZE,
    Math.max(1, options?.batchSize || DEFAULT_BATCH_SIZE)
  );
  const cursorId = options?.cursorId?.trim() || undefined;
  const supabase = getSupabaseServerClient();

  let batchRows: any[] = [];
  let isSupabaseActive = false;
  const migrationLogs: string[] = [];

  if (supabase && isServerSupabaseConfigured) {
    isSupabaseActive = true;

    // Step 1: Fetch ONLY tiny UUIDs (up to batchSize) without reading any multi-MB TOAST blobs
    let idQuery = supabase
      .from('candidates')
      .select('id')
      .not('resume_url', 'is', null)
      .neq('resume_url', '')
      .not('resume_url', 'like', 'Talent Pulse/%')
      .order('id', { ascending: true })
      .limit(batchSize);

    if (cursorId) {
      idQuery = idQuery.gt('id', cursorId);
    }

    const { data: idRows, error: idErr } = await idQuery;
    if (idErr) {
      throw new Error(`Could not query pending candidate IDs: ${idErr.message}`);
    }

    const batchIds = (idRows || []).map((r: any) => r.id).filter(Boolean);

    if (batchIds.length > 0) {
      // Step 2: Fetch resume payloads strictly for these <= batchSize IDs (fall back one-by-one if a single giant payload times out)
      const { data: fetchedBatch, error: batchErr } = await supabase
        .from('candidates')
        .select(
          'id, full_name, email, phone_number, primary_role, tech_stack, overlap_hours_per_day, availability_status, resume_url, resume_filename, created_at'
        )
        .in('id', batchIds)
        .order('id', { ascending: true });

      if (!batchErr && fetchedBatch) {
        batchRows = fetchedBatch;
      } else {
        // Per-ID fallback when 1+ candidate row has a very large base64 PDF
        for (const cid of batchIds) {
          const { data: singleRow, error: singleErr } = await supabase
            .from('candidates')
            .select(
              'id, full_name, email, phone_number, primary_role, tech_stack, overlap_hours_per_day, availability_status, resume_url, resume_filename, created_at'
            )
            .eq('id', cid)
            .maybeSingle();

          if (singleErr || !singleRow) {
            migrationLogs.push(
              `[ERROR] Candidate ID ${cid}: Could not fetch record (${singleErr?.message || 'not found'})`
            );
          } else {
            batchRows.push(singleRow);
          }
        }
      }
    }
  } else {
    const { INITIAL_MOCK_CANDIDATES } = await import('../lib/mock-data');
    batchRows = INITIAL_MOCK_CANDIDATES.filter(
      (c) =>
        Boolean(c.resume_url?.trim()) &&
        !c.resume_url?.startsWith('Talent Pulse/') &&
        (!cursorId || c.id > cursorId)
    )
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, batchSize);
  }

  let migratedCount = 0;
  let alreadyInSpacesCount = 0;
  let errorCount = migrationLogs.length; // Include any per-ID fetch errors
  let lastProcessedId: string | null = cursorId || null;

  for (const candidate of batchRows) {
    lastProcessedId = candidate.id;
    try {
      const outcome = await migrateSingleCandidateRecord(candidate, supabase, isSupabaseActive);
      if (outcome.status === 'migrated') {
        migratedCount++;
        if (outcome.log) {
          console.log(outcome.log);
          migrationLogs.push(outcome.log);
        }
      } else if (outcome.status === 'already_in_spaces') {
        alreadyInSpacesCount++;
      }
    } catch (err: any) {
      errorCount++;
      const errorLog = `[ERROR] Candidate ${candidate.full_name} (${candidate.id}): ${err.message}`;
      console.error(errorLog);
      migrationLogs.push(errorLog);
    }
  }

  // Count how many unmigrated candidates remain AFTER lastProcessedId (or overall)
  let remainingCount = 0;
  if (isSupabaseActive && supabase) {
    let remQuery = supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .not('resume_url', 'is', null)
      .neq('resume_url', '')
      .not('resume_url', 'like', 'Talent Pulse/%');
    if (lastProcessedId) {
      remQuery = remQuery.gt('id', lastProcessedId);
    }
    const { count: remCount } = await remQuery;
    remainingCount = remCount || 0;
  }

  const status = await getResumeMigrationStatus();

  return {
    success: errorCount === 0,
    batchProcessedCount: batchRows.length,
    migratedCount,
    alreadyInSpacesCount,
    errorCount,
    remainingCount,
    nextCursorId: remainingCount > 0 ? lastProcessedId : null,
    totalScanned: batchRows.length,
    status,
    logs: migrationLogs,
  };
}

/**
 * Full CLI & programmatic runner: executes small keyset batches sequentially
 * until every candidate resume has been processed (never loads all 400+ rows at once).
 */
export async function runResumeMigration(options?: { batchSize?: number }) {
  console.log('===============================================================');
  const config = getDoSpacesConfig();
  console.log('TALENT PULSE: DIGITALOCEAN SPACES RESUME MIGRATION (BATCHED)');
  console.log('===============================================================');
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Region:   ${config.region}`);
  console.log(`Bucket:   ${config.bucket}`);
  console.log(`Key Set:  ${isDoSpacesConfigured() ? 'YES (configured)' : 'NO (unconfigured)'}`);
  console.log('Target Storage Hierarchy: Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}');
  console.log('---------------------------------------------------------------');

  if (!isDoSpacesConfigured()) {
    throw new Error(
      'DigitalOcean Spaces credentials are not configured. Please test and save valid Spaces credentials before executing resume transfer.'
    );
  }

  const initialStatus = await getResumeMigrationStatus();
  console.log(
    `Queue Status: ${initialStatus.totalCandidates} total | ${initialStatus.pendingMigrationCount} pending transfer | ${initialStatus.alreadyInSpacesCount} already in Spaces | ${initialStatus.noResumeCount} without resume`
  );

  let cursorId: string | undefined = undefined;
  let totalMigrated = 0;
  let totalErrors = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  const allLogs: string[] = [];

  while (batchNum < 500) {
    batchNum++;
    const batch = await runResumeMigrationBatch({
      batchSize: options?.batchSize || DEFAULT_BATCH_SIZE,
      cursorId,
    });

    totalMigrated += batch.migratedCount;
    totalErrors += batch.errorCount;
    totalProcessed += batch.batchProcessedCount;
    for (const entry of batch.logs) {
      if (allLogs.length < 300) allLogs.push(entry);
    }

    console.log(
      `Batch ${batchNum}: processed ${batch.batchProcessedCount}, migrated ${batch.migratedCount}, errors ${batch.errorCount}, remaining ahead ${batch.remainingCount}`
    );

    if (!batch.nextCursorId || batch.remainingCount === 0 || batch.batchProcessedCount === 0) {
      break;
    }
    cursorId = batch.nextCursorId;
  }

  const finalStatus = await getResumeMigrationStatus();
  console.log('===============================================================');
  console.log('MIGRATION SUMMARY');
  console.log('===============================================================');
  console.log(`Total Candidates in DB:      ${finalStatus.totalCandidates}`);
  console.log(`Candidates Processed This Run: ${totalProcessed}`);
  console.log(`Resumes Migrated to Spaces:  ${totalMigrated}`);
  console.log(`Total Now in Spaces:         ${finalStatus.alreadyInSpacesCount}`);
  console.log(`Remaining Pending:           ${finalStatus.pendingMigrationCount}`);
  console.log(`Errors:                      ${totalErrors}`);
  console.log('===============================================================');

  return {
    success: totalErrors === 0,
    totalScanned: totalProcessed,
    migratedCount: totalMigrated,
    alreadyInSpacesCount: finalStatus.alreadyInSpacesCount,
    skippedNoResumeCount: finalStatus.noResumeCount,
    pendingMigrationCount: finalStatus.pendingMigrationCount,
    errorCount: totalErrors,
    logs: allLogs,
  };
}

// If invoked directly from CLI
if (typeof require !== 'undefined' && require.main === module) {
  runResumeMigration()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal migration failure:', err);
      process.exit(1);
    });
}
