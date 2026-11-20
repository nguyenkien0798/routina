"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { HabitStatistics, PeriodPoint } from "@/utils/stats";

function tooltipStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--foreground)",
    fontSize: 12,
  };
}

export function InsightsCharts({
  weekly,
  monthly,
  comparison,
}: {
  weekly: PeriodPoint[];
  monthly: PeriodPoint[];
  comparison: HabitStatistics[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold">Weekly completion</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}%`, "Completion"]} />
              <Bar dataKey="percentage" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold">Activity trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                name="Check-ins"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold">Monthly completion</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}%`, "Completion"]} />
              <Bar dataKey="percentage" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold">Habit comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}%`, "Rate"]} />
              <Bar dataKey="completionRate" fill="var(--primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
