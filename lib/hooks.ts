"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Debounced value hook - delays updating a value until
 * the user stops changing it for the specified delay.
 * Great for search inputs to avoid excessive API calls.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Media query hook for responsive logic in components
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * Hook to detect if user is on mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}
