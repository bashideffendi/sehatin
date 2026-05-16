import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine Tailwind classes with proper dedup + override. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format IDR currency. */
export function formatIDR(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

/** Format with thin-space thousand separator. */
export function fmtNum(n: number, digits = 0): string {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
