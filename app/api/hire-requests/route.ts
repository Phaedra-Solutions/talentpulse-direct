import { NextRequest, NextResponse } from 'next/server';
import { getHireRequestsList, createHireRequest } from '@/lib/hire-request-store';
import { hireRequestFormSchema } from '@/types/hire-request';
import { getRolesList } from '@/lib/roles-tech-store';

export async function GET(request: NextRequest) {
  try {
    const { requests, isLiveSupabase } = await getHireRequestsList();
    return NextResponse.json({
      success: true,
      data: requests,
      isLiveSupabase,
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
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    // Determine role title
    const roles = await getRolesList(false);
    const matchedRole = roles.find(
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
