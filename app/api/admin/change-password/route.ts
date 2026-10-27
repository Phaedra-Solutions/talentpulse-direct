import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { 
  DESIGNATED_ADMIN_EMAIL, 
  DEFAULT_ADMIN_SALT, 
  DEFAULT_ADMIN_HASH, 
  generateSalt, 
  hashAdminPassword, 
  verifyAdminPassword 
} from '@/lib/auth/admin-password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, current_password, new_password } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Admin email is required.' }, { status: 400 });
    }

    if (!current_password || typeof current_password !== 'string') {
      return NextResponse.json({ error: 'Current (or temporary) password is required.' }, { status: 400 });
    }

    if (!new_password || typeof new_password !== 'string' || new_password.trim().length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanNewPassword = new_password.trim();

    if (current_password.trim() === cleanNewPassword) {
      return NextResponse.json({ error: 'New password must be different from your current temporary password.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase || !isServerSupabaseConfigured) {
      // Fallback mode
      return NextResponse.json({
        success: true,
        message: 'Password successfully updated (fallback mode).',
        user: { email: normalizedEmail, name: 'Admin', role: 'super_admin' },
      });
    }

    // 1. Fetch user from admin_users
    const { data: dbAdmin, error: fetchErr } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchErr || !dbAdmin) {
      return NextResponse.json({ error: 'Administrator account not found.' }, { status: 404 });
    }

    if (!dbAdmin.is_active) {
      return NextResponse.json({ error: 'This administrator account has been deactivated.' }, { status: 403 });
    }

    // 2. Verify current password
    let isCurrentValid = verifyAdminPassword(current_password.trim(), dbAdmin.salt, dbAdmin.password_hash);
    if (!isCurrentValid && normalizedEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase() && verifyAdminPassword(current_password.trim(), DEFAULT_ADMIN_SALT, DEFAULT_ADMIN_HASH)) {
      isCurrentValid = true;
    }

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Current password is incorrect. Please re-check your password or invite code.' }, { status: 401 });
    }

    // 3. Compute new hash and salt
    const newSalt = generateSalt();
    const newHash = hashAdminPassword(cleanNewPassword, newSalt);
    const cleanRole = typeof dbAdmin.role === 'string' ? dbAdmin.role.replace(':reset', '') : 'admin';

    const { data: updatedAdmin, error: updateErr } = await supabase
      .from('admin_users')
      .update({
        password_hash: newHash,
        salt: newSalt,
        role: cleanRole,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbAdmin.id)
      .select('id, email, full_name, role, is_active, last_login_at')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Your administrator password has been updated successfully.',
      user: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.full_name || 'Admin',
        role: updatedAdmin.role,
        must_change_password: false,
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update password' }, { status: 500 });
  }
}
