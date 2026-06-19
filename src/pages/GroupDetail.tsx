import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Bot, CheckCircle2, FileWarning, HeartPulse, KeyRound, ListChecks, LockKeyhole, ScrollText, Shield, ShieldCheck, UserCog, UsersRound, X, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { HealthDot, RiskBadge, SecurityBadge, StatusBadge } from "@/components/common/StatusBadge";
import { apiFetch, FormatItem, GroupAdmin, type GroupDetail as GroupDetailType, GroupSettings, HealthStatus, Incident, RiskMember, TrustedHash } from "@/lib/api";
import { compactId, extensionIsValid, formatDateTime, hashIsValid, listFromResponse, normalizeBool, safeDecodeURIComponent, safeNumber, safeText, uniqueStrings } from "@/lib/utils";
import { configureMainButton, haptic } from "@/lib/telegram";
import { useApi } from "@/hooks/useApi";

const tabItems = [
  { value: "overview", label: "Overview", icon: Shield },
  { value: "scanner", label: "Scanner", icon: FileWarning },
  { value: "formats", label: "Formats", icon: ListChecks },
  { value: "hashes", label: "Trusted Hashes", icon: KeyRound },
  { value: "incidents", label: "Incidents", icon: AlertTriangle },
  { value: "risk", label: "Risk", icon: UsersRound },
  { value: "admins", label: "Admins", icon: UserCog },
  { value: "health", label: "Health", icon: HeartPulse },
  { value: "logs", label: "Logs", icon: ScrollText },
];

