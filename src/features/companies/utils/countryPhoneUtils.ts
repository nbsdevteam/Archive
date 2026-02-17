/**
 * Country list and calling-code helpers for Companies phone/country UI.
 * Uses libphonenumber-js for codes and Intl.DisplayNames for English country names.
 */

import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

export interface CountryOption {
  value: string;
  label: string;
  callingCode: string;
  englishName: string;
}

const displayNamesEn = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * Returns English display name for an ISO-2 country code.
 */
export function getCountryEnglishName(iso2: string): string {
  try {
    return displayNamesEn.of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

/**
 * Builds country options for react-select: value=iso2, label="Country Name (+NNN)".
 * Sorted by English name.
 */
export function getCountryOptions(): CountryOption[] {
  const countries = getCountries();
  const options: CountryOption[] = countries.map((iso2) => {
    const code = getCountryCallingCode(iso2 as CountryCode);
    const englishName = getCountryEnglishName(iso2);
    return {
      value: iso2,
      label: `${englishName} (+${code})`,
      callingCode: code,
      englishName,
    };
  });
  options.sort((a, b) => a.englishName.localeCompare(b.englishName));
  return options;
}

/** Map from calling code (digits only, e.g. "966") to list of { iso2, englishName }. */
let callingCodeToCountries: Map<string, { iso2: string; englishName: string }[]> | null = null;

/**
 * Returns the first country that uses the given calling code.
 * If currentIso2 is provided and is one of the matches, it is returned.
 */
export function getCountryByCallingCode(
  callingCodeDigits: string,
  currentIso2?: string
): { iso2: string; englishName: string } | null {
  if (!callingCodeDigits || !/^\d+$/.test(callingCodeDigits)) return null;
  if (!callingCodeToCountries) {
    callingCodeToCountries = new Map();
    const countries = getCountries();
    for (const iso2 of countries) {
      const code = getCountryCallingCode(iso2 as CountryCode);
      const list = callingCodeToCountries.get(code) ?? [];
      list.push({ iso2, englishName: getCountryEnglishName(iso2) });
      callingCodeToCountries.set(code, list);
    }
  }
  const list = callingCodeToCountries.get(callingCodeDigits);
  if (!list || list.length === 0) return null;
  if (currentIso2 && list.some((c) => c.iso2 === currentIso2)) {
    return list.find((c) => c.iso2 === currentIso2) ?? list[0];
  }
  return list[0];
}

/**
 * Validates that the given string is a known country calling code (digits only).
 */
export function isValidCallingCode(digits: string): boolean {
  return getCountryByCallingCode(digits) !== null;
}

/**
 * Formats phone to E.164 (+XXXXXXXXX) if valid for the given country/calling code.
 * Returns undefined if invalid or empty.
 */
export function formatPhoneToE164(
  nationalNumber: string,
  countryIso2OrCallingCode: string,
  isIso2: boolean
): string | undefined {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return undefined;
  const full = isIso2
    ? `+${getCountryCallingCode(countryIso2OrCallingCode as CountryCode)}${digits}`
    : `+${countryIso2OrCallingCode}${digits}`;
  const parsed = parsePhoneNumberFromString(full);
  if (!parsed || !parsed.isValid()) return undefined;
  return parsed.number;
}

/**
 * Validates phone number for the selected country (or by calling code).
 * Uses libphonenumber-js; returns true only if valid for that country.
 */
export function validatePhoneForCountry(
  nationalNumber: string,
  countryIso2: string | undefined,
  callingCodeDigits: string
): boolean {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return true; // empty is allowed (optional field)
  const full = `+${callingCodeDigits}${digits}`;
  if (countryIso2) {
    return isValidPhoneNumber(full, countryIso2 as CountryCode);
  }
  return isValidPhoneNumber(full);
}
