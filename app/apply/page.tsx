'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  candidateApplicationSchema, 
  CandidateApplicationFormValues, 
  PrimaryRole, 
  WorkMode, 
  TargetRegion, 
  AvailabilityStatus, 
  EnglishProficiency,
  ROLE_LABELS,
  TIMEZONE_OPTIONS
} from '@/types/candidate';
import { createCandidateRecord } from '@/lib/candidate-store';
import { Navbar } from '@/components/Navbar';
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
  FileCheck
} from 'lucide-react';

const COMMON_TECH_STACK = [
  'Python', 'PyTorch', 'vLLM', 'LangChain', 'LlamaIndex', 
  'React Native', 'Swift', 'Kotlin', 'Flutter', 'iOS', 'Android',
  'AWS', 'GCP', 'Terraform', 'Kubernetes', 'Docker', 'Istio',
  'TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL',
  'FastAPI', 'Kafka', 'Redis', 'gRPC', 'GraphQL'
];

export default function ApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTechs, setSelectedTechs] = useState<string[]>(['Python', 'TypeScript', 'Docker']);
  const [customTechInput, setCustomTechInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
      primary_role: 'ai_engineer',
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

  // Resume File Upload handler (creates local base64/data URI and sets filename)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller PDF or Word document.');
      return;
    }

    setUploadedFileName(file.name);
    setValue('resume_filename', file.name);

    // Read as Data URL so it can be previewed or persisted
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setValue('resume_url', result, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedFile = () => {
    setUploadedFileName(null);
    setValue('resume_url', '', { shouldValidate: true });
    setValue('resume_filename', '');
  };

  // Step validation triggers
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CandidateApplicationFormValues)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['full_name', 'email', 'phone_number', 'linkedin_url', 'github_url', 'portfolio_url', 'resume_url'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['primary_role', 'contractual_agreement_accepted', 'work_modes'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['home_timezone', 'target_timezones', 'overlap_hours_per_day', 'availability_status', 'available_from'];
    } else if (currentStep === 4) {
      fieldsToValidate = ['english_proficiency', 'written_pitch', 'video_pitch_url'];
    }

    const isValid = await trigger(fieldsToValidate);
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

  const addCustomTech = () => {
    if (!customTechInput.trim()) return;
    const clean = customTechInput.trim();
    if (!selectedTechs.includes(clean)) {
      const updated = [...selectedTechs, clean];
      setSelectedTechs(updated);
      setValue('tech_stack', updated, { shouldValidate: true });
    }
    setCustomTechInput('');
  };

  const onSubmit = async (data: CandidateApplicationFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
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

            <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4] max-w-sm mx-auto text-left font-mono text-xs space-y-2">
              <div>
                <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Candidate:</span>
                <p className="font-bold text-[#111113]">{formValues.full_name}</p>
              </div>
              <div>
                <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Email:</span>
                <p className="text-[#FF4D00] font-bold">{formValues.email}</p>
              </div>
              <div>
                <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Phone:</span>
                <p className="text-[#111113]">{formValues.phone_number}</p>
              </div>
              {formValues.resume_filename && (
                <div>
                  <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Attached CV:</span>
                  <p className="text-[#111113] font-bold">{formValues.resume_filename}</p>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs">
              <Link
                href="/admin/dashboard"
                className="btn-brutalist btn-brutalist-primary py-3 px-6"
              >
                View Pipeline Dashboard
              </Link>
              <Link
                href="/candidate/update"
                className="btn-brutalist py-3 px-6"
              >
                Availability Portal
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-Step Application Form Card */
          <div className="bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113] overflow-hidden">
            {/* Form Header with Progress Stepper */}
            <div className="p-6 sm:p-8 border-b-2 border-[#111113] bg-[#F8F7F4]">
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-1">
                [TALENT ONBOARDING PROTOCOL]
              </div>
              <h1 className="font-syne font-extrabold text-2xl sm:text-3xl text-[#111113]">
                Candidate Application
              </h1>
              <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-1">
                Phase {currentStep} of 5 — Complete your technical dossier for direct client matching.
              </p>

              {/* Step Pills */}
              <div className="grid grid-cols-5 gap-2 mt-6 font-mono text-[10px] uppercase">
                {[
                  { step: 1, label: 'Identity & CV' },
                  { step: 2, label: 'Role & Terms' },
                  { step: 3, label: 'Timezone' },
                  { step: 4, label: 'Pitch & Video' },
                  { step: 5, label: 'Tech Stack' },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col gap-1">
                    <div 
                      className={`h-1.5 transition-all duration-200 ${
                        s.step < currentStep 
                          ? 'bg-[#111113]' 
                          : s.step === currentStep 
                          ? 'bg-[#FF4D00]' 
                          : 'bg-[#111113]/20'
                      }`}
                    />
                    <span className={`hidden sm:inline font-bold truncate ${s.step === currentStep ? 'text-[#FF4D00]' : 'text-[#111113]/70'}`}>
                      {s.step}. {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message Box */}
            {submitError && (
              <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
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
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1 flex items-center justify-between">
                        <span>Phone Number (with Country Code) <span className="text-[#FF4D00]">*</span></span>
                        <span className="text-[10px] text-[#111113]/60 uppercase">Mandatory</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#111113]/50" />
                        <input
                          type="tel"
                          {...register('phone_number')}
                          placeholder="+1 555 123 4567 or +44 20 7946 0912"
                          className="w-full font-mono text-xs pl-10 pr-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                        />
                      </div>
                      {errors.phone_number && (
                        <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.phone_number.message}</p>
                      )}
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
                      Primary Track &amp; Contractual Terms
                    </h2>
                    <p className="font-mono text-xs text-[#111113]/70 uppercase tracking-wider mt-0.5">
                      Select your specialty: AI, FDE, Mobile App Developer, Solutions Architect, or Full-Stack.
                    </p>
                  </div>

                  {/* Primary Role Selector Cards */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2">
                      Primary Engineering Specialization <span className="text-[#FF4D00]">*</span>
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(['ai_engineer', 'forward_deployed_engineer', 'mobile_app_developer', 'solutions_architect', 'full_stack'] as PrimaryRole[]).map((role) => {
                        const meta = ROLE_LABELS[role];
                        const isSelected = formValues.primary_role === role;
                        return (
                          <div
                            key={role}
                            onClick={() => setValue('primary_role', role, { shouldValidate: true })}
                            className={`p-4 border-2 border-[#111113] cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#111113] text-[#F8F7F4] shadow-[4px_4px_0px_0px_#FF4D00]'
                                : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-syne font-bold text-sm">
                                {meta.label}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF4D00]" />}
                            </div>
                            <p className={`font-mono text-xs mt-1.5 ${isSelected ? 'text-[#F8F7F4]/70' : 'text-[#111113]/60'}`}>
                              {meta.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
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
                      {errors.home_timezone && (
                        <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.home_timezone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Daily Client Overlap Hours (min 2) <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="12"
                        {...register('overlap_hours_per_day')}
                        className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                      />
                      <span className="font-mono text-[10px] text-[#111113]/60 uppercase mt-1 block">Hours per day available during target client working windows.</span>
                    </div>
                  </div>

                  {/* Target Client Regions */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2">
                      Target Client Regions Willing to Overlap With <span className="text-[#FF4D00]">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                            className={`p-3 border-2 border-[#111113] font-mono text-xs uppercase font-bold transition flex items-center justify-between ${
                              isChecked
                                ? 'bg-[#111113] text-[#F8F7F4] shadow-[3px_3px_0px_0px_#FF4D00]'
                                : 'bg-[#F8F7F4] text-[#111113] hover:bg-white'
                            }`}
                          >
                            <span>{region}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-[#FF4D00]" />}
                          </button>
                        );
                      })}
                    </div>
                    {errors.target_timezones && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.target_timezones.message}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Current Availability Status <span className="text-[#FF4D00]">*</span>
                      </label>
                      <select
                        {...register('availability_status')}
                        className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                      >
                        <option value="available_now">Available Now (Immediate)</option>
                        <option value="available_soon">Available Soon (1-2 weeks)</option>
                        <option value="part_time_only">Part-Time Only (15-20h/w)</option>
                        <option value="busy">Committed / Busy for now</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                        Available From Date <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="date"
                        {...register('available_from')}
                        className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: English & Video Pitch ================= */}
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
                    <p className="font-mono text-[10px] text-[#111113]/60 uppercase mt-1">
                      2-3 minute video introducing yourself, walking through a past architecture diagram or code repository, and explaining your overlap availability.
                    </p>
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
                      Pick technologies you can deploy immediately on client contracts.
                    </p>
                  </div>

                  {/* Common tags */}
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-2">
                      Select Primary Technologies (Select at least 2) <span className="text-[#FF4D00]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_TECH_STACK.map((tech) => {
                        const isSelected = selectedTechs.includes(tech);
                        return (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => toggleTech(tech)}
                            className={`px-3 py-1.5 border-2 border-[#111113] font-mono text-xs font-bold transition ${
                              isSelected
                                ? 'bg-[#111113] text-[#F8F7F4] shadow-[2px_2px_0px_0px_#FF4D00]'
                                : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                            }`}
                          >
                            {isSelected ? `✓ ${tech}` : `+ ${tech}`}
                          </button>
                        );
                      })}
                    </div>
                    {errors.tech_stack && (
                      <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.tech_stack.message}</p>
                    )}
                  </div>

                  {/* Add custom technology */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTechInput}
                      onChange={(e) => setCustomTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTech();
                        }
                      }}
                      placeholder="Add custom technology (e.g. Swift, Terraform, Temporal)..."
                      className="font-mono text-xs px-3.5 py-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 flex-1 focus:outline-hidden focus:border-[#FF4D00]"
                    />
                    <button
                      type="button"
                      onClick={addCustomTech}
                      className="btn-brutalist text-xs py-2 px-4 uppercase font-bold"
                    >
                      Add Tag
                    </button>
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
                      <div><strong className="text-[#111113]">Role:</strong> {ROLE_LABELS[formValues.primary_role]?.label}</div>
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
                    ← Overview
                  </Link>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn-brutalist btn-brutalist-primary text-xs py-2.5 px-6"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-brutalist btn-brutalist-primary text-xs py-3 px-8 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#FF4D00]" />
                    <span>{isSubmitting ? 'SUBMITTING DOSSIER...' : 'SUBMIT CANDIDATE DOSSIER & CV'}</span>
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
