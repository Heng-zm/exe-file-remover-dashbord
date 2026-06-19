import { DependencyList, useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
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

  const refetch = useCallback(async () => {
    if (!enabled) return null;
    setLoading(true);
    setError(null);
    setStatus(undefined);
    try {
      const result = await factory();
      setData(result);
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setStatus(err.status);
      } else {
        setError("Something went wrong. Please try again.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, status, refetch, setData };
}
