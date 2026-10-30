import { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumber, CountryCode } from 'libphonenumber-js';

export interface CountryInfo {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

export function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length !== 2) return '🌐';
  try {
    const codePoints = isoCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

// Country names mapping for ISO alpha-2 codes
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  PK: 'Pakistan',
  IN: 'India',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  NL: 'Netherlands',
  SE: 'Sweden',
  CH: 'Switzerland',
  IE: 'Ireland',
  NZ: 'New Zealand',
  ES: 'Spain',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil',
  MX: 'Mexico',
  ZA: 'South Africa',
  NG: 'Nigeria',
  KE: 'Kenya',
  EG: 'Egypt',
  TR: 'Turkey',
  PL: 'Poland',
  BE: 'Belgium',
  AT: 'Austria',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PT: 'Portugal',
  GR: 'Greece',
  CZ: 'Czech Republic',
  RO: 'Romania',
  HU: 'Hungary',
  IL: 'Israel',
  QA: 'Qatar',
  KW: 'Kuwait',
  OM: 'Oman',
  BH: 'Bahrain',
  PH: 'Philippines',
  MY: 'Malaysia',
  ID: 'Indonesia',
  VN: 'Vietnam',
  TH: 'Thailand',
  BD: 'Bangladesh',
  LK: 'Sri Lanka',
  NP: 'Nepal',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  UA: 'Ukraine',
  EE: 'Estonia',
  LV: 'Latvia',
  LT: 'Lithuania',
  IS: 'Iceland',
  LU: 'Luxembourg',
  CY: 'Cyprus',
  MT: 'Malta',
  GH: 'Ghana',
  UG: 'Uganda',
  RW: 'Rwanda',
  MA: 'Morocco',
  TN: 'Tunisia',
  JO: 'Jordan',
  LB: 'Lebanon',
};

// Build sorted list of supported countries
export const ALL_COUNTRIES: CountryInfo[] = (() => {
  const allCodes = getCountries();
  const list: CountryInfo[] = [];

  for (const code of allCodes) {
    try {
      const dialCode = `+${getCountryCallingCode(code)}`;
      const name = COUNTRY_NAMES[code] || code;
      list.push({
        code,
        name,
        dialCode,
        flag: getCountryFlag(code),
      });
    } catch {
      // Ignore unsupported codes
    }
  }

  // Priority countries on top, rest alphabetical
  const priorityCodes = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'PK', 'IN', 'AE', 'SA', 'SG'];
  return list.sort((a, b) => {
    const aPri = priorityCodes.indexOf(a.code);
    const bPri = priorityCodes.indexOf(b.code);
    if (aPri !== -1 && bPri !== -1) return aPri - bPri;
    if (aPri !== -1) return -1;
    if (bPri !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
})();

/**
 * Validate phone number using libphonenumber-js
 */
export function validateInternationalPhone(phoneNumber: string, defaultCountry: CountryCode = 'US') {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  try {
    const valid = isValidPhoneNumber(trimmed, defaultCountry);
    if (!valid) {
      return {
        isValid: false,
        error: `Please enter a valid phone number for selected country (+${getCountryCallingCode(defaultCountry)})`,
      };
    }

    const parsed = parsePhoneNumber(trimmed, defaultCountry);
    return {
      isValid: true,
      formatted: parsed.formatInternational(),
      e164: parsed.number,
      country: parsed.country,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: 'Invalid international phone format. Please check country code and digits.',
    };
  }
}
