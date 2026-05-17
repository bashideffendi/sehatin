"use client";
import { Camera, Pencil, CheckCircle2 } from "lucide-react";
import { Card, Kicker, Pill } from "@/components/ui";
import { fmtKcal } from "@/lib/format";
import type { FoodLogEntry } from "@/lib/food-log";

interface Props {
  entry: FoodLogEntry;
  onEdit?: () => void;
}

function extractTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—:—";
  }
}

/**
 * Standalone "last AI photo analysis" preview card.
 * Shown on /log when the user has at least one recent photo-source entry.
 */
export function LogRecentPhotoCard({ entry, onEdit }: Props) {
  return (
    <Card radius="lg" shadow="paper-1" className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2">
          <Pill tone="sky" size="sm" icon={<Camera className="w-3 h-3" />}>
            AI Foto
          </Pill>
          <span className="text-[10.5px] text-muted tabular">
            · {extractTime(entry.created_at)}
          </span>
        </div>
        <CheckCircle2 className="w-4 h-4 text-forest" />
      </div>

      <div className="flex items-start gap-3">
        {/* Mini thumbnail — emoji placeholder */}
        <div className="flex-shrink-0 w-16 h-16 rounded-[12px] bg-clay-50 inline-flex items-center justify-center text-3xl">
          🍲
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] tracking-tight truncate">
            {entry.food_name}
          </div>
          <div className="text-[10.5px] text-muted mt-0.5 truncate">
            est. {entry.portion_g}g{entry.notes ? ` · ${entry.notes}` : ""}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            <span
              className="tabular leading-none"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
              }}
            >
              {fmtKcal(entry.kcal)}
              <span className="text-[10px] text-muted ml-0.5">kcal</span>
            </span>
            <div className="text-[10px] text-muted tabular space-x-1.5">
              {entry.protein_g != null && (
                <span>
                  <span className="font-semibold text-ink/70">
                    {Math.round(entry.protein_g)}g
                  </span>
                  P
                </span>
              )}
              {entry.fat_g != null && (
                <span>
                  <span className="font-semibold text-ink/70">
                    {Math.round(entry.fat_g)}g
                  </span>
                  L
                </span>
              )}
              {entry.carb_g != null && (
                <span>
                  <span className="font-semibold text-ink/70">
                    {Math.round(entry.carb_g)}g
                  </span>
                  K
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled
          className="flex-1 py-2 rounded-full bg-forest-50 text-forest font-bold text-[12px] inline-flex items-center justify-center gap-1.5 cursor-default opacity-70"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Tercatat
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-2 rounded-full bg-surface border border-hairline hover:border-hairline-2 text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <Pencil className="w-3 h-3" />
            Edit porsi
          </button>
        )}
      </div>
    </Card>
  );
}
