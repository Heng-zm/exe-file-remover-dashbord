import { getInitData } from "@/lib/telegram";

export const API_BASE = (import.meta.env.VITE_API_BASE || "https://exe-file-remover.onrender.com").replace(/\/$/, "");

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
  username?: string;
  language?: string;
  language_code?: string;
  is_premium?: boolean;
  premium?: boolean;
  photo_url?: string;
  profile_photo_url?: string;
  is_owner?: boolean;
  is_developer?: boolean;
  developer?: boolean;
  start_param?: string;
};

export type DashboardStats = {
  linked_groups?: number;
  protected_groups?: number;
  open_incidents?: number;
  risk_count?: number;
  warnings?: number;
};

export type AuthSession = {
  user?: TelegramProfile;
  profile?: TelegramProfile;
  me?: TelegramProfile;
  stats?: DashboardStats;
  groups?: GroupSummary[];
  is_owner?: boolean;
  is_developer?: boolean;
};

export type GroupSummary = {
  chat_id: number | string;
  id?: number | string;
  title?: string;
  name?: string;
  type?: string;
  protection_enabled?: boolean;
  protected?: boolean;
  strictness?: "standard" | "high" | string;
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
  strictness?: "standard" | "high" | string;
  silent_mode?: boolean;
  auto_action?: string;
  scanner_enabled?: boolean;
};

export type ScanNameResult = {
  safe?: boolean;
  blocked?: boolean;
  status?: string;
  reason?: string;
  matched_extension?: string;
  extension?: string;
};

export type FormatItem = {
  ext?: string;
  extension?: string;
  value?: string;
};

export type TrustedHash = {
  digest?: string;
  hash?: string;
  label?: string;
  note?: string;
  created_at?: string;
};

export type Incident = {
  id?: string | number;
  token?: string;
  key?: string;
  file_name?: string;
  filename?: string;
  sender?: string;
  sender_name?: string;
  user_id?: number | string;
  reason?: string;
  created_at?: string;
  time?: string;
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
  trusted_hash_whitelist_enabled?: boolean;
  max_hash_file_size?: number;
  trusted_hash_max_download_bytes?: number;
  max_hashes_per_group?: number;
  max_trusted_file_hashes?: number;
};

type ApiFetchOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  allowNoTelegram?: boolean;
};

function buildHeaders(extra?: HeadersInit) {
  const initData = getInitData();
  return {
    Authorization: `tma ${initData}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

function messageForStatus(status: number) {
  if (status === 401) return "Session expired. Reopen from Telegram.";
  if (status === 403) return "You do not have permission.";
  if (status === 404) return "This API endpoint is not available yet.";
  if (status >= 500) return "Server error. Please try again later.";
  return "Request failed. Please try again.";
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const initData = getInitData();
  if (!initData && !options.allowNoTelegram) {
    throw new ApiError("Session expired. Reopen from Telegram.", 401);
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => "");

  if (!response.ok) {
    const apiMessage = payload && typeof payload === "object" ? String((payload as Record<string, unknown>).detail || (payload as Record<string, unknown>).message || "") : "";
    throw new ApiError(apiMessage || messageForStatus(response.status), response.status, payload);
  }

  return payload as T;
}

export async function createSession() {
  return apiFetch<AuthSession>("/api/auth/session", {
    method: "POST",
  });
}
