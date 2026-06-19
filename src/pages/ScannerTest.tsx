import { useState } from "react";
import { toast } from "sonner";
import { FileSearch, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanResultBadge } from "@/components/common/StatusBadge";
import { apiFetch, ScanNameResult } from "@/lib/api";
import { haptic } from "@/lib/telegram";
import { safeText } from "@/lib/utils";

export function ScannerTest() {
  const [filename, setFilename] = useState("invoice.pdf.exe");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanNameResult | null>(null);

  const scan = async () => {
    const clean = filename.trim();
    if (!clean) {
      toast.error("Enter a filename to scan");
      haptic("warning");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await apiFetch<ScanNameResult>("/api/scan/name", { method: "POST", body: { filename: clean, name: clean } });
      setResult(response || {});
      haptic(response?.blocked ? "warning" : "success");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scan failed");
      haptic("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><FileSearch className="h-6 w-6" /></div>
            <div>
              <CardTitle>Scanner Test</CardTitle>
              <CardDescription>Check whether a filename would be allowed or blocked by your bot API.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="filename" value={filename} onChange={(event) => setFilename(event.target.value)} placeholder="invoice.pdf.exe" onKeyDown={(event) => event.key === "Enter" && void scan()} />
              <Button onClick={scan} disabled={loading}>{loading ? "Scanning…" : "Scan"}</Button>
            </div>
          </div>
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Real API only</AlertTitle>
            <AlertDescription>This page calls POST /api/scan/name and does not use fake scan data.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Scan result</CardTitle>
                <CardDescription>{safeText(filename)}</CardDescription>
              </div>
              <ScanResultBadge blocked={result.blocked} safe={result.safe} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ResultRow label="Status" value={result.status || (result.blocked ? "blocked" : "safe")} />
            <ResultRow label="Matched extension" value={result.matched_extension || result.extension} />
            <div className="sm:col-span-2">
              <ResultRow label="Reason" value={result.reason} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-bold">{safeText(value)}</p>
    </div>
  );
}
