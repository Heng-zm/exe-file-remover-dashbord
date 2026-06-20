import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingScreenProps = {
  error?: string | null;
  apiOnline?: boolean | null;
  onRetry?: () => void;
};

export function LoadingScreen({ error, apiOnline, onRetry }: LoadingScreenProps) {
  const openTelegram = typeof error === "string" && /telegram|initdata|reopen/i.test(error);

  return (
    <main className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-background p-5 text-foreground safe-top safe-bottom">
      <Card className="w-full max-w-sm overflow-hidden shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-3xl bg-primary/10 p-4 text-primary">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="mt-4 text-2xl font-black">EXE File Remover</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error ? "Mini App connection needs attention" : "Connecting to Telegram…"}</p>
          </div>

          {error ? (
            <div className="mt-6 space-y-4">
              <Alert variant={openTelegram ? "warning" : "destructive"}>
                <AlertTitle>{openTelegram ? "Open from Telegram" : "Connection error"}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              {apiOnline !== null ? (
                <div className="rounded-2xl border bg-muted/40 p-3 text-sm">
                  <span className="font-semibold">API status: </span>
                  <span className={apiOnline ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>{apiOnline ? "online" : "not reachable"}</span>
                </div>
              ) : null}

              <div className="grid gap-2">
                {onRetry ? (
                  <Button onClick={onRetry} className="rounded-2xl">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry connection
                  </Button>
                ) : null}
                {openTelegram ? (
                  <Button asChild variant="outline" className="rounded-2xl">
                    <a href="https://t.me/EXERemoverBot" target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Telegram bot
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
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
