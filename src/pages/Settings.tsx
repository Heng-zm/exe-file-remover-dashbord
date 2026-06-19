import type { ReactNode } from "react";
import { Info, Moon, Smartphone, Sun } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTelegram } from "@/hooks/useTelegram";
import { API_BASE } from "@/lib/api";
import { safeText } from "@/lib/utils";

export function Settings() {
  const telegram = useTelegram();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Mini App Settings</CardTitle>
          <CardDescription>Read-only frontend diagnostics and Telegram theme status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="API base" value={API_BASE} />
          <InfoRow label="Telegram platform" value={telegram.platform} />
          <InfoRow label="Color scheme" value={<Badge variant="secondary" className="gap-1">{telegram.colorScheme === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}{telegram.colorScheme}</Badge>} />
          <InfoRow label="Opened inside Telegram" value={<Badge variant={telegram.isTelegram ? "success" : "danger"}>{telegram.isTelegram ? "Yes" : "No"}</Badge>} />
        </CardContent>
      </Card>
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertTitle>Theme behavior</AlertTitle>
        <AlertDescription>This app reads Telegram theme data and maps it to Tailwind/shadcn CSS variables for dark and light mode.</AlertDescription>
      </Alert>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="break-all text-sm font-bold">{typeof value === "string" ? safeText(value) : value}</span>
    </div>
  );
}
