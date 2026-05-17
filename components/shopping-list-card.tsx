"use client";
import { useState, useMemo } from "react";
import { ShoppingBag, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Card, Kicker, Btn } from "@/components/ui";
import { buildShoppingList, fmtPortion } from "@/lib/shopping-list";
import type { StoredMealPlan } from "@/lib/meal-plan";

const STORAGE_KEY = "sehatin:shopping_checked:v1";

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveChecked(set: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}

interface Props {
  plan: StoredMealPlan;
  /** Default collapsed on mobile to save real estate */
  defaultOpen?: boolean;
}

export function ShoppingListCard({ plan, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked());

  const items = useMemo(() => buildShoppingList(plan), [plan]);

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveChecked(next);
      return next;
    });
  };

  const clearChecks = () => {
    setChecked(new Set());
    saveChecked(new Set());
  };

  if (items.length === 0) {
    return null;
  }

  const checkedCount = items.filter((i) => checked.has(i.name.toLowerCase())).length;

  return (
    <Card radius="lg" shadow="paper-1" className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] bg-forest-50 text-forest flex-shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <Kicker>Belanja minggu ini</Kicker>
            <div className="mt-0.5 text-[13.5px] font-bold tabular">
              {items.length} bahan
              {checkedCount > 0 && (
                <span className="text-muted font-normal">
                  {" · "}
                  <span className="tabular">{checkedCount}</span> dicentang
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="flex-shrink-0 text-muted">
          {open ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </span>
      </button>

      {open && (
        <div className="border-t border-hairline px-4 sm:px-5 py-3 sm:py-4">
          <ul className="divide-y divide-hairline">
            {items.map((item) => {
              const key = item.name.toLowerCase();
              const isChecked = checked.has(key);
              return (
                <li key={key}>
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-3 py-2 text-left hover:bg-surface-2/40 rounded-md px-2 -mx-2"
                  >
                    <span
                      className={`w-5 h-5 rounded-[6px] border-2 flex-shrink-0 inline-flex items-center justify-center transition-colors ${
                        isChecked
                          ? "bg-forest border-forest text-paper"
                          : "border-hairline-2"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span
                      className={`flex-1 text-[13px] truncate ${
                        isChecked ? "line-through text-muted" : "text-ink"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="text-[11.5px] text-muted tabular flex-shrink-0">
                      {fmtPortion(item.total_g)}
                      {item.occurrences > 1 && (
                        <span className="text-muted/70">
                          {" · "}
                          {item.occurrences}×
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {checkedCount > 0 && (
            <div className="mt-3 flex justify-end">
              <Btn variant="ghost" size="xs" onClick={clearChecks}>
                Reset centangan
              </Btn>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
