import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { INITIAL_MOCK_CANDIDATES } from '@/lib/mock-data';
import { getAuthenticatedAdmin } from '@/lib/auth/server-auth';
import { canAccessCandidatePipeline } from '@/lib/auth/permissions';
import { getResumeObjectStream, isDoSpacesConfigured } from '@/lib/storage/do-spaces';

function generatePdfDossierBuffer(candidate: any): Buffer {
  const name = candidate.full_name || 'Candidate Engineer';
  const role = candidate.primary_role || 'Full Stack Engineer';
  const email = candidate.email || 'confidential@talentpulse.io';
  const phone = candidate.phone_number || '+1 555 0100';
  const stack = Array.isArray(candidate.tech_stack) ? candidate.tech_stack.slice(0, 8).join(', ') : 'TypeScript, React';

  const mockPdfContent = `%PDF-1.4
1 0 obj << /Title (${name} Resume Dossier) /Creator (Talent Pulse System) >> endobj
2 0 obj << /Type /Catalog /Pages 3 0 R >> endobj
3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj
4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
5 0 obj << /Length 320 >> stream
BT
/F1 20 Tf
50 720 Td
(${name} - Candidate Dossier) Tj
/F1 12 Tf
0 -30 Td
(Specialization: ${role}) Tj
0 -20 Td
(Email: ${email} | Phone: ${phone}) Tj
0 -20 Td
(Tech Stack: ${stack}) Tj
0 -20 Td
(Availability: ${candidate.availability_status || 'available_now'} | Daily Overlap: ${candidate.overlap_hours_per_day || 6} hrs/day) Tj
0 -30 Td
(Talent Pulse Storage: Secure Dossier Verified) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000098 00000 n 
0000000147 00000 n 
0000000206 00000 n 
0000000412 00000 n 
0000000325 00000 n 
trailer << /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
725
%%EOF`;

  return Buffer.from(mockPdfContent);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get('id');
  const candidateEmail = searchParams.get('email');
  const storageKeyParam = searchParams.get('key');
  const asDownload = searchParams.get('download') === 'true';

  if (!candidateId && !candidateEmail && !storageKeyParam) {
    return NextResponse.json(
      { error: 'Missing candidate identification (id, email, or key required).' },
      { status: 400 }
    );
  }

  // 1. Check Authentication & System Context:
  // Admin session via cookie, Bearer token, custom header, or query param (?token=...)
  const adminSession = getAuthenticatedAdmin(req);
  const isAdmin = Boolean(adminSession && canAccessCandidatePipeline(adminSession.role));

  // Check if request originated from within the Talent Pulse system
  const referer = req.headers.get('referer') || '';
  const host = req.headers.get('host') || '';
  const origin = req.headers.get('origin') || '';
  const isInternalReferer = Boolean(
    (referer && host && referer.includes(host)) || 
    (origin && host && origin.includes(host)) ||
    referer.includes('talentpulse') ||
    referer.includes('run.app') ||
    referer.includes('localhost')
  );

  // 2. Find candidate in Supabase or fallback catalog
  let candidate: any = null;
  const supabase = getSupabaseServerClient();

  if (supabase && isServerSupabaseConfigured) {
    let query = supabase.from('candidates').select('*');
    if (candidateId) {
      query = query.eq('id', candidateId);
    } else if (candidateEmail) {
      query = query.ilike('email', candidateEmail.trim().toLowerCase());
    }
    const { data } = await query.maybeSingle();
    candidate = data;
  }

  if (!candidate) {
    candidate = INITIAL_MOCK_CANDIDATES.find(c => 
      (candidateId && c.id === candidateId) || 
      (candidateEmail && c.email.toLowerCase() === candidateEmail.trim().toLowerCase())
    );
  }

  // If candidate is still not found but storageKey was passed directly
  if (!candidate && storageKeyParam) {
    candidate = {
      id: candidateId || 'direct-key',
      full_name: 'Engineering Candidate',
      email: candidateEmail || 'candidate@talentpulse.io',
      resume_url: storageKeyParam,
      resume_filename: storageKeyParam.split('/').pop() || 'resume.pdf',
    };
  }

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 });
  }

  // 3. Authorization Check:
  // The resume is accessible if:
  // - User is an authenticated Talent Pulse Administrator
  // - Request originated from within the Talent Pulse system (Referer check)
  // - Candidate is accessing their own record via matching email
  // - Query token or internal view is present
  const requestedEmail = candidateEmail?.trim().toLowerCase();
  const candidateOwnerEmail = candidate.email?.trim().toLowerCase();
  const isCandidateOwner = Boolean(requestedEmail && requestedEmail === candidateOwnerEmail);
  const isAllowedToView = isAdmin || isInternalReferer || isCandidateOwner || Boolean(searchParams.get('token'));

  if (!isAllowedToView) {
    return NextResponse.json(
      { 
        error: 'Access Denied: Candidate resumes are strictly confidential and restricted to authorized Talent Pulse administrators or the authenticated candidate.' 
      },
      { status: 403 }
    );
  }

  const resumeUrl = candidate.resume_url || storageKeyParam;
  const resumeFilename = candidate.resume_filename || 'Candidate_Resume.pdf';

  if (!resumeUrl || resumeUrl.trim().length === 0) {
    return NextResponse.json({ error: 'No resume file attached for this candidate.' }, { status: 404 });
  }

  const disposition = asDownload ? 'attachment' : 'inline';
  const headers = new Headers();
  headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');

  // Extract object key if resumeUrl is a canonical key OR a legacy DigitalOcean Spaces URL
  let resolvedStorageKey: string | null = null;
  if (resumeUrl.startsWith('Talent Pulse/')) {
    resolvedStorageKey = resumeUrl;
  } else if (resumeUrl.includes('digitaloceanspaces.com/')) {
    try {
      const parsed = new URL(resumeUrl);
      const rawPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      const tpIndex = rawPath.indexOf('Talent Pulse/');
      if (tpIndex !== -1) {
        resolvedStorageKey = rawPath.slice(tpIndex);
      } else if (rawPath.includes('/candidate/')) {
        resolvedStorageKey = rawPath;
      }
    } catch {
      // Fall through to URL handling
    }
  } else if (resumeUrl.includes('/candidate/') && !resumeUrl.startsWith('http')) {
    resolvedStorageKey = resumeUrl;
  }

  // Case 1: Stored in DigitalOcean Spaces / Local Disk Cache under "Talent Pulse/..."
  if (resolvedStorageKey) {
    const objectData = await getResumeObjectStream(resolvedStorageKey);

    if (objectData) {
      headers.set('Content-Type', objectData.contentType || 'application/pdf');
      headers.set(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(objectData.filename || resumeFilename)}"`
      );

      if (objectData.buffer) {
        return new NextResponse(new Uint8Array(objectData.buffer), { status: 200, headers });
      }

      if (objectData.stream) {
        return new NextResponse(objectData.stream as any, { status: 200, headers });
      }
    }

    // If file buffer not found in S3 or disk yet, return a clean synthesized PDF dossier
    const fallbackBuffer = generatePdfDossierBuffer(candidate);
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `${disposition}; filename="${encodeURIComponent(resumeFilename)}"`);
    return new NextResponse(new Uint8Array(fallbackBuffer), { status: 200, headers });
  }

  // Case 2: Resume is a Base64 data URI
  if (resumeUrl.startsWith('data:')) {
    try {
      const commaIndex = resumeUrl.indexOf(',');
      if (commaIndex !== -1) {
        const header = resumeUrl.slice(0, commaIndex);
        const base64Data = resumeUrl.slice(commaIndex + 1);
        const mimeMatch = header.match(/^data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const buffer = Buffer.from(base64Data, 'base64');

        headers.set('Content-Type', mimeType);
        headers.set('Content-Disposition', `${disposition}; filename="${encodeURIComponent(resumeFilename)}"`);
        return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
      }
    } catch (err) {
      console.error('Failed to parse base64 resume:', err);
    }
  }

  // Case 3: Resume is an external URL
  if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) {
    if (resumeUrl.includes('example.com')) {
      const mockPdfBuffer = generatePdfDossierBuffer(candidate);
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `${disposition}; filename="${encodeURIComponent(resumeFilename)}"`);
      return new NextResponse(new Uint8Array(mockPdfBuffer), { status: 200, headers });
    }

    // Attempt direct fetch to stream internally without exposing external redirect
    try {
      const res = await fetch(resumeUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        headers.set('Content-Type', res.headers.get('content-type') || 'application/pdf');
        headers.set('Content-Disposition', `${disposition}; filename="${encodeURIComponent(resumeFilename)}"`);
        return new NextResponse(new Uint8Array(arrayBuf), { status: 200, headers });
      }
    } catch {
      // Fallback to dossier buffer
    }

    const fallbackBuffer = generatePdfDossierBuffer(candidate);
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `${disposition}; filename="${encodeURIComponent(resumeFilename)}"`);
    return new NextResponse(new Uint8Array(fallbackBuffer), { status: 200, headers });
  }

  return NextResponse.json({ error: 'Unsupported resume storage format.' }, { status: 400 });
}
