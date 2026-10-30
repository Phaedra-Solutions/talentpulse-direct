'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hireRequestFormSchema, HireRequestFormValues, TIMELINE_OPTIONS } from '@/types/hire-request';
import { getRolesList } from '@/lib/roles-tech-store';
import { Role } from '@/types/roles-tech';
import { ALL_COUNTRIES } from '@/lib/countries-data';
import { Navbar } from '@/components/Navbar';
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry';
import {
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  Globe,
  User,
  Mail,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

function HireRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role');

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<HireRequestFormValues>({
    resolver: zodResolver(hireRequestFormSchema),
    defaultValues: {
      role_id: '',
      expected_cost: '',
      timeline_to_start: 'immediate',
      client_name: '',
      client_email: '',
      client_phone: '',
      country: 'United States',
      business_name: '',
      project_scope: '',
    },
    mode: 'onTouched',
  });

  const selectedRoleId = watch('role_id');
  const selectedExpectedCost = watch('expected_cost');

  // Load dynamic roles from database / store
  useEffect(() => {
    async function fetchRoles() {
      try {
        const list = await getRolesList(false); // get open roles first, or all
        setRoles(list);
        if (list.length > 0) {
          if (initialRoleParam) {
            const matched = list.find((r) => r.slug === initialRoleParam || r.id === initialRoleParam);
            if (matched) {
              setValue('role_id', matched.id, { shouldValidate: true });
            } else {
              setValue('role_id', list[0].id);
            }
          } else {
            setValue('role_id', list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load roles:', err);
      } finally {
        setIsLoadingRoles(false);
      }
    }
    fetchRoles();
  }, [initialRoleParam, setValue]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const onSubmit = async (values: HireRequestFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/hire-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit hire request');
      }

      setSubmittedData({
        ...json.data,
        roleTitle: selectedRole?.title || values.role_id,
      });
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetBudgetOptions = [
    '$50 - $70 / hr',
    '$70 - $90 / hr',
    '$90 - $120 / hr',
    '$8,000 - $12,000 / month',
    '$12,000 - $18,000 / month',
  ];

  if (submitSuccess && submittedData) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
        <Navbar />

        <main className="flex-1 py-12 px-4 sm:px-[4vw] max-w-4xl mx-auto w-full">
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-10 shadow-[8px_8px_0px_0px_#111113] space-y-8 animate-in fade-in duration-300">
            {/* Success Banner */}
            <div className="flex items-start gap-4 pb-6 border-b-2 border-[#111113]">
              <div className="w-12 h-12 bg-[#FF4D00] text-white flex items-center justify-center shrink-0 border-2 border-[#111113]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
                  [REQUEST DISPATCHED • CODE: {submittedData.id.slice(-6).toUpperCase()}]
                </div>
                <h1 className="font-syne font-extrabold text-2xl sm:text-4xl text-[#111113]">
                  Hiring Request Received
                </h1>
                <p className="font-sans text-sm text-[#111113]/80">
                  Thank you, <strong>{submittedData.client_name}</strong>. Our senior technical recruitment team has received your talent request for <strong>{submittedData.business_name}</strong>.
                </p>
              </div>
            </div>

            {/* Request Summary Receipt */}
            <div className="bg-[#F8F7F4] border-2 border-[#111113] p-5 sm:p-6 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#111113]/20">
                <span className="uppercase text-[#111113]/60">Requested Track</span>
                <span className="font-bold text-sm text-[#111113]">{submittedData.role_title || submittedData.roleTitle}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="uppercase text-[#111113]/60 block mb-1">Company / Organization</span>
                  <span className="font-bold text-[#111113]">{submittedData.business_name}</span>
                </div>
                <div>
                  <span className="uppercase text-[#111113]/60 block mb-1">Target Location</span>
                  <span className="font-bold text-[#111113]">{submittedData.country}</span>
                </div>
                <div>
                  <span className="uppercase text-[#111113]/60 block mb-1">Expected Cost / Budget</span>
                  <span className="font-bold text-[#FF4D00]">{submittedData.expected_cost}</span>
                </div>
                <div>
                  <span className="uppercase text-[#111113]/60 block mb-1">Target Start Timeline</span>
                  <span className="font-bold text-[#111113]">{submittedData.timeline_to_start}</span>
                </div>
                <div>
                  <span className="uppercase text-[#111113]/60 block mb-1">Direct Contact Phone</span>
                  <span className="font-bold text-[#111113]">{submittedData.client_phone}</span>
                </div>
                <div>
                  <span className="uppercase text-[#111113]/60 block mb-1">Business Email</span>
                  <span className="font-bold text-[#111113]">{submittedData.client_email}</span>
                </div>
              </div>

              {submittedData.project_scope && (
                <div className="pt-3 border-t border-[#111113]/20">
                  <span className="uppercase text-[#111113]/60 block mb-1">Contract Scope Brief</span>
                  <p className="font-sans text-xs text-[#111113] whitespace-pre-wrap">{submittedData.project_scope}</p>
                </div>
              )}
            </div>

            {/* Offline Contact Protocol */}
            <div className="p-4 bg-orange-50 border-2 border-[#111113] text-[#111113] space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#FF4D00]">
                <Clock className="w-4 h-4" />
                <span>Next Steps: Offline Review &amp; Candidate Matching</span>
              </div>
              <p className="font-sans text-xs text-[#111113]/85 leading-relaxed">
                A dedicated talent lead from Phaedra Solutions will reach out directly to your email (<strong>{submittedData.client_email}</strong>) and phone (<strong>{submittedData.client_phone}</strong>) within <strong>24 to 48 business hours</strong> with vetted engineer dossiers matching your specific technical requirements.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setSubmittedData(null);
                }}
                className="btn-brutalist btn-brutalist-primary text-xs py-3 px-6"
              >
                Submit Another Request
              </button>
              <Link
                href="/"
                className="btn-brutalist text-xs py-3 px-6"
              >
                Return to Overview
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-[4vw] max-w-5xl mx-auto w-full space-y-8">
        {/* Header Hero */}
        <div className="border-b-2 border-[#111113] pb-6">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF4D00] font-bold tracking-widest uppercase mb-2">
            <span>[ENTERPRISE CLIENT PORTAL]</span>
            <span>•</span>
            <span>[DIRECT CONTRACT DEPLOYMENT]</span>
          </div>
          <h1 className="font-syne font-extrabold text-3xl sm:text-5xl tracking-tight text-[#111113]">
            Hire Contract Engineers &amp; Tech Leaders
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#111113]/80 mt-3 max-w-3xl leading-relaxed">
            Staff elite engineering talent without agency markup or full-time overhead. Every contractor brings <strong>4+ hours guaranteed client timezone overlap</strong> and vetted technical rigor. Tell us what you need and our coordinators will connect offline.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 font-mono text-xs">
            <div className="bg-white border-2 border-[#111113] p-3 shadow-[2px_2px_0px_0px_#111113]">
              <span className="text-[10px] text-[#111113]/60 uppercase block">Model</span>
              <strong className="text-xs text-[#111113]">Direct Contractual</strong>
            </div>
            <div className="bg-white border-2 border-[#111113] p-3 shadow-[2px_2px_0px_0px_#111113]">
              <span className="text-[10px] text-[#111113]/60 uppercase block">Availability</span>
              <strong className="text-xs text-[#FF4D00]">48-hr Deployment</strong>
            </div>
            <div className="bg-white border-2 border-[#111113] p-3 shadow-[2px_2px_0px_0px_#111113]">
              <span className="text-[10px] text-[#111113]/60 uppercase block">Overlap</span>
              <strong className="text-xs text-[#111113]">4+ Hours Minimum</strong>
            </div>
            <div className="bg-white border-2 border-[#111113] p-3 shadow-[2px_2px_0px_0px_#111113]">
              <span className="text-[10px] text-[#111113]/60 uppercase block">Trial</span>
              <strong className="text-xs text-[#111113]">2-Week Risk-Free</strong>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="p-4 bg-red-100 border-2 border-red-500 font-mono text-xs text-red-900 shadow-[4px_4px_0px_0px_#111113]">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        {/* Client Request Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Role Specification */}
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-[#111113] pb-4">
              <div className="w-8 h-8 bg-[#111113] text-[#F8F7F4] flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <div>
                <h2 className="font-syne font-bold text-lg text-[#111113]">
                  Select Engineering Role Track
                </h2>
                <p className="font-mono text-xs text-[#111113]/60">
                  Choose from our core talent tracks or upcoming leadership pools
                </p>
              </div>
            </div>

            {isLoadingRoles ? (
              <div className="p-6 text-center font-mono text-xs text-[#111113]/60">
                Loading dynamic roles from database...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    const isClosed = role.status === 'closed';

                    return (
                      <div
                        key={role.id}
                        onClick={() => setValue('role_id', role.id, { shouldValidate: true })}
                        className={`p-4 border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? 'border-[#FF4D00] bg-orange-50 shadow-[4px_4px_0px_0px_#111113]'
                            : 'border-[#111113] bg-[#F8F7F4] hover:bg-neutral-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 border font-bold ${
                                isClosed
                                  ? 'border-[#111113] bg-neutral-200 text-[#111113]'
                                  : 'border-[#FF4D00] bg-[#FF4D00] text-white'
                              }`}
                            >
                              {isClosed ? 'Upcoming Track' : 'Active Pool'}
                            </span>
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00]"></span>
                            )}
                          </div>
                          <h3 className="font-syne font-bold text-sm text-[#111113] mb-1">
                            {role.title}
                          </h3>
                          <p className="font-sans text-xs text-[#111113]/70 line-clamp-2">
                            {role.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#111113]/10 flex items-center justify-between font-mono text-[10px]">
                          <span className="text-[#111113]/60">View details</span>
                          <Link
                            href={`/roles/${role.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#FF4D00] hover:underline font-bold"
                          >
                            <span>Spec</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.role_id && (
                  <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.role_id.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Budget & Timeline */}
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-[#111113] pb-4">
              <div className="w-8 h-8 bg-[#111113] text-[#F8F7F4] flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <div>
                <h2 className="font-syne font-bold text-lg text-[#111113]">
                  Budget &amp; Start Timeline
                </h2>
                <p className="font-mono text-xs text-[#111113]/60">
                  Define your financial expectations and operational urgency
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Expected Cost / Budget */}
              <div className="space-y-3">
                <label className="block font-mono text-xs uppercase font-bold text-[#111113]">
                  Expected Cost / Budget <span className="text-[#FF4D00]">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-[#111113]/50" />
                  <input
                    type="text"
                    {...register('expected_cost')}
                    placeholder="e.g. $75 - $90 / hr or $10k / mo"
                    className="w-full font-mono text-xs pl-10 pr-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                  />
                </div>
                {errors.expected_cost && (
                  <p className="font-mono text-xs text-[#FF4D00] mt-1">
                    {errors.expected_cost.message}
                  </p>
                )}

                {/* Preset Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-[#111113]/60 self-center mr-1">
                    Presets:
                  </span>
                  {presetBudgetOptions.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setValue('expected_cost', preset, { shouldValidate: true })}
                      className={`text-[10px] font-mono px-2 py-1 border transition-colors ${
                        selectedExpectedCost === preset
                          ? 'border-[#FF4D00] bg-[#FF4D00] text-white font-bold'
                          : 'border-[#111113]/30 bg-white text-[#111113] hover:border-[#111113]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline to start */}
              <div className="space-y-3">
                <label className="block font-mono text-xs uppercase font-bold text-[#111113]">
                  Timeline to Start <span className="text-[#FF4D00]">*</span>
                </label>
                <div className="space-y-2">
                  {TIMELINE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-2.5 border border-[#111113]/30 bg-[#F8F7F4] hover:bg-neutral-100 cursor-pointer font-mono text-xs"
                    >
                      <input
                        type="radio"
                        value={opt.label}
                        {...register('timeline_to_start')}
                        className="accent-[#FF4D00] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[#111113] font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {errors.timeline_to_start && (
                  <p className="font-mono text-xs text-[#FF4D00] mt-1">
                    {errors.timeline_to_start.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Company & Contact Information with International Phone Input */}
          <div className="bg-white border-2 border-[#111113] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#111113] space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-[#111113] pb-4">
              <div className="w-8 h-8 bg-[#111113] text-[#F8F7F4] flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <div>
                <h2 className="font-syne font-bold text-lg text-[#111113]">
                  Business &amp; Direct Contact Information
                </h2>
                <p className="font-mono text-xs text-[#111113]/60">
                  Where our talent coordinators can reach you directly offline
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Business Name */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Business / Company Name <span className="text-[#FF4D00]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-[#111113]/50" />
                  <input
                    type="text"
                    {...register('business_name')}
                    placeholder="e.g. Acme Artificial Intelligence Inc."
                    className="w-full font-mono text-xs pl-10 pr-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                  />
                </div>
                {errors.business_name && (
                  <p className="font-mono text-xs text-[#FF4D00] mt-1">
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              {/* Country Selection */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Country / Operating Region <span className="text-[#FF4D00]">*</span>
                </label>
                <select
                  {...register('country')}
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                >
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="font-mono text-xs text-[#FF4D00] mt-1">{errors.country.message}</p>
                )}
              </div>

              {/* Contact Full Name */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Contact Person Full Name <span className="text-[#FF4D00]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#111113]/50" />
                  <input
                    type="text"
                    {...register('client_name')}
                    placeholder="e.g. Sarah Connor"
                    className="w-full font-mono text-xs pl-10 pr-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                  />
                </div>
                {errors.client_name && (
                  <p className="font-mono text-xs text-[#FF4D00] mt-1">
                    {errors.client_name.message}
                  </p>
                )}
              </div>

              {/* Business Email */}
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Work / Corporate Email <span className="text-[#FF4D00]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#111113]/50" />
                  <input
                    type="email"
                    {...register('client_email')}
                    placeholder="sconnor@acme.ai"
                    className="w-full font-mono text-xs pl-10 pr-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                  />
                </div>
                {errors.client_email && (
                  <p className="font-mono text-xs text-[#FF4D00] mt-1">
                    {errors.client_email.message}
                  </p>
                )}
              </div>
            </div>

            {/* International Phone Input with Country Code & Flags */}
            <div className="pt-2">
              <Controller
                name="client_phone"
                control={control}
                render={({ field, fieldState }) => (
                  <PhoneInputWithCountry
                    value={field.value}
                    onChange={(formattedPhone) => {
                      field.onChange(formattedPhone);
                    }}
                    onBlur={field.onBlur}
                    label="Direct Phone Number (with Country Code & Flag)"
                    required
                    defaultCountry="US"
                    error={fieldState.error?.message}
                    placeholder="Enter phone digits (country prefix auto-formats)"
                  />
                )}
              />
              <p className="font-mono text-[10px] text-[#111113]/60 mt-1">
                International standard validation applied via Google libphonenumber engine. Includes country code and area validation.
              </p>
            </div>

            {/* Project / Contract Scope */}
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1 flex items-center justify-between">
                <span>Contract Scope &amp; Technical Requirements (Optional)</span>
                <span className="text-[10px] text-[#111113]/60 uppercase">Max 3,000 chars</span>
              </label>
              <textarea
                {...register('project_scope')}
                rows={3}
                placeholder="Briefly describe what your team is building, desired tech stack, team size, duration, or specific timezone overlap needed..."
                className="w-full font-mono text-xs p-3 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
              ></textarea>
            </div>
          </div>

          {/* Submission Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113]">
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold text-[#111113] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF4D00]" />
                <span>CONFIDENTIAL CLIENT ENGAGEMENT GUARANTEE</span>
              </div>
              <p className="font-sans text-xs text-[#111113]/70">
                Your hiring requirements are treated under strict confidentiality. No spam. Direct offline recruiter contact within 24-48 hours.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-brutalist btn-brutalist-primary py-3.5 px-8 text-xs font-bold tracking-wider uppercase shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Hiring Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function HirePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center font-mono text-xs">
          Loading hiring portal...
        </div>
      }
    >
      <HireRequestContent />
    </Suspense>
  );
}
