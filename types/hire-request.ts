import { z } from 'zod';

export type HireRequestStatus =
  | 'new'
  | 'contacted'
  | 'negotiating'
  | 'contract_signed'
  | 'closed';

export const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediately (within 1 week)' },
  { value: '1_2_weeks', label: '1 - 2 Weeks' },
  { value: '1_month', label: 'Within 1 Month' },
  { value: 'flexible', label: 'Flexible / Exploring options' },
] as const;

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
  created_at: string;
  updated_at: string;
}

export const hireRequestFormSchema = z.object({
  role_id: z.string().min(1, 'Please select the engineering or leadership role required'),
  expected_cost: z.string().min(2, 'Please indicate your expected budget or target hourly/monthly rate'),
  timeline_to_start: z.string().min(1, 'Please select your target start timeline'),
  client_name: z.string().min(2, 'Contact person name is required'),
  client_email: z.string().email('Please enter a valid business email'),
  client_phone: z.string().min(6, 'Please provide a valid international phone number with country code'),
  country: z.string().min(2, 'Please select or enter your business country/location'),
  business_name: z.string().min(2, 'Business or organization name is required'),
  project_scope: z.string().max(3000).optional(),
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
