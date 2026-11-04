import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { 
  verifyAdminPassword,
  generateAdminSessionToken
} from '@/lib/auth/admin-password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Strict password requirement: No blank passwords allowed
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Password is required to access the admin pipeline.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase || !isServerSupabaseConfigured) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication Service Unavailable: Database connection is required. Please check your Supabase configuration.' 
        },
        { status: 503 }
      );
    }

    // Query public.admin_users table in Supabase PostgreSQL
    const { data: dbAdmin, error } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, salt, full_name, role, is_active, last_login_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Supabase admin_users select error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Authentication service error. Please try again later.' },
        { status: 500 }
      );
    }

    if (!dbAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Account not found or invalid credentials.' },
        { status: 401 }
      );
    }

    if (!dbAdmin.is_active) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: This administrator account has been deactivated. Please contact your system administrator.' },
        { status: 403 }
      );
    }

    // Strict cryptographic verification against stored personal hash and salt only
    const isValid = verifyAdminPassword(password.trim(), dbAdmin.salt, dbAdmin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Invalid credentials. Please check your password.' },
        { status: 401 }
      );
    }

    // Detect first login or forced password change
    const isFirstLogin = dbAdmin.last_login_at === null;
    const isRoleReset = typeof dbAdmin.role === 'string' && dbAdmin.role.includes(':reset');
    const mustChangePassword = isFirstLogin || isRoleReset;

    let cleanRole = typeof dbAdmin.role === 'string' ? dbAdmin.role.replace(':reset', '') : 'super_admin';
    if (cleanRole === 'admin') cleanRole = 'super_admin';

    const adminProfile = {
      id: dbAdmin.id,
      email: dbAdmin.email,
      name: dbAdmin.full_name || 'Administrator',
      role: cleanRole,
    };

    // If not first login, update last_login_at
    if (!mustChangePassword) {
      try {
        await supabase
          .from('admin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', dbAdmin.id);
      } catch {
        // Non-blocking log
      }
    }

    // Generate cryptographic session token
    const sessionToken = generateAdminSessionToken(adminProfile);

    const response = NextResponse.json({
      success: true,
      must_change_password: mustChangePassword,
      token: sessionToken,
      user: adminProfile,
      message: mustChangePassword 
        ? 'First login detected. Mandatory password update required.' 
        : 'Admin authentication successful.',
    });

    // Set secure HTTP-only session cookie (supports both standard and embedded iframes)
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
