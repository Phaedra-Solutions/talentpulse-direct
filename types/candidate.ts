import { z } from 'zod';

export type PrimaryRole = 
  | 'ai_engineer'
  | 'forward_deployed_engineer'
  | 'mobile_app_developer'
  | 'solutions_architect'
  | 'full_stack'
  | 'fractional_cto'
  | string;

export type AvailabilityStatus = 
  | 'available_now'
  | 'available_soon'
  | 'part_time_only'
  | 'busy';

export type EnglishProficiency = 
  | 'native_fluent'
  | 'professional'
  | 'intermediate';

export type PipelineStage = 
  | 'new'
  | 'vetted'
  | 'interviewing'
  | 'assigned'
  | 'on_hold';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type TargetRegion = 'USA' | 'Europe' | 'Asia' | 'APAC';

export interface Candidate {
  id: string;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone_number: string;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  resume_url?: string | null;
  resume_filename?: string | null;
  primary_role: PrimaryRole;
  contractual_agreement_accepted: boolean;
  work_modes: WorkMode[];
  home_timezone: string;
  target_timezones: TargetRegion[];
  overlap_hours_per_day: number;
  availability_status: AvailabilityStatus;
  available_from: string;
  english_proficiency: EnglishProficiency;
  written_pitch: string;
  video_pitch_url?: string | null;
  tech_stack: string[];
  pipeline_stage: PipelineStage;
  internal_notes: string;
}

// Predefined Global Timezones with UTC Offsets
export const TIMEZONE_OPTIONS = [
  { value: 'UTC-10:00 (HST - Hawaii)', label: 'UTC-10:00 — HST (Hawaii)' },
  { value: 'UTC-08:00 (PST - US Pacific / Los Angeles)', label: 'UTC-08:00 — PST (Los Angeles, San Francisco, Vancouver)' },
  { value: 'UTC-07:00 (MST - US Mountain / Denver)', label: 'UTC-07:00 — MST (Denver, Phoenix, Calgary)' },
  { value: 'UTC-06:00 (CST - US Central / Chicago)', label: 'UTC-06:00 — CST (Chicago, Dallas, Mexico City)' },
  { value: 'UTC-05:00 (EST - US Eastern / New York)', label: 'UTC-05:00 — EST (New York, Toronto, Miami)' },
  { value: 'UTC-04:00 (AST - Santiago / Halifax)', label: 'UTC-04:00 — AST (Santiago, Halifax, Caracas)' },
  { value: 'UTC-03:00 (ART / BRT - Buenos Aires / Sao Paulo)', label: 'UTC-03:00 — ART / BRT (Buenos Aires, São Paulo)' },
  { value: 'UTC+00:00 (GMT / WET - London / Dublin / Lisbon)', label: 'UTC+00:00 — GMT / WET (London, Dublin, Lisbon, Casablanca)' },
  { value: 'UTC+01:00 (CET - Berlin / Paris / Amsterdam)', label: 'UTC+01:00 — CET (Berlin, Paris, Amsterdam, Rome, Madrid, Warsaw)' },
  { value: 'UTC+02:00 (EET - Athens / Cairo / Helsinki)', label: 'UTC+02:00 — EET (Athens, Cairo, Helsinki, Bucharest, Kyiv)' },
  { value: 'UTC+03:00 (MSK / EAT - Istanbul / Riyadh / Nairobi)', label: 'UTC+03:00 — MSK / EAT (Istanbul, Riyadh, Nairobi, Moscow)' },
  { value: 'UTC+04:00 (GST - Dubai / Abu Dhabi / Baku)', label: 'UTC+04:00 — GST (Dubai, Abu Dhabi, Baku, Tbilisi)' },
  { value: 'UTC+04:30 (AFT - Kabul)', label: 'UTC+04:30 — AFT (Kabul)' },
  { value: 'UTC+05:00 (PKT - Karachi / Islamabad / Tashkent)', label: 'UTC+05:00 — PKT (Karachi, Islamabad, Tashkent)' },
  { value: 'UTC+05:30 (IST - New Delhi / Mumbai / Bengaluru)', label: 'UTC+05:30 — IST (New Delhi, Mumbai, Bengaluru, Colombo)' },
  { value: 'UTC+06:00 (BST - Dhaka / Almaty)', label: 'UTC+06:00 — BST (Dhaka, Almaty)' },
  { value: 'UTC+07:00 (ICT - Bangkok / Jakarta / Hanoi)', label: 'UTC+07:00 — ICT (Bangkok, Jakarta, Ho Chi Minh City)' },
  { value: 'UTC+08:00 (SGT - Singapore / Hong Kong / Perth)', label: 'UTC+08:00 — SGT (Singapore, Hong Kong, Taipei, Beijing, Perth)' },
  { value: 'UTC+09:00 (JST / KST - Tokyo / Seoul)', label: 'UTC+09:00 — JST / KST (Tokyo, Seoul)' },
  { value: 'UTC+09:30 (ACST - Adelaide / Darwin)', label: 'UTC+09:30 — ACST (Adelaide, Darwin)' },
  { value: 'UTC+10:00 (AEST - Sydney / Melbourne / Brisbane)', label: 'UTC+10:00 — AEST (Sydney, Melbourne, Brisbane)' },
  { value: 'UTC+12:00 (NZST - Auckland / Wellington / Fiji)', label: 'UTC+12:00 — NZST (Auckland, Wellington, Fiji)' },
];

