// lib/auth/server-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, AdminSessionPayload } from '@/lib/auth/admin-password';
import type { RecruiterRole } from '@/lib/auth/permissions';

/**
 * Extract and cryptographically verify administrator session from request.
 * Checks HTTP-only cookie first, then Bearer token in Authorization header, then x-admin-token.
 * Returns decoded session payload with normalized role if valid, null otherwise.
 */
export function getAuthenticatedAdmin(req: NextRequest): AdminSessionPayload | null {
  const cookie = req.cookies.get('admin_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const customToken = req.headers.get('x-admin-token');
  const queryToken = req.nextUrl?.searchParams?.get('token') || undefined;
  const token = cookie || authHeader || customToken || queryToken;

  if (!token) return null;
  const verified = verifyAdminSessionToken(token);
  if (!verified) return null;

  return {
    ...verified,
    role: verified.role === 'admin' ? 'super_admin' : verified.role
  };
}

/**
 * Standard helper to assert authentication & permission in route handlers.
 * Returns { session } on success, or { errorResponse } with 401 / 403 on failure.
 */
export function requireAdminAuth(
  req: NextRequest, 
  permissionCheck?: RecruiterRole[] | ((role: string) => boolean)
): { session: AdminSessionPayload; errorResponse?: never } | { session?: never; errorResponse: NextResponse } {
  const session = getAuthenticatedAdmin(req);
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { 
          success: false, 
          error: 'Authentication Required: Valid administrator session required to access this resource.' 
        },
        { status: 401 }
      )
    };
  }

  if (permissionCheck) {
    let isAllowed = false;
    if (typeof permissionCheck === 'function') {
      isAllowed = permissionCheck(session.role);
    } else if (Array.isArray(permissionCheck)) {
      isAllowed = permissionCheck.includes(session.role as RecruiterRole) || (permissionCheck.includes('super_admin') && session.role === 'admin');
    }

    if (!isAllowed) {
      return {
        errorResponse: NextResponse.json(
          { 
            success: false, 
            error: `Access Denied: Role '${session.role}' is not authorized to perform this action.` 
          },
          { status: 403 }
        )
      };
    }
  }

  return { session };
}
