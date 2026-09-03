"use client";

import { Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCategoryFilter, setSearchQuery } from "@/store/slices/gearSlice";

const categories = ["All gear", "Jacket", "Poles", "Tent", "Kit", "Layers", "Power"];

export function GearFilterBar() {
  const dispatch = useAppDispatch();
  const { categoryFilter, searchQuery } = useAppSelector((s) => s.gear);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search jackets, tents, safety kits..."
          className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => dispatch(setCategoryFilter(e.target.value))}
        className="h-11 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}