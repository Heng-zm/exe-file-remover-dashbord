import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bot, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { SecurityBadge, StatusBadge } from "@/components/common/StatusBadge";
import { apiFetch, GroupSummary } from "@/lib/api";
import { compactId, listFromResponse, normalizeBool, safeText } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";

export function Groups() {
  const query = useApi<unknown>(() => apiFetch("/api/me/groups"), []);
  const groups = listFromResponse<GroupSummary>(query.data, ["groups", "items", "data"]);

  if (query.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (query.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load linked groups</AlertTitle>
        <AlertDescription>{query.error}</AlertDescription>
      </Alert>
    );
  }

  if (!groups.length) {
    return <EmptyState icon={UsersRound} title="No linked groups yet" description="Add the bot to a group and make it admin first. Only groups returned by the backend API can be shown here." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight">My Groups</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage groups and channels already known by the bot backend.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const chatId = String(group.chat_id || group.id || "");
          return (
            <Card key={chatId} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{safeText(group.title || group.name, "Untitled group")}</CardTitle>
                    <CardDescription className="mt-1 truncate">Chat ID: {compactId(chatId)}</CardDescription>
                  </div>
                  <SecurityBadge active={group.protection_enabled ?? group.protected} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Strictness" value={<Badge variant={group.strictness === "high" ? "warning" : "secondary"}>{safeText(group.strictness, "standard")}</Badge>} />
                <InfoRow label="Silent mode" value={<StatusBadge value={group.silent_mode} trueLabel="Silent" falseLabel="Visible" />} />
                <InfoRow label="Bot permission" value={<Badge variant={normalizeBool(group.bot_is_admin ?? group.bot_admin) ? "success" : "danger"}>{normalizeBool(group.bot_is_admin ?? group.bot_admin) ? "Admin" : "Needs admin"}</Badge>} />
                <InfoRow label="Can delete" value={<StatusBadge value={group.can_delete_messages} trueLabel="Yes" falseLabel="No" />} />
              </CardContent>
              <CardFooter className="gap-2">
                <Button asChild className="flex-1">
                  <Link to={`/groups/${encodeURIComponent(chatId)}`}>Manage</Link>
                </Button>
                <Button asChild variant="outline" size="icon">
                  <Link to={`/groups/${encodeURIComponent(chatId)}`} aria-label="Open group health">
                    {normalizeBool(group.bot_is_admin ?? group.bot_admin) ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Telegram limitation</AlertTitle>
        <AlertDescription>Mini Apps cannot fetch every group/channel from a user account. This app shows only groups/channels linked and returned by your backend.</AlertDescription>
      </Alert>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
