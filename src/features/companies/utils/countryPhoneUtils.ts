/**
 * Country list and calling-code helpers for Companies phone/country UI.
 * Uses POST /api/countries data; phone validation/formatting via libphonenumber-js.
 */

import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import type { ApiCountryRow } from "../services/companies.api";

export interface CountryOption {
  value: string;
  label: string;
  callingCode: string;
  englishName: string;
}

/** Map from calling code (digits) to list of { code, name } for dial-code blur resolution. */
let phoneCodeToCountries: Map<string, { code: string; name: string }[]> = new Map();

/**
 * Builds country options from API rows and populates phoneCodeToCountries for blur resolution.
 */
export function mapApiCountriesToOptions(rows: ApiCountryRow[]): CountryOption[] {
  phoneCodeToCountries = new Map();
  const options: CountryOption[] = rows.map((row) => {
    const name = (row.name ?? row.code ?? "") as string;
    const code = (row.code ?? "") as string;
    const phoneCode = row.phone_code != null ? String(row.phone_code) : "";
    const callingCode = phoneCode.replace(/\D/g, "");
    const value = code || String(row.id ?? "");
    const label = callingCode ? `${name} (+${callingCode})` : name;

    if (callingCode) {
      const list = phoneCodeToCountries.get(callingCode) ?? [];
      list.push({ code: value, name });
      phoneCodeToCountries.set(callingCode, list);
    }

    return {
      value,
      label,
      callingCode,
      englishName: name,
    };
  });
  options.sort((a, b) => a.englishName.localeCompare(b.englishName));
  return options;
}

/**
 * Resolves country by calling code (digits). If currentCode is provided and matches that code, prefer it.
 */
export function getCountryByPhoneCode(
  phoneCode: string,
  currentCode?: string
): { code: string; name: string } | null {
  const digits = phoneCode.replace(/\D/g, "");
  if (!digits) return null;
  const list = phoneCodeToCountries.get(digits);
  if (!list?.length) return null;
  if (currentCode && list.some((c) => c.code === currentCode)) {
    return list.find((c) => c.code === currentCode) ?? list[0];
  }
  return list[0];
}

/**
 * Returns true if the given string looks like a valid calling code (digits only, non-empty).
 */
export function isValidCallingCode(digits: string): boolean {
  return /^\d{1,4}$/.test(digits.replace(/\D/g, ""));
}

/**
 * Formats national number with country calling code to E.164 (e.g. +15551234567).
 * Uses libphonenumber with 2-letter country code when available.
 */
export function formatPhoneToE164(
  nationalNumber: string,
  countryCodeOrPhoneCode: string,
  isCountryCode: boolean
): string {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return "";
  if (isCountryCode && countryCodeOrPhoneCode.length === 2) {
    try {
      const parsed = parsePhoneNumberFromString(
        digits,
        countryCodeOrPhoneCode as CountryCode
      );
      return parsed?.format("E.164") ?? "";
    } catch {
      return "";
    }
  }
  const code = countryCodeOrPhoneCode.replace(/\D/g, "");
  if (!code) return "";
  return `+${code}${digits}`;
}

/**
 * Validates national number for the given country (2-letter code or phone code). Uses libphonenumber when country code is 2-letter.
 */
export function validatePhoneForCountry(
  nationalNumber: string,
  countryCode: string | undefined,
  phoneCode: string
): boolean {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits || !phoneCode) return false;
  const full = `+${phoneCode.replace(/\D/g, "")}${digits}`;
  if (countryCode && countryCode.length === 2) {
    try {
      return isValidPhoneNumber(full, countryCode as CountryCode);
    } catch {
      return false;
    }
  }
  try {
    return isValidPhoneNumber(full);
  } catch {
    return false;
  }
}
