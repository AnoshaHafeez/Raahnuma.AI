"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Check } from "lucide-react";
import { Trip } from "@/types/trip";
import { useAppDispatch } from "@/store/hooks";
import { toggleGearItem } from "@/store/slices/tripsSlice";
import { cn } from "@/lib/utils";

export function GearChecklist({ trip }: { trip: Trip }) {
  const dispatch = useAppDispatch();
  const [tab, setTab] = React.useState<"mandatory" | "recommended">("mandatory");

  const mandatory = trip.gearChecklist.filter((g) => g.category === "mandatory");
  const recommended = trip.gearChecklist.filter((g) => g.category === "recommended");
  const items = tab === "mandatory" ? mandatory : recommended;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pack smart</p>
          <h3 className="font-semibold">Gear checklist</h3>
        </div>
        <Package className="h-5 w-5 text-primary" />
      </div>

      <div className="mb-4 flex rounded-lg border border-border bg-secondary/50 p-1">
        <button
          onClick={() => setTab("mandatory")}
          className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "mandatory" ? "bg-card shadow-sm" : "text-muted-foreground")}
        >
          Mandatory · {mandatory.length}
        </button>
        <button
          onClick={() => setTab("recommended")}
          className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "recommended" ? "bg-card shadow-sm" : "text-muted-foreground")}
        >
          Recommended · {recommended.length}
        </button>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-secondary/40">
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <button
                onClick={() => dispatch(toggleGearItem({ tripId: trip.id, itemId: item.id }))}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                  item.checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                )}
              >
                {item.checked && <Check className="h-3 w-3" />}
              </button>
              <span className={cn("text-sm", item.checked && "text-muted-foreground line-through")}>{item.name}</span>
            </label>
            <Link href={`/trips/${trip.id}/gear`} className="text-xs font-medium text-primary hover:underline">
              Buy / rent
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}