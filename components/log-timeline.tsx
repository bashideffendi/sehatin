"use client";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { Pill, Btn, Card, Kicker } from "@/components/ui";
import { fmtKcal } from "@/lib/format";
import {
  MEAL_SLOT_EMOJI,
  type FoodLogEntry,
  type MealSlot,
} from "@/lib/food-log";
import type { MealItem } from "@/lib/meal-plan";

interface TimelineEntry {
  id: string;
  time: string;
  emoji?: string;
  name: string;
  subtitle: string;
  kcal: number;
  protein?: number;
  fat?: number;
  carb?: number;
  source: FoodLogEntry["source"];
  rupiah?: string;
  isPlanned?: boolean;
  onDelete?: () => void;
  onLogPlanned?: () => void;
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

function sourceLabel(source: FoodLogEntry["source"]): string {
  switch (source) {
    case "photo":
      return "AI foto";
    case "search":
      return "TKPI";
    case "manual":
      return "manual";
    case "plan":
      return "plan";
    default:
      return source;
  }
}

interface TimelineProps {
  entries: FoodLogEntry[];
  unloggedPlanned?: { slot: MealSlot; item: MealItem }[];
  onDelete: (id: string) => void;
  onLogPlanned?: (slot: MealSlot, item: MealItem) => void;
  onAddManual?: () => void;
}

export function LogTimeline({
  entries,
  unloggedPlanned = [],
  onDelete,
  onLogPlanned,
  onAddManual,
}: TimelineProps) {
  // Sort entries by created_at ascending (oldest first → timeline top to bottom)
  const sorted = [...entries].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const totalKcal = sorted.reduce((s, e) => s + e.kcal, 0);

  return (
    <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <Kicker>Timeline hari ini</Kicker>
          <div className="mt-1 text-[12.5px] text-muted">
            <span className="tabular font-bold text-ink">
              {sorted.length}
            </span>{" "}
            catatan
            {unloggedPlanned.length > 0 && (
              <>
                {" · "}
                <span className="tabular text-clay font-semibold">
                  {unloggedPlanned.length}
                </span>{" "}
                planned
              </>
            )}
          </div>
        </div>
        {onAddManual && (
          <Btn variant="ghost" size="xs" icon={<Plus className="w-3 h-3" />}>
            <button onClick={onAddManual} className="contents">
              Catat manual
            </button>
          </Btn>
        )}
      </div>

      {sorted.length === 0 && unloggedPlanned.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-muted">
          Belum ada catatan hari ini.
          <br />
          Pakai quick action di kiri buat mulai.
        </div>
      ) : (
        <ol className="relative">
          {/* Vertical dotted line */}
          <div
            className="absolute left-[34px] top-2 bottom-2 border-l-2 border-dashed border-hairline-2 pointer-events-none"
            aria-hidden
          />
          {sorted.map((entry) => (
            <TimelineRow
              key={entry.id}
              time={extractTime(entry.created_at)}
              emoji={MEAL_SLOT_EMOJI[entry.meal_slot]}
              name={entry.food_name}
              subtitle={`${entry.portion_g}g · ${sourceLabel(entry.source)}${entry.notes ? ` · ${entry.notes}` : ""}`}
              kcal={entry.kcal}
              protein={entry.protein_g}
              fat={entry.fat_g}
              carb={entry.carb_g}
              source={entry.source}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
          {/* Unlogged planned items at the bottom */}
          {unloggedPlanned.map(({ slot, item }, i) => (
            <TimelineRow
              key={`planned-${i}-${item.food_code}`}
              time=""
              emoji={MEAL_SLOT_EMOJI[slot]}
              name={item.food_name}
              subtitle={`${item.portion_g}g · plan · tap untuk catat`}
              kcal={item.kcal}
              isPlanned
              onLogPlanned={() => onLogPlanned?.(slot, item)}
            />
          ))}
        </ol>
      )}

      {sorted.length > 0 && (
        <div className="mt-4 pt-4 border-t border-hairline flex items-baseline justify-between">
          <Kicker>Total hari</Kicker>
          <div>
            <span
              className="tabular"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 26,
                lineHeight: 1,
              }}
            >
              {fmtKcal(totalKcal)}
            </span>{" "}
            <span className="text-[11px] text-muted">kcal</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function TimelineRow({
  time,
  emoji,
  name,
  subtitle,
  kcal,
  protein,
  fat,
  carb,
  source,
  isPlanned,
  onDelete,
  onLogPlanned,
}: {
  time: string;
  emoji?: string;
  name: string;
  subtitle: string;
  kcal: number;
  protein?: number;
  fat?: number;
  carb?: number;
  source?: FoodLogEntry["source"];
  isPlanned?: boolean;
  onDelete?: () => void;
  onLogPlanned?: () => void;
}) {
  return (
    <li className="relative pl-[68px] pr-1 py-2 group">
      {/* Time label */}
      <span className="absolute left-0 top-3 text-[11px] font-bold tabular text-muted w-[30px] text-right">
        {time || "—"}
      </span>
      {/* Dot anchor on the line */}
      <span
        className={`absolute left-[30px] top-3.5 w-2 h-2 rounded-full ring-4 ring-paper ${
          isPlanned
            ? "bg-clay"
            : source === "photo"
              ? "bg-sky"
              : "bg-forest"
        }`}
        aria-hidden
      />
      {/* Card */}
      <div
        className={`flex items-center gap-3 rounded-[14px] border px-3 py-2.5 transition-colors ${
          isPlanned
            ? "bg-clay-50/60 border-clay/30 border-dashed"
            : "bg-surface border-hairline hover:border-hairline-2"
        }`}
      >
        <span className="text-xl flex-shrink-0">{emoji ?? "🍽️"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-[13.5px] truncate">{name}</span>
            {source === "photo" && (
              <Pill tone="sky" size="sm">
                AI
              </Pill>
            )}
          </div>
          <div className="text-[10.5px] text-muted truncate">{subtitle}</div>
          {(protein != null || fat != null || carb != null) && (
            <div className="text-[10px] text-muted/85 mt-0.5 tabular">
              {protein != null && (
                <span>
                  <span className="font-semibold text-ink/70">{protein}g</span>P
                </span>
              )}
              {fat != null && (
                <span className="ml-2">
                  <span className="font-semibold text-ink/70">{fat}g</span>L
                </span>
              )}
              {carb != null && (
                <span className="ml-2">
                  <span className="font-semibold text-ink/70">{carb}g</span>K
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div
            className="tabular font-bold text-[14px]"
            style={isPlanned ? { color: "var(--color-muted)" } : undefined}
          >
            {fmtKcal(kcal)}{" "}
            <span className="text-[10px] text-muted font-medium">kcal</span>
          </div>
        </div>
        {isPlanned && onLogPlanned ? (
          <button
            onClick={onLogPlanned}
            className="ml-2 px-2.5 py-1 rounded-md bg-clay text-paper text-[10px] font-bold inline-flex items-center gap-1 hover:bg-clay-700 flex-shrink-0"
          >
            <Plus className="w-3 h-3" /> Catat
          </button>
        ) : onDelete ? (
          <button
            onClick={() => {
              if (confirm(`Hapus "${name}"?`)) onDelete();
            }}
            className="ml-1 w-7 h-7 rounded-md text-muted hover:text-rose hover:bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            aria-label="Hapus"
            title="Hapus catatan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    </li>
  );
}
