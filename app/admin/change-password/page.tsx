'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { 
  getCurrentHrUser, 
  updateHrUserSession, 
  HrUser 
} from '@/lib/auth/recruiter-auth';
import { 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [currentUser] = useState<HrUser | null>(() => {
    if (typeof window === 'undefined') return null;
    return getCurrentHrUser();
  });
  const [email, setEmail] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) return emailParam;
    const user = getCurrentHrUser();
    return user?.email || '';
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFirstLogin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const firstParam = params.get('first_login') === 'true';
    const user = getCurrentHrUser();
    return firstParam || Boolean(user?.must_change_password);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Admin email is required.');
      return;
    }

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current (or temporary invite) password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and password confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password cannot be identical to the temporary password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          current_password: currentPassword.trim(),
          new_password: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update administrator password.');
        setIsLoading(false);
        return;
      }

      // Password updated successfully
      setSuccessMessage('Administrator password successfully updated! Redirecting to pipeline...');

      // Update local session
      updateHrUserSession({
        must_change_password: false,
        name: data.user?.name || currentUser?.name,
      });

      // Redirect into dashboard
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message || 'Network error updating password.');
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
              {isFirstLogin ? '[MANDATORY ROTATION: FIRST LOGIN]' : '[ADMIN SECURITY SETTINGS]'}
            </div>
            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">
              {isFirstLogin ? 'Set New Password' : 'Change Password'}
            </h1>
            <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider">
              {isFirstLogin
                ? 'Security policy requires setting a private password on initial login.'
                : 'Update your administrative encryption credentials.'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-6">
            {/* Status alerts */}
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

            {isFirstLogin && (
              <div className="p-3 border-2 border-[#111113] bg-[#F8F7F4] font-mono text-[11px] text-[#111113] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#FF4D00]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>INITIAL ACCOUNT ACTIVATION</span>
                </div>
                <p className="text-[#111113]/80">
                  Please replace your temporary invitation code with a private password of at least 8 characters.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (Read-Only) */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Administrator Account
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={Boolean(currentUser?.email)}
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden"
                />
              </div>

              {/* Current Password */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  {isFirstLogin ? 'Temporary Invite Password' : 'Current Password'}
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={isFirstLogin ? 'Enter temporary code (e.g. TP-...)' : 'Enter current password...'}
                  required
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  New Private Password (min 8 chars)
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password..."
                  required
                  minLength={8}
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden"
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password..."
                  required
                  minLength={8}
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden"
                />
              </div>

              {/* Show password toggle */}
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
                <span>{isLoading ? 'ENCRYPTING & UPDATING...' : 'UPDATE PASSWORD & PROCEED →'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
