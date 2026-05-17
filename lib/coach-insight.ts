/**
 * Coach insight — deterministic rule-based insight generator from
 * past food log + weight + workout patterns. Surfaces on dashboard
 * as a contextual nudge.
 *
 * Phase 4 can swap to AI-powered (/api/insights → Claude) for richer,
 * less repetitive insights.
 */

import { getDailySummary, getEntriesByDateRange, todayISO } from "./food-log";
import { getWeightHistory } from "./weight-log";
import { getStreak } from "./insights";
import { fmtKcal } from "./format";

export interface Insight {
  /** Visual tone — drives icon background color */
  tone: "forest" | "clay" | "sun" | "sky";
  /** Short title (1-3 words) */
  title: string;
  /** Sentence-style body (max ~120 chars) */
  body: string;
  /** Optional secondary CTA */
  cta?: {
    label: string;
    href: string;
  };
}

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Generate the most relevant insight from current state.
 * Rules run in priority order; first match wins.
 */
export function getCoachInsight(targetKcal: number | null): Insight | null {
  if (typeof window === "undefined") return null;
  const today = todayISO();
  const yesterday = shiftISO(today, -1);
  const weekAgo = shiftISO(today, -7);

  const todaySummary = getDailySummary(today);
  const yesterdaySummary = getDailySummary(yesterday);
  const weekEntries = getEntriesByDateRange(weekAgo, today);
  const weights = getWeightHistory();
  const streak = getStreak();

  // === RULE 1: Streak milestone ===
  if (streak === 7) {
    return {
      tone: "sun",
      title: "Seminggu konsisten",
      body: "7 hari berturut catat makanan. Habit lagi terbentuk — keep going.",
    };
  }
  if (streak === 14) {
    return {
      tone: "sun",
      title: "2 minggu solid",
      body: "Streak 14 hari. Pola kamu udah bisa di-analisis buat insight personal lebih akurat.",
    };
  }
  if (streak === 30) {
    return {
      tone: "sun",
      title: "Sebulan full",
      body: "30 hari berturut. Plan tracking jadi part of life — bukan diet sementara.",
    };
  }

  // === RULE 2: Yesterday over target ===
  if (
    targetKcal &&
    yesterdaySummary.entry_count > 0 &&
    yesterdaySummary.total_kcal > targetKcal * 1.15
  ) {
    const over = yesterdaySummary.total_kcal - targetKcal;
    return {
      tone: "clay",
      title: "Kemarin over",
      body: `+${fmtKcal(over)} kcal di atas target — kondangan atau makan di luar? Plan hari ini di-keep ringan kalo perlu.`,
      cta: { label: "Lihat catatan kemarin", href: "/log" },
    };
  }

  // === RULE 3: Streak broken yesterday ===
  if (
    streak === 0 &&
    todaySummary.entry_count === 0 &&
    yesterdaySummary.entry_count === 0
  ) {
    return {
      tone: "sky",
      title: "Mulai lagi",
      body: "Catat 1 makanan hari ini buat re-build streak. Foto piring lebih cepat dari ngetik manual.",
      cta: { label: "Catat sekarang", href: "/log" },
    };
  }

  // === RULE 4: Weight trend ===
  if (weights.length >= 4) {
    const recent = weights.slice(-7);
    if (recent.length >= 3) {
      const first = recent[0]?.weight_kg ?? 0;
      const last = recent[recent.length - 1]?.weight_kg ?? 0;
      const delta = last - first;
      if (delta <= -0.7) {
        return {
          tone: "forest",
          title: "Trend turun",
          body: `Berat turun ${Math.abs(delta).toFixed(1)} kg dalam ${recent.length} catatan terakhir. Konsisten — jangan agresif amat.`,
        };
      }
      if (delta >= 0.7) {
        return {
          tone: "clay",
          title: "Berat naik",
          body: `+${delta.toFixed(1)} kg minggu ini. Cek lagi consistency makan + frekuensi snack manis.`,
        };
      }
    }
  }

  // === RULE 5: Low protein ===
  if (weekEntries.length >= 10) {
    const days = new Set(weekEntries.map((e) => e.date));
    const totalProtein = weekEntries.reduce(
      (s, e) => s + (e.protein_g ?? 0),
      0,
    );
    const avgProteinPerDay = totalProtein / Math.max(days.size, 1);
    if (avgProteinPerDay < 50) {
      return {
        tone: "clay",
        title: "Protein rendah",
        body: `Rata-rata cuma ${Math.round(avgProteinPerDay)}g/hari minggu ini — di bawah 0.8g per kg BB. Coba tambah telur, tempe, atau ikan.`,
      };
    }
  }

  // === RULE 6: Plan compliance ===
  if (weekEntries.length >= 7) {
    const fromPlan = weekEntries.filter((e) => e.source === "plan").length;
    const ratio = fromPlan / weekEntries.length;
    if (ratio < 0.2 && weekEntries.length > 14) {
      return {
        tone: "sky",
        title: "Plan jarang dipakai",
        body: "Minggu ini cuma <20% dari catatan yang sesuai plan. Plan-nya gak cocok? Re-roll atau edit manual.",
        cta: { label: "Edit plan", href: "/plan" },
      };
    }
  }

  // === RULE 7: No weight in 14 days ===
  if (weights.length > 0) {
    const last = weights[weights.length - 1];
    if (last) {
      const lastDate = new Date(last.date);
      const daysSince = Math.floor(
        (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince >= 14) {
        return {
          tone: "sky",
          title: "Cek berat",
          body: `Catatan terakhir berat ${daysSince} hari lalu. Update biar tracker progres tetep akurat.`,
          cta: { label: "Catat berat", href: "/log" },
        };
      }
    }
  }

  // === RULE 8: Early morning empty ===
  const hour = new Date().getHours();
  if (
    hour >= 10 &&
    hour < 14 &&
    todaySummary.entry_count === 0 &&
    streak >= 1
  ) {
    return {
      tone: "sun",
      title: "Belum sarapan",
      body: "Udah jam lewat dan belum ada catatan. Skip sarapan biasanya pengaruh ke energi siang — ada plan?",
      cta: { label: "Catat", href: "/log" },
    };
  }

  // === Default fallback (only if there's at least some activity) ===
  if (todaySummary.entry_count > 0 || streak > 0) {
    return {
      tone: "forest",
      title: "On track",
      body: `Catatan hari ini ${todaySummary.entry_count} item · streak ${streak}. Konsistensi > intensitas.`,
    };
  }

  return null;
}
