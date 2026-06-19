import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Code2, Database, MessageSquareText, ServerCog, ShieldCheck, UsersRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { apiFetch, DeveloperOverview, RuntimeConfig } from "@/lib/api";
import { compactId, formatDateTime, listFromResponse, normalizeBool, safeNumber, safeText } from "@/lib/utils";
import { haptic } from "@/lib/telegram";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";

export function DeveloperDashboard() {
  const { isDeveloper } = useAuth();
  if (!isDeveloper) {
    return (
      <Alert variant="warning">
        <AlertTitle>You do not have permission.</AlertTitle>
        <AlertDescription>The backend session did not mark this Telegram user as developer or owner.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Code2 className="h-6 w-6" /></div>
            <div>
              <CardTitle>Developer Dashboard</CardTitle>
              <CardDescription>Owner-only operational tools for bot users, groups, feedback, and runtime config.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max justify-start gap-1 rounded-2xl p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="runtime">Runtime Config</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview"><DeveloperOverviewPanel /></TabsContent>
        <TabsContent value="users"><DeveloperTable endpoint="/api/developer/users" title="Bot users" itemKeys={["users", "items", "data"]} /></TabsContent>
        <TabsContent value="groups"><DeveloperTable endpoint="/api/developer/groups" title="Bot groups" itemKeys={["groups", "items", "data"]} /></TabsContent>
        <TabsContent value="feedback"><FeedbackList /></TabsContent>
        <TabsContent value="runtime"><RuntimeConfigEditor /></TabsContent>
      </Tabs>
    </div>
  );
}

function DeveloperOverviewPanel() {
  const query = useApi<DeveloperOverview>(() => apiFetch("/api/developer/overview"), []);
  if (query.loading) return <Skeleton className="h-64 rounded-3xl" />;
  if (query.error) return <Alert variant="warning"><AlertTitle>Cannot load developer overview</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert>;
  const data = query.data || {};
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Bot users" value={data.users} icon={UsersRound} />
      <StatCard title="Bot groups" value={data.groups} icon={Database} />
      <StatCard title="Protected" value={data.protected_groups} icon={ShieldCheck} />
      <StatCard title="Feedback" value={data.feedback} icon={MessageSquareText} />
    </div>
  );
}

function DeveloperTable({ endpoint, title, itemKeys }: { endpoint: string; title: string; itemKeys: string[] }) {
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const rows = listFromResponse<Record<string, unknown>>(query.data, itemKeys);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Raw table adapts to whatever fields your backend returns.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.loading ? <Skeleton className="h-72" /> : query.error ? <Alert variant="warning"><AlertTitle>Cannot load {title.toLowerCase()}</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : rows.length ? (
          <Table>
            <TableHeader>
              <TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">{compactId(row.telegram_id || row.user_id || row.chat_id || row.id)}</TableCell>
                  <TableCell>{safeText(row.first_name || row.name || row.title || row.username)}</TableCell>
                  <TableCell><Badge variant={normalizeBool(row.protection_enabled ?? row.active ?? row.enabled) ? "success" : "secondary"}>{safeText(row.status || (normalizeBool(row.protection_enabled ?? row.active ?? row.enabled) ? "active" : "known"))}</Badge></TableCell>
                  <TableCell>{formatDateTime(row.created_at || row.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState title={`No ${title.toLowerCase()} returned`} description="Connect this endpoint in the backend to populate the table." icon={Database} />}
      </CardContent>
    </Card>
  );
}

function FeedbackList() {
  const query = useApi<unknown>(() => apiFetch("/api/developer/feedback"), []);
  const items = listFromResponse<Record<string, unknown>>(query.data, ["feedback", "items", "data"]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
        <CardDescription>Messages submitted from the Mini App feedback form.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.loading ? <Skeleton className="h-72" /> : query.error ? <Alert variant="warning"><AlertTitle>Cannot load feedback</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : items.length ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{safeText(item.category, "feedback")}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(item.created_at || item.time)}</span>
                  <span className="text-xs text-muted-foreground">User: {compactId(item.user_id || item.telegram_id)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{safeText(item.message)}</p>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No feedback yet" description="User feedback will appear here after POST /api/feedback is used." icon={MessageSquareText} />}
      </CardContent>
    </Card>
  );
}

function RuntimeConfigEditor() {
  const query = useApi<RuntimeConfig>(() => apiFetch("/api/developer/runtime-config"), []);
  const [config, setConfig] = useState<RuntimeConfig>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.data) setConfig(query.data);
  }, [query.data]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/developer/runtime-config", { method: "PATCH", body: config });
      toast.success("Runtime config updated");
      haptic("success");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update runtime config");
      haptic("error");
    } finally {
      setSaving(false);
    }
  };

  if (query.loading) return <Skeleton className="h-72 rounded-3xl" />;
  if (query.error) return <Alert variant="warning"><AlertTitle>Cannot load runtime config</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime config editor</CardTitle>
        <CardDescription>Update trusted hash limits and related runtime settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-2xl border p-4">
          <div>
            <p className="font-bold">Trusted hash whitelist enabled</p>
            <p className="text-sm text-muted-foreground">Enable exact-file approvals by digest.</p>
          </div>
          <Switch checked={normalizeBool(config.trusted_hash_whitelist_enabled)} onCheckedChange={(value) => setConfig((current) => ({ ...current, trusted_hash_whitelist_enabled: value }))} />
        </div>
        <RuntimeNumber label="Max hash file size" value={config.max_hash_file_size ?? config.trusted_hash_max_download_bytes} onChange={(value) => setConfig((current) => ({ ...current, max_hash_file_size: value, trusted_hash_max_download_bytes: value }))} />
        <RuntimeNumber label="Max hashes per group" value={config.max_hashes_per_group ?? config.max_trusted_file_hashes} onChange={(value) => setConfig((current) => ({ ...current, max_hashes_per_group: value, max_trusted_file_hashes: value }))} />
        <Button onClick={save} disabled={saving}>
          <ServerCog className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save runtime config"}
        </Button>
      </CardContent>
    </Card>
  );
}

function RuntimeNumber({ label, value, onChange }: { label: string; value: unknown; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" min={0} value={safeNumber(value)} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
