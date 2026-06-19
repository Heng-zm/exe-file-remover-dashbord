import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function messageFromError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "The Mini App UI crashed while loading.";
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: messageFromError(error) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep this visible in Telegram Desktop/WebView developer tools.
    console.error("Mini App render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground safe-top safe-bottom">
        <Card className="w-full max-w-md border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle>Mini App error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Something stopped the app from rendering.</AlertTitle>
              <AlertDescription className="break-words">{this.state.error}</AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => window.location.reload()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reload Mini App
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
}
