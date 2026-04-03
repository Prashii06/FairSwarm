import { Activity, AlertTriangle, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";

type SummaryCardsProps = {
  totalDatasets: number;
  completedAnalyses: number;
  averageFairnessScore: number;
};

export function SummaryCards({
  totalDatasets,
  completedAnalyses,
  averageFairnessScore,
}: SummaryCardsProps) {
  const cards = [
    { label: "Datasets", value: totalDatasets, icon: Activity },
    { label: "Completed Analyses", value: completedAnalyses, icon: ShieldCheck },
    { label: "Average Fairness", value: `${averageFairnessScore.toFixed(1)}%`, icon: AlertTriangle },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">{item.label}</p>
              <Icon className="h-4 w-4 text-secondary" />
            </div>
            <p className="text-3xl font-semibold text-white">{item.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
