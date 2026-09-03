"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { GearCard } from "@/components/marketplace/GearCard";
import { GearFilterBar } from "@/components/marketplace/GearFilterBar";
import { Button } from "@/components/ui/button";
import { setCartOpen } from "@/store/slices/uiSlice";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { fetchGearProducts } from "@/store/slices/gearSlice";
import { TripGearSuggestions } from "@/components/marketplace/TripGearSuggestions";

export default function MarketplacePage() {
  const dispatch = useAppDispatch();
  const { products, categoryFilter, searchQuery } = useAppSelector((s) => s.gear);
  const cartCount = useAppSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));
  const catalogueRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    dispatch(fetchGearProducts());
  }, [dispatch]);

  const filtered = products.filter((p) => {
    const matchesCategory = categoryFilter === "All gear" || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Local gear network</p>
          <h1 className="mt-1 text-2xl font-bold">Ready for the road ahead?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rent or buy trusted mountain gear from local operators in the Northern Areas.</p>
        </div>
        <Button variant="outline" className="gap-2 self-start sm:self-auto" onClick={() => dispatch(setCartOpen(true))}>
          <ShoppingBag className="h-4 w-4" /> Cart ({cartCount})
        </Button>
      </div>

      <TripGearSuggestions onSeeAll={() => catalogueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      <div ref={catalogueRef} className="scroll-mt-24">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Explore all gear</h2>
          <p className="mt-1 text-sm text-muted-foreground">Filter or search the complete marketplace catalogue.</p>
        </div>
        <GearFilterBar />
      </div>

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
