'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  candidateApplicationSchema, 
  CandidateApplicationFormValues, 
  WorkMode, 
  TargetRegion, 
  AvailabilityStatus, 
  EnglishProficiency,
  ROLE_LABELS,
  TIMEZONE_OPTIONS
} from '@/types/candidate';
import { createCandidateRecord } from '@/lib/candidate-store';
import { Role, Technology } from '@/types/roles-tech';
import { getRolesList, getTopTechnologiesForRole } from '@/lib/roles-tech-store';
import { Navbar } from '@/components/Navbar';
import { TechAutocomplete } from '@/components/TechAutocomplete';
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Briefcase, 
  Clock, 
  Video, 
  Terminal, 
  AlertCircle, 
  Check, 
  Phone, 
  FileText, 
  UploadCloud, 
  X, 
  FileCheck,
  Info,
  ExternalLink
} from 'lucide-react';

function ApplyFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dynamic Roles & Technologies State
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [roleTopTechs, setRoleTopTechs] = useState<Technology[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>(['Python', 'TypeScript', 'Docker']);
  const [customTechTags, setCustomTechTags] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CandidateApplicationFormValues>({
    resolver: zodResolver(candidateApplicationSchema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      phone_number: '',
      linkedin_url: '',
      github_url: '',
      portfolio_url: '',
      resume_url: '',
      resume_filename: '',
      primary_role: roleParam || 'ai-llm-engineer',
      contractual_agreement_accepted: false,
      work_modes: ['remote'],
      home_timezone: 'UTC-05:00 (EST - US Eastern / New York)',
      target_timezones: ['USA', 'Europe'],
      overlap_hours_per_day: 5,
      availability_status: 'available_now',
      available_from: new Date().toISOString().split('T')[0],
      english_proficiency: 'professional',
      written_pitch: '',
      video_pitch_url: '',
      tech_stack: ['Python', 'TypeScript', 'Docker'],
    },
    mode: 'onTouched',
  });

  const formValues = watch();

  // Load dynamic roles on mount and handle ?role= query param
  useEffect(() => {
    async function loadRoles() {
      try {
        const roles = await getRolesList(true);
        setAvailableRoles(roles);

        if (roleParam) {
          const matched = roles.find(r => r.slug === roleParam || r.id === roleParam);
          if (matched) {
            setValue('primary_role', matched.slug, { shouldValidate: true });
          }
        }
      } catch (err) {
        console.error('Failed to load roles for apply form', err);
      }
    }
    loadRoles();
  }, [roleParam, setValue]);

  // Load Top 15 approved technologies associated with selected role
  useEffect(() => {
    async function loadRoleTechs() {
      if (!formValues.primary_role) return;
      try {
        const topTechs = await getTopTechnologiesForRole(formValues.primary_role, 15);
        setRoleTopTechs(topTechs);
      } catch (err) {
        console.error('Failed to load technologies for role', err);
      }
    }
    loadRoleTechs();
  }, [formValues.primary_role]);

  // Resume File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller PDF or DOCX file.');
      return;
    }

    setUploadedFileName(file.name);
    setValue('resume_filename', file.name, { shouldValidate: true });

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setValue('resume_url', base64Data, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedFile = () => {
    setUploadedFileName(null);
    setValue('resume_url', '', { shouldValidate: true });
    setValue('resume_filename', '', { shouldValidate: true });
  };

  // Step validation
  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(['full_name', 'email', 'phone_number', 'resume_url']);
    } else if (currentStep === 2) {
      isValid = await trigger(['primary_role', 'work_modes', 'contractual_agreement_accepted']);
    } else if (currentStep === 3) {
      isValid = await trigger(['home_timezone', 'target_timezones', 'overlap_hours_per_day', 'availability_status', 'available_from']);
    } else if (currentStep === 4) {
      isValid = await trigger(['english_proficiency', 'written_pitch', 'video_pitch_url']);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const toggleTech = (tech: string) => {
    let updated: string[];
    if (selectedTechs.includes(tech)) {
      updated = selectedTechs.filter((t) => t !== tech);
    } else {
      updated = [...selectedTechs, tech];
    }
    setSelectedTechs(updated);
    setValue('tech_stack', updated, { shouldValidate: true });
  };

  // Add technology from autocomplete (either approved existing or new custom)
  const handleAddTechFromAutocomplete = (techName: string, isCustom = false) => {
    const clean = techName.trim();
    if (!clean) return;

    if (!selectedTechs.some(t => t.toLowerCase() === clean.toLowerCase())) {
      const updated = [...selectedTechs, clean];
      setSelectedTechs(updated);
      setValue('tech_stack', updated, { shouldValidate: true });

      if (isCustom && !customTechTags.includes(clean)) {
        setCustomTechTags(prev => [...prev, clean]);
      }
    }
  };

  const handleRemoveTech = (tech: string) => {
    const updated = selectedTechs.filter(t => t !== tech);
    setSelectedTechs(updated);
    setValue('tech_stack', updated, { shouldValidate: true });
    setCustomTechTags(prev => prev.filter(t => t !== tech));
  };

  const onSubmit = async (data: CandidateApplicationFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Submit any custom technologies into the moderation queue
      if (customTechTags.length > 0) {
        for (const customTech of customTechTags) {
          try {
            await fetch('/api/technologies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: customTech,
                roleSlugOrId: data.primary_role,
              }),
            });
          } catch (e) {
            console.error('Failed to queue custom technology', e);
          }
        }
      }

      // 2. Submit candidate application record
      const res = await createCandidateRecord(data);
      if (res.success) {
        setSubmissionSuccess(true);
      } else {
        setSubmitError(res.error || 'Failed to submit application. Please review fields.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Banner Notice */}
        <div className="mb-6 p-4 border-2 border-[#111113] bg-white text-xs font-mono text-[#111113] flex items-start gap-3 shadow-[4px_4px_0px_0px_#111113]">
          <ShieldCheck className="w-5 h-5 text-[#FF4D00] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5 text-[#FF4D00]">
              [STRICT CONTRACTUAL MANDATE]
            </span>
            <span>
              TalentPulse Direct deploys engineers exclusively for <strong>Contractual, Fractional, and Project-Based</strong> milestones. Do not apply if you are seeking full-time permanent direct employment.
            </span>
          </div>
        </div>

        {submissionSuccess ? (
          /* Submission Success State */
          <div className="bg-white border-2 border-[#111113] p-8 sm:p-12 text-center shadow-[6px_6px_0px_0px_#111113] space-y-6">
            <div className="w-16 h-16 border-2 border-[#111113] bg-[#F8F7F4] text-[#FF4D00] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="font-syne font-extrabold text-2xl sm:text-3xl text-[#111113]">
                Application Ingested
              </h2>
              <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider">
                Your technical profile and resume have been ingested into our talent repository. We review video pitches and CVs within 48 hours.
              </p>
            </div>

            <div className="p-5 bg-[#F8F7F4] border-2 border-[#111113] max-w-md mx-auto font-mono text-xs text-left space-y-2">
              <div className="font-bold text-[#FF4D00] uppercase tracking-wider">
                [SUBMISSION SUMMARY]
              </div>
              <div className="space-y-1 text-[#111113]/80">
                <div>Candidate: <strong>{formValues.full_name}</strong></div>
                <div>Primary Track: <strong>{formValues.primary_role}</strong></div>
                <div>Overlap: <strong>{formValues.overlap_hours_per_day} hrs/day</strong> ({formValues.target_timezones?.join(', ')})</div>
                <div>Core Stack: <strong>{selectedTechs.join(', ')}</strong></div>
                {customTechTags.length > 0 && (
                  <div className="text-[#FF4D00] text-[11px] pt-1">
                    * Custom skills ({customTechTags.join(', ')}) queued for moderation review.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/" className="btn-brutalist btn-brutalist-primary">
                Return to Overview
              </Link>
              <Link href="/candidate/update" className="btn-brutalist">
                Candidate Availability Portal
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-Step Wizard Container */
          <div className="bg-white border-2 border-[#111113] shadow-[8px_8px_0px_0px_#111113] overflow-hidden">
            {/* Step Indicator Header */}
            <div className="bg-[#111113] text-[#F8F7F4] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#111113]">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold block mb-1">
                  [CANDIDATE ONBOARDING]
                </span>
                <span className="font-syne font-bold text-lg sm:text-xl">
                  Step {currentStep} of 5: {
                    currentStep === 1 ? 'Identity & Resume' :
                    currentStep === 2 ? 'Specialization Track' :
                    currentStep === 3 ? 'Timezone & Overlap' :
                    currentStep === 4 ? 'Communication & Pitch' : 'Core Technologies'
                  }
                </span>
              </div>

              {/* Progress Steps Indicators */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-7 h-7 border-2 flex items-center justify-center font-bold ${
                      currentStep === step
                        ? 'bg-[#FF4D00] border-[#FF4D00] text-white'
                        : currentStep > step
                        ? 'bg-white border-white text-[#111113]'
                        : 'border-[#F8F7F4]/30 text-[#F8F7F4]/40'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message Box */}
            {submitError && (
              <div className="mx-6 sm:mx-8 mt-6 p-4 bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-mono flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
              {/* ================= STEP 1: Personal Info & Portfolio & Phone & Resume ================= */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b-2 border-[#111113]/10 pb-3">
                    <h2 className="font-syne font-bold text-base text-[#111113] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#FF4D00]" />
                      Candidate Identity, Phone &amp; Resume
                    </h2>
                    <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-0.5">
                      Phone number and Resume/CV are mandatory requirements for contract assignment.
                    </p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                      Full Legal / Professional Name <span className="text-[#FF4D00]">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('full_name')}
                      placeholder="e.g. Alex Morgan"
                      className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                    />
                    {errors.full_name && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email & Phone */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Email Address <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="alex@domain.com"
                        className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                      />
                      {errors.email && (
                        <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Controller
                        name="phone_number"
                        control={control}
                        render={({ field, fieldState }) => (
                          <PhoneInputWithCountry
                            value={field.value}
                            onChange={(formatted) => {
                              field.onChange(formatted);
                            }}
                            onBlur={field.onBlur}
                            label="Phone Number (with Country Code & Flag)"
                            required
                            defaultCountry="US"
                            error={fieldState.error?.message}
                            placeholder="e.g. (555) 123-4567"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Resume Upload Dropzone */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1 flex items-center justify-between">
                      <span>Upload Resume / Curriculum Vitae (PDF or DOCX) <span className="text-[#FF4D00]">*</span></span>
                      <span className="text-[10px] text-[#FF4D00] font-bold uppercase">Max 10MB</span>
                    </label>

                    {uploadedFileName ? (
                      <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4] flex items-center justify-between">
                        <div className="flex items-center gap-3 font-mono">
                          <div className="w-10 h-10 border-2 border-[#111113] bg-[#111113] text-[#F8F7F4] flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5 text-[#FF4D00]" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#111113] block">
                              {uploadedFileName}
                            </span>
                            <span className="text-[10px] text-[#FF4D00] uppercase font-bold">
                              Ready for submission
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={removeUploadedFile}
                          className="p-1.5 border-2 border-[#111113] text-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition"
                          title="Remove File"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-[#111113] hover:border-[#FF4D00] p-6 text-center cursor-pointer transition bg-[#F8F7F4] group">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 border-2 border-[#111113] bg-white text-[#FF4D00] flex items-center justify-center mb-2 group-hover:bg-[#FF4D00] group-hover:text-white transition-colors">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <span className="font-mono text-xs font-bold uppercase text-[#111113]">
                            Click to upload or drag &amp; drop your Resume
                          </span>
                          <span className="font-mono text-[10px] text-[#111113]/60 uppercase mt-0.5">
                            PDF, DOC, or DOCX (up to 10MB)
                          </span>
                        </div>
                      </div>
                    )}
                    {errors.resume_url && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.resume_url.message}</p>
                    )}
                  </div>

                  {/* LinkedIn & GitHub */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        {...register('linkedin_url')}
                        placeholder="https://linkedin.com/in/alexmorgan"
                        className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        {...register('github_url')}
                        placeholder="https://github.com/alexmorgan"
                        className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                      Personal Portfolio / Technical Blog URL
                    </label>
                    <input
                      type="url"
                      {...register('portfolio_url')}
                      placeholder="https://alexmorgan.dev"
                      className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                    />
                  </div>
                </div>
              )}

              {/* ================= STEP 2: Role & Engagement Terms ================= */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b-2 border-[#111113]/10 pb-3">
                    <h2 className="font-syne font-bold text-base text-[#111113] flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#FF4D00]" />
                      Primary Engineering Specialization Track
                    </h2>
                    <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-0.5">
                      Select your specialization track. Both Active and Future Tracks are open for registration.
                    </p>
                  </div>

                  {/* Dynamic Roles Cards */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2">
                      Select Your Specialty <span className="text-[#FF4D00]">*</span>
                    </label>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {availableRoles.map((role) => {
                        const isSelected = formValues.primary_role === role.slug || formValues.primary_role === role.id;
                        const isClosed = role.status === 'closed';

                        return (
                          <div
                            key={role.id}
                            onClick={() => setValue('primary_role', role.slug, { shouldValidate: true })}
                            className={`p-4 border-2 border-[#111113] cursor-pointer transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-[#111113] text-[#F8F7F4] shadow-[4px_4px_0px_0px_#FF4D00]'
                                : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-syne font-bold text-sm">
                                    {role.title}
                                  </span>
                                  {isClosed && (
                                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-mono uppercase px-1.5 py-0.2 font-bold">
                                      Future Track
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Info icon opening standalone role page in new tab */}
                                  <Link
                                    href={`/roles/${role.slug}?from=apply`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`p-1 rounded-sm border transition-colors ${
                                      isSelected
                                        ? 'border-white/30 text-white/80 hover:text-white hover:border-white'
                                        : 'border-[#111113]/30 text-[#111113]/70 hover:text-[#FF4D00] hover:border-[#FF4D00]'
                                    }`}
                                    title="Open role specification in new tab"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </Link>

                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF4D00]" />}
                                </div>
                              </div>

                              <p className={`font-mono text-xs mt-2 ${isSelected ? 'text-[#F8F7F4]/70' : 'text-[#111113]/60'}`}>
                                {role.short_description}
                              </p>

                              {isClosed && (
                                <p className={`font-mono text-[10px] mt-2 italic ${isSelected ? 'text-amber-200' : 'text-amber-800'}`}>
                                  * Upcoming talent pool — Applications prioritized for upcoming enterprise mandates.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {errors.primary_role && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.primary_role.message}</p>
                    )}
                  </div>

                  {/* Work Modes */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2">
                      Acceptable Work Modes <span className="text-[#FF4D00]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {(['remote', 'hybrid', 'onsite'] as WorkMode[]).map((mode) => {
                        const isChecked = formValues.work_modes?.includes(mode);
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              const current = formValues.work_modes || [];
                              const updated = isChecked
                                ? current.filter((m) => m !== mode)
                                : [...current, mode];
                              setValue('work_modes', updated as any, { shouldValidate: true });
                            }}
                            className={`px-4 py-2 border-2 border-[#111113] font-mono text-xs uppercase font-bold transition ${
                              isChecked
                                ? 'bg-[#111113] text-[#F8F7F4] shadow-[3px_3px_0px_0px_#FF4D00]'
                                : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                            }`}
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                    {errors.work_modes && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.work_modes.message}</p>
                    )}
                  </div>

                  {/* Mandatory Contractual Terms Checkbox */}
                  <div className="p-4 border-2 border-[#111113] bg-[#FF4D00]/10">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('contractual_agreement_accepted')}
                        className="mt-1 w-4 h-4 border-2 border-[#111113] accent-[#FF4D00]"
                      />
                      <div className="font-mono text-xs text-[#111113]">
                        <span className="font-bold block uppercase text-[#111113]">
                          I explicitly acknowledge that TalentPulse Direct represents Contractual &amp; Project-Based Engagements only.
                        </span>
                        <p className="text-[#111113]/70 mt-1 uppercase text-[11px] leading-relaxed">
                          I understand that assignments have defined scopes or milestone-based hours, with zero expectation of direct W2/permanent employment.
                        </p>
                      </div>
                    </label>
                    {errors.contractual_agreement_accepted && (
                      <p className="font-mono text-xs font-bold text-[#FF4D00] mt-2 pl-7">
                        {errors.contractual_agreement_accepted.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ================= STEP 3: Timezone & Availability ================= */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b-2 border-[#111113]/10 pb-3">
                    <h2 className="font-syne font-bold text-base text-[#111113] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#FF4D00]" />
                      Home Timezone &amp; Client Overlap Schedule
                    </h2>
                    <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-0.5">
                      Select your home timezone and commit to client overlap hours.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Home Timezone Select List */}
                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Home Timezone (Select from list) <span className="text-[#FF4D00]">*</span>
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

                    {/* Overlap Hours */}
                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Daily Client Overlap Hours (Min 4 recommended) <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={12}
                        {...register('overlap_hours_per_day')}
                        className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                      />
                    </div>
                  </div>

                  {/* Target Client Regions */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2">
                      Target Client Regions (Select all you can overlap with) <span className="text-[#FF4D00]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {(['USA', 'Europe', 'Asia', 'APAC'] as TargetRegion[]).map((region) => {
                        const isChecked = formValues.target_timezones?.includes(region);
                        return (
                          <button
                            key={region}
                            type="button"
                            onClick={() => {
                              const current = formValues.target_timezones || [];
                              const updated = isChecked
                                ? current.filter((r) => r !== region)
                                : [...current, region];
                              setValue('target_timezones', updated as any, { shouldValidate: true });
                            }}
                            className={`px-4 py-2 border-2 border-[#111113] font-mono text-xs uppercase font-bold transition ${
                              isChecked
                                ? 'bg-[#111113] text-[#F8F7F4] shadow-[3px_3px_0px_0px_#FF4D00]'
                                : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                            }`}
                          >
                            {region}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Availability Status <span className="text-[#FF4D00]">*</span>
                      </label>
                      <select
                        {...register('availability_status')}
                        className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                      >
                        <option value="available_now">Available Now (Immediate Deploy)</option>
                        <option value="available_soon">Available Soon (1-2 Weeks)</option>
                        <option value="part_time_only">Part-Time Only (15-20 hrs/week)</option>
                        <option value="busy">Committed / Future Notice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Available From Date <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="date"
                        {...register('available_from')}
                        className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: Pitch & Video ================= */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b-2 border-[#111113]/10 pb-3">
                    <h2 className="font-syne font-bold text-base text-[#111113] flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#FF4D00]" />
                      Written Pitch &amp; Video Screening
                    </h2>
                    <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-0.5">
                      Video pitches boost client interview acceptance rate by 4x.
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                      English Speaking &amp; Writing Proficiency <span className="text-[#FF4D00]">*</span>
                    </label>
                    <select
                      {...register('english_proficiency')}
                      className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                    >
                      <option value="native_fluent">Native / Bilingual (C2)</option>
                      <option value="professional">Full Professional (C1)</option>
                      <option value="intermediate">Working Proficiency (B2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                      Written Technical Pitch <span className="text-[#FF4D00]">*</span>
                    </label>
                    <textarea
                      rows={4}
                      {...register('written_pitch')}
                      placeholder="Highlight your standout achievements: e.g. Shipped high-concurrency mobile app, fine-tuned Llama-3 with QLoRA, architected AWS multi-region infrastructure, forward deployed customer POCs..."
                      className="w-full font-mono text-xs p-3 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                    />
                    {errors.written_pitch && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.written_pitch.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1 flex items-center justify-between">
                      <span>Self-Recorded Video Pitch URL (Loom / YouTube / Drive)</span>
                      <span className="text-[10px] text-[#FF4D00] font-bold uppercase">Recommended</span>
                    </label>
                    <input
                      type="url"
                      {...register('video_pitch_url')}
                      placeholder="https://www.loom.com/share/... or https://youtu.be/..."
                      className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                    />
                    {errors.video_pitch_url && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.video_pitch_url.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ================= STEP 5: Tech Stack & Review ================= */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b-2 border-[#111113]/10 pb-3">
                    <h2 className="font-syne font-bold text-base text-[#111113] flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#FF4D00]" />
                      Core Tech Stack &amp; Review
                    </h2>
                    <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-0.5">
                      Top 15 vetted technologies for your selected specialization track.
                    </p>
                  </div>

                  {/* Top 15 Technologies specific to selected role */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2 flex items-center justify-between">
                      <span>Associated Track Technologies (Top 15 Approved) <span className="text-[#FF4D00]">*</span></span>
                      <span className="text-[10px] text-[#111113]/60 uppercase">
                        Select at least 2
                      </span>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {roleTopTechs.map((tech) => {
                        const isSelected = selectedTechs.includes(tech.name);
                        return (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => toggleTech(tech.name)}
                            className={`px-3 py-1.5 border-2 border-[#111113] font-mono text-xs font-bold transition ${
                              isSelected
                                ? 'bg-[#111113] text-[#F8F7F4] shadow-[2px_2px_0px_0px_#FF4D00]'
                                : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                            }`}
                          >
                            {isSelected ? `✓ ${tech.name}` : `+ ${tech.name}`}
                          </button>
                        );
                      })}
                    </div>
                    {errors.tech_stack && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.tech_stack.message}</p>
                    )}
                  </div>

                  {/* Selected Tech Stack Badges */}
                  {selectedTechs.length > 0 && (
                    <div className="p-3 bg-[#F8F7F4] border-2 border-[#111113] space-y-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#111113]/70 block">
                        Selected Stack ({selectedTechs.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTechs.map((tech) => {
                          const isCustom = customTechTags.includes(tech);
                          return (
                            <span
                              key={tech}
                              className={`font-mono text-xs px-2.5 py-1 border flex items-center gap-1.5 ${
                                isCustom
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-white text-[#111113] border-[#111113]'
                              }`}
                            >
                              <span>{tech}</span>
                              {isCustom && (
                                <span className="text-[9px] uppercase px-1 bg-amber-200 text-amber-900 font-bold">
                                  Custom
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveTech(tech)}
                                className="hover:text-rose-600 font-bold ml-1"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Additional or Custom Technology via Autocomplete */}
                  <div className="space-y-1">
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113]">
                      Search Or Add Custom Technology (Type 2+ Characters)
                    </label>
                    <p className="font-mono text-[10px] text-[#111113]/60 uppercase">
                      Select matching system skills or add custom tools. Custom technologies are auto-sent to moderation review.
                    </p>
                    <TechAutocomplete
                      roleSlugOrId={formValues.primary_role}
                      selectedTechs={selectedTechs}
                      availableRoleTechs={roleTopTechs}
                      onSelectTech={handleAddTechFromAutocomplete}
                    />
                  </div>

                  {/* Quick Summary Review Box */}
                  <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4] font-mono text-xs space-y-2">
                    <div className="font-bold text-[#FF4D00] uppercase tracking-wider text-[11px]">
                      [APPLICATION DOSSIER PREVIEW]
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-[#111113]/80">
                      <div><strong className="text-[#111113]">Name:</strong> {formValues.full_name}</div>
                      <div><strong className="text-[#111113]">Email:</strong> {formValues.email}</div>
                      <div><strong className="text-[#111113]">Phone:</strong> {formValues.phone_number}</div>
                      <div><strong className="text-[#111113]">Role:</strong> {formValues.primary_role}</div>
                      <div><strong className="text-[#111113]">Resume:</strong> {formValues.resume_filename || 'Attached'}</div>
                      <div><strong className="text-[#111113]">Timezone:</strong> {formValues.home_timezone.split(' — ')[0]}</div>
                      <div><strong className="text-[#111113]">Overlap:</strong> {formValues.overlap_hours_per_day} hrs/day ({formValues.target_timezones?.join(', ')})</div>
                      <div><strong className="text-[#111113]">Status:</strong> {formValues.availability_status}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Navigation Controls */}
              <div className="pt-6 border-t-2 border-[#111113] flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn-brutalist text-xs py-2.5 px-5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="font-mono text-xs uppercase text-[#111113]/70 hover:text-[#FF4D00] transition-colors"
                  >
                    ← Cancel Application
                  </Link>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn-brutalist btn-brutalist-primary text-xs py-2.5 px-6 ml-auto"
                  >
                    <span>Proceed to Step {currentStep + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-brutalist btn-brutalist-primary text-xs py-3 px-8 ml-auto font-bold tracking-wider"
                  >
                    {isSubmitting ? 'Ingesting Dossier...' : 'Submit Final Application →'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center font-mono text-xs">
        Loading Application Wizard...
      </div>
    }>
      <ApplyFormContent />
    </Suspense>
  );
}
