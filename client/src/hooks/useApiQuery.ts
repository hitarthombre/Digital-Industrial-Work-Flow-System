import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Minimal data-fetching hook: runs `fetcher` whenever `deps` change and exposes
 * loading / error state plus a manual refetch. Errors are surfaced, never faked.
 */
export function useApiQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = [], options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      // Ignore responses from requests superseded by a newer one
      if (id === requestId.current) setData(result);
    } catch (err: any) {
      if (id === requestId.current) setError(err?.message || "Failed to load data");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(deps)]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run, setData };
}

/**
 * Wraps an async mutation with a shared `submitting` flag and error message.
 */
export function useMutation() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async <R,>(action: () => Promise<R>): Promise<R> => {
    setSubmitting(true);
    setError(null);
    try {
      return await action();
    } catch (err: any) {
      setError(err?.message || "Request failed");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, error, setError, mutate };
}

export default useApiQuery;

// Debounce a fast-changing value (e.g. a search box) before it drives a request
export function useDebounced<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
