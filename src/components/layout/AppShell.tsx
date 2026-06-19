import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Code2, Home, MessageSquareText, ScanSearch, ShieldCheck, UsersRound } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getTelegramWebApp } from "@/lib/telegram";
import { cn } from "@/lib/utils";

const desktopItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/groups", label: "Groups", icon: UsersRound },
  { to: "/scan", label: "Scanner", icon: ScanSearch },
  { to: "/feedback", label: "Feedback", icon: MessageSquareText },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDeveloper } = useAuth();

  useEffect(() => {
    const backButton = getTelegramWebApp()?.BackButton;
    if (!backButton) return;
    const onBack = () => navigate(-1);
    if (location.pathname === "/") backButton.hide();
    else backButton.show();
    backButton.onClick(onBack);
    return () => backButton.offClick(onBack);
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-28 pt-4 md:grid-cols-[240px_1fr] md:pb-8">
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] rounded-3xl border bg-card p-3 shadow-soft md:block">
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <p className="text-sm font-black">Security Bot</p>
              <p className="text-xs text-primary/75">Mini App Control</p>
            </div>
          </div>
          <div className="space-y-1">
            {desktopItems.map((item) => {
              const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Button key={item.to} asChild variant="ghost" className={cn("w-full justify-start rounded-2xl", active && "bg-primary/10 text-primary hover:bg-primary/15")}>
                  <Link to={item.to}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
            {isDeveloper ? (
              <Button asChild variant="ghost" className={cn("w-full justify-start rounded-2xl", location.pathname.startsWith("/developer") && "bg-primary/10 text-primary hover:bg-primary/15")}>
                <Link to="/developer">
                  <Code2 className="mr-2 h-4 w-4" />
                  Developer
                </Link>
              </Button>
            ) : null}
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
