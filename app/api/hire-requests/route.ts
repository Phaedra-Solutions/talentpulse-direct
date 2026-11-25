import { NextRequest, NextResponse } from 'next/server';
import {
  getHireRequestsPaginated,
  exportHireRequestsList,
  createHireRequest,
} from '@/lib/hire-request-store';
import {
  hireRequestFormSchema,
  HireRequestFilterStatus,
} from '@/types/hire-request';
import { getRolesPaginated } from '@/lib/roles-tech-store';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessHireRequests } from '@/lib/auth/permissions';

const ALLOWED_HIRE_STATUS_FILTERS = new Set<HireRequestFilterStatus>([
  'active',
  'all',
  'new',
  'contacted',
  'negotiating',
  'contract_signed',
  'closed',
]);

export async function GET(request: NextRequest) {
  try {
    // Restrict access to authenticated Super Admins and Sales Executives
    const auth = requireAdminAuth(request, canAccessHireRequests);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get('status') || 'active';
    const statusParam: HireRequestFilterStatus = ALLOWED_HIRE_STATUS_FILTERS.has(
      rawStatus as HireRequestFilterStatus
    )
      ? (rawStatus as HireRequestFilterStatus)
      : 'active';
    const search = searchParams.get('search') || searchParams.get('query') || '';
    const isExport = searchParams.get('export') === 'true';

    if (isExport) {
      const exported = await exportHireRequestsList({
        status: statusParam,
        search,
      });
      if (exported.error) {
        return NextResponse.json(
          { success: false, error: exported.error, data: [] },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        data: exported.requests,
        total: exported.requests.length,
        isLiveSupabase: exported.isLiveSupabase,
      });
    }

    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '25', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 25;
    const includeStats = searchParams.get('includeStats') === 'true';
    const summary = searchParams.get('summary') === 'true';

    const result = await getHireRequestsPaginated({
      page,
      limit,
      status: statusParam,
      search,
      includeStats,
      summary,
    });

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          data: [],
          total: 0,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.requests,
      total: result.total,
      page: result.page,
      limit: result.limit,
      stats: result.stats,
      isLiveSupabase: result.isLiveSupabase,
    });
  } catch (error: any) {
    console.error('API /api/hire-requests GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch hire requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = hireRequestFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || 'Validation failed. Please review your entries.',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    // Determine role title cleanly using lightweight summary role lookup
    const rolesResult = await getRolesPaginated({
      includeClosed: true,
      summary: true,
      limit: 100,
    });
    const matchedRole = rolesResult.roles.find(
      (r) => r.id === parsed.data.role_id || r.slug === parsed.data.role_id
    );
    const roleTitle = matchedRole ? matchedRole.title : parsed.data.role_id;

    const newRequest = await createHireRequest(parsed.data, roleTitle);

    return NextResponse.json(
      {
        success: true,
        message: 'Hire request successfully submitted. Our team will contact you within 24-48 business hours.',
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /api/hire-requests POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit hire request' },
      { status: 500 }
    );
  }
}
