import { NextRequest, NextResponse } from 'next/server';
import { updateHireRequestStatusAndNotes, deleteHireRequest } from '@/lib/hire-request-store';
import { HireRequestStatus } from '@/types/hire-request';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, offline_notes } = body;

    const validStatuses: HireRequestStatus[] = [
      'new',
      'contacted',
      'negotiating',
      'contract_signed',
      'closed',
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hire request status' },
        { status: 400 }
      );
    }

    const updated = await updateHireRequestStatusAndNotes(id, status, offline_notes);
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
