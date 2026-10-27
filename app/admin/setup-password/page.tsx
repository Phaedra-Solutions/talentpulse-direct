'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { 
  HR_SESSION_KEY, 
  HrUser 
} from '@/lib/auth/recruiter-auth';
import { 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  Lock
} from 'lucide-react';

export default function AdminSetupPasswordPage() {
  const router = useRouter();
  const [inviteToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('invite') || '';
  });
  const [inviteInfo] = useState<{ email: string; role: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return null;
    try {
      const [dataBase64] = token.split('.');
      if (dataBase64) {
        const jsonStr = atob(dataBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed = JSON.parse(jsonStr);
        if (parsed?.email) {
          return { email: parsed.email, role: parsed.role || 'admin' };
        }
      }
    } catch {
      // Ignored
    }
    return null;
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (!params.get('invite')) {
      return 'Invitation token is missing from the link URL.';
    }
    return null;
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!inviteToken) {
      setErrorMessage('Invalid invitation token. Please check your invite URL.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_token: inviteToken,
          new_password: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to setup administrator account.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Account activated and password configured! Entering pipeline...');

      // Store authenticated session
      if (typeof window !== 'undefined' && data.user) {
        const session: HrUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          must_change_password: false,
        };
        localStorage.setItem(HR_SESSION_KEY, JSON.stringify(session));
      }

      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message || 'Network error completing onboarding.');
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
              [ADMINISTRATOR ONBOARDING INVITATION]
            </div>
            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">
              Activate Admin Access
            </h1>
            <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider">
              TalentPulse Direct • Contractual Engineering Infrastructure
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-6">
            {errorMessage && (
              <div className="p-3.5 border-2 border-rose-600 bg-rose-50 text-rose-900 text-xs font-mono flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 border-2 border-emerald-600 bg-emerald-50 text-emerald-900 text-xs font-mono flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {inviteInfo && (
              <div className="p-3.5 border-2 border-[#111113] bg-[#F8F7F4] font-mono text-xs space-y-1">
                <div>
                  <span className="text-[10px] text-[#111113]/60 uppercase block">Invited Account:</span>
                  <span className="font-bold text-[#111113]">{inviteInfo.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#111113]/60 uppercase block">Clearance Level:</span>
                  <span className="font-bold uppercase text-[#FF4D00]">{inviteInfo.role.replace('_', ' ')}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Choose Permanent Password (min 8 chars)
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create personal secure password..."
                  required
                  minLength={8}
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Confirm Permanent Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to verify..."
                  required
                  minLength={8}
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between font-mono text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[#111113]/70 hover:text-[#111113] flex items-center gap-1.5"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswords ? 'Hide characters' : 'Show characters'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-brutalist btn-brutalist-primary py-3 text-xs font-mono font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoading ? 'ACTIVATING CLEARANCE...' : 'ACTIVATE ACCOUNT & ACCESS PIPELINE →'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
