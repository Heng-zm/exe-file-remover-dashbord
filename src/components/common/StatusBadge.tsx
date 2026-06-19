import { AlertTriangle, CheckCircle2, Shield, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { normalizeBool, safeText } from "@/lib/utils";

export function StatusBadge({ value, trueLabel = "Enabled", falseLabel = "Disabled" }: { value: unknown; trueLabel?: string; falseLabel?: string }) {
  const enabled = normalizeBool(value);
  return <Badge variant={enabled ? "success" : "secondary"}>{enabled ? trueLabel : falseLabel}</Badge>;
}

export function RiskBadge({ level }: { level?: unknown }) {
  const text = safeText(level, "low").toLowerCase();
  const variant = text.includes("high") || text.includes("danger") ? "danger" : text.includes("medium") || text.includes("warn") ? "warning" : "success";
  return <Badge variant={variant}>{safeText(level, "Low")}</Badge>;
}

export function ScanResultBadge({ blocked, safe }: { blocked?: unknown; safe?: unknown }) {
  const isBlocked = normalizeBool(blocked) || !normalizeBool(safe, true);
  return (
    <Badge variant={isBlocked ? "danger" : "success"} className="gap-1">
      {isBlocked ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
      {isBlocked ? "Blocked" : "Safe"}
    </Badge>
  );
}

export function HealthDot({ status }: { status: "ok" | "warn" | "bad" }) {
  const cls = status === "ok" ? "bg-emerald-500" : status === "warn" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-flex h-2.5 w-2.5 rounded-full ${cls}`} />;
}

export function SecurityBadge({ active }: { active: unknown }) {
  return (
    <Badge variant={normalizeBool(active) ? "success" : "warning"} className="gap-1">
      {normalizeBool(active) ? <Shield className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {normalizeBool(active) ? "Protected" : "Needs setup"}
    </Badge>
  );
}
