import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type DataSource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Database, Wifi, WifiOff, AlertCircle, RefreshCw, Server, BrainCircuit, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const typeIcon: Record<string, any> = {
  api: Globe,
  model: BrainCircuit,
  mcp: Server,
};

const statusConfig: Record<string, { color: string; bg: string; icon: any; dot: string }> = {
  active:   { color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",  icon: Wifi,        dot: "bg-green-400" },
  degraded: { color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",  icon: AlertCircle, dot: "bg-amber-400" },
  offline:  { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",      icon: WifiOff,     dot: "bg-red-400" },
};

export default function DataSources() {
  const { toast } = useToast();

  const { data: sources = [], isLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
    queryFn: () => apiRequest("GET", "/api/data-sources").then(r => r.json()),
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/data-sources/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      toast({ title: "Status updated" });
    },
  });

  const active = sources.filter((s) => s.status === "active").length;
  const degraded = sources.filter((s) => s.status === "degraded").length;
  const offline = sources.filter((s) => s.status === "offline").length;

  const avgAccuracy = sources.filter((s) => s.status === "active").reduce((sum, s) => sum + s.successRate, 0) / (active || 1);

  return (
    <div className="p-6 space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database size={20} className="text-primary" />
            Data Sources
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Weather APIs, ML models, and MCP server health</p>
        </div>
        <Badge variant="outline" className="text-xs gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live monitoring
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active", value: active, color: "text-green-400" },
          { label: "Degraded", value: degraded, color: "text-amber-400" },
          { label: "Offline", value: offline, color: "text-red-400" },
          { label: "Avg. Accuracy", value: `${avgAccuracy.toFixed(1)}%`, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
              <p className={cn("text-xl font-bold tabular", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Source Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)
          : sources.map((src) => {
            const cfg = statusConfig[src.status] ?? statusConfig.offline;
            const StatusIcon = cfg.icon;
            const TypeIcon = typeIcon[src.type] ?? Database;

            return (
              <Card key={src.id} className={cn("border transition-all", src.status === "active" ? "border-border hover:border-primary/30" : `border-${src.status === "degraded" ? "amber" : "red"}-500/20`)} data-testid={`datasource-card-${src.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <TypeIcon size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{src.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{src.type}</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border", cfg.bg, cfg.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot, src.status === "active" && "animate-pulse")} />
                      {src.status}
                    </div>
                  </div>

                  {/* Accuracy bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Success Rate</span>
                      <span className={cn("text-xs font-semibold tabular", src.successRate >= 90 ? "text-green-400" : src.successRate >= 75 ? "text-amber-400" : "text-red-400")}>
                        {src.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", src.successRate >= 90 ? "bg-green-400" : src.successRate >= 75 ? "bg-amber-400" : "bg-red-400")}
                        style={{ width: `${src.successRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {src.lastPolled ? (
                        <>Last polled: <span className="tabular">{format(new Date(src.lastPolled), "h:mm a")}</span></>
                      ) : (
                        <span className="text-red-400">Never polled</span>
                      )}
                    </div>
                    <Select
                      defaultValue={src.status}
                      onValueChange={(v) => updateMutation.mutate({ id: src.id, data: { status: v } })}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs" data-testid={`select-status-${src.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="degraded">Degraded</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {src.notes && (
                    <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2">{src.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* MCP Servers Section */}
      <Card className="border-border">
        <CardHeader className="px-5 pt-5 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Server size={14} className="text-primary" />
            MCP Server Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="space-y-2">
            {[
              { endpoint: "mcp://weather.data.sync", purpose: "Weather polling synchronization", status: "active" },
              { endpoint: "mcp://analytics.tracker", purpose: "Accuracy tracking & trade outcomes", status: "active" },
              { endpoint: "mcp://docs.agent", purpose: "Knowledge retraining log", status: "active" },
              { endpoint: "mcp://risk.policy", purpose: "Risk & capital allocation governance", status: "active" },
            ].map((m) => (
              <div key={m.endpoint} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div>
                  <p className="text-xs font-mono text-primary">{m.endpoint}</p>
                  <p className="text-xs text-muted-foreground">{m.purpose}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {m.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
