import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return toLocalDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts
  });
}

export function formatDateRange(start: string | Date, end: string | Date) {
  const s = toLocalDate(start);
  const e = toLocalDate(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const startStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = e.toLocaleDateString("en-US", sameMonth ? { day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

export function formatCurrency(amount: number, currency = "PKR") {
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}

/** Tolerates empty or multi-space names, which server display fields can contain. */
export function initials(name: string) {
  const letters = name
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return letters || "?";
}

/**
 * HTML date inputs return `YYYY-MM-DD`. Parsing that form with `new Date()`
 * treats it as UTC, which can display the previous calendar day west of UTC.
 */
function toLocalDate(value: string | Date) {
  if (value instanceof Date) return value;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!dateOnly) return new Date(value);

  const [, year, month, day] = dateOnly;
  return new Date(Number(year), Number(month) - 1, Number(day));
}
