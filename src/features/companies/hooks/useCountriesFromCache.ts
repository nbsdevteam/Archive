/**
 * Returns country options for company forms. Uses localStorage cache; fetches API only when enabled and cache is empty.
 * Call with enabled=true only when the Create Company panel is open so the API runs at most once (on first Create open with empty cache).
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
 * When enabled is true: syncs from localStorage; if cache empty and fetchIfEmpty, fetches once and caches.
 * When enabled is false: no effect, no API. Create panel: useCountriesFromCache(isOpen, true). Edit: useCountriesFromCache(isOpen, false).
 */
export function useCountriesFromCache(
  enabled: boolean,
  fetchIfEmpty: boolean = true
): {
  countryOptions: CountryOption[];
  selectOptions: SelectOption[];
  loading: boolean;
  error: string | null;
} {
  const [rawList, setRawList] = useState<ApiCountryRow[]>(() => getCachedCountries() ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const cached = getCachedCountries();
    if (cached !== null) {
      setRawList(cached);
      setLoading(false);
      return;
    }
    if (!fetchIfEmpty) {
      setRawList([]);
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
  }, [enabled, fetchIfEmpty]);

  const countryOptions = useMemo(() => mapApiCountriesToOptions(rawList), [rawList]);
  const selectOptions = useMemo(
    () => countryOptions.map((o) => ({ value: o.value, label: o.label })),
    [countryOptions]
  );

  return { countryOptions, selectOptions, loading, error };
}
