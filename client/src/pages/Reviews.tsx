import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type DailyReview, type InsertDailyReview } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from "recharts";

export default function Reviews() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, reset } = useForm<Partial<InsertDailyReview>>();

  const { data: reviews = [], isLoading } = useQuery<DailyReview[]>({
    queryKey: ["/api/reviews"],
    queryFn: () => apiRequest("GET", "/api/reviews").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertDailyReview) => apiRequest("POST", "/api/reviews", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Review logged" });
      setShowAdd(false);
      reset();
    },
  });

  const trendData = reviews.map((r) => ({
    day: `D${r.reviewDay}`,
    accuracy: +(r.accuracyPct * 100).toFixed(1),
    pnl: +r.pnl.toFixed(2),
    capital: +r.capitalRemaining.toFixed(2),
  }));

  const latest = reviews[reviews.length - 1];

  const onSubmit = (data: any) => {
    const total = parseInt(data.cumulativeWins) + parseInt(data.cumulativeLosses);
    createMutation.mutate({
      reviewDay: parseInt(data.reviewDay),
      date: data.date || new Date().toISOString().split("T")[0],
      cumulativeWins: parseInt(data.cumulativeWins) || 0,
      cumulativeLosses: parseInt(data.cumulativeLosses) || 0,
      accuracyPct: total > 0 ? parseInt(data.cumulativeWins) / total : 0,
      capitalRemaining: parseFloat(data.capitalRemaining) || 250,
      pnl: parseFloat(data.pnl) || 0,
      notes: data.notes || null,
    });
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Daily Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review cycle begins Day 3 · Daily through Day 50</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-review" className="gap-2">
          <Plus size={14} /> Add Review
        </Button>
      </div>

      {/* Summary Cards */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Latest Accuracy", value: `${(latest.accuracyPct * 100).toFixed(1)}%`, color: latest.accuracyPct >= 0.93 ? "text-green-400" : "text-amber-400" },
            { label: "Total Wins", value: latest.cumulativeWins.toString(), color: "text-primary" },
            { label: "Total Losses", value: latest.cumulativeLosses.toString(), color: "text-red-400" },
            { label: "Running P&L", value: `$${latest.pnl.toFixed(2)}`, color: latest.pnl >= 0 ? "text-green-400" : "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className={cn("text-xl font-bold tabular", s.color)}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold">Accuracy Over Time</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[80, 100]} unit="%" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", color: "hsl(var(--foreground))" }} formatter={(v: any) => [`${v}%`]} />
                <ReferenceLine y={93} stroke="hsl(38,95%,55%)" strokeDasharray="4 2" />
                <ReferenceLine y={89} stroke="hsl(0,72%,51%)" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(186,90%,47%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold">Cumulative P&L</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(120,50%,50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(120,50%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", color: "hsl(var(--foreground))" }} formatter={(v: any) => [`$${v}`, "P&L"]} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="pnl" stroke="hsl(120,50%,50%)" fill="url(#pnlGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Review Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-xs text-muted-foreground">
                  {["Day", "Date", "Wins", "Losses", "Accuracy", "Capital", "P&L", "Status", "Notes"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-5 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground text-sm">No reviews yet — reviews start from Day 3</td>
                  </tr>
                ) : (
                  [...reviews].reverse().map((r) => {
                    const onTrack = r.accuracyPct >= 0.93;
                    const nearBE = r.accuracyPct >= 0.89;
                    return (
                      <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors" data-testid={`review-row-${r.id}`}>
                        <td className="px-5 py-3 tabular font-medium text-primary">Day {r.reviewDay}</td>
                        <td className="px-5 py-3 tabular text-xs">{format(new Date(r.date + "T00:00:00"), "MMM d, yyyy")}</td>
                        <td className="px-5 py-3 tabular text-green-400 font-semibold">{r.cumulativeWins}</td>
                        <td className="px-5 py-3 tabular text-red-400 font-semibold">{r.cumulativeLosses}</td>
                        <td className="px-5 py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold tabular", onTrack ? "badge-win" : nearBE ? "badge-pending" : "badge-loss")}>
                            {(r.accuracyPct * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3 tabular text-xs">${r.capitalRemaining.toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <span className={cn("tabular text-sm font-semibold flex items-center gap-1", r.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                            {r.pnl > 0 ? <TrendingUp size={12} /> : r.pnl < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                            ${r.pnl.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", onTrack ? "badge-win" : nearBE ? "badge-pending" : "badge-loss")}>
                            {onTrack ? "On Target" : nearBE ? "Near B/E" : "Below Threshold"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Review Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) reset(); }}>
        <DialogContent className="max-w-md" data-testid="dialog-add-review">
          <DialogHeader><DialogTitle>Log Daily Review</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Review Day</Label>
                <Input type="number" {...register("reviewDay")} className="h-9 text-sm" placeholder="3" data-testid="input-review-day" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" {...register("date")} className="h-9 text-sm" data-testid="input-review-date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Cumulative Wins</Label>
                <Input type="number" {...register("cumulativeWins")} className="h-9 text-sm" data-testid="input-cum-wins" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cumulative Losses</Label>
                <Input type="number" {...register("cumulativeLosses")} className="h-9 text-sm" data-testid="input-cum-losses" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Capital Remaining ($)</Label>
                <Input type="number" step="0.01" {...register("capitalRemaining")} className="h-9 text-sm" data-testid="input-capital" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">P&L ($)</Label>
                <Input type="number" step="0.01" {...register("pnl")} className="h-9 text-sm" data-testid="input-pnl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea {...register("notes")} rows={2} className="text-sm resize-none" data-testid="textarea-review-notes" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-review">
                {createMutation.isPending ? "Saving..." : "Save Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
