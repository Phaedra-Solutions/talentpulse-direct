'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { 
  Lock, 
  AlertCircle
} from 'lucide-react';
import { 
  signInHrRecruiter, 
  getCurrentHrUser
} from '@/lib/auth/recruiter-auth';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isUnauthorized = searchParams.get('unauthorized') === 'true';
  const errorMessage = formError || (isUnauthorized ? 'Access Restricted: You must authenticate with an authorized administrator account to access that page.' : null);

  // If already authenticated, redirect to requested destination or dashboard
  React.useEffect(() => {
    const user = getCurrentHrUser();
    if (user && user.email) {
      const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';
      router.replace(redirectUrl);
    }
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginEmail = email.trim();
    const loginPass = password.trim();

    if (!loginEmail) {
      setFormError('Please enter your administrator email address.');
      return;
    }
    if (!loginPass) {
      setFormError('Password is required. Unauthenticated access is not permitted.');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const res = await signInHrRecruiter(loginEmail, loginPass);
      if (res.success) {
        if (res.must_change_password) {
          router.push(`/admin/change-password?email=${encodeURIComponent(loginEmail)}&first_login=true`);
          return;
        }
        const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';
        router.push(redirectUrl);
      } else {
        setFormError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
              [RESTRICTED ACCESS PORTAL]
            </div>
            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">
              Admin Login
            </h1>
            <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider">
              Cryptographic PBKDF2 Verification • Database-Authenticated Access
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-6">
            {errorMessage && (
              <div className="p-3.5 border-2 border-rose-600 bg-rose-50 text-rose-900 text-xs font-mono flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Administrator Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@talentpulse.com"
                    autoComplete="email"
                    required
                    className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden"
                  />
                </div>
                <p className="font-mono text-[10px] text-[#111113]/60 mt-1 uppercase">
                  Authorized administrative accounts registered in <code className="font-bold text-[#111113]">admin_users</code>
                </p>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your personal password..."
                    autoComplete="current-password"
                    required
                    className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden"
                  />
                </div>
                <p className="font-mono text-[10px] text-[#111113]/60 mt-1 uppercase">
                  Verified against PBKDF2 SHA-512 cryptographic hash in <code className="font-bold text-[#FF4D00]">public.admin_users</code>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-brutalist btn-brutalist-primary text-xs py-3.5 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER PIPELINE'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="text-center font-mono text-xs">
            <Link href="/" className="text-[#111113]/70 hover:text-[#FF4D00] transition-colors uppercase">
              ← Return to TalentPool Overview
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 font-mono text-xs">
          Loading Admin Gate...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