// Zod Schema for Candidate Application Form
export const candidateApplicationSchema = z.object({
  // Step 1: Personal Info & Portfolio & Resume
  full_name: z.string().min(2, 'Full legal or professional name is required'),
  email: z.string().email('Please enter a valid personal or business email'),
  phone_number: z.string().min(7, 'Mandatory: Please provide a valid phone number with international country code (e.g. +1 555 123 4567)').max(30),
  linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  resume_url: z.string().min(1, 'Mandatory: Please upload your Resume/CV (PDF or DOCX)').max(15_000_000, 'Resume file payload exceeds maximum allowable size (15MB)').optional().or(z.literal('')),
  resume_filename: z.string().max(255).optional(),

  // Step 2: Role & Engagement terms
  primary_role: z.string().min(1, 'Please select your primary engineering specialization'),
  contractual_agreement_accepted: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge and accept contractual & project-based terms only.',
  }),
  work_modes: z.array(z.enum(['remote', 'hybrid', 'onsite'] as const)).min(1, 'Select at least one work mode preference'),

  // Step 3: Timezone & Availability (Hourly rate removed - handled offline)
  home_timezone: z.string().min(1, 'Please select your home timezone from the list'),
  target_timezones: z.array(z.enum(['USA', 'Europe', 'Asia', 'APAC'] as const)).min(1, 'Select at least one target client region'),
  overlap_hours_per_day: z.coerce.number().min(2, 'Minimum 2 hours daily overlap required').max(12, 'Maximum 12 hours'),
  availability_status: z.enum(['available_now', 'available_soon', 'part_time_only', 'busy'] as const),
  available_from: z.string().min(1, 'Please specify the date you can start'),

  // Step 4: English & Pitch
  english_proficiency: z.enum(['native_fluent', 'professional', 'intermediate'] as const),
  written_pitch: z.string().min(40, 'Please provide at least 40 characters highlighting your key technical edge & projects'),
  video_pitch_url: z.string().url('Please provide a valid Loom, YouTube, Vimeo, or Google Drive URL').optional().or(z.literal('')),

  // Step 5: Tech Stack
  tech_stack: z.array(z.string()).min(2, 'Select at least 2 core technologies from your stack'),
});

export type CandidateApplicationFormValues = z.infer<typeof candidateApplicationSchema>;

// Zod Schema for Candidate Availability Self-Update
export const candidateUpdateSchema = z.object({
  availability_status: z.enum(['available_now', 'available_soon', 'part_time_only', 'busy'] as const),
  available_from: z.string().min(1, 'Please specify availability start date'),
  overlap_hours_per_day: z.coerce.number().min(1).max(12),
  target_timezones: z.array(z.enum(['USA', 'Europe', 'Asia', 'APAC'] as const)).min(1, 'Select at least one region'),
  home_timezone: z.string().min(1, 'Please select your timezone'),
  video_pitch_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  written_pitch: z.string().min(20, 'Pitch must be at least 20 characters'),
});

export type CandidateUpdateFormValues = z.infer<typeof candidateUpdateSchema>;

// Filter Criteria for Recruiter Dashboard
export interface CandidateFilters {
  searchQuery: string;
  primaryRole: string; // 'all' or PrimaryRole
  targetRegion: string; // 'all' or TargetRegion
  availabilityStatus: string; // 'all' or AvailabilityStatus
  pipelineStage: string; // 'all' or PipelineStage
  hasVideoPitch: string; // 'all' | 'yes' | 'no'
  hasResume: string; // 'all' | 'yes' | 'no'
  englishProficiency: string; // 'all' or EnglishProficiency
  sortBy: 'created_at' | 'overlap_hours_per_day' | 'full_name';
  sortOrder: 'asc' | 'desc';
}

