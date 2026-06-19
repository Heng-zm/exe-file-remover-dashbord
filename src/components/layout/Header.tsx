import { Link, useLocation } from "react-router-dom";
import { Bell, MoreVertical, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { haptic } from "@/lib/telegram";

const titles: Record<string, string> = {
  "/": "Security Dashboard",
  "/groups": "My Groups",
  "/scan": "Scanner Test",
  "/feedback": "Feedback",
  "/developer": "Developer",
  "/settings": "Settings",
};

function titleFor(pathname: string) {
  if (pathname.startsWith("/groups/")) return "Group Admin Panel";
  return titles[pathname] || "EXE File Remover";
}

export function Header() {
  const location = useLocation();
  const { refresh, isDeveloper } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl safe-top">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-none">{titleFor(location.pathname)}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Professional Telegram bot control center</p>
          </div>
        </Link>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Refresh"
          onClick={() => {
            haptic("light");
            void refresh(true);
          }}
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Alerts"
          onClick={() => {
            haptic("light");
          }}
        >
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Menu">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Navigate</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/groups">My Groups</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/scan">Scanner Test</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/feedback">Feedback</Link>
            </DropdownMenuItem>
            {isDeveloper ? (
              <DropdownMenuItem asChild>
                <Link to="/developer">Developer Dashboard</Link>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
