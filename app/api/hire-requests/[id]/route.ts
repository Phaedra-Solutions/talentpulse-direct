import { NextRequest, NextResponse } from 'next/server';
import {
  getHireRequestById,
  updateHireRequestStatusAndNotes,
  deleteHireRequest,
} from '@/lib/hire-request-store';
import { hireRequestPatchSchema, HireRequestStatus } from '@/types/hire-request';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canAccessHireRequests } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdminAuth(request, canAccessHireRequests);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const item = await getHireRequestById(id);
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Hire request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('API /api/hire-requests/[id] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch hire request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdminAuth(request, canAccessHireRequests);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const parsed = hireRequestPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid hire request update payload',
        },
        { status: 400 }
      );
    }

    const updated = await updateHireRequestStatusAndNotes(
      id,
      parsed.data.status as HireRequestStatus,
      parsed.data.offline_notes
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Hire request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hire request updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('API /api/hire-requests/[id] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hire request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdminAuth(request, canAccessHireRequests);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    await deleteHireRequest(id);
    return NextResponse.json({
      success: true,
      message: 'Hire request deleted successfully',
    });
  } catch (error: any) {
    console.error('API /api/hire-requests/[id] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete hire request' },
      { status: 500 }
    );
  }
}
