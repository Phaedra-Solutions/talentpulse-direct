'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CountryCode, AsYouType, parsePhoneNumber } from 'libphonenumber-js';
import { ALL_COUNTRIES, CountryInfo, validateInternationalPhone } from '@/lib/countries-data';
import { ChevronDown, Search, Check, AlertCircle, Phone } from 'lucide-react';

export interface PhoneInputWithCountryProps {
  value: string;
  onChange: (value: string, isValid: boolean, countryCode: CountryCode) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  defaultCountry?: CountryCode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const COUNTRIES_BY_LONGEST_DIAL_CODE = [...ALL_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

function detectCountryFromInternationalInput(
  rawValue: string,
  currentCountry: CountryCode
): CountryCode {
  const trimmed = rawValue.trim();
  if (!trimmed.startsWith('+')) return currentCountry;

  try {
    const parsed = parsePhoneNumber(trimmed);
    if (parsed?.country) {
      return parsed.country;
    }
    if (parsed?.countryCallingCode) {
      const callingDial = `+${parsed.countryCallingCode}`;
      const currentInfo = ALL_COUNTRIES.find((c) => c.code === currentCountry);
      if (currentInfo?.dialCode === callingDial) {
        return currentCountry;
      }
      const matched = ALL_COUNTRIES.find((c) => c.dialCode === callingDial);
      if (matched) return matched.code;
    }
  } catch {
    // Partial international number while typing: fall back to longest dial code prefix matching
  }

  const currentInfo = ALL_COUNTRIES.find((c) => c.code === currentCountry);
  const longestMatch = COUNTRIES_BY_LONGEST_DIAL_CODE.find((c) => {
    if (!trimmed.startsWith(c.dialCode)) return false;
    const nextChar = trimmed.slice(c.dialCode.length, c.dialCode.length + 1);
    return !nextChar || /\s|\d|\(|-/.test(nextChar);
  });

  if (longestMatch) {
    if (currentInfo && currentInfo.dialCode === longestMatch.dialCode) {
      return currentCountry;
    }
    return longestMatch.code;
  }

  return currentCountry;
}

function stripDialCodePrefix(rawInput: string, currentDialCode: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('+')) return trimmed;

  try {
    const parsed = parsePhoneNumber(trimmed);
    if (parsed?.nationalNumber) {
      return parsed.nationalNumber;
    }
  } catch {
    // Fall back to prefix stripping
  }

  if (trimmed.startsWith(currentDialCode)) {
    return trimmed.slice(currentDialCode.length).replace(/^[\s\-()]+/, '');
  }

  const matchedPrefix = COUNTRIES_BY_LONGEST_DIAL_CODE.find((c) => trimmed.startsWith(c.dialCode));
  if (matchedPrefix) {
    return trimmed.slice(matchedPrefix.dialCode.length).replace(/^[\s\-()]+/, '');
  }

  return trimmed.replace(/^\+\d*\s*/, '');
}

function buildCanonicalPhoneValue(
  formattedLocal: string,
  countryInfo: CountryInfo,
  validation: ReturnType<typeof validateInternationalPhone>
): string {
  const trimmed = formattedLocal.trim();
  if (!trimmed || !/\d/.test(trimmed)) return '';

  if (validation.isValid && validation.formatted) {
    return validation.formatted;
  }

  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  return `${countryInfo.dialCode} ${trimmed}`;
}

export function PhoneInputWithCountry({
  value,
  onChange,
  onBlur,
  name = 'phone',
  id,
  label,
  placeholder,
  defaultCountry = 'US',
  error,
  required = false,
  disabled = false,
  className = '',
}: PhoneInputWithCountryProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() =>
    value && value.trim().startsWith('+')
      ? detectCountryFromInternationalInput(value, defaultCountry)
      : defaultCountry
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localInput, setLocalInput] = useState(() => value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  const [lastEmitted, setLastEmitted] = useState<string | null>(null);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value === lastEmitted) {
      setLastEmitted(null);
    } else {
      setLastEmitted(null);
      setLocalInput(value || '');
      if (value && value.trim().startsWith('+')) {
        const matchedCountry = detectCountryFromInternationalInput(value, selectedCountry);
        if (matchedCountry !== selectedCountry) {
          setSelectedCountry(matchedCountry);
        }
      }
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentCountry = useMemo(() => {
    return (
      ALL_COUNTRIES.find((c) => c.code === selectedCountry) ||
      ALL_COUNTRIES.find((c) => c.code === 'US')!
    );
  }, [selectedCountry]);

  // Filtered countries based on user search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return ALL_COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle typing inside phone input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    let targetCountry = selectedCountry;
    if (rawValue.trim().startsWith('+')) {
      targetCountry = detectCountryFromInternationalInput(rawValue, selectedCountry);
      if (targetCountry !== selectedCountry) {
        setSelectedCountry(targetCountry);
      }
    }

    const targetCountryInfo =
      ALL_COUNTRIES.find((c) => c.code === targetCountry) || currentCountry;

    // Format with AsYouType for display
    const formatter = new AsYouType(targetCountry);
    const formatted = formatter.input(rawValue);
    setLocalInput(formatted);

    // Always emit value with country dial code so backend never receives ambiguous bare local digits
    const validation = validateInternationalPhone(formatted, targetCountry);
    const emittedValue = buildCanonicalPhoneValue(formatted, targetCountryInfo, validation);
    setLastEmitted(emittedValue);
    onChange(emittedValue, validation.isValid, targetCountry);
  };

  // Select a new country from dropdown
  const handleSelectCountry = (country: CountryInfo) => {
    const oldDialCode = currentCountry.dialCode;
    const hadExplicitPlus = localInput.trim().startsWith('+');
    const subscriberPart = stripDialCodePrefix(localInput, oldDialCode);

    setSelectedCountry(country.code);
    setIsOpen(false);
    setSearchQuery('');

    let nextLocalInput = '';
    if (!subscriberPart) {
      nextLocalInput = `${country.dialCode} `;
    } else if (hadExplicitPlus) {
      const formatter = new AsYouType(country.code);
      nextLocalInput = formatter.input(`${country.dialCode} ${subscriberPart}`);
    } else {
      const formatter = new AsYouType(country.code);
      nextLocalInput = formatter.input(subscriberPart);
    }

    setLocalInput(nextLocalInput);

    const validation = validateInternationalPhone(nextLocalInput, country.code);
    const emittedValue = buildCanonicalPhoneValue(nextLocalInput, country, validation);
    setLastEmitted(emittedValue);
    onChange(emittedValue, validation.isValid, country.code);
  };

  const validationResult = useMemo(() => {
    if (!localInput.trim()) return null;
    return validateInternationalPhone(localInput, selectedCountry);
  }, [localInput, selectedCountry]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block font-mono text-xs uppercase font-bold text-[#111113] flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-[#FF4D00]">*</span>}
          </span>
          {validationResult && (
            <span
              className={`text-[10px] uppercase font-mono tracking-wider font-semibold ${
                validationResult.isValid ? 'text-emerald-700' : 'text-[#FF4D00]'
              }`}
            >
              {validationResult.isValid ? '✓ Valid International Format' : 'Invalid Number'}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-stretch border-2 border-[#111113] bg-[#F8F7F4] focus-within:border-[#FF4D00] transition-colors">
        {/* Country Selector Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="h-full px-3 py-2.5 bg-[#EAE8E2] border-r-2 border-[#111113] hover:bg-[#DDD9D0] flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 select-none"
            aria-label="Select Country Code"
            title={`${currentCountry.name} (${currentCountry.dialCode})`}
          >
            <span className="text-lg leading-none select-none">{currentCountry.flag}</span>
            <span className="font-mono text-xs font-bold text-[#111113]">
              {currentCountry.dialCode}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#111113]/70 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Country Selection Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 w-72 sm:w-80 bg-[#F8F7F4] border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] max-h-80 flex flex-col">
              {/* Search Box */}
              <div className="p-2 border-b-2 border-[#111113] bg-white sticky top-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#111113]/50" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country or code (e.g. +44, UK)..."
                    className="w-full font-mono text-xs pl-8 pr-3 py-1.5 border border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="overflow-y-auto flex-1 divide-y divide-[#111113]/10">
                {filteredCountries.length === 0 ? (
                  <div className="p-4 text-center font-mono text-xs text-[#111113]/60">
                    No matching countries found
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = c.code === selectedCountry;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        className={`w-full px-3 py-2 text-left font-mono text-xs flex items-center justify-between hover:bg-[#FF4D00] hover:text-white transition-colors cursor-pointer group ${
                          isSelected ? 'bg-[#111113] text-[#F8F7F4]' : 'text-[#111113]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-base leading-none select-none">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] opacity-70 group-hover:opacity-100">
                            ({c.code})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-2 shrink-0">
                          <span className="font-bold">{c.dialCode}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Raw Phone Number Input */}
        <div className="relative flex-1 flex items-center">
          <input
            id={id || name}
            name={name}
            type="tel"
            disabled={disabled}
            value={localInput}
            onChange={handleInputChange}
            onBlur={onBlur}
            placeholder={
              placeholder ||
              `e.g. ${
                currentCountry.code === 'US'
                  ? '(555) 123-4567'
                  : currentCountry.code === 'GB'
                  ? '7911 123456'
                  : '123456789'
              }`
            }
            className="w-full font-mono text-xs px-3.5 py-2.5 bg-transparent text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden disabled:opacity-50"
          />
        </div>
      </div>

      {/* Validation / Field Error Message */}
      {error ? (
        <p className="font-mono text-xs text-[#FF4D00] flex items-center gap-1.5 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : localInput.trim() && validationResult && !validationResult.isValid ? (
        <p className="font-mono text-[11px] text-[#FF4D00] flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{validationResult.error}</span>
        </p>
      ) : null}
    </div>
  );
}
