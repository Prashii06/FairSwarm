"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";

type FairnessBarData = {
  metric: string;
  value: number;
};

type FairnessBarChartProps = {
  data: FairnessBarData[];
};

export function FairnessBarChart({ data }: FairnessBarChartProps) {
  return (
    <Card className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A3050" />
          <XAxis dataKey="metric" stroke="#94A3B8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} domain={[-1, 1]} />
          <Tooltip
            contentStyle={{
              background: "#0A1628",
              border: "1px solid #1A3050",
              borderRadius: 8,
              color: "#E2E8F0",
            }}
          />
          <Bar dataKey="value" fill="#00D4FF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
