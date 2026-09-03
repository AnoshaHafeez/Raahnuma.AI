"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ShoppingBag, Truck } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCartOpen } from "@/store/slices/uiSlice";
import { GearCard } from "@/components/marketplace/GearCard";
import { GearFilterBar } from "@/components/marketplace/GearFilterBar";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils";
import { fetchTripGearRecommendations } from "@/store/slices/gearSlice";
import { setCartTripId } from "@/store/slices/cartSlice";

export default function TripGearPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const dispatch = useAppDispatch();
  const trip = useAppSelector((s) => s.trips.trips.find((t) => t.id === tripId));
  const { products, categoryFilter, searchQuery } = useAppSelector((s) => s.gear);
  const cartCount = useAppSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));

  React.useEffect(() => {
    dispatch(setCartTripId(tripId));
    dispatch(fetchTripGearRecommendations(tripId));
  }, [dispatch, tripId]);

  const filtered = products.filter((p) => {
    const matchesCategory = categoryFilter === "All gear" || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!trip) {
    return <p className="text-sm text-muted-foreground">Trip not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Local gear network</p>
          <h1 className="mt-1 text-2xl font-bold">Gear matched to your itinerary</h1>
          <p className="mt-1 text-sm text-muted-foreground">AI matches local gear to the places and activities you selected.</p>
        </div>
        <Button variant="outline" className="gap-2 self-start sm:self-auto" onClick={() => dispatch(setCartOpen(true))}>
          <ShoppingBag className="h-4 w-4" /> Cart ({cartCount})
        </Button>
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-xl bg-primary px-5 py-3.5 text-primary-foreground sm:flex-row sm:items-center">
        <span className="text-sm font-medium">
          Your trip: {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <Truck className="h-3.5 w-3.5" /> Delivery to {trip.destination.split(" ")[0]} available
        </span>
      </div>

      <GearFilterBar />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <GearCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">No gear matches your search. Try a different category.</p>
      )}

      <p className="flex items-center justify-center gap-1.5 border-t border-border pt-6 text-xs text-muted-foreground">
        ✓ Every vendor is verified by Raahnuma.AI and reviewed by travelers.
      </p>

      <CartDrawer />
    </div>
  );
}
