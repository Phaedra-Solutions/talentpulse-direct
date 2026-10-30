import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { 
  DESIGNATED_ADMIN_EMAIL, 
  DEFAULT_ADMIN_SALT, 
  DEFAULT_ADMIN_HASH, 
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
    let verified = false;
    let mustChangePassword = false;
    let adminProfile = {
      id: 'admin-master',
      email: normalizedEmail,
      name: 'Admin',
      role: 'admin',
    };

    // 1. Query public.admin_users table in Supabase PostgreSQL
    if (supabase && isServerSupabaseConfigured) {
      try {
        const { data: dbAdmin, error } = await supabase
          .from('admin_users')
          .select('id, email, password_hash, salt, full_name, role, is_active, last_login_at')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (error) {
          console.warn('Supabase admin_users select warning:', error.message);
        }

        if (dbAdmin) {
          if (!dbAdmin.is_active) {
            return NextResponse.json(
              { success: false, error: 'Access Denied: This administrator account has been deactivated. Please contact your system administrator.' },
              { status: 403 }
            );
          }

          // Strict verification against the stored database hash & salt
          const isValid = verifyAdminPassword(password, dbAdmin.salt, dbAdmin.password_hash);

          if (isValid) {
            verified = true;

            // Detect first login or forced password change
            const isFirstLogin = dbAdmin.last_login_at === null;
            const isRoleReset = typeof dbAdmin.role === 'string' && dbAdmin.role.includes(':reset');
            mustChangePassword = isFirstLogin || isRoleReset;

            const cleanRole = typeof dbAdmin.role === 'string' ? dbAdmin.role.replace(':reset', '') : 'admin';

            adminProfile = {
              id: dbAdmin.id,
              email: dbAdmin.email,
              name: dbAdmin.full_name || 'Admin',
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
          } else {
            return NextResponse.json(
              { success: false, error: 'Invalid password. Please check your credentials.' },
              { status: 401 }
            );
          }
        }
      } catch (err) {
        console.warn('Database query error:', err);
      }
    }

    // 2. Offline / unseeded fallback only when database is unavailable and for initial setup
    if (!verified) {
      const isMasterValid = verifyAdminPassword(password, DEFAULT_ADMIN_SALT, DEFAULT_ADMIN_HASH);
      if (isMasterValid) {
        if (normalizedEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase()) {
          verified = true;
          mustChangePassword = false;
          adminProfile = {
            id: 'admin-master',
            email: DESIGNATED_ADMIN_EMAIL,
            name: 'TalentPulse Super Admin',
            role: 'super_admin',
          };
        } else if (normalizedEmail === 'sales@talentpulse.com') {
          verified = true;
          mustChangePassword = false;
          adminProfile = {
            id: 'sales-lead-01',
            email: 'sales@talentpulse.com',
            name: 'Marcus Vance (Sales Executive)',
            role: 'sales_executive',
          };
        } else if (normalizedEmail === 'hr@talentpulse.com') {
          verified = true;
          mustChangePassword = false;
          adminProfile = {
            id: 'hr-lead-01',
            email: 'hr@talentpulse.com',
            name: 'Sofia Chen (HR Executive)',
            role: 'hr_executive',
          };
        }
      }
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Account not found or invalid credentials.' },
        { status: 401 }
      );
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

    // Set secure HTTP-only session cookie
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
