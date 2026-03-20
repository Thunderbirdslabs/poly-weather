import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Event, type InsertEvent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, CheckCircle2, Circle, X, Flag, Clock, AlertTriangle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { useForm } from "react-hook-form";

const typeConfig: Record<string, { icon: any; color: string; badge: string }> = {
  milestone: { icon: Star, color: "text-primary", badge: "badge-win" },
  review:    { icon: Clock, color: "text-amber-400", badge: "badge-pending" },
  deadline:  { icon: AlertTriangle, color: "text-red-400", badge: "badge-loss" },
  alert:     { icon: Flag, color: "text-orange-400", badge: "badge-pending" },
};

export default function EventsPage() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<Partial<InsertEvent>>();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertEvent) => apiRequest("POST", "/api/events", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event added" });
      setShowAdd(false);
      reset();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      apiRequest("PATCH", `/api/events/${id}`, { completed }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/events/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event removed" });
    },
  });

  const upcoming = events.filter((e) => !e.completed && !isPast(new Date(e.date + "T00:00:00")));
  const overdue = events.filter((e) => !e.completed && isPast(new Date(e.date + "T00:00:00")));
  const completed = events.filter((e) => e.completed);

  const onSubmit = (data: any) => {
    createMutation.mutate({
      title: data.title,
      date: data.date,
      type: data.type || "milestone",
      description: data.description || null,
      completed: false,
    });
  };

  const EventCard = ({ ev }: { ev: Event }) => {
    const cfg = typeConfig[ev.type] ?? typeConfig.milestone;
    const Icon = cfg.icon;
    const overdue_ = !ev.completed && isPast(new Date(ev.date + "T00:00:00"));

    return (
      <div
        className={cn("flex items-start gap-4 p-4 rounded-lg border transition-all", ev.completed ? "border-border/30 opacity-60" : overdue_ ? "border-red-500/30 bg-red-500/5" : "border-border bg-card hover:border-primary/30")}
        data-testid={`event-card-${ev.id}`}
      >
        <button
          onClick={() => toggleMutation.mutate({ id: ev.id, completed: !ev.completed })}
          className="mt-0.5 flex-shrink-0"
          data-testid={`button-toggle-event-${ev.id}`}
        >
          {ev.completed ? <CheckCircle2 size={18} className="text-green-400" /> : <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-medium", ev.completed && "line-through text-muted-foreground")}>{ev.title}</p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.badge)}>{ev.type}</span>
            {overdue_ && <span className="text-xs px-2 py-0.5 rounded-full badge-loss">overdue</span>}
          </div>
          {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
          <p className="text-xs text-muted-foreground tabular mt-1 flex items-center gap-1">
            <Calendar size={10} />
            {format(new Date(ev.date + "T00:00:00"), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Icon size={14} className={cfg.color} />
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(ev.id)} data-testid={`button-delete-event-${ev.id}`}>
            <X size={12} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Events & Milestones
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track strategy checkpoints, deadlines, and milestones</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-event" className="gap-2">
          <Plus size={14} /> Add Event
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Upcoming", value: upcoming.length, color: "text-primary" },
          { label: "Overdue", value: overdue.length, color: "text-red-400" },
          { label: "Completed", value: completed.length, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("text-2xl font-bold tabular", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={12} /> Overdue ({overdue.length})
          </h2>
          {overdue.map((ev) => <EventCard key={ev.id} ev={ev} />)}
        </div>
      )}

      {/* Upcoming */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming ({upcoming.length})</h2>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No upcoming events</p>
        ) : (
          upcoming.map((ev) => <EventCard key={ev.id} ev={ev} />)
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed ({completed.length})</h2>
          {completed.map((ev) => <EventCard key={ev.id} ev={ev} />)}
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) reset(); }}>
        <DialogContent className="max-w-md" data-testid="dialog-add-event">
          <DialogHeader><DialogTitle>Add Event or Milestone</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input {...register("title", { required: true })} className="h-9 text-sm" placeholder="e.g. Trade 25 Review" data-testid="input-event-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" {...register("date", { required: true })} className="h-9 text-sm" data-testid="input-event-date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select onValueChange={(v) => setValue("type", v)} defaultValue="milestone">
                  <SelectTrigger className="h-9 text-sm" data-testid="select-event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea {...register("description")} rows={2} className="text-sm resize-none" data-testid="textarea-event-desc" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setShowAdd(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-event">
                {createMutation.isPending ? "Adding..." : "Add Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
