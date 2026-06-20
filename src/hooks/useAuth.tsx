import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, AuthSession, clearApiCache, createSession, TelegramProfile, testApiConnection } from "@/lib/api";
import { getInitData, initTelegramApp, isTelegramWebApp } from "@/lib/telegram";
import { normalizeBool } from "@/lib/utils";

type AuthContextValue = {
  loading: boolean;
  error: string | null;
  apiOnline: boolean | null;
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

function friendlyAuthMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Session expired or Telegram initData is missing. Reopen this Mini App from Telegram.";
    if (err.status === 403) return "You do not have permission for this dashboard.";
    if (err.status === 408 || err.status === 0) return err.message || "API connection failed. Check Render service, CORS, and Vercel env.";
    return err.message;
  }
  return err instanceof Error ? err.message : "Unable to connect to Telegram session.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refresh = useCallback(async (liveRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      initTelegramApp();
      if (liveRefresh) clearApiCache();

      const hasInitData = Boolean(getInitData());

      // Public connection test keeps the UI informative when Telegram auth is missing.
      // It is best-effort and never blocks the authenticated dashboard load.
      void testApiConnection().then((result) => setApiOnline(result.ok)).catch(() => setApiOnline(false));

      if (!isTelegramWebApp() || !hasInitData) {
        setSession(null);
        setError("Please open this app from Telegram Mini App button. Normal browser links do not provide initData.");
        return;
      }

      const nextSession = await createSession(liveRefresh);
      setSession(nextSession || {});
      setApiOnline(true);
    } catch (err) {
      setSession(null);
      setError(friendlyAuthMessage(err));
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
      apiOnline,
      session,
      user,
      isDeveloper: extractDeveloper(session, user),
      refresh,
    };
  }, [loading, error, apiOnline, session, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
