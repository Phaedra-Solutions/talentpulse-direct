import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { 
  DESIGNATED_ADMIN_EMAIL, 
  generateSalt, 
  hashAdminPassword, 
  generateTemporaryPassword, 
  generateInviteToken,
  verifyAdminSessionToken
} from '@/lib/auth/admin-password';

/**
 * Extract and verify admin session from cookie or Authorization header
 */
function getAdminSession(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookie || authHeader;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase || !isServerSupabaseConfigured) {
      return NextResponse.json({
        users: [
          {
            id: 'admin-master',
            email: DESIGNATED_ADMIN_EMAIL,
            full_name: 'Admin',
            role: 'super_admin',
            is_active: true,
            last_login_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            must_change_password: false,
          }
        ],
        source: 'fallback'
      });
    }

    // Require valid admin authentication in production
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication session required.' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, last_login_at, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const sanitizedUsers = (data || []).map((u: any) => {
      const isRoleReset = typeof u.role === 'string' && u.role.includes(':reset');
      const cleanRole = typeof u.role === 'string' ? u.role.replace(':reset', '') : 'admin';
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: cleanRole,
        is_active: u.is_active,
        last_login_at: u.last_login_at,
        created_at: u.created_at,
        updated_at: u.updated_at,
        must_change_password: u.last_login_at === null || isRoleReset,
      };
    });

    return NextResponse.json({ users: sanitizedUsers, source: 'supabase' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch admin users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require valid admin authentication in production
    const session = getAdminSession(req);
    if (isServerSupabaseConfigured && !session) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication session required to provision users.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { full_name, email, role = 'admin', is_active = true } = body || {};

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanRole = ['super_admin', 'admin', 'recruiter'].includes(role) ? role : 'admin';

    // Generate credentials
    const salt = generateSalt();
    const tempPassword = generateTemporaryPassword();
    const passwordHash = hashAdminPassword(tempPassword, salt);
    const inviteToken = generateInviteToken({ email: normalizedEmail, role: cleanRole });

    const supabase = getSupabaseServerClient();
    if (!supabase || !isServerSupabaseConfigured) {
      return NextResponse.json({
        user: {
          id: `admin-${Date.now()}`,
          email: normalizedEmail,
          full_name: full_name.trim(),
          role: cleanRole,
          is_active: Boolean(is_active),
          last_login_at: null,
          created_at: new Date().toISOString(),
          must_change_password: true,
        },
        invite_token: inviteToken,
        temporary_password: tempPassword,
        source: 'fallback'
      }, { status: 201 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'An administrator account with this email address already exists.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          full_name: full_name.trim(),
          email: normalizedEmail,
          role: cleanRole,
          password_hash: passwordHash,
          salt: salt,
          is_active: Boolean(is_active),
          last_login_at: null, // Forces mandatory first login password reset
        }
      ])
      .select('id, email, full_name, role, is_active, last_login_at, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        ...data,
        must_change_password: true,
      },
      invite_token: inviteToken,
      temporary_password: tempPassword,
      source: 'supabase'
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create admin user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Require valid admin authentication in production
    const session = getAdminSession(req);
    if (isServerSupabaseConfigured && !session) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication session required to modify users.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, is_active, role, full_name, trigger_password_reset } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'User ID is required for updates.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase || !isServerSupabaseConfigured) {
      return NextResponse.json({ success: true, source: 'fallback' });
    }

    // Fetch existing record
    const { data: currentAdmin, error: fetchErr } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !currentAdmin) {
      return NextResponse.json({ error: 'Administrator user not found.' }, { status: 404 });
    }

    // Prevent deactivating primary super admin
    if (currentAdmin.email === DESIGNATED_ADMIN_EMAIL && is_active === false) {
      return NextResponse.json({ error: 'The primary system super administrator cannot be deactivated.' }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }

    if (full_name && typeof full_name === 'string') {
      updates.full_name = full_name.trim();
    }

    if (role && ['super_admin', 'admin', 'recruiter'].includes(role)) {
      updates.role = role;
    }

    let newInviteToken: string | null = null;
    let newTempPassword: string | null = null;

    if (trigger_password_reset) {
      newTempPassword = generateTemporaryPassword();
      const newSalt = generateSalt();
      updates.salt = newSalt;
      updates.password_hash = hashAdminPassword(newTempPassword, newSalt);
      updates.last_login_at = null; // Forces password reset
      newInviteToken = generateInviteToken({ email: currentAdmin.email, role: updates.role || currentAdmin.role });
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, role, is_active, last_login_at, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...data,
        must_change_password: data.last_login_at === null,
      },
      invite_token: newInviteToken,
      temporary_password: newTempPassword,
      source: 'supabase'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update admin user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Require valid admin authentication in production
    const session = getAdminSession(req);
    if (isServerSupabaseConfigured && !session) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication session required to delete users.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required for deletion.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase || !isServerSupabaseConfigured) {
      return NextResponse.json({ success: true, source: 'fallback' });
    }

    // Check user email to protect primary super admin
    const { data: targetUser } = await supabase
      .from('admin_users')
      .select('email')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (targetUser.email === DESIGNATED_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Security Protection: The primary super administrator account cannot be deleted.' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, source: 'supabase' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete admin user' }, { status: 500 });
  }
}
