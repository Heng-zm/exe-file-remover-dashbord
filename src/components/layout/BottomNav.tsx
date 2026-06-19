import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquareText, ScanSearch, Settings, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/telegram";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/groups", label: "Groups", icon: UsersRound },
  { to: "/scan", label: "Scan", icon: ScanSearch },
  { to: "/feedback", label: "Feedback", icon: MessageSquareText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-xl safe-bottom md:hidden">
      <div className="grid grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => haptic("light")}
              className={cn("flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold text-muted-foreground transition", active && "bg-primary/10 text-primary")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
