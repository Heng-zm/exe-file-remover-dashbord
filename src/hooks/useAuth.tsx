import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, AuthSession, clearApiCache, createSession, TelegramProfile } from "@/lib/api";
import { isTelegramWebApp } from "@/lib/telegram";
import { normalizeBool } from "@/lib/utils";

type AuthContextValue = {
  loading: boolean;
  error: string | null;
  session: AuthSession | null;
  user: TelegramProfile | null;
  isDeveloper: boolean;
  refresh: (liveRefresh?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractUser(session: AuthSession | null): TelegramProfile | null {
  if (!session) return null;
  return session.user || session.profile || session.me || null;
}

function extractDeveloper(session: AuthSession | null, user: TelegramProfile | null) {
  return normalizeBool(session?.is_owner) || normalizeBool(session?.is_developer) || normalizeBool(user?.is_owner) || normalizeBool(user?.is_developer) || normalizeBool(user?.developer);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refresh = useCallback(async (liveRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!isTelegramWebApp()) {
        setSession(null);
        setError("Please open this app from Telegram.");
        return;
      }
      if (liveRefresh) clearApiCache();
      const nextSession = await createSession(liveRefresh);
      setSession(nextSession || {});
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Unable to connect to Telegram session.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  const value = useMemo(() => {
    const user = extractUser(session);
    return {
      loading,
      error,
      session,
      user,
      isDeveloper: extractDeveloper(session, user),
      refresh,
    };
  }, [loading, error, session, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
