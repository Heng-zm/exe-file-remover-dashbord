import { DependencyList, useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ApiError } from "@/lib/api";

type UseApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  status?: number;
  refetch: () => Promise<T | null>;
  setData: Dispatch<SetStateAction<T | null>>;
};

export function useApi<T>(factory: () => Promise<T>, deps: DependencyList = [], enabled = true): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | undefined>();
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return null;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    setStatus(undefined);

    try {
      const result = await factory();
      if (mountedRef.current && requestIdRef.current === requestId) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (mountedRef.current && requestIdRef.current === requestId) {
        if (err instanceof ApiError) {
          setError(err.message);
          setStatus(err.status);
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        }
      }
      return null;
    } finally {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    void refetch();
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [refetch]);

  return { data, loading, error, status, refetch, setData };
}
