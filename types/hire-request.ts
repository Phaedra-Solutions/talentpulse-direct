import { z } from 'zod';

export type HireRequestStatus =
  | 'new'
  | 'contacted'
  | 'negotiating'
  | 'contract_signed'
  | 'closed';

export type HireRequestFilterStatus = 'active' | 'all' | HireRequestStatus;

export const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediately (within 1 week)' },
  { value: '1_2_weeks', label: '1 - 2 Weeks' },
  { value: '1_month', label: 'Within 1 Month' },
  { value: 'flexible', label: 'Flexible / Exploring options' },
] as const;

export const HIRE_REQUEST_LIMITS = {
  BUSINESS_NAME_MIN: 2,
  BUSINESS_NAME_MAX: 80,
  BUSINESS_NAME_MAX_TOKEN: 40,
  CLIENT_NAME_MIN: 2,
  CLIENT_NAME_MAX: 60,
  CLIENT_NAME_MAX_TOKEN: 35,
  PROJECT_SCOPE_MIN: 20,
  PROJECT_SCOPE_MAX: 2000,
  PROJECT_SCOPE_MAX_TOKEN: 100,
  EXPECTED_COST_MIN: 2,
  EXPECTED_COST_MAX: 50,
  CLIENT_EMAIL_MAX: 120,
  CLIENT_PHONE_MIN: 6,
  CLIENT_PHONE_MAX: 24,
  COUNTRY_MIN: 2,
  COUNTRY_MAX: 80,
  TIMELINE_MAX: 60,
  OFFLINE_NOTES_MAX: 2000,
} as const;

export interface HireRequest {
  id: string;
  role_id: string;
  role_title: string;
  expected_cost: string; // e.g. "$60 - $80 / hr" or "$8,000 / month"
  timeline_to_start: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  country: string;
  business_name: string;
  project_scope?: string;
  status: HireRequestStatus;
  offline_notes?: string;
  terms_accepted?: boolean;
  privacy_accepted?: boolean;
  consent_timestamp?: string;
  created_at: string;
  updated_at: string;
}

const HAS_REPEATED_CHAR_RUN = /(.)\1{5,}/;
const HAS_REPEATED_PATTERN_LOOP = /([a-zA-Z]{2,8})\1{2,}/i;
const HAS_HTML_TAGS = /<\/?[a-z][\s\S]*>/i;

function hasExcessiveTokenLength(value: string, maxTokenLen: number): boolean {
  return value
    .trim()
    .split(/\s+/)
    .some((token) => token.length > maxTokenLen);
}

function hasLowDiversityLongToken(value: string, minTokenLen = 12, maxUniqueLetters = 3): boolean {
  return value
    .trim()
    .split(/\s+/)
    .some((token) => {
      const lettersOnly = token.toLowerCase().replace(/[^a-z\u00C0-\u024F]/g, '');
      if (lettersOnly.length < minTokenLen) return false;
      return new Set(lettersOnly).size <= maxUniqueLetters;
    });
}

