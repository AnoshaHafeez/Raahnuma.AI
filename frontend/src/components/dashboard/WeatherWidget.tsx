"use client";

import { CloudRain, CloudSun, Sun, Snowflake } from "lucide-react";
import { Trip } from "@/types/trip";
import { cn } from "@/lib/utils";

const conditionIcon = { sunny: Sun, cloudy: CloudSun, rain: CloudRain, snow: Snowflake };

export function WeatherWidget({ trip }: { trip: Trip }) {
  const Icon = conditionIcon[trip.weatherCondition];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{trip.destination} · Today</p>
            <p className="mt-1 text-3xl font-bold">{trip.currentTempC}°</p>
            <p className="text-xs text-muted-foreground">Feels like {trip.feelsLikeC}°</p>
          </div>
          <Icon className="h-9 w-9 text-primary" />
        </div>
        <div className="mt-4 flex justify-between text-xs">
          <div>
            <p className="text-muted-foreground">Rain chance</p>
            <p className="font-semibold">{trip.rainChance}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Wind</p>
            <p className="font-semibold">{trip.windKph} km/h</p>
          </div>
          <div>
            <p className="text-muted-foreground">Visibility</p>
            <p className="font-semibold">{trip.visibility}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground">7-day outlook</p>
        {trip.sevenDayOutlook.length === 0 ? (
          <p className="text-xs text-muted-foreground">Forecast unavailable right now.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {trip.sevenDayOutlook.map((d) => {
              const DayIcon = conditionIcon[d.condition];
              return (
                <div key={d.date} className="flex flex-col items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">{d.day}</span>
                  <DayIcon className={cn("h-4 w-4", d.condition === "rain" ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-semibold">{d.tempHigh}°</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">Altitude check</p>
        <p className="mt-1 text-2xl font-bold">{trip.elevationM.toLocaleString()} m</p>
        <p className="text-xs text-muted-foreground">{trip.destination} elevation · acclimatize slowly</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((trip.elevationM / 4700) * 100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
