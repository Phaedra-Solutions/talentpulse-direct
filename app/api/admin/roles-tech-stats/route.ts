import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canManageRolesAndTech } from '@/lib/auth/permissions';
import { INITIAL_MOCK_CANDIDATES } from '@/lib/mock-data';
import { INITIAL_ROLES, INITIAL_TECHNOLOGIES } from '@/lib/roles-tech-store';

function normalizeRoleSlugFromCandidate(primaryRole?: string | null, internalNotes?: string | null): string[] {
  const keys: string[] = [];
  const rawRole = (primaryRole || '').toLowerCase().trim();
  if (rawRole) {
    keys.push(rawRole);
    keys.push(rawRole.replace(/_/g, '-'));
  }

  if (internalNotes) {
    const match = internalNotes.match(/\[Role:\s*([\w-]+)\]/);
    if (match && match[1]) {
      const extracted = match[1].toLowerCase().trim();
      keys.push(extracted);
      keys.push(extracted.replace(/_/g, '-'));
    }
  }

  // Known aliases between role slugs and candidate enum keys
  const expanded = new Set<string>(keys);
  for (const k of keys) {
    if (k === 'ai_engineer' || k === 'ai-llm-engineer') {
      expanded.add('ai_engineer');
      expanded.add('ai-llm-engineer');
    } else if (k === 'forward_deployed_engineer' || k === 'forward-deployed-engineer') {
      expanded.add('forward_deployed_engineer');
      expanded.add('forward-deployed-engineer');
    } else if (k === 'mobile_app_developer' || k === 'mobile-developers') {
      expanded.add('mobile_app_developer');
      expanded.add('mobile-developers');
    } else if (k === 'solutions_architect' || k === 'solutions-architects') {
      expanded.add('solutions_architect');
      expanded.add('solutions-architects');
    } else if (k === 'full_stack' || k === 'full-stack-developers') {
      expanded.add('full_stack');
      expanded.add('full-stack-developers');
    } else if (k === 'fractional_cto' || k === 'fractional-cto') {
      expanded.add('fractional_cto');
      expanded.add('fractional-cto');
    }
  }

  return Array.from(expanded);
}

/**
 * Lightweight aggregation endpoint for /admin/roles.
 * Fetches ONLY 3 tiny scalar columns from candidates (primary_role, tech_stack, internal_notes) —
 * NEVER touches resume_url base64 blobs or written_pitch — and returns pre-aggregated counts.
 */
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req, canManageRolesAndTech);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const supabase = getSupabaseServerClient();

    if (supabase && isServerSupabaseConfigured) {
      // Fetch tiny candidate projection in batches + exact tech status counts + roles list
      const [rolesRes, pendingCountRes, approvedCountRes, rejectedCountRes] = await Promise.all([
        supabase.from('roles').select('id, slug'),
        supabase.from('technologies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('technologies').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('technologies').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);

      const roleSlugCounts: Record<string, number> = {};
      const techNameCounts: Record<string, number> = {};

      const chunkSize = 1000;
      let offset = 0;
      while (offset < 10000) {
        const { data: rows, error } = await supabase
          .from('candidates')
          .select('primary_role, tech_stack, internal_notes')
          .range(offset, offset + chunkSize - 1);

        if (error) {
          console.error('[GET /api/admin/roles-tech-stats] Candidate projection error:', error.message);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        if (!rows || rows.length === 0) break;

        for (const c of rows as any[]) {
          const roleKeys = normalizeRoleSlugFromCandidate(c.primary_role, c.internal_notes);
          for (const rk of roleKeys) {
            roleSlugCounts[rk] = (roleSlugCounts[rk] || 0) + 1;
          }

          if (Array.isArray(c.tech_stack)) {
            const seenInCandidate = new Set<string>();
            for (const rawTech of c.tech_stack) {
              if (typeof rawTech !== 'string') continue;
              const clean = rawTech.toLowerCase().trim();
              if (clean && !seenInCandidate.has(clean)) {
                seenInCandidate.add(clean);
                techNameCounts[clean] = (techNameCounts[clean] || 0) + 1;
              }
            }
          }
        }

        if (rows.length < chunkSize) break;
        offset += chunkSize;
      }

      const roleCountsById: Record<string, number> = {};
      for (const r of rolesRes.data || INITIAL_ROLES) {
        const slugLower = (r.slug || '').toLowerCase();
        roleCountsById[r.id] =
          roleSlugCounts[slugLower] ||
          roleSlugCounts[slugLower.replace(/-/g, '_')] ||
          0;
      }

      return NextResponse.json({
        success: true,
        roleCountsById,
        techNameCounts,
        techStatusCounts: {
          pending: pendingCountRes.count || 0,
          approved: approvedCountRes.count || 0,
          rejected: rejectedCountRes.count || 0,
        },
        source: 'supabase',
      });
    }

    // Offline demo fallback when Supabase is not configured
    const roleSlugCounts: Record<string, number> = {};
    const techNameCounts: Record<string, number> = {};
    for (const c of INITIAL_MOCK_CANDIDATES) {
      for (const rk of normalizeRoleSlugFromCandidate(c.primary_role, c.internal_notes)) {
        roleSlugCounts[rk] = (roleSlugCounts[rk] || 0) + 1;
      }
      if (Array.isArray(c.tech_stack)) {
        for (const t of c.tech_stack) {
          const clean = t.toLowerCase().trim();
          techNameCounts[clean] = (techNameCounts[clean] || 0) + 1;
        }
      }
    }

    const roleCountsById: Record<string, number> = {};
    for (const r of INITIAL_ROLES) {
      roleCountsById[r.id] = roleSlugCounts[r.slug.toLowerCase()] || 0;
    }

    return NextResponse.json({
      success: true,
      roleCountsById,
      techNameCounts,
      techStatusCounts: {
        pending: INITIAL_TECHNOLOGIES.filter((t) => t.status === 'pending').length,
        approved: INITIAL_TECHNOLOGIES.filter((t) => t.status === 'approved').length,
        rejected: INITIAL_TECHNOLOGIES.filter((t) => t.status === 'rejected').length,
      },
      source: 'demo_memory',
    });
  } catch (err: any) {
    console.error('[GET /api/admin/roles-tech-stats] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to compute stats' }, { status: 500 });
  }
}
