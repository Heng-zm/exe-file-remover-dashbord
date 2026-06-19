import { getInitData } from "@/lib/telegram";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "https://exe-file-remover.onrender.com").replace(/\/$/, "");

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_GET_CACHE_TTL_MS = 15_000;
const MAX_RETRIES = 1;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export type TelegramProfile = {
  id?: number | string;
  telegram_id?: number | string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  language?: string;
  language_code?: string;
  is_premium?: boolean;
  premium?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
  profile_photo_url?: string;
  is_owner?: boolean;
  is_developer?: boolean;
  developer?: boolean;
  start_param?: string;
};

export type DashboardStats = {
  linked_groups?: number;
  linked_group_count?: number;
  protected_groups?: number;
  open_incidents?: number;
  risk_count?: number;
  warnings?: number;
};

export type FeatureFlags = {
  groups?: boolean;
  group_settings?: boolean;
  incidents?: boolean;
  trusted_hashes?: boolean;
  developer_dashboard?: boolean;
  [key: string]: unknown;
};

export type AuthSession = {
  ok?: boolean;
  user?: TelegramProfile;
  profile?: TelegramProfile;
  me?: TelegramProfile;
  stats?: DashboardStats;
  groups?: GroupSummary[];
  linked_group_count?: number;
  features?: FeatureFlags;
  routes?: Record<string, unknown>;
  is_owner?: boolean;
  is_developer?: boolean;
};

export type GroupSummary = {
  chat_id?: number | string;
  id?: number | string;
  title?: string;
  name?: string;
  type?: string;
  protection_enabled?: boolean;
  protected?: boolean;
  strictness?: "standard" | "high" | "strict" | string;
  silent_mode?: boolean;
  bot_is_admin?: boolean;
  bot_admin?: boolean;
  can_delete_messages?: boolean;
  can_restrict_members?: boolean;
  scanner_enabled?: boolean;
  admin_alerts_ready?: boolean;
  open_incidents?: number;
};

export type GroupDetail = GroupSummary & {
  settings?: GroupSettings;
  health?: HealthStatus;
  stats?: Record<string, unknown>;
};

export type GroupSettings = {
  protection_enabled?: boolean;
  strictness?: "standard" | "high" | "strict" | string;
  silent_mode?: boolean;
  auto_action?: string;
  auto_action_mode?: "off" | "warn" | "smart" | "ban" | string;
  auto_warn_threshold?: number;
  auto_mute_threshold?: number;
  auto_ban_threshold?: number;
  auto_mute_minutes?: number;
  scanner_enabled?: boolean;
};

export type ScanNameResult = {
  safe?: boolean;
  blocked?: boolean;
  status?: string;
  reason?: string;
  reason_code?: string;
  reason_display?: string;
  details?: unknown[];
  matched_extension?: string;
  extension?: string;
  file_name?: string;
  filename?: string;
  mime_type?: string;
  file_sha256?: string;
};

export type ScanNameResponse = {
  ok?: boolean;
  user_id?: number | string;
  scan?: ScanNameResult;
} & ScanNameResult;

export type FormatItem = {
  ext?: string;
  extension?: string;
  value?: string;
};

export type TrustedHash = {
  digest?: string;
  hash?: string;
  sha256?: string;
  md5?: string;
  label?: string;
  note?: string;
  created_at?: string;
};

export type Incident = {
  id?: string | number;
  token?: string;
  key?: string;
  token_or_key?: string;
  incident_token?: string;
  file_name?: string;
  filename?: string;
  sender?: string;
  sender_name?: string;
  user_id?: number | string;
  reason?: string;
  reason_display?: string;
  created_at?: string;
  time?: string;
  ts?: string;
  status?: string;
  action_supported?: boolean;
};

export type RiskMember = {
  user_id?: number | string;
  id?: number | string;
  name?: string;
  first_name?: string;
  incidents?: number;
  incident_count?: number;
  last_incident?: string;
  risk_level?: string;
};

export type GroupAdmin = {
  user_id?: number | string;
  id?: number | string;
  name?: string;
  first_name?: string;
  username?: string;
  alert_ready?: boolean;
  private_started?: boolean;
  allows_write_to_pm?: boolean;
  permission_status?: string;
  status?: string;
};

export type HealthStatus = {
  bot_is_admin?: boolean;
  can_delete_messages?: boolean;
  can_restrict_members?: boolean;
  protection_enabled?: boolean;
  scanner_enabled?: boolean;
  admin_alerts_ready?: boolean;
};

export type DeveloperOverview = {
  users?: number;
  groups?: number;
  protected_groups?: number;
  incidents?: number;
  feedback?: number;
  uptime?: string;
};

export type RuntimeConfig = {
  trusted_file_hash_whitelist_enabled?: boolean;
  trusted_hash_whitelist_enabled?: boolean;
  trusted_hash_max_download_bytes?: number;
  max_hash_file_size?: number;
  max_trusted_file_hashes?: number;
  max_hashes_per_group?: number;
};

