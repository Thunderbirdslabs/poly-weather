import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type StrategyConfig } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Save, Shield, BarChart3, Thermometer, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export default function Settings() {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<Partial<StrategyConfig>>();

  const { data: config } = useQuery<StrategyConfig>({
    queryKey: ["/api/config"],
    queryFn: () => apiRequest("GET", "/api/config").then(r => r.json()),
  });

  useEffect(() => {
    if (config) reset(config);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/config", {
      ...data,
      totalTrades: parseInt(data.totalTrades),
      capitalPerTrade: parseFloat(data.capitalPerTrade),
      initialCapital: parseFloat(data.initialCapital),
      targetAccuracy: parseFloat(data.targetAccuracy),
      breakEvenAccuracy: parseFloat(data.breakEvenAccuracy),
      boundedRangeMin: parseFloat(data.boundedRangeMin),
      boundedRangeMax: parseFloat(data.boundedRangeMax),
      reviewStartDay: parseInt(data.reviewStartDay),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Settings saved", description: "Strategy parameters updated." });
    },
  });

  return (
    <div className="p-6 space-y-5 max-w-[800px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings2 size={20} className="text-primary" />
          Strategy Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure trade parameters, accuracy thresholds, and review schedule</p>
      </div>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">
        {/* Capital & Trade Config */}
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield size={14} className="text-primary" />
              Capital & Trade Config
            </CardTitle>
            <CardDescription className="text-xs">Controls trade size, total scope, and initial capital</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Initial Capital ($)</Label>
              <Input type="number" step="0.01" {...register("initialCapital")} className="h-9 text-sm" data-testid="input-initial-capital" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Capital Per Trade ($)</Label>
              <Input type="number" step="0.01" {...register("capitalPerTrade")} className="h-9 text-sm" data-testid="input-capital-per-trade" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Trade Count</Label>
              <Input type="number" {...register("totalTrades")} className="h-9 text-sm" data-testid="input-total-trades" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary Location</Label>
              <Input {...register("primaryLocation")} className="h-9 text-sm" data-testid="input-location" />
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Thresholds */}
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              Accuracy Thresholds
            </CardTitle>
            <CardDescription className="text-xs">Min accuracy to achieve target profit vs break-even</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Target Accuracy (decimal)</Label>
              <Input type="number" step="0.01" {...register("targetAccuracy")} className="h-9 text-sm" placeholder="0.93" data-testid="input-target-accuracy" />
              <p className="text-xs text-muted-foreground">e.g. 0.93 = 93%</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Break-Even Accuracy (decimal)</Label>
              <Input type="number" step="0.01" {...register("breakEvenAccuracy")} className="h-9 text-sm" placeholder="0.89" data-testid="input-breakeven-accuracy" />
              <p className="text-xs text-muted-foreground">e.g. 0.89 = 89%</p>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Range */}
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Thermometer size={14} className="text-primary" />
              Bounded Temperature Range
            </CardTitle>
            <CardDescription className="text-xs">Default forecast evaluation range in °F</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Min Temp (°F)</Label>
              <Input type="number" step="0.1" {...register("boundedRangeMin")} className="h-9 text-sm" data-testid="input-temp-min" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Temp (°F)</Label>
              <Input type="number" step="0.1" {...register("boundedRangeMax")} className="h-9 text-sm" data-testid="input-temp-max" />
            </div>
          </CardContent>
        </Card>

        {/* Review Schedule */}
        <Card className="border-border">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText size={14} className="text-primary" />
              Review Schedule
            </CardTitle>
            <CardDescription className="text-xs">When accuracy tracking and reviews begin</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Review Start Day</Label>
              <Input type="number" {...register("reviewStartDay")} className="h-9 text-sm" data-testid="input-review-start-day" />
              <p className="text-xs text-muted-foreground">Accuracy tracking begins at this day</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={saveMutation.isPending} data-testid="button-save-settings">
            <Save size={14} />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
