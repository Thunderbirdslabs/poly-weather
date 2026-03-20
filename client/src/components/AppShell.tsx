import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard, TrendingUp, BookOpen, Calendar, Database,
  Settings, Sun, Moon, CloudLightning, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PerplexityAttribution from "@/components/PerplexityAttribution";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/trades", label: "Trade Log", icon: TrendingUp },
  { href: "/reviews", label: "Reviews", icon: BookOpen },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => apiRequest("GET", "/api/analytics").then(r => r.json()),
    refetchInterval: 30000,
  });

  const accuracy = analytics?.accuracy ?? 0;
  const onTrack = accuracy >= 0.93;

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sidebar-nav bg-card border-r border-border flex flex-col" data-testid="sidebar">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0">
            <svg viewBox="0 0 32 32" fill="none" aria-label="Poly Weather logo" className="w-8 h-8">
              <circle cx="16" cy="16" r="14" stroke="hsl(186,90%,47%)" strokeWidth="1.5"/>
              <path d="M8 20 C10 14, 14 10, 16 10 C18 10, 22 14, 24 20" stroke="hsl(186,90%,47%)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <path d="M11 24 L16 12 L21 24" stroke="hsl(38,95%,55%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="16" cy="12" r="2" fill="hsl(186,90%,47%)"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Poly Weather</p>
            <p className="text-xs text-muted-foreground leading-tight">Trading Dashboard</p>
          </div>
        </div>

        {/* Status pill */}
        <div className="px-4 py-3 border-b border-border">
          <div className={cn(
            "text-xs px-3 py-1.5 rounded-full flex items-center gap-2 w-fit",
            onTrack ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", onTrack ? "bg-green-400" : "bg-amber-400")} />
            {onTrack ? "On Track" : "Monitor"}
            <span className="tabular ml-1">{(accuracy * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5" role="navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 group",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon size={16} className={cn(active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {label}
                {active && <ChevronRight size={12} className="ml-auto text-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border space-y-2">
          <button
            onClick={toggle}
            data-testid="theme-toggle"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <PerplexityAttribution />
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="main-content bg-background" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