// Display Mappings and Badges
export const ROLE_LABELS: Record<string, { label: string; badgeClass: string; desc: string }> = {
  ai_engineer: {
    label: 'AI / LLM Engineer',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    desc: 'Fine-tuning, RAG, PyTorch, vLLM, Agentic frameworks, inference latency',
  },
  forward_deployed_engineer: {
    label: 'Forward Deployed Engineer (FDE)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    desc: 'Enterprise deployments, client integrations, rapid prototyping, POC bridges',
  },
  mobile_app_developer: {
    label: 'Mobile App Developer',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    desc: 'iOS, Android, React Native, Flutter, Swift, Kotlin, offline sync',
  },
  solutions_architect: {
    label: 'Solutions Architect',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    desc: 'Multi-cloud systems (AWS/GCP/Azure), distributed scale, microservices, SOC2',
  },
  full_stack: {
    label: 'Full-Stack Developer',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    desc: 'Next.js App Router, TypeScript, React, PostgreSQL, serverless APIs',
  },
  fractional_cto: {
    label: 'Fractional CTO',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    desc: 'Strategic leadership, architecture due diligence, cloud cost optimization, team scaling',
  },
  'fractional-cto': {
    label: 'Fractional CTO',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    desc: 'Strategic leadership, architecture due diligence, cloud cost optimization, team scaling',
  },
  'ai-llm-engineer': {
    label: 'AI & LLM Engineer',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    desc: 'Fine-tuning, RAG, PyTorch, vLLM, Agentic frameworks, inference latency',
  },
  'forward-deployed-engineer': {
    label: 'Forward Deployed Engineer (FDE)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    desc: 'Enterprise deployments, client integrations, rapid prototyping, POC bridges',
  },
  'mobile-developers': {
    label: 'Mobile Developers',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    desc: 'iOS, Android, React Native, Flutter, Swift, Kotlin, offline sync',
  },
  'solutions-architects': {
    label: 'Solutions Architects',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    desc: 'Multi-cloud systems (AWS/GCP/Azure), distributed scale, microservices, SOC2',
  },
  'full-stack-developers': {
    label: 'Full-Stack Developers',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    desc: 'Next.js App Router, TypeScript, React, PostgreSQL, serverless APIs',
  },
  // Legacy / graceful fallback for previously saved candidates
  software_engineer: {
    label: 'Software Engineer',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    desc: 'General software systems & cloud application engineering',
  },
};

export function getRoleMeta(role?: string): { label: string; badgeClass: string; desc: string } {
  if (role && ROLE_LABELS[role]) {
    return ROLE_LABELS[role];
  }
  return {
    label: role ? role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Software Specialist',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    desc: 'Contract & project-based engineering contributor',
  };
}

export const AVAILABILITY_LABELS: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  available_now: {
    label: 'Available Now',
    dotClass: 'bg-emerald-500 animate-pulse',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
  available_soon: {
    label: 'Available Soon (1-2 wks)',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  part_time_only: {
    label: 'Part-Time Only (15-20h/w)',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  },
  busy: {
    label: 'Committed / Busy',
    dotClass: 'bg-zinc-400',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  },
};

export function getAvailabilityMeta(status?: string): { label: string; dotClass: string; badgeClass: string } {
  if (status && AVAILABILITY_LABELS[status]) {
    return AVAILABILITY_LABELS[status];
  }
  return {
    label: status ? status.replace(/_/g, ' ') : 'Available',
    dotClass: 'bg-zinc-400',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  };
}

export const PIPELINE_STAGE_LABELS: Record<string, { label: string; step: number; colorClass: string }> = {
  new: { label: 'New Lead', step: 1, colorClass: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
  vetted: { label: 'Technically Vetted', step: 2, colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
  interviewing: { label: 'Client Interviewing', step: 3, colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  assigned: { label: 'Active on Project', step: 4, colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  on_hold: { label: 'On Hold / Paused', step: 0, colorClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
};

export function getPipelineStageMeta(stage?: string): { label: string; step: number; colorClass: string } {
  if (stage && PIPELINE_STAGE_LABELS[stage]) {
    return PIPELINE_STAGE_LABELS[stage];
  }
  return {
    label: stage ? stage.replace(/_/g, ' ') : 'New Lead',
    step: 1,
    colorClass: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
  };
}

export const ENGLISH_LABELS: Record<string, string> = {
  native_fluent: 'Native / Bilingual (C2)',
  professional: 'Full Professional (C1)',
  intermediate: 'Working Proficiency (B2)',
};
