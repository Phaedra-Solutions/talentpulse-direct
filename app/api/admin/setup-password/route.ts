import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { 
  verifyInviteToken, 
  generateSalt, 
  hashAdminPassword 
} from '@/lib/auth/admin-password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invite_token, new_password } = body || {};

    if (!invite_token || typeof invite_token !== 'string') {
      return NextResponse.json({ error: 'Invite token is missing or malformed.' }, { status: 400 });
    }

    if (!new_password || typeof new_password !== 'string' || new_password.trim().length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    const payload = verifyInviteToken(invite_token.trim());
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: 'This invitation link has expired or is invalid. Please request a new invite link from your administrator.' },
        { status: 400 }
      );
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const cleanNewPassword = new_password.trim();

    const supabase = getSupabaseServerClient();
    if (!supabase || !isServerSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Account initialized successfully (fallback mode).',
        user: { email: normalizedEmail, name: 'Admin', role: payload.role },
      });
    }

    // Verify user exists in admin_users
    const { data: dbAdmin, error: fetchErr } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchErr || !dbAdmin) {
      return NextResponse.json({ error: 'Administrator user not found. The account may have been removed.' }, { status: 404 });
    }

    if (!dbAdmin.is_active) {
      return NextResponse.json({ error: 'This administrator account has been deactivated. Contact your super admin.' }, { status: 403 });
    }

    // Generate new salt and hash for permanent password
    const newSalt = generateSalt();
    const newHash = hashAdminPassword(cleanNewPassword, newSalt);
    const cleanRole = typeof dbAdmin.role === 'string' ? dbAdmin.role.replace(':reset', '') : payload.role;

    const { data: updatedAdmin, error: updateErr } = await supabase
      .from('admin_users')
      .update({
        password_hash: newHash,
        salt: newSalt,
        role: cleanRole,
        is_active: true,
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
      message: 'Password successfully configured. Your administrator account is now active.',
      user: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.full_name || 'Admin',
        role: updatedAdmin.role,
        must_change_password: false,
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to setup password' }, { status: 500 });
  }
}
