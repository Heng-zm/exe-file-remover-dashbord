import { ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingScreen({ error }: { error?: string | null }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 safe-top safe-bottom">
      <Card className="w-full max-w-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-3xl bg-primary/10 p-4 text-primary">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="mt-4 text-2xl font-black">EXE File Remover</h1>
            <p className="mt-2 text-sm text-muted-foreground">Connecting to Telegram…</p>
          </div>

          {error ? (
            <Alert variant="warning" className="mt-6">
              <AlertTitle>Telegram Mini App required</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