export const hireRequestFormSchema = z.object({
  role_id: z
    .string()
    .trim()
    .min(1, 'Please select the engineering or leadership role required')
    .max(100, 'Role identifier is too long'),
  expected_cost: z
    .string()
    .trim()
    .min(
      HIRE_REQUEST_LIMITS.EXPECTED_COST_MIN,
      'Please indicate your expected budget or target hourly/monthly rate'
    )
    .max(
      HIRE_REQUEST_LIMITS.EXPECTED_COST_MAX,
      `Expected budget must be at most ${HIRE_REQUEST_LIMITS.EXPECTED_COST_MAX} characters`
    )
    .refine(
      (val) => !HAS_HTML_TAGS.test(val),
      'HTML or script tags are not permitted'
    ),
  timeline_to_start: z
    .string()
    .trim()
    .min(1, 'Please select your target start timeline')
    .max(HIRE_REQUEST_LIMITS.TIMELINE_MAX, 'Target timeline value is too long'),
  client_name: z
    .string()
    .trim()
    .min(
      HIRE_REQUEST_LIMITS.CLIENT_NAME_MIN,
      `Contact person full name must be at least ${HIRE_REQUEST_LIMITS.CLIENT_NAME_MIN} characters`
    )
    .max(
      HIRE_REQUEST_LIMITS.CLIENT_NAME_MAX,
      `Contact person full name cannot exceed ${HIRE_REQUEST_LIMITS.CLIENT_NAME_MAX} characters`
    )
    .regex(
      /^[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F\s.'\-]*$/,
      'Please enter a valid full name using letters, spaces, hyphens, periods, or apostrophes only (no numbers or symbols)'
    )
    .refine(
      (val) => (val.match(/[a-zA-Z\u00C0-\u024F]/g) || []).length >= 2,
      'Contact person full name must contain at least 2 letters'
    )
    .refine(
      (val) =>
        !HAS_REPEATED_CHAR_RUN.test(val) &&
        !HAS_REPEATED_PATTERN_LOOP.test(val) &&
        !hasLowDiversityLongToken(val),
      'Please enter a real contact person name'
    )
    .refine(
      (val) => !hasExcessiveTokenLength(val, HIRE_REQUEST_LIMITS.CLIENT_NAME_MAX_TOKEN),
      `Individual words in contact name cannot exceed ${HIRE_REQUEST_LIMITS.CLIENT_NAME_MAX_TOKEN} characters`
    ),
  client_email: z
    .string()
    .trim()
    .max(
      HIRE_REQUEST_LIMITS.CLIENT_EMAIL_MAX,
      `Email address cannot exceed ${HIRE_REQUEST_LIMITS.CLIENT_EMAIL_MAX} characters`
    )
    .email('Please enter a valid business email'),
  client_phone: z
    .string()
    .trim()
    .min(
      HIRE_REQUEST_LIMITS.CLIENT_PHONE_MIN,
      'Please provide a valid international phone number with country code'
    )
    .max(
      HIRE_REQUEST_LIMITS.CLIENT_PHONE_MAX,
      `Phone number cannot exceed ${HIRE_REQUEST_LIMITS.CLIENT_PHONE_MAX} characters`
    ),
  country: z
    .string()
    .trim()
    .min(HIRE_REQUEST_LIMITS.COUNTRY_MIN, 'Please select or enter your business country/location')
    .max(HIRE_REQUEST_LIMITS.COUNTRY_MAX, 'Country name is too long'),
  business_name: z
    .string()
    .trim()
    .min(
      HIRE_REQUEST_LIMITS.BUSINESS_NAME_MIN,
      `Business / company name must be at least ${HIRE_REQUEST_LIMITS.BUSINESS_NAME_MIN} characters`
    )
    .max(
      HIRE_REQUEST_LIMITS.BUSINESS_NAME_MAX,
      `Business / company name cannot exceed ${HIRE_REQUEST_LIMITS.BUSINESS_NAME_MAX} characters`
    )
    .regex(
      /^[a-zA-Z0-9\u00C0-\u024F\s.,&'()\-/+]+$/,
      'Business name contains unsupported special characters'
    )
    .refine(
      (val) => (val.match(/[a-zA-Z0-9\u00C0-\u024F]/g) || []).length >= 2,
      'Business name must contain at least 2 alphanumeric characters'
    )
    .refine(
      (val) =>
        !HAS_REPEATED_CHAR_RUN.test(val) &&
        !HAS_REPEATED_PATTERN_LOOP.test(val) &&
        !hasLowDiversityLongToken(val),
      'Please enter a valid company or organization name'
    )
    .refine(
      (val) => !hasExcessiveTokenLength(val, HIRE_REQUEST_LIMITS.BUSINESS_NAME_MAX_TOKEN),
      `Individual words in business name cannot exceed ${HIRE_REQUEST_LIMITS.BUSINESS_NAME_MAX_TOKEN} characters`
    ),
  project_scope: z
    .string()
    .trim()
    .max(
      HIRE_REQUEST_LIMITS.PROJECT_SCOPE_MAX,
      `Contract scope & technical requirements cannot exceed ${HIRE_REQUEST_LIMITS.PROJECT_SCOPE_MAX.toLocaleString()} characters`
    )
    .refine(
      (val) => val.length === 0 || val.length >= HIRE_REQUEST_LIMITS.PROJECT_SCOPE_MIN,
      `If provided, please enter at least ${HIRE_REQUEST_LIMITS.PROJECT_SCOPE_MIN} characters describing your technical requirements (or leave blank)`
    )
    .refine(
      (val) => val.length === 0 || (val.match(/[a-zA-Z0-9\u00C0-\u024F]/g) || []).length >= 10,
      'Contract scope must contain meaningful technical details'
    )
    .refine(
      (val) => !HAS_HTML_TAGS.test(val),
      'HTML or script tags are not permitted in contract scope'
    )
    .refine(
      (val) => val.length === 0 || !hasExcessiveTokenLength(val, HIRE_REQUEST_LIMITS.PROJECT_SCOPE_MAX_TOKEN),
      'Contract scope contains an overly long unbroken word; please separate terms with spaces'
    )
    .optional()
    .or(z.literal('')),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge and accept the Commercial Terms of Use to proceed.',
  }),
  privacy_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge and accept the Global Privacy Policy to proceed.',
  }),
});

export const hireRequestPatchSchema = z.object({
  status: z.enum(['new', 'contacted', 'negotiating', 'contract_signed', 'closed']).optional(),
  offline_notes: z
    .string()
    .max(
      HIRE_REQUEST_LIMITS.OFFLINE_NOTES_MAX,
      `Internal recruiter notes cannot exceed ${HIRE_REQUEST_LIMITS.OFFLINE_NOTES_MAX.toLocaleString()} characters`
    )
    .refine((val) => !HAS_HTML_TAGS.test(val), 'HTML tags are not permitted in notes')
    .optional(),
});

export type HireRequestFormValues = z.infer<typeof hireRequestFormSchema>;

export function getHireRequestStatusMeta(status: HireRequestStatus) {
  switch (status) {
    case 'new':
      return {
        label: 'New Request',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-400',
        badge: 'bg-[#FF4D00] text-white',
      };
    case 'contacted':
      return {
        label: 'Contacted Offline',
        color: 'bg-blue-100 text-blue-800 border-blue-400',
        badge: 'bg-blue-600 text-white',
      };
    case 'negotiating':
      return {
        label: 'In Negotiation',
        color: 'bg-purple-100 text-purple-800 border-purple-400',
        badge: 'bg-purple-600 text-white',
      };
    case 'contract_signed':
      return {
        label: 'Contract Signed',
        color: 'bg-green-100 text-green-900 border-green-500',
        badge: 'bg-emerald-600 text-white',
      };
    case 'closed':
      return {
        label: 'Closed / Completed',
        color: 'bg-neutral-200 text-neutral-700 border-neutral-400',
        badge: 'bg-neutral-600 text-white',
      };
    default:
      return {
        label: status,
        color: 'bg-neutral-100 text-neutral-800 border-neutral-300',
        badge: 'bg-[#111113] text-white',
      };
  }
}
