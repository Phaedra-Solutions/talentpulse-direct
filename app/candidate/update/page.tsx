'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  candidateUpdateSchema, 
  CandidateUpdateFormValues, 
  Candidate, 
  ROLE_LABELS, 
  AVAILABILITY_LABELS,
  TargetRegion,
  AvailabilityStatus,
  TIMEZONE_OPTIONS
} from '@/types/candidate';
import { 
  getCandidateByEmail, 
  updateCandidateAvailabilityRecord 
} from '@/lib/candidate-store';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  Save, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  FileText,
  Phone,
  Sparkles,
  UploadCloud,
  ExternalLink,
  FileCheck,
  Trash2
} from 'lucide-react';

function CandidateUpdateContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [searchEmail, setSearchEmail] = useState(initialEmail);
  const [isSearching, setIsSearching] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Resume replacement state
  const [newResumeFileName, setNewResumeFileName] = useState<string | null>(null);
  const [resumeUploadNotice, setResumeUploadNotice] = useState<string | null>(null);

  // Secure Auth State (Supabase Email OTP)
  const [otpStep, setOtpStep] = useState<'input_email' | 'enter_otp' | 'authenticated'>('input_email');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [candidateAccessToken, setCandidateAccessToken] = useState<string | null>(null);
  const [demoFallbackOtp, setDemoFallbackOtp] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CandidateUpdateFormValues>({
    resolver: zodResolver(candidateUpdateSchema) as any,
  });

  const formValues = watch();

  const populateCandidateForm = (record: Candidate) => {
    reset({
      availability_status: record.availability_status,
      available_from: record.available_from,
      overlap_hours_per_day: record.overlap_hours_per_day,
      target_timezones: record.target_timezones,
      home_timezone: record.home_timezone,
      video_pitch_url: record.video_pitch_url || '',
      written_pitch: record.written_pitch,
      resume_url: record.resume_url || '',
      resume_filename: record.resume_filename || '',
    });
  };

  // Step 1: Look up candidate record & send Supabase Email OTP
  const handleRequestOtp = async (emailToLookup: string) => {
    const cleanEmail = emailToLookup.trim().toLowerCase();
    if (!cleanEmail) return;
    setIsSearching(true);
    setSearchError(null);
    setOtpError(null);
    setOtpNotice(null);

    try {
      const { candidate: found } = await getCandidateByEmail(cleanEmail);
      if (!found) {
        setCandidate(null);
        setSearchError('No registered candidate profile found with this email. Please apply as a new engineer.');
        return;
      }

      setCandidate(found);

      const supabase = getSupabaseBrowserClient();
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOtp({
          email: found.email,
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) {
          setSearchError(error.message || 'Unable to send OTP email. Please check Supabase SMTP configuration and try again.');
          return;
        }

        setDemoFallbackOtp(null);
        setOtpCode('');
        setResendCooldown(60);
        setOtpNotice(`A 6-digit verification code has been sent to ${found.email}. Check your inbox and spam folder.`);
        setOtpStep('enter_otp');
      } else {
        // Offline / local demo fallback when Supabase is not configured
        const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
        setDemoFallbackOtp(generatedCode);
        setOtpCode('');
        setOtpNotice(`Offline demo mode (Supabase not configured). Use code: ${generatedCode}`);
        setOtpStep('enter_otp');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error looking up profile.');
    } finally {
      setIsSearching(false);
    }
  };

  // Resend OTP with rate-limit protection
  const handleResendOtp = async () => {
    if (!candidate || resendCooldown > 0 || isResendingOtp) return;
    setIsResendingOtp(true);
    setOtpError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOtp({
          email: candidate.email,
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) {
          setOtpError(error.message || 'Failed to resend verification code.');
          return;
        }

        setResendCooldown(60);
        setOtpNotice(`A fresh verification code has been dispatched to ${candidate.email}.`);
      } else {
        const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
        setDemoFallbackOtp(generatedCode);
        setOtpNotice(`Offline demo mode. New code: ${generatedCode}`);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Step 2: Verify OTP via Supabase Auth
  const handleVerifyOtp = async () => {
    const cleanToken = otpCode.trim();
    if (!cleanToken || !candidate) {
      setOtpError('Please enter the verification code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: candidate.email,
          token: cleanToken,
          type: 'email',
        });

        if (error || !data?.session?.access_token) {
          setOtpError(error?.message || 'Invalid or expired verification code. Please check the code or request a new one.');
          return;
        }

        const accessToken = data.session.access_token;
        setCandidateAccessToken(accessToken);

        // Fetch full unredacted own candidate record (phone & resume key) using verified session token
        const { candidate: fullRecord } = await getCandidateByEmail(candidate.email, accessToken);
        const resolved = fullRecord || candidate;
        setCandidate(resolved);
        populateCandidateForm(resolved);
        setOtpStep('authenticated');
        return;
      }

      // Offline / local demo fallback verification
      if (demoFallbackOtp && cleanToken === demoFallbackOtp) {
        populateCandidateForm(candidate);
        setOtpStep('authenticated');
      } else {
        setOtpError('Invalid verification code. Please enter the demo code shown above.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetToEmailStep = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setCandidateAccessToken(null);
    setOtpCode('');
    setOtpError(null);
    setOtpNotice(null);
    setDemoFallbackOtp(null);
    setOtpStep('input_email');
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setResumeUploadNotice('File size exceeds 10MB limit. Please upload a smaller PDF or DOCX file.');
      return;
    }

    setNewResumeFileName(file.name);
    setValue('resume_filename', file.name, { shouldValidate: true });

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setValue('resume_url', base64Data, { shouldValidate: true });
      setResumeUploadNotice(`Replacement file "${file.name}" staged. Saving will upload to DigitalOcean Spaces and delete old file.`);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelResumeReplacement = () => {
    setNewResumeFileName(null);
    setResumeUploadNotice(null);
    setValue('resume_url', candidate?.resume_url || '', { shouldValidate: true });
    setValue('resume_filename', candidate?.resume_filename || '', { shouldValidate: true });
  };

  const onUpdateSubmit = async (data: CandidateUpdateFormValues) => {
    if (!candidate) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      let tokenToUse = candidateAccessToken || undefined;
      const supabase = getSupabaseBrowserClient();
      if (supabase && isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          tokenToUse = sessionData.session.access_token;
          setCandidateAccessToken(tokenToUse);
        }
      }

      const res = await updateCandidateAvailabilityRecord(candidate.email, data, tokenToUse);
      if (res.success && res.candidate) {
        setCandidate(res.candidate);
        setNewResumeFileName(null);
        setResumeUploadNotice(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.error || 'Failed to update availability profile.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error saving changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-[4vw] max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
            [SELF-SERVICE VERIFICATION PORTAL]
          </div>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#111113]">
            Candidate Availability
          </h1>
          <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider">
            Passwordless email authentication to update contract availability &amp; client overlap.
          </p>
        </div>

        {/* STEP 1: Email Lookup */}
        {otpStep === 'input_email' && (
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-5">
            <div className="border-b border-[#111113]/20 pb-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[#FF4D00] block mb-1">
                [PHASE 01: IDENTITY VERIFICATION]
              </span>
              <h3 className="font-syne font-bold text-xl text-[#111113]">
                Enter Registered Email Address
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Registered Candidate Email
                </label>
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRequestOtp(searchEmail);
                    }
                  }}
                  placeholder="e.g. elena.rostova@engineer-pulse.dev"
                  className="w-full font-mono text-xs px-3.5 py-3 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRequestOtp(searchEmail)}
                disabled={isSearching}
                className="w-full btn-brutalist btn-brutalist-primary py-3.5 text-xs font-mono disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSearching ? 'VERIFYING RECORD...' : 'REQUEST 6-DIGIT VERIFICATION CODE'}</span>
              </button>
            </div>

            {searchError && (
              <div className="p-3.5 border-2 border-rose-600 bg-rose-50 text-rose-900 font-mono text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Enter OTP Code */}
        {otpStep === 'enter_otp' && candidate && (
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-5">
            <div className="border-b border-[#111113]/20 pb-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[#FF4D00] block mb-1">
                [PHASE 02: CODE VERIFICATION]
              </span>
              <h3 className="font-syne font-bold text-xl text-[#111113]">
                Enter 6-Digit One-Time Code
              </h3>
              <p className="font-mono text-xs text-[#111113]/70 uppercase mt-0.5">
                A verification code has been dispatched to: <strong className="text-[#111113]">{candidate.email}</strong>
              </p>
            </div>

            <div className="p-3 border border-[#111113]/20 bg-[#F8F7F4] font-mono text-xs text-[#111113]/75">
              {otpNotice || 'Please enter the one-time verification code sent to your registered email to unlock and manage your availability.'}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\s+/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerifyOtp();
                  }
                }}
                placeholder="123456"
                className="w-full text-center text-3xl font-mono tracking-widest py-3 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden"
              />

              {otpError && (
                <div className="p-3.5 border-2 border-rose-600 bg-rose-50 text-rose-900 font-mono text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={handleResetToEmailStep}
                  className="btn-brutalist py-3 px-4 min-h-[44px] flex items-center justify-center"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResendingOtp}
                  className="btn-brutalist py-3 px-4 min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResendingOtp ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                  className="flex-1 btn-brutalist btn-brutalist-primary py-3 min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{isVerifyingOtp ? 'VERIFYING...' : 'VERIFY & UNLOCK AVAILABILITY'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Authenticated Candidate Profile Edit Form */}
        {otpStep === 'authenticated' && candidate && (
          <div className="bg-white border-2 border-[#111113] p-4 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-6 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-[#111113]/20 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap font-mono text-xs">
                  <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border ${ROLE_LABELS[candidate.primary_role]?.badgeClass}`}>
                    {ROLE_LABELS[candidate.primary_role]?.label}
                  </span>
                  <span className="text-xs text-[#111113]/60 font-mono">
                    ID: {candidate.id.slice(0, 8)}...
                  </span>
                </div>
                <h2 className="text-2xl font-syne font-extrabold text-[#111113] break-words">
                  {candidate.full_name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#111113]/70 mt-0.5 font-mono">
                  <span>{candidate.email}</span>
                  <span>•</span>
                  <span>{candidate.phone_number}</span>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs font-mono text-[#111113]/70">
                <span className="text-[10px] uppercase block">Last Updated:</span>
                <div suppressHydrationWarning className="font-bold text-[#111113]">
                  {new Date(candidate.updated_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Notification messages */}
            {saveSuccess && (
              <div className="p-4 border-2 border-emerald-700 bg-emerald-50 text-emerald-950 font-mono text-xs flex items-center gap-2.5 animate-in fade-in shadow-[2px_2px_0px_0px_#111113]">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Availability Profile Updated!</strong> Real-time timestamp committed to candidate record.
                </span>
              </div>
            )}

            {saveError && (
              <div className="p-4 border-2 border-rose-600 bg-rose-50 text-rose-950 font-mono text-xs flex items-center gap-2.5 shadow-[2px_2px_0px_0px_#111113]">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onUpdateSubmit)} className="space-y-6">
              {/* Availability Status & Start Date */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Current Availability Status
                  </label>
                  <select
                    {...register('availability_status')}
                    className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                  >
                    <option value="available_now">Available Now (Ready for Deploy)</option>
                    <option value="available_soon">Available Soon (1-2 weeks)</option>
                    <option value="part_time_only">Part-Time Only (15-20 hrs/week)</option>
                    <option value="busy">Committed / Busy for now</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Available From Date
                  </label>
                  <input
                    type="date"
                    {...register('available_from')}
                    className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Home Timezone Select & Daily Overlap */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Home Timezone
                  </label>
                  <select
                    {...register('home_timezone')}
                    className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Daily Overlap Hours (Client Working Window)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    {...register('overlap_hours_per_day')}
                    className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Target Client Regions */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2">
                  Target Client Regions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['USA', 'Europe', 'Asia', 'APAC'] as TargetRegion[]).map((region) => {
                    const current = formValues.target_timezones || [];
                    const isChecked = current.includes(region);
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? current.filter((r) => r !== region)
                            : [...current, region];
                          setValue('target_timezones', updated as any, { shouldValidate: true });
                        }}
                        className={`p-2.5 border-2 border-[#111113] font-mono text-xs uppercase font-bold transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-[#111113] text-[#F8F7F4] shadow-[3px_3px_0px_0px_#FF4D00]'
                            : 'bg-[#F8F7F4] text-[#111113] hover:bg-white'
                        }`}
                      >
                        <span>{region}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4D00]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Pitch URL */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1 flex items-center justify-between">
                  <span>Video Intro URL (Loom, YouTube, Drive)</span>
                  <span className="text-[10px] text-[#FF4D00] font-bold uppercase">Boosts Match Rate</span>
                </label>
                <input
                  type="url"
                  {...register('video_pitch_url')}
                  placeholder="https://www.loom.com/share/..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                />
              </div>

              {/* Technical Resume & Storage Replacement */}
              <div className="border-2 border-[#111113] bg-[#F8F7F4] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113]">
                    Technical Resume / CV (DigitalOcean Spaces)
                  </label>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[#111113] bg-white text-[#FF4D00]">
                    [PRIVATE STORAGE]
                  </span>
                </div>

                {/* Currently Active Resume */}
                <div className="p-3 border border-[#111113] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-[#FF4D00] shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-[#111113] block truncate">
                        {candidate.resume_filename || (candidate.resume_url ? 'Candidate_Resume.pdf' : 'No resume file attached')}
                      </span>
                      <span className="text-[10px] text-[#111113]/60 block uppercase">
                        {candidate.resume_url 
                          ? 'Stored securely in Talent Pulse DigitalOcean bucket (Private ACL)' 
                          : 'Upload your updated resume below to attach to your profile'}
                      </span>
                    </div>
                  </div>

                  {candidate.resume_url && (
                    <a
                      href={`/api/candidates/resume?id=${candidate.id}&email=${encodeURIComponent(candidate.email)}&v=${encodeURIComponent(candidate.updated_at || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-brutalist text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Current PDF</span>
                    </a>
                  )}
                </div>

                {/* Replacement Upload Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer btn-brutalist bg-white hover:bg-[#111113] hover:text-[#F8F7F4] text-xs py-2 px-3.5 flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-[#FF4D00]" />
                      <span>{newResumeFileName ? 'Change Replacement File' : 'Upload Updated Resume (PDF/DOCX)'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleResumeFileChange}
                        className="hidden"
                      />
                    </label>

                    {newResumeFileName && (
                      <button
                        type="button"
                        onClick={handleCancelResumeReplacement}
                        className="btn-brutalist border-rose-600 text-rose-700 bg-rose-50 text-xs py-2 px-3 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Replacement</span>
                      </button>
                    )}
                  </div>

                  {resumeUploadNotice && (
                    <div className="p-2.5 border border-[#FF4D00] bg-orange-50/80 font-mono text-[11px] text-[#111113] flex items-center gap-2 animate-in fade-in">
                      <FileCheck className="w-4 h-4 text-[#FF4D00] shrink-0" />
                      <span>{resumeUploadNotice}</span>
                    </div>
                  )}

                  <p className="font-mono text-[10px] text-[#111113]/60 uppercase leading-relaxed">
                    Note: Updating your resume will store the new file in <strong className="text-[#111113]">Talent Pulse/{'{Month-Year}'}/candidate/</strong> and automatically purge the previously saved file from DigitalOcean storage. Files are kept private and cannot be accessed publicly.
                  </p>
                </div>
              </div>

              {/* Written Pitch Update */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Updated Technical Edge / Project Highlights
                </label>
                <textarea
                  rows={3}
                  {...register('written_pitch')}
                  className="w-full font-mono text-xs p-3 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t-2 border-[#111113] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="font-mono text-xs text-[#111113]/60 uppercase">
                  Target rates are managed offline by HR partner.
                </span>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-brutalist btn-brutalist-primary text-xs py-3 px-6 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-white shrink-0" />
                  <span>{isSaving ? 'SAVING UPDATES...' : 'SAVE UPDATED AVAILABILITY'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CandidateUpdatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center font-mono text-xs">
          Loading Candidate Self-Service Portal...
        </div>
      }
    >
      <CandidateUpdateContent />
    </Suspense>
  );
}
