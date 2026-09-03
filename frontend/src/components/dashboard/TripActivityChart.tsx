"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Trip } from "@/types/trip";

/** Rolling 6-month window ending on the current month. */
function buildSeries(trips: Trip[]) {
  const now = new Date();
  const buckets: { key: string; month: string; trips: number }[] = [];

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      month: date.toLocaleDateString("en-US", { month: "short" }),
      trips: 0
    });
  }

  const index = new Map(buckets.map((bucket, i) => [bucket.key, i]));
  for (const trip of trips) {
    // startDate is `YYYY-MM-DD`, so the prefix is the bucket key directly.
    const position = index.get(trip.startDate.slice(0, 7));
    if (position !== undefined) buckets[position].trips += 1;
  }

  return buckets;
}

export function TripActivityChart({ trips }: { trips: Trip[] }) {
  const data = React.useMemo(() => buildSeries(trips), [trips]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold">Trip Activity</h3>
        <p className="text-xs text-muted-foreground">Your trips per month · last 6 months</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
            cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
          />
          <Bar dataKey="trips" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