export function GroupDetail() {
  const { chatId = "" } = useParams();
  const decodedChatId = safeDecodeURIComponent(chatId);
  const query = useApi<unknown>(() => apiFetch(`/api/groups/${encodeURIComponent(decodedChatId)}`), [decodedChatId], Boolean(decodedChatId));
  const group = useMemo(() => normalizeGroup(query.data), [query.data]);

  if (query.loading) return <GroupDetailSkeleton />;
  if (query.error) {
    return (
      <Alert variant={query.status === 403 ? "warning" : "destructive"}>
        <AlertTitle>{query.status === 403 ? "Permission required" : "Unable to load group"}</AlertTitle>
        <AlertDescription>{query.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-black tracking-tight">{safeText(group.title || group.name, "Group Admin Panel")}</h1>
                <SecurityBadge active={group.protection_enabled ?? group.settings?.protection_enabled ?? group.protected} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Chat ID: {safeText(group.chat_id || decodedChatId)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Manage protection, scanner formats, trusted hashes, incidents, risky members, admins, and bot health.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
              <MiniStatus label="Bot admin" value={group.bot_is_admin ?? group.bot_admin} />
              <MiniStatus label="Can delete" value={group.can_delete_messages} />
              <MiniStatus label="Scanner" value={group.scanner_enabled ?? group.settings?.scanner_enabled} />
              <MiniStatus label="Alerts" value={group.admin_alerts_ready} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max justify-start gap-1 rounded-2xl p-1">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2 rounded-xl px-3 py-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewTab chatId={decodedChatId} group={group} onSaved={query.refetch} />
        </TabsContent>
        <TabsContent value="scanner">
          <GroupScannerTab />
        </TabsContent>
        <TabsContent value="formats">
          <FormatsPanel chatId={decodedChatId} />
        </TabsContent>
        <TabsContent value="hashes">
          <TrustedHashesPanel chatId={decodedChatId} />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentsPanel chatId={decodedChatId} />
        </TabsContent>
        <TabsContent value="risk">
          <RiskPanel chatId={decodedChatId} />
        </TabsContent>
        <TabsContent value="admins">
          <AdminsPanel chatId={decodedChatId} />
        </TabsContent>
        <TabsContent value="health">
          <HealthPanel chatId={decodedChatId} fallback={group.health || group} />
        </TabsContent>
        <TabsContent value="logs">
          <LogsPanel chatId={decodedChatId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function normalizeGroup(raw: unknown): GroupDetailType {
  if (!raw || typeof raw !== "object") return {} as GroupDetailType;
  const record = raw as Record<string, unknown>;
  const base = (record.group && typeof record.group === "object" ? record.group : record) as GroupDetailType;
  return {
    ...base,
    settings: { ...(base.settings || {}), ...((record.settings as GroupSettings | undefined) || {}) },
    health: { ...(base.health || {}), ...((record.health as HealthStatus | undefined) || {}) },
  };
}

function GroupDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-44 rounded-3xl" />
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}

function MiniStatus({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2">
        <StatusBadge value={value} trueLabel="OK" falseLabel="No" />
      </div>
    </div>
  );
}

function OverviewTab({ chatId, group, onSaved }: { chatId: string; group: GroupDetailType; onSaved: () => Promise<unknown> }) {
  const initial = {
    protection_enabled: normalizeBool(group.settings?.protection_enabled ?? group.protection_enabled ?? group.protected, true),
    strictness: safeText(group.settings?.strictness ?? group.strictness, "standard"),
    silent_mode: normalizeBool(group.settings?.silent_mode ?? group.silent_mode, false),
    auto_action_mode: safeText(group.settings?.auto_action_mode ?? group.settings?.auto_action, "off"),
  };
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(initial);

  useEffect(() => setSettings(initial), [group.chat_id, group.settings?.strictness, group.settings?.silent_mode, group.settings?.protection_enabled, group.settings?.auto_action_mode]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        protection_enabled: settings.protection_enabled,
        strictness: settings.strictness,
        silent_mode: settings.silent_mode,
      };
      if (settings.auto_action_mode !== "off") payload.auto_action_mode = settings.auto_action_mode;
      await apiFetch(`/api/groups/${encodeURIComponent(chatId)}/settings`, { method: "PATCH", body: payload });
      haptic("success");
      toast.success("Group settings saved");
      await onSaved();
    } catch (error) {
      haptic("error");
      toast.error(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return configureMainButton({ text: saving ? "Saving…" : "Save Settings", visible: dirty, loading: saving, disabled: saving, onClick: save });
  }, [dirty, saving, settings.protection_enabled, settings.strictness, settings.silent_mode, settings.auto_action_mode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview settings</CardTitle>
        <CardDescription>Control the main protection behavior for this group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SettingRow title="Protection enabled" description="Delete and moderate dangerous executable files.">
          <Switch checked={settings.protection_enabled} onCheckedChange={(value) => setSettings((current) => ({ ...current, protection_enabled: value }))} />
        </SettingRow>
        <SettingRow title="Strictness" description="Standard blocks executables. High/Strict block more risky extensions.">
          <Select value={settings.strictness} onValueChange={(value) => setSettings((current) => ({ ...current, strictness: value }))}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Strictness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="strict">Strict</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Silent mode" description="Remove blocked files without noisy messages in the group.">
          <Switch checked={settings.silent_mode} onCheckedChange={(value) => setSettings((current) => ({ ...current, silent_mode: value }))} />
        </SettingRow>
        <SettingRow title="Auto action" description="Optional automated follow-up mode returned by the API: off, warn, smart, or ban.">
          <Select value={settings.auto_action_mode} onValueChange={(value) => setSettings((current) => ({ ...current, auto_action_mode: value }))}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Auto action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="smart">Smart</SelectItem>
              <SelectItem value="ban">Ban</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setSettings(initial)} disabled={!dirty || saving}>Reset</Button>
          <Button onClick={save} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function GroupScannerTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scanner test</CardTitle>
        <CardDescription>Use the global scanner endpoint to test filename detection.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Open the Scanner tab from bottom navigation for a full-width test form.</p>
      </CardContent>
    </Card>
  );
}

function FormatsPanel({ chatId }: { chatId: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FormatSection chatId={chatId} kind="allowed" title="Allowed Formats" description="Whitelist formats that should pass even when strict mode is enabled." />
      <FormatSection chatId={chatId} kind="blocked" title="Blocked Formats" description="Dangerous formats the scanner should always block." />
    </div>
  );
}

function formatText(item: FormatItem | string) {
  if (typeof item === "string") return item;
  return safeText(item.ext || item.extension || item.value);
}

function FormatSection({ chatId, kind, title, description }: { chatId: string; kind: "allowed" | "blocked"; title: string; description: string }) {
  const [ext, setExt] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/groups/${encodeURIComponent(chatId)}/formats/${kind}`;
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const items = listFromResponse<FormatItem | string>(query.data, ["extensions", "formats", kind, "items", "data"]);

  const add = async () => {
    const clean = ext.trim().toLowerCase();
    if (!extensionIsValid(clean)) {
      toast.error("Extension must start with dot, example .apk");
      haptic("warning");
      return;
    }
    setBusy(true);
    try {
      const existing = items.map(formatText).map((item) => item.toLowerCase());
      if (existing.includes(clean)) {
        toast.info(`${clean} already exists`);
        return;
      }
      await apiFetch(endpoint, { method: "POST", body: { mode: "append", extensions: [clean] } });
      toast.success(`${clean} added`);
      haptic("success");
      setExt("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add extension");
      haptic("error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (value: string) => {
    const nextExtensions = uniqueStrings(items.map(formatText).filter((item) => item && item !== value));
    setBusy(true);
    try {
      // README_API exposes POST append/replace for formats. Removing one item is done by replacing the list.
      await apiFetch(endpoint, { method: "POST", body: { mode: "replace", extensions: nextExtensions } });
      toast.success(`${value} removed`);
      haptic("success");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove extension");
      haptic("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={ext} onChange={(event) => setExt(event.target.value)} placeholder=".apk" onKeyDown={(event) => event.key === "Enter" && void add()} />
          <Button onClick={add} disabled={busy}>Add</Button>
        </div>
        {query.loading ? <Skeleton className="h-20" /> : query.error ? <Alert variant="warning"><AlertTitle>Cannot load formats</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : items.length ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => {
              const value = formatText(item);
              return (
                <Badge key={value} variant={kind === "blocked" ? "danger" : "success"} className="gap-2 py-1">
                  {value}
                  <button type="button" aria-label={`Remove ${value}`} onClick={() => void remove(value)} className="rounded-full hover:bg-background/40">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : <EmptyState title={`No ${kind} formats`} description="Add extensions with the input above." icon={ListChecks} />}
      </CardContent>
    </Card>
  );
}

function TrustedHashesPanel({ chatId }: { chatId: string }) {
  const [digest, setDigest] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/groups/${encodeURIComponent(chatId)}/trusted-hashes`;
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const hashes = listFromResponse<TrustedHash>(query.data, ["trusted_hashes", "hashes", "items", "data"]);

  const add = async () => {
    const clean = digest.trim().toLowerCase();
    if (!hashIsValid(clean)) {
      toast.error("Enter a valid MD5 or SHA256 hash");
      haptic("warning");
      return;
    }
    setBusy(true);
    try {
      await apiFetch(endpoint, { method: "POST", body: { ...(clean.length === 64 ? { sha256: clean } : { md5: clean }), digest: clean, label: note, note } });
      toast.success("Trusted hash added");
      haptic("success");
      setDigest("");
      setNote("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add trusted hash");
      haptic("error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (value: string) => {
    setBusy(true);
    try {
      await apiFetch(`${endpoint}/${encodeURIComponent(value)}`, { method: "DELETE" });
      toast.success("Trusted hash removed");
      haptic("success");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove hash");
      haptic("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trusted Hashes</CardTitle>
        <CardDescription>Approve exact files by digest. This should be used carefully.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <LockKeyhole className="h-4 w-4" />
          <AlertTitle>Trusted hashes allow exact approved files only.</AlertTitle>
          <AlertDescription>Any file with a different hash remains blocked by normal policy.</AlertDescription>
        </Alert>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <Input value={digest} onChange={(event) => setDigest(event.target.value)} placeholder="MD5 or SHA256 digest" />
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Label or note" />
          <Button onClick={add} disabled={busy}>Add</Button>
        </div>
        {query.loading ? <Skeleton className="h-32" /> : query.error ? <Alert variant="warning"><AlertTitle>Cannot load hashes</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : hashes.length ? (
          <div className="space-y-2">
            {hashes.map((hash) => {
              const value = safeText(hash.digest || hash.hash || hash.sha256 || hash.md5);
              return (
                <div key={value} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs font-bold">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{safeText(hash.label || hash.note, "No label")} · {formatDateTime(hash.created_at)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void remove(value)} disabled={busy}>Delete</Button>
                </div>
              );
            })}
          </div>
        ) : <EmptyState title="No trusted hashes" description="Add a known MD5/SHA256 digest to approve one exact file." icon={KeyRound} />}
      </CardContent>
    </Card>
  );
}

function IncidentsPanel({ chatId }: { chatId: string }) {
  const endpoint = `/api/groups/${encodeURIComponent(chatId)}/incidents?status=all&limit=50`;
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const incidents = listFromResponse<Incident>(query.data, ["incidents", "items", "data"]);

  const act = async (incident: Incident, action: "warn" | "ban" | "ignore") => {
    const token = String(incident.token_or_key || incident.token || incident.incident_token || incident.key || incident.id || "");
    if (!token) return toast.error("Incident action token missing");
    try {
      await apiFetch(`/api/incidents/${encodeURIComponent(token)}/action`, { method: "POST", body: { action } });
      toast.success(`Incident marked: ${action}`);
      haptic("success");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
      haptic("error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidents</CardTitle>
        <CardDescription>Review blocked file events and apply follow-up actions when supported.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.loading ? <Skeleton className="h-72" /> : query.error ? <Alert variant="warning"><AlertTitle>Cannot load incidents</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : incidents.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident, index) => (
                <TableRow key={String(incident.id || incident.key || index)}>
                  <TableCell className="font-medium">{safeText(incident.file_name || incident.filename)}</TableCell>
                  <TableCell>{safeText(incident.sender || incident.sender_name || incident.user_id)}</TableCell>
                  <TableCell>{safeText(incident.reason_display || incident.reason)}</TableCell>
                  <TableCell>{formatDateTime(incident.created_at || incident.time || incident.ts)}</TableCell>
                  <TableCell><Badge variant="secondary">{safeText(incident.status, "open")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={incident.action_supported === false} onClick={() => void act(incident, "warn")}>Warn</Button>
                      <Button size="sm" variant="destructive" disabled={incident.action_supported === false} onClick={() => void act(incident, "ban")}>Ban</Button>
                      <Button size="sm" variant="ghost" disabled={incident.action_supported === false} onClick={() => void act(incident, "ignore")}>Ignore</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState title="No incidents" description="Blocked files and moderation actions will appear here." icon={ShieldCheck} />}
      </CardContent>
    </Card>
  );
}

function RiskPanel({ chatId }: { chatId: string }) {
  const endpoint = `/api/groups/${encodeURIComponent(chatId)}/risk`;
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const members = listFromResponse<RiskMember>(query.data, ["risk", "members", "users", "items", "data"]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk members</CardTitle>
        <CardDescription>Members with repeated incidents or risky behavior.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.loading ? <Skeleton className="h-64" /> : query.error ? <Alert variant="warning"><AlertTitle>Cannot load risk list</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : members.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>User ID</TableHead><TableHead>Name</TableHead><TableHead>Incidents</TableHead><TableHead>Last incident</TableHead><TableHead>Risk</TableHead></TableRow></TableHeader>
            <TableBody>
              {members.map((member, index) => (
                <TableRow key={String(member.user_id || member.id || index)}>
                  <TableCell className="font-mono text-xs">{compactId(member.user_id || member.id)}</TableCell>
                  <TableCell>{safeText(member.name || member.first_name)}</TableCell>
                  <TableCell>{safeNumber(member.incidents ?? member.incident_count)}</TableCell>
                  <TableCell>{formatDateTime(member.last_incident)}</TableCell>
                  <TableCell><RiskBadge level={member.risk_level} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState title="No risky members" description="Risk scores will appear after incidents are recorded." icon={UsersRound} />}
      </CardContent>
    </Card>
  );
}

function AdminsPanel({ chatId }: { chatId: string }) {
  const endpoint = `/api/groups/${encodeURIComponent(chatId)}/admins`;
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const admins = listFromResponse<GroupAdmin>(query.data, ["admins", "items", "data"]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group admins</CardTitle>
        <CardDescription>Admin alert readiness and permission status.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.loading ? <Skeleton className="h-64" /> : query.error ? <Alert variant="warning"><AlertTitle>Cannot load admins</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : admins.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Admin</TableHead><TableHead>User ID</TableHead><TableHead>Alerts</TableHead><TableHead>Permission</TableHead></TableRow></TableHeader>
            <TableBody>
              {admins.map((admin, index) => (
                <TableRow key={String(admin.user_id || admin.id || index)}>
                  <TableCell>{safeText(admin.name || admin.first_name || admin.username)}</TableCell>
                  <TableCell className="font-mono text-xs">{compactId(admin.user_id || admin.id)}</TableCell>
                  <TableCell><StatusBadge value={admin.alert_ready ?? admin.private_started} trueLabel="Ready" falseLabel="Needs private start" /></TableCell>
                  <TableCell><Badge variant="secondary">{safeText(admin.permission_status || admin.status, "admin")}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState title="No admins returned" description="Ask the backend to return group admin data for this panel." icon={UserCog} />}
      </CardContent>
    </Card>
  );
}

function HealthPanel({ chatId, fallback }: { chatId: string; fallback?: HealthStatus }) {
  const endpoint = `/api/groups/${encodeURIComponent(chatId)}/health`;
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const health = { ...(fallback || {}), ...((query.data && typeof query.data === "object" ? (query.data as Record<string, unknown>).health || query.data : {}) as HealthStatus) };
  const checks = [
    ["Bot is admin", health.bot_is_admin],
    ["Can delete messages", health.can_delete_messages],
    ["Can restrict members", health.can_restrict_members],
    ["Protection enabled", health.protection_enabled],
    ["Scanner enabled", health.scanner_enabled],
    ["Admin alerts ready", health.admin_alerts_ready],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health checklist</CardTitle>
        <CardDescription>Green means ready. Yellow/red means setup is required in Telegram or backend.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.error ? <Alert variant="warning"><AlertTitle>Using fallback health data</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : null}
        {query.loading ? <Skeleton className="h-56" /> : checks.map(([label, value]) => {
          const ok = normalizeBool(value);
          return (
            <div key={label} className="flex items-center justify-between rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <HealthDot status={ok ? "ok" : "bad"} />
                <span className="font-semibold">{label}</span>
              </div>
              {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function LogsPanel({ chatId }: { chatId: string }) {
  const endpoint = `/api/groups/${encodeURIComponent(chatId)}/admin-logs`;
  const query = useApi<unknown>(() => apiFetch(endpoint), [endpoint]);
  const logs = listFromResponse<Record<string, unknown>>(query.data, ["logs", "items", "data"]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs</CardTitle>
        <CardDescription>Recent backend logs for this group, if the API exposes them.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.loading ? <Skeleton className="h-56" /> : query.error ? <Alert variant="warning"><AlertTitle>Logs endpoint unavailable</AlertTitle><AlertDescription>{query.error}</AlertDescription></Alert> : logs.length ? (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="rounded-2xl border p-4">
                <p className="text-xs text-muted-foreground">{formatDateTime(log.time || log.created_at)}</p>
                <p className="mt-1 break-words font-mono text-xs">{safeText(log.message || log.event || JSON.stringify(log))}</p>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No logs returned" description="Connect /api/groups/{chat_id}/admin-logs to show backend events here." icon={ScrollText} />}
      </CardContent>
    </Card>
  );
}
