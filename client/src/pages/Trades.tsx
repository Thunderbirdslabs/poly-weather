import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Trade, type InsertTrade } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, TrendingUp, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";

const SOURCES = ["Open-Meteo API", "Weather Underground API", "Prithvi (IBM/NASA)", "Pangu-Weather", "GraphWeather"];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-medium tabular", `badge-${status}`)}>
      {status}
    </span>
  );
}

export default function Trades() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);

  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    queryFn: () => apiRequest("GET", "/api/trades").then(r => r.json()),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<InsertTrade>>();

  const createMutation = useMutation({
    mutationFn: (data: InsertTrade) => apiRequest("POST", "/api/trades", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Trade logged", description: "New trade added to the log." });
      setShowAdd(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTrade> }) =>
      apiRequest("PATCH", `/api/trades/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Trade updated" });
      setEditTrade(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/trades/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Trade removed" });
    },
  });

  const filtered = trades.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchSearch = search === "" ||
      t.tradeNumber.toString().includes(search) ||
      (t.forecastSource ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.notes ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openEdit = (t: Trade) => {
    setEditTrade(t);
    setValue("status", t.status as any);
    setValue("actualMin", t.actualMin ?? undefined);
    setValue("actualMax", t.actualMax ?? undefined);
    setValue("notes", t.notes ?? "");
  };

  const onSubmit = (data: any) => {
    const nextNum = (trades[trades.length - 1]?.tradeNumber ?? 0) + 1;
    const payload: InsertTrade = {
      tradeNumber: nextNum,
      date: data.date || new Date().toISOString().split("T")[0],
      status: data.status || "pending",
      capitalAllocated: 5,
      forecastSource: data.forecastSource || "Open-Meteo API",
      predictedMin: parseFloat(data.predictedMin) || 65,
      predictedMax: parseFloat(data.predictedMax) || 75,
      actualMin: data.actualMin ? parseFloat(data.actualMin) : null,
      actualMax: data.actualMax ? parseFloat(data.actualMax) : null,
      location: "New York, NY",
      hypothesis: data.hypothesis || "Temperature within 65-75°F bounded range",
      notes: data.notes || null,
    };
    createMutation.mutate(payload);
  };

  const onUpdate = (data: any) => {
    if (!editTrade) return;
    updateMutation.mutate({
      id: editTrade.id,
      data: {
        status: data.status,
        actualMin: data.actualMin ? parseFloat(data.actualMin) : undefined,
        actualMax: data.actualMax ? parseFloat(data.actualMax) : undefined,
        notes: data.notes,
      },
    });
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Trade Log
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{trades.length} trades recorded · $5 capital per trade</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-trade" className="gap-2">
          <Plus size={14} /> Log Trade
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trades..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-trades"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-sm" data-testid="select-filter-status">
            <Filter size={12} className="mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="win">Wins</SelectItem>
            <SelectItem value="loss">Losses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs tabular">
          {filtered.length} shown
        </Badge>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-left font-medium">#</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Source</th>
                  <th className="px-5 py-3 text-left font-medium">Predicted</th>
                  <th className="px-5 py-3 text-left font-medium">Actual</th>
                  <th className="px-5 py-3 text-left font-medium">Capital</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Notes</th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
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
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground text-sm">
                      No trades match current filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors" data-testid={`trade-row-${t.id}`}>
                      <td className="px-5 py-3 tabular text-muted-foreground font-medium">{t.tradeNumber}</td>
                      <td className="px-5 py-3 tabular">{format(new Date(t.date + "T00:00:00"), "MMM d, yyyy")}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{t.forecastSource}</td>
                      <td className="px-5 py-3 tabular text-xs">{t.predictedMin?.toFixed(1)}–{t.predictedMax?.toFixed(1)}°F</td>
                      <td className="px-5 py-3 tabular text-xs">
                        {t.actualMin ? `${t.actualMin.toFixed(1)}–${t.actualMax?.toFixed(1)}°F` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3 tabular text-xs">${t.capitalAllocated.toFixed(2)}</td>
                      <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{t.notes || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(t)} data-testid={`button-edit-trade-${t.id}`}>
                            <Edit2 size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(t.id)} data-testid={`button-delete-trade-${t.id}`}>
                            <X size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Trade Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg" data-testid="dialog-add-trade">
          <DialogHeader>
            <DialogTitle>Log New Trade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date</Label>
                <Input id="date" type="date" {...register("date")} className="h-9 text-sm" data-testid="input-trade-date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs">Status</Label>
                <Select onValueChange={(v) => setValue("status", v as any)} defaultValue="pending">
                  <SelectTrigger className="h-9 text-sm" data-testid="select-trade-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Forecast Source</Label>
              <Select onValueChange={(v) => setValue("forecastSource", v)} defaultValue="Open-Meteo API">
                <SelectTrigger className="h-9 text-sm" data-testid="select-trade-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Predicted Min (°F)</Label>
                <Input type="number" step="0.1" {...register("predictedMin")} className="h-9 text-sm" placeholder="65.0" data-testid="input-predicted-min" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Predicted Max (°F)</Label>
                <Input type="number" step="0.1" {...register("predictedMax")} className="h-9 text-sm" placeholder="75.0" data-testid="input-predicted-max" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Actual Min (°F)</Label>
                <Input type="number" step="0.1" {...register("actualMin")} className="h-9 text-sm" placeholder="Optional" data-testid="input-actual-min" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Actual Max (°F)</Label>
                <Input type="number" step="0.1" {...register("actualMax")} className="h-9 text-sm" placeholder="Optional" data-testid="input-actual-max" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea {...register("notes")} rows={2} className="text-sm resize-none" placeholder="Optional notes..." data-testid="textarea-trade-notes" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-trade">
                {createMutation.isPending ? "Logging..." : "Log Trade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Trade Dialog */}
      <Dialog open={!!editTrade} onOpenChange={(o) => { if (!o) { setEditTrade(null); reset(); } }}>
        <DialogContent className="max-w-md" data-testid="dialog-edit-trade">
          <DialogHeader>
            <DialogTitle>Update Trade #{editTrade?.tradeNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select onValueChange={(v) => setValue("status", v as any)} defaultValue={editTrade?.status ?? "pending"}>
                <SelectTrigger className="h-9 text-sm" data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Actual Min (°F)</Label>
                <Input type="number" step="0.1" defaultValue={editTrade?.actualMin ?? ""} {...register("actualMin")} className="h-9 text-sm" data-testid="input-edit-actual-min" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Actual Max (°F)</Label>
                <Input type="number" step="0.1" defaultValue={editTrade?.actualMax ?? ""} {...register("actualMax")} className="h-9 text-sm" data-testid="input-edit-actual-max" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea defaultValue={editTrade?.notes ?? ""} {...register("notes")} rows={2} className="text-sm resize-none" data-testid="textarea-edit-notes" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setEditTrade(null); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                {updateMutation.isPending ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
