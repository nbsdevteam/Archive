/**
 * Returns country options for company forms. Uses localStorage cache only; fetches API once on cache miss.
 * Does not use global state — cache is read/written from localStorage so the API is not triggered on every Create open.
 */

import { useEffect, useState, useMemo } from "react";
import { listCountries } from "../services/companies.api";
import type { ApiCountryRow } from "../services/companies.api";
import { mapApiCountriesToOptions } from "../utils/countryPhoneUtils";
import type { CountryOption } from "../utils/countryPhoneUtils";
import type { SelectOption } from "@/shared/components/ui";

const STORAGE_KEY = "direct_apply_countries";

function getCachedCountries(): ApiCountryRow[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: ApiCountryRow[] };
    if (!parsed?.data || !Array.isArray(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedCountries(data: ApiCountryRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data }));
  } catch {
    // ignore quota or other errors
  }
}

/**
 * Reads countries from localStorage first; if missing, fetches once from POST /api/countries and caches.
 * Returns { countryOptions, selectOptions, loading, error }. API is not called when cache exists.
 */
export function useCountriesFromCache(): {
  countryOptions: CountryOption[];
  selectOptions: SelectOption[];
  loading: boolean;
  error: string | null;
} {
  const [rawList, setRawList] = useState<ApiCountryRow[]>(() => getCachedCountries() ?? []);
  const [loading, setLoading] = useState(() => getCachedCountries() === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedCountries();
    if (cached !== null) {
      setRawList(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCountries({ limit: 300 })
      .then(({ data }) => {
        if (!cancelled) {
          setRawList(data);
          setCachedCountries(data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load countries");
          setRawList([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const countryOptions = useMemo(() => mapApiCountriesToOptions(rawList), [rawList]);
  const selectOptions = useMemo(
    () => countryOptions.map((o) => ({ value: o.value, label: o.label })),
    [countryOptions]
  );

  return { countryOptions, selectOptions, loading, error };
}
