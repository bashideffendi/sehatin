/**
 * Number formatting helpers — Indonesian locale.
 */

/** Rupiah string with "Rp" prefix + thousands separator (titik). */
export function rupiah(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

/** Compact rupiah, e.g. Rp48k, Rp1.2jt. Use for tight spaces. */
export function rupiahShort(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "";
  const v = Math.round(n);
  if (v >= 1_000_000) return `Rp${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  if (v >= 1_000) return `Rp${Math.round(v / 1000)}k`;
  return `Rp${v}`;
}

/** Kcal with Indonesian thousands separator (titik). */
export function fmtKcal(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("id-ID");
}

/** Number with thousands separator. Generic. */
export function fmtNum(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "0";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format gram value with `g` suffix. */
export function fmtGram(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "0g";
  return `${fmtNum(n, decimals)}g`;
}

/** Format weight with `kg` suffix. */
export function fmtKg(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${fmtNum(n, decimals)} kg`;
}

/** Compact percentage: "85%" or "+12%". */
export function fmtPct(n: number | null | undefined, withSign = false): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "0%";
  const rounded = Math.round(n);
  if (withSign && rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}
