"use client";

import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Trip } from "@/types/trip";

/**
 * Compares the elevation of the destinations the user is actually travelling to.
 *
 * This deliberately is not a per-waypoint route profile: the backend stores a
 * single `elevation_m` per destination and has no waypoint or route-geometry
 * data, so a waypoint curve could only be invented. Real destination elevations
 * still answer the useful question — how high does this trip get.
 */
export function AltitudeChart({ trips }: { trips: Trip[] }) {
  const data = React.useMemo(() => {
    const seen = new Map<number, { point: string; elevation: number }>();
    for (const trip of trips) {
      if (!seen.has(trip.destinationId)) {
        seen.set(trip.destinationId, { point: trip.destination, elevation: trip.elevationM });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.elevation - b.elevation);
  }, [trips]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Destination Elevations</h3>
          <p className="text-xs text-muted-foreground">Your trips · meters above sea level</p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-xs text-muted-foreground">Plan a trip to see its elevation.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="point" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area type="monotone" dataKey="elevation" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#elevationFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
