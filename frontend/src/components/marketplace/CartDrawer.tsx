"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCartOpen } from "@/store/slices/uiSlice";
import { removeFromCart, updateQuantity, updateRentalDays, clearCart } from "@/store/slices/cartSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { marketplaceApi, toErrorMessage } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.cartOpen);
  const { items, tripId } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);
  const [checkout, setCheckout] = React.useState(false);
  const [placing, setPlacing] = React.useState(false);
  const [form, setForm] = React.useState({ recipientName: "", phone: "", address: "" });

  React.useEffect(() => {
    if (user) setForm((current) => ({ ...current, recipientName: current.recipientName || user.fullName, phone: current.phone || user.phone }));
  }, [user]);

  const total = items.reduce((sum, item) => {
    const unitPrice = item.mode === "rent" ? item.product.rentPricePerDay : item.product.buyPrice;
    return sum + unitPrice * item.quantity * (item.mode === "rent" ? item.rentalDays : 1);
  }, 0);
  const close = () => { setCheckout(false); dispatch(setCartOpen(false)); };

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setPlacing(true);
    try {
      const order = await marketplaceApi.placeOrder({
        recipient_name: form.recipientName, phone: form.phone, delivery_address: form.address,
        payment_method: "cod", trip_id: tripId ? Number(tripId) : undefined,
        items: items.map((item) => ({ product_id: Number(item.product.id), mode: item.mode, quantity: item.quantity, rental_days: item.mode === "rent" ? item.rentalDays : 1 })),
      });
      dispatch(clearCart()); close();
      toast({ title: `Order #${order.id} placed`, description: `Cash on delivery confirmed. Total: ${formatCurrency(order.total_amount)}.`, variant: "success" });
    } catch (error) {
      toast({ title: "Could not place order", description: toErrorMessage(error), variant: "error" });
    } finally { setPlacing(false); }
  };

  return <AnimatePresence>{open && <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-40 bg-black/40" />
    <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.25, ease: "easeInOut" }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card shadow-xl">
      <div className="flex h-16 items-center justify-between border-b border-border px-5"><h2 className="flex items-center gap-2 font-semibold"><ShoppingBag className="h-4.5 w-4.5" /> {checkout ? "COD checkout" : "Your trip cart"}</h2><button type="button" onClick={close} aria-label="Close cart"><X className="h-5 w-5" /></button></div>
      {!checkout ? <>
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? <p className="mt-10 text-center text-sm text-muted-foreground">Your cart is empty. Add gear from the marketplace.</p> : <div className="space-y-4">{items.map((item) => {
            const unit = item.mode === "rent" ? item.product.rentPricePerDay : item.product.buyPrice;
            return <div key={`${item.product.id}-${item.mode}`} className="flex gap-3 border-b border-border pb-4">
              {item.product.imageUrl ? <Image src={item.product.imageUrl} alt={item.product.name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg object-cover" /> : <div className={`h-16 w-16 shrink-0 rounded-lg ${item.product.imageColor}`} />}
              <div className="flex-1"><p className="text-sm font-semibold">{item.product.name}</p><p className="text-xs capitalize text-muted-foreground">{item.mode} · {item.product.vendor.name}</p><p className="mt-1 text-sm font-medium">{formatCurrency(unit)}{item.mode === "rent" && "/day"}</p>
                {item.mode === "rent" && <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">Rental days <Input aria-label={`Rental days for ${item.product.name}`} type="number" min={1} max={60} value={item.rentalDays} onChange={(e) => dispatch(updateRentalDays({ productId: item.product.id, mode: item.mode, rentalDays: Number(e.target.value) }))} className="h-7 w-16 px-2" /></label>}
                <div className="mt-2 flex items-center gap-2"><button type="button" aria-label={`Decrease quantity of ${item.product.name}`} onClick={() => dispatch(updateQuantity({ productId: item.product.id, mode: item.mode, quantity: item.quantity - 1 }))} className="flex h-7 w-7 items-center justify-center rounded-md border border-input hover:bg-secondary"><Minus className="h-3 w-3" /></button><span className="w-6 text-center text-sm">{item.quantity}</span><button type="button" aria-label={`Increase quantity of ${item.product.name}`} onClick={() => dispatch(updateQuantity({ productId: item.product.id, mode: item.mode, quantity: item.quantity + 1 }))} className="flex h-7 w-7 items-center justify-center rounded-md border border-input hover:bg-secondary"><Plus className="h-3 w-3" /></button><button type="button" aria-label={`Remove ${item.product.name} from cart`} onClick={() => dispatch(removeFromCart({ productId: item.product.id, mode: item.mode }))} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>
              </div></div>;
          })}</div>}
        </div>
        {items.length > 0 && <div className="border-t border-border p-5"><div className="mb-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">Order total</span><span className="text-lg font-bold">{formatCurrency(total)}</span></div><Button className="w-full" size="lg" onClick={() => setCheckout(true)}>Continue to COD checkout</Button><button type="button" onClick={() => dispatch(clearCart())} className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-destructive">Clear cart</button></div>}
      </> : <form onSubmit={placeOrder} className="flex flex-1 flex-col overflow-y-auto p-5"><p className="text-sm text-muted-foreground">Pay {formatCurrency(total)} in cash when the order is delivered. Rental prices include the days selected above.</p><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Recipient name<Input required minLength={2} value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} className="mt-1" /></label><label className="block text-sm font-medium">Phone number<Input required minLength={7} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></label><label className="block text-sm font-medium">Delivery address<textarea required minLength={10} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="House / hotel, street, city" /></label></div><div className="mt-auto pt-6"><Button type="submit" className="w-full" size="lg" disabled={placing}>{placing ? "Placing order..." : `Place COD order · ${formatCurrency(total)}`}</Button><Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setCheckout(false)}>Back to cart</Button></div></form>}
    </motion.aside>
  </>}</AnimatePresence>;
}
