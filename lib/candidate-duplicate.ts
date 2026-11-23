import { parsePhoneNumber } from 'libphonenumber-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Candidate } from '@/types/candidate';

export type DuplicateMatchField = 'email' | 'phone' | 'both';

export interface CandidateDuplicateCheckResult {
  exists: boolean;
  matchedBy: DuplicateMatchField | null;
}

export function normalizeCandidateEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function escapeSqlLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export function extractPhoneDigits(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '');
}

export function parseNormalizedPhone(phone?: string | null): {
  raw: string;
  digits: string;
  countryCallingCode: string | null;
  e164: string | null;
  international: string | null;
  nationalNumber: string | null;
} {
  const raw = (phone || '').trim();
  const digits = extractPhoneDigits(raw);

  if (!raw || digits.length < 6) {
    return {
      raw,
      digits,
      countryCallingCode: null,
      e164: null,
      international: null,
      nationalNumber: null,
    };
  }

  // Only infer country calling code when an explicit international prefix (+ or 00) is present.
  // Never assume a default country (e.g. 'US') because doing so falsely maps foreign local digits onto +1.
  const intlCandidate = raw.startsWith('+')
    ? raw
    : raw.startsWith('00') && digits.length >= 9
    ? `+${digits.slice(2)}`
    : null;

  if (intlCandidate) {
    try {
      const parsed = parsePhoneNumber(intlCandidate);
      if (parsed) {
        return {
          raw,
          digits: extractPhoneDigits(parsed.number) || digits,
          countryCallingCode: parsed.countryCallingCode || null,
          e164: parsed.number,
          international: parsed.formatInternational(),
          nationalNumber: parsed.nationalNumber || null,
        };
      }
    } catch {
      // Fall back to digit-only representation when explicit + prefix cannot be parsed by libphonenumber
    }
  }

  return {
    raw,
    digits,
    countryCallingCode: null,
    e164: null,
    international: null,
    nationalNumber: null,
  };
}

export function phonesMatch(storedPhone?: string | null, inputPhone?: string | null): boolean {
  const a = parseNormalizedPhone(storedPhone);
  const b = parseNormalizedPhone(inputPhone);

  if (!a.raw || !b.raw) return false;

  // When both numbers specify a country calling code, different country codes can NEVER match,
  // even when national/local digits are identical (e.g. +92 300 1234567 vs +91 300 1234567).
  if (a.countryCallingCode && b.countryCallingCode) {
    if (a.countryCallingCode !== b.countryCallingCode) {
      return false;
    }
    if (a.e164 && b.e164 && a.e164 === b.e164) {
      return true;
    }
    if (a.nationalNumber && b.nationalNumber) {
      return a.nationalNumber === b.nationalNumber;
    }
    return a.digits.length >= 7 && a.digits === b.digits;
  }

  // If one number includes an explicit country code and the other does not,
  // only match if the unprefixed string already contains the full international digits (dial code + local).
  // Never match bare local digits alone, which would cause false cross-country blocks.
  if (a.countryCallingCode || b.countryCallingCode) {
    return a.digits.length >= 8 && a.digits === b.digits;
  }

  // Neither number includes a country code: compare full digit sequences strictly.
  if (a.raw.toLowerCase() === b.raw.toLowerCase()) return true;
  return a.digits.length >= 7 && b.digits.length >= 7 && a.digits === b.digits;
}

/**
 * Checks whether any existing candidate record matches the supplied email OR phone_number.
 * Never returns PII; returns only existence boolean and which field matched.
 */
export async function findExistingCandidateMatch(
  supabase: SupabaseClient | null,
  input: { email?: string | null; phone_number?: string | null },
  fallbackCandidates: Candidate[] = []
): Promise<CandidateDuplicateCheckResult> {
  const cleanEmail = normalizeCandidateEmail(input.email);
  const parsedPhone = parseNormalizedPhone(input.phone_number);
  const hasPhone = parsedPhone.digits.length >= 6;

  let emailMatched = false;
  let phoneMatched = false;

  if (supabase) {
    if (cleanEmail) {
      const { data: emailRows, error: emailError } = await supabase
        .from('candidates')
        .select('email')
        .ilike('email', escapeSqlLike(cleanEmail))
        .limit(5);

      if (emailError) {
        throw new Error(`Unable to verify candidate email uniqueness: ${emailError.message}`);
      }

      emailMatched = (emailRows || []).some(
        (row: any) => normalizeCandidateEmail(row.email) === cleanEmail
      );
    }

    if (hasPhone) {
      const exactVariants = Array.from(
        new Set(
          [
            parsedPhone.raw,
            parsedPhone.e164,
            parsedPhone.international,
            parsedPhone.digits,
          ].filter((v): v is string => Boolean(v && v.trim()))
        )
      );

      // Wildcard over the last 7 digits catches stored formatting differences (spaces, dashes, parens)
      const tailDigits = parsedPhone.digits.slice(-7);
      const digitPattern = `%${tailDigits.split('').join('%')}%`;

      const orClauses = [
        ...exactVariants.map((v) => `phone_number.eq."${v.replace(/"/g, '')}"`),
        `phone_number.ilike.${digitPattern}`,
      ];

      const { data: phoneRows, error: phoneError } = await supabase
        .from('candidates')
        .select('phone_number')
        .or(orClauses.join(','))
        .limit(50);

      if (phoneError) {
        throw new Error(`Unable to verify candidate phone uniqueness: ${phoneError.message}`);
      }

      phoneMatched = (phoneRows || []).some((row: any) =>
        phonesMatch(row.phone_number, parsedPhone.raw)
      );
    }
  } else {
    for (const c of fallbackCandidates) {
      if (cleanEmail && normalizeCandidateEmail(c.email) === cleanEmail) {
        emailMatched = true;
      }
      if (hasPhone && phonesMatch(c.phone_number, parsedPhone.raw)) {
        phoneMatched = true;
      }
      if (emailMatched && phoneMatched) break;
    }
  }

  if (emailMatched && phoneMatched) {
    return { exists: true, matchedBy: 'both' };
  }
  if (emailMatched) {
    return { exists: true, matchedBy: 'email' };
  }
  if (phoneMatched) {
    return { exists: true, matchedBy: 'phone' };
  }

  return { exists: false, matchedBy: null };
}