export type ServerLogRow = {
  id?: number;
  ts?: string;
  ts_ms?: number;
  category?: string;
  level?: string;
  message?: string;
  method?: string;
  path?: string;
  status?: number;
  duration_ms?: number;
  request_id?: string;
  [key: string]: unknown;
};

export type ServerLogsResponse = {
  ok?: boolean;
  logs?: ServerLogRow[];
  total?: number;
  filters?: Record<string, unknown>;
  counters?: Record<string, unknown>;
  process?: Record<string, unknown>;
};

type ApiFetchOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  allowNoTelegram?: boolean;
  timeoutMs?: number;
  cacheTtlMs?: number;
  skipCache?: boolean;
  retry?: number;
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function buildHeaders(extra?: HeadersInit, hasBody = false) {
  const initData = getInitData();
  const headers = new Headers(extra || {});

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (initData) {
    // README_API prefers X-Telegram-Init-Data. Extra aliases keep compatibility with older backend builds.
    headers.set("X-Telegram-Init-Data", initData);
    headers.set("X-TMA-Init-Data", initData);
    headers.set("X-Telegram-Web-App-Data", initData);
    headers.set("Authorization", `tma ${initData}`);
  }
  return headers;
}

function messageForStatus(status: number) {
  if (status === 400) return "Bad request. Check the data and try again.";
  if (status === 401) return "Session expired. Reopen from Telegram.";
  if (status === 403) return "You do not have permission.";
  if (status === 404) return "This API endpoint is not available yet.";
  if (status === 413) return "Request is too large.";
  if (status >= 500) return "Server error. Please try again later.";
  return "Request failed. Please try again.";
}

function apiMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    return String(record.detail || record.message || record.error || "");
  }
  if (typeof payload === "string") return payload;
  return "";
}

async function parseResponse(response: Response) {
  if (response.status === 204) return {};
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json().catch(() => ({}));
  const text = await response.text().catch(() => "");
  return text ? { message: text } : {};
}

function getCacheKey(method: string, url: string, body: unknown) {
  if (method !== "GET" || body !== undefined) return "";
  return `${method}:${url}`;
}

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    responseCache.clear();
    inFlightRequests.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(prefix)) responseCache.delete(key);
  }
  for (const key of inFlightRequests.keys()) {
    if (key.includes(prefix)) inFlightRequests.delete(key);
  }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const initData = getInitData();
  if (!initData && !options.allowNoTelegram) {
    throw new ApiError("Session expired. Reopen from Telegram.", 401);
  }

  const {
    body,
    headers,
    allowNoTelegram: _allowNoTelegram,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cacheTtlMs = DEFAULT_GET_CACHE_TTL_MS,
    skipCache = false,
    retry = MAX_RETRIES,
    ...requestOptions
  } = options;

  const method = (requestOptions.method || "GET").toUpperCase();
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const cacheKey = getCacheKey(method, url, body);
  const now = Date.now();

  if (method !== "GET") {
    // Mutations may change group details, formats, incidents, runtime config, or logs.
    clearApiCache();
  }

  if (cacheKey && !skipCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cloneValue(cached.value) as T;

    const pending = inFlightRequests.get(cacheKey);
    if (pending) return cloneValue(await pending) as T;
  }

  const runRequest = async (attempt = 0): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    if (requestOptions.signal) {
      if (requestOptions.signal.aborted) controller.abort();
      else requestOptions.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(url, {
        ...requestOptions,
        method,
        headers: buildHeaders(headers, body !== undefined),
        signal: controller.signal,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      });

      const payload = await parseResponse(response);
      const payloadRecord = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;

      if (!response.ok || payloadRecord?.ok === false) {
        const shouldRetry = method === "GET" && response.status >= 500 && attempt < retry;
        if (shouldRetry) return runRequest(attempt + 1);
        throw new ApiError(apiMessage(payload) || messageForStatus(response.status), response.status, payload);
      }

      return payload as T;
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const canRetry = method === "GET" && !isAbort && attempt < retry;
      if (canRetry) return runRequest(attempt + 1);
      if (isAbort) throw new ApiError("Request timed out. Please check your connection and try again.", 408);
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  if (cacheKey && !skipCache) {
    const pending = runRequest().then((value) => {
      responseCache.set(cacheKey, { value, expiresAt: Date.now() + cacheTtlMs });
      return value;
    }).finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, pending);
    return cloneValue(await pending) as T;
  }

  return runRequest();
}

export async function createSession(refresh = false) {
  return apiFetch<AuthSession>(`/api/bootstrap${refresh ? "?refresh=true" : ""}`, {
    method: "POST",
    body: {},
    timeoutMs: 25_000,
  });
}
