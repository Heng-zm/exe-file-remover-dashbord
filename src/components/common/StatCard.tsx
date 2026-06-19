import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { safeNumber } from "@/lib/utils";

export function StatCard({ title, value, icon: Icon, hint }: { title: string; value?: unknown; icon: LucideIcon; hint?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-black tracking-tight">{safeNumber(value)}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
