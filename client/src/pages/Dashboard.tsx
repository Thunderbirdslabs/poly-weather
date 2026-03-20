import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Trade, type DailyReview, type Event } from "@shared/schema";
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, Calendar, CloudLightning, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine
} from "recharts";
import { format } from "date-fns";

function KPICard({ title, value, sub, icon: Icon, color, glow }: {
  title: string; value: string; sub?: string; icon: any; color: string; glow?: string;
}) {
  return (
    <Card className={cn("border-border relative overflow-hidden", glow)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className={cn("text-2xl font-bold tabular", color)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={cn("p-2 rounded-lg", `${color.replace("text-", "bg-").replace("[", "[").replace("]", "]")}/10`)}>
            <Icon size={18} className={color} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => apiRequest("GET", "/api/analytics").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: trades = [], isLoading: loadingTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    queryFn: () => apiRequest("GET", "/api/trades").then(r => r.json()),
  });

  const { data: reviews = [] } = useQuery<DailyReview[]>({
    queryKey: ["/api/reviews"],
    queryFn: () => apiRequest("GET", "/api/reviews").then(r => r.json()),
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });

  const loading = loadingAnalytics || loadingTrades;
  const acc = analytics?.accuracy ?? 0;
  const tradeProgress = ((analytics?.completed ?? 0) / 50) * 100;

  // Accuracy trend data from reviews
  const accuracyTrend = reviews.map((r) => ({
    day: `Day ${r.reviewDay}`,
    accuracy: +(r.accuracyPct * 100).toFixed(1),
    target: 93,
  }));

  // Win/loss by source
  const sourceStats: Record<string, { wins: number; losses: number }> = {};
  trades.forEach((t) => {
    if (t.status === "pending") return;
    const src = t.forecastSource ?? "Unknown";
    if (!sourceStats[src]) sourceStats[src] = { wins: 0, losses: 0 };
    if (t.status === "win") sourceStats[src].wins++;
    else sourceStats[src].losses++;
  });
  const sourceData = Object.entries(sourceStats).map(([name, s]) => ({
    name: name.replace(" API", "").replace(" (IBM/NASA)", ""),
    wins: s.wins,
    losses: s.losses,
    accuracy: s.wins + s.losses > 0 ? +((s.wins / (s.wins + s.losses)) * 100).toFixed(1) : 0,
  }));

  // Capital curve
  const capitalCurve = reviews.map((r) => ({
    day: `D${r.reviewDay}`,
    capital: +r.capitalRemaining.toFixed(2),
    pnl: +r.pnl.toFixed(2),
  }));

  const upcomingEvents = events.filter((e) => !e.completed).slice(0, 4);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CloudLightning size={20} className="text-primary" />
            Strategy Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weather-Based Prediction Trading — 50-Trade Test Window
          </p>
        </div>
        <Badge variant="outline" className="text-xs tabular border-primary/30 text-primary">
          Updated just now
        </Badge>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-grid">
          <KPICard
            title="Accuracy"
            value={`${(acc * 100).toFixed(1)}%`}
            sub={acc >= 0.93 ? "▲ On target (≥93%)" : acc >= 0.89 ? "Near break-even" : "▼ Below threshold"}
            icon={Target}
            color={acc >= 0.93 ? "text-green-400" : acc >= 0.89 ? "text-amber-400" : "text-red-400"}
            glow={acc >= 0.93 ? "glow-green" : acc >= 0.89 ? "glow-amber" : "glow-red"}
          />
          <KPICard
            title="Trades Complete"
            value={`${analytics?.completed ?? 0} / 50`}
            sub={`${analytics?.remaining ?? 50} remaining`}
            icon={Activity}
            color="text-primary"
            glow="glow-cyan"
          />
          <KPICard
            title="P&L"
            value={`$${(analytics?.pnl ?? 0).toFixed(2)}`}
            sub={`Capital: $${(analytics?.capitalRemaining ?? 250).toFixed(2)}`}
            icon={DollarSign}
            color={(analytics?.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}
          />
          <KPICard
            title="Win / Loss"
            value={`${analytics?.wins ?? 0}W — ${analytics?.losses ?? 0}L`}
            sub="$5 per trade"
            icon={(analytics?.pnl ?? 0) >= 0 ? TrendingUp : TrendingDown}
            color={(analytics?.wins ?? 0) > (analytics?.losses ?? 0) ? "text-green-400" : "text-red-400"}
          />
        </div>
      )}

      {/* ── Progress Bar ────────────────────────────────────────────────── */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Trade Progress</span>
            <span className="text-sm tabular text-foreground font-medium">{analytics?.completed ?? 0} / 50 trades</span>
          </div>
          <Progress value={tradeProgress} className="h-2" />
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>Start</span>
            <span className="text-amber-400">Day 25 Review</span>
            <span>Day 51 Final</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Accuracy Trend */}
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Accuracy Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Daily rolling accuracy vs 93% target</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={accuracyTrend}>
                <defs>
                  <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(186,90%,47%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(186,90%,47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", color: "hsl(var(--foreground))" }}
                  formatter={(v: any) => [`${v}%`, "Accuracy"]}
                />
                <ReferenceLine y={93} stroke="hsl(38,95%,55%)" strokeDasharray="4 2" label={{ value: "Target 93%", fill: "hsl(38,95%,55%)", fontSize: 10, position: "insideTopRight" }} />
                <Area type="monotone" dataKey="accuracy" stroke="hsl(186,90%,47%)" fill="url(#accuracyGrad)" strokeWidth={2} dot={{ r: 3, fill: "hsl(186,90%,47%)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Performance */}
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Forecast Source Performance</CardTitle>
            <p className="text-xs text-muted-foreground">Wins vs losses per data source</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="wins" fill="hsl(186,90%,47%)" radius={[3, 3, 0, 0]} name="Wins" />
                <Bar dataKey="losses" fill="hsl(0,72%,51%)" radius={[3, 3, 0, 0]} name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Capital Curve + Events ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capital Curve */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Capital Curve</CardTitle>
            <p className="text-xs text-muted-foreground">Running capital over review days</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={capitalCurve}>
                <defs>
                  <linearGradient id="capitalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(120,50%,50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(120,50%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[230, 280]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", color: "hsl(var(--foreground))" }}
                  formatter={(v: any) => [`$${v}`, "Capital"]}
                />
                <ReferenceLine y={250} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 2" label={{ value: "Initial $250", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Line type="monotone" dataKey="capital" stroke="hsl(120,50%,50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming events</p>
            ) : (
              upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50" data-testid={`event-card-${ev.id}`}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    ev.type === "deadline" ? "bg-red-400" : ev.type === "review" ? "bg-amber-400" : "bg-primary"
                  )} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground tabular">{format(new Date(ev.date + "T00:00:00"), "MMM d, yyyy")}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Trades ───────────────────────────────────────────────── */}
      <Card className="border-border">
        <CardHeader className="px-5 pt-5 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Recent Trades</CardTitle>
          <Badge variant="outline" className="text-xs">Last 5</Badge>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">#</th>
                  <th className="pb-2 text-left font-medium">Date</th>
                  <th className="pb-2 text-left font-medium">Source</th>
                  <th className="pb-2 text-left font-medium">Predicted Range</th>
                  <th className="pb-2 text-left font-medium">Actual Range</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {trades.slice(-5).reverse().map((t) => (
                  <tr key={t.id} className="border-b border-border/40 text-xs" data-testid={`trade-row-${t.id}`}>
                    <td className="py-2.5 tabular text-muted-foreground">{t.tradeNumber}</td>
                    <td className="py-2.5 tabular">{format(new Date(t.date + "T00:00:00"), "MMM d")}</td>
                    <td className="py-2.5 max-w-[120px] truncate text-muted-foreground">{t.forecastSource?.replace(" API", "")}</td>
                    <td className="py-2.5 tabular">{t.predictedMin?.toFixed(1)}–{t.predictedMax?.toFixed(1)}°F</td>
                    <td className="py-2.5 tabular">{t.actualMin ? `${t.actualMin.toFixed(1)}–${t.actualMax?.toFixed(1)}°F` : "—"}</td>
                    <td className="py-2.5">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium tabular", `badge-${t.status}`)}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
