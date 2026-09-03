"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import { GearProduct } from "@/types/gear";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart } from "@/store/slices/cartSlice";
import { toggleWishlist } from "@/store/slices/gearSlice";
import { toast } from "@/components/ui/toaster";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function GearCard({ product }: { product: GearProduct }) {
  const dispatch = useAppDispatch();
  const wishlist = useAppSelector((s) => s.gear.wishlist);
  const isWishlisted = wishlist.includes(product.id);

  const handleAdd = (mode: "rent" | "buy") => {
    dispatch(addToCart({ product, mode }));
    toast({ title: "Added to cart", description: `${product.name} added for ${mode}.`, variant: "success" });
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={cn("relative aspect-[4/3] w-full overflow-hidden", product.imageColor)}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">{product.category}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
        <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground backdrop-blur">
          {product.category}
        </span>
        <button
          type="button"
          onClick={() => dispatch(toggleWishlist(product.id))}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart className={cn("h-4 w-4", isWishlisted ? "fill-destructive text-destructive" : "text-muted-foreground")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{product.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.vendor.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs font-medium">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {product.rating}
          </div>
        </div>

        {product.recommendationReason && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-primary">AI match: {product.recommendationReason}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="text-xs">
            <p className="font-semibold">{formatCurrency(product.rentPricePerDay)}/day</p>
            <p className="text-muted-foreground">Buy from {formatCurrency(product.buyPrice)}</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => handleAdd("buy")}>Buy</Button>
            <Button size="sm" onClick={() => handleAdd("rent")}>Rent</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
