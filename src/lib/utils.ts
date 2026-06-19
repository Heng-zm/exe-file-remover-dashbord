import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeText(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function safeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

export function listFromResponse<T = unknown>(value: unknown, keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  return [];
}

export function getObject(value: unknown, key?: string): Record<string, unknown> {
  if (key && value && typeof value === "object") {
    const nested = (value as Record<string, unknown>)[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

export function normalizeBool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (["true", "yes", "1", "enabled", "active", "ok"].includes(v)) return true;
    if (["false", "no", "0", "disabled", "inactive"].includes(v)) return false;
  }
  return fallback;
}

export function formatDateTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function compactId(value: unknown) {
  const text = safeText(value);
  if (text.length <= 18) return text;
  return `${text.slice(0, 8)}…${text.slice(-6)}`;
}

export function extensionIsValid(value: string) {
  return /^\.[a-z0-9][a-z0-9._-]{0,30}$/i.test(value.trim());
}

export function hashIsValid(value: string) {
  return /^[a-f0-9]{32}$/i.test(value.trim()) || /^[a-f0-9]{64}$/i.test(value.trim());
}
