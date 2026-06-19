import { Link } from "react-router-dom";
import { Code2, MessageSquareText, ScanSearch, Shield, ShieldCheck, TriangleAlert, UsersRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/common/EmptyState";
import { SecurityBadge } from "@/components/common/StatusBadge";
import { StatCard } from "@/components/common/StatCard";
import { apiFetch, GroupSummary } from "@/lib/api";
import { listFromResponse, normalizeBool, safeNumber, safeText } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useTelegram } from "@/hooks/useTelegram";

export function Dashboard() {
  const { user, session, isDeveloper } = useAuth();
  const telegram = useTelegram();
  const sessionGroups = listFromResponse<GroupSummary>(session, ["groups"]);
  const shouldFetchGroups = sessionGroups.length === 0;
  const groupsQuery = useApi<unknown>(() => apiFetch("/api/me/groups"), [shouldFetchGroups], shouldFetchGroups);
  const apiGroups = listFromResponse<GroupSummary>(groupsQuery.data, ["groups", "items", "data"]);
  const groups = sessionGroups.length ? sessionGroups : apiGroups;
  const stats = session?.stats || {};
  const linkedGroups = session?.linked_group_count ?? stats.linked_group_count ?? stats.linked_groups ?? groups.length;
  const protectedGroups = stats.protected_groups ?? groups.filter((group) => normalizeBool(group.protection_enabled ?? group.protected)).length;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-3xl border bg-muted shadow-sm">
                {user?.photo_url || user?.profile_photo_url || telegram.user?.photo_url ? (
                  <img src={user?.photo_url || user?.profile_photo_url || telegram.user?.photo_url} alt="Telegram profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-black tracking-tight">{safeText(user?.first_name || telegram.user?.first_name, "Telegram User")}</h1>
                  {normalizeBool(user?.is_premium ?? user?.premium ?? telegram.user?.is_premium) ? <Badge variant="success">Premium</Badge> : null}
                  {isDeveloper ? <Badge variant="default">Owner</Badge> : null}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">@{safeText(user?.username || telegram.user?.username, "no_username")}</p>
              </div>
            </div>
            <SecurityBadge active={safeNumber(protectedGroups) > 0} />
          </div>

          <div className="mt-5 grid gap-3 rounded-3xl border bg-background/55 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileRow label="Telegram ID" value={user?.telegram_id || user?.id || telegram.user?.id} />
            <ProfileRow label="First name" value={user?.first_name || telegram.user?.first_name} />
            <ProfileRow label="Last name" value={user?.last_name || telegram.user?.last_name} />
            <ProfileRow label="Language" value={user?.language || user?.language_code || telegram.user?.language_code} />
            <ProfileRow label="Can write to bot" value={normalizeBool(user?.allows_write_to_pm) ? "Yes" : "Unknown"} />
            <ProfileRow label="Platform" value={telegram.platform} />
            <ProfileRow label="Start parameter" value={user?.start_param || telegram.startParam} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Linked groups" value={linkedGroups} icon={UsersRound} hint="Known by backend" />
        <StatCard title="Protected groups" value={protectedGroups} icon={Shield} hint="Protection enabled" />
        <StatCard title="Open incidents" value={stats.open_incidents} icon={TriangleAlert} hint="Needs review" />
        <StatCard title="Warnings / risk" value={stats.risk_count ?? stats.warnings} icon={ShieldCheck} hint="Risk count" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Open the most-used controls without Telegram chat button chains.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Action to="/groups" icon={UsersRound} title="My Groups" description="Manage linked groups and channels" />
          <Action to="/scan" icon={ScanSearch} title="Scanner Test" description="Check a filename instantly" />
          <Action to="/feedback" icon={MessageSquareText} title="Feedback" description="Send bug reports or requests" />
          {isDeveloper ? <Action to="/developer" icon={Code2} title="Developer Dashboard" description="Runtime and platform control" /> : null}
        </CardContent>
      </Card>

      {shouldFetchGroups && groupsQuery.error ? (
        <Alert variant="warning">
          <AlertTitle>Groups could not be loaded</AlertTitle>
          <AlertDescription>{groupsQuery.error}</AlertDescription>
        </Alert>
      ) : groups.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recently linked groups</CardTitle>
            <CardDescription>Showing groups returned by your backend API only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {groups.slice(0, 3).map((group) => (
              <Link key={String(group.chat_id || group.id)} to={`/groups/${encodeURIComponent(String(group.chat_id || group.id))}`} className="flex items-center justify-between rounded-2xl border p-4 transition hover:bg-muted/60">
                <div className="min-w-0">
                  <p className="truncate font-bold">{safeText(group.title || group.name, "Untitled group")}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{safeText(group.chat_id || group.id)}</p>
                </div>
                <SecurityBadge active={group.protection_enabled ?? group.protected} />
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="No linked groups yet" description="Add the bot to a group and make it admin first. Telegram does not expose every group from a user's account to Mini Apps." icon={UsersRound} />
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{safeText(value)}</p>
    </div>
  );
}

function Action({ to, icon: Icon, title, description }: { to: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <Button asChild variant="outline" className="h-auto justify-start rounded-2xl p-4 text-left">
      <Link to={to}>
        <Icon className="mr-3 h-5 w-5 text-primary" />
        <span>
          <span className="block font-bold">{title}</span>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">{description}</span>
        </span>
      </Link>
    </Button>
  );
}
