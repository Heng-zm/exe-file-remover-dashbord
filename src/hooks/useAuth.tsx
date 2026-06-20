import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthSession, clearApiCache, loadBootstrap, TelegramProfile, testApiConnection } from "@/lib/api";
import { getInitData, getTelegramWebApp, initTelegramApp } from "@/lib/telegram";
import { getObject, normalizeBool } from "@/lib/utils";

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

function firstObject(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
}

function extractTelegramUnsafeUser(): TelegramProfile | null {
  const unsafe = getTelegramWebApp()?.initDataUnsafe;
  const user = unsafe?.user;
  if (!user) return null;
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code,
    is_premium: user.is_premium,
    photo_url: user.photo_url,
    start_param: unsafe?.start_param,
  };
}

function normalizeSession(raw: unknown): AuthSession {
  const root = getObject(raw);

  // Some backend builds wrap dashboard data under data/session/dashboard/result.
  const nested = firstObject(root.data, root.session, root.dashboard, root.result, root.payload);
  const source = nested ? { ...root, ...nested } : root;

  const user = firstObject(source.user, source.profile, source.me, source.telegram_user, source.current_user) || extractTelegramUnsafeUser() || undefined;
  const groups = Array.isArray(source.groups)
    ? source.groups
    : Array.isArray(source.linked_groups)
      ? source.linked_groups
      : Array.isArray(source.chats)
        ? source.chats
        : Array.isArray(source.items)
          ? source.items
          : undefined;

  return {
    ...(source as AuthSession),
    user: user as TelegramProfile | undefined,
    groups: groups as AuthSession["groups"],
    linked_group_count: Number(source.linked_group_count ?? source.linked_groups_count ?? (groups ? groups.length : 0)) || undefined,
    is_developer: normalizeBool(source.is_developer ?? source.is_owner ?? source.developer ?? source.owner),
    is_owner: normalizeBool(source.is_owner ?? source.owner),
  };
}

function extractUser(session: AuthSession | null): TelegramProfile | null {
  if (!session) return null;
  return session.user || session.profile || session.me || extractTelegramUnsafeUser();
}

function extractDeveloper(session: AuthSession | null, user: TelegramProfile | null) {
  return normalizeBool(session?.is_owner) || normalizeBool(session?.is_developer) || normalizeBool(user?.is_owner) || normalizeBool(user?.is_developer) || normalizeBool(user?.developer);
}

function friendlyBootstrapError(status: number, message?: string | null) {
  if (status === 401) return "Session expired or Telegram initData is missing. Reopen this Mini App from Telegram.";
  if (status === 403) return "You do not have permission for this dashboard.";
  if (status === 408 || status === 0) return message || "API connection failed. Check Render service, CORS, and Vercel env.";
  return message || "Unable to load dashboard from API.";
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

      // Best-effort public connection test. It never blocks dashboard render.
      void testApiConnection().then((result) => setApiOnline(result.ok)).catch(() => setApiOnline(false));

      const result = await loadBootstrap(liveRefresh);
      if (!result.ok) {
        setSession(null);
        setApiOnline(result.status > 0 && result.status < 500);
        setError(friendlyBootstrapError(result.status, result.error));
        return;
      }

      const normalized = normalizeSession(result.data || {});
      const hasInitData = Boolean(getInitData());
      const hasUser = Boolean(extractUser(normalized));

      setSession(normalized);
      setApiOnline(true);

      // Do not blank the app when backend returned 200. Show the dashboard shell and a
      // visible warning instead. This handles MINI_APP_PUBLIC_BOOTSTRAP_ON_MISSING_INITDATA.
      if (!hasInitData && !hasUser) {
        setError("API is online, but Telegram initData is missing. Open this Mini App from the bot's Mini App button, not from a normal browser link.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Bootstrap failed", err);
      setSession(null);
      setError(err instanceof Error ? err.message : "Unable to connect to Telegram session.");
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
