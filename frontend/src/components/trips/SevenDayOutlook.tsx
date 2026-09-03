"use client";

import { CloudRain, CloudSun, Sun, Snowflake } from "lucide-react";
import { WeatherDay } from "@/types/trip";
import { cn } from "@/lib/utils";

const conditionIcon = { sunny: Sun, cloudy: CloudSun, rain: CloudRain, snow: Snowflake };

export function SevenDayOutlook({ outlook }: { outlook: WeatherDay[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">7-day outlook</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {outlook.map((d) => {
          const Icon = conditionIcon[d.condition];
          return (
            <div key={d.day} className="flex flex-col items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">{d.day}</span>
              <Icon className={cn("h-4 w-4", d.condition === "rain" ? "text-primary" : "text-muted-foreground")} />
              <span className="font-semibold">{d.tempHigh}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
