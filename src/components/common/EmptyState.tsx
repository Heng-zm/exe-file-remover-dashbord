import { LucideIcon, ShieldQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState({ icon: Icon = ShieldQuestion, title, description, actionLabel, onAction }: { icon?: LucideIcon; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="rounded-3xl bg-muted p-4 text-muted-foreground">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        {actionLabel && onAction ? (
          <Button className="mt-5" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
