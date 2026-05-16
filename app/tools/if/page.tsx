"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Timer,
  ChevronLeft,
  Info,
  Utensils,
  Moon,
  Zap,
  TrendingUp,
} from "lucide-react";
import {
  calculateIFState,
  listIFProtocols,
  type IFProtocol,
  type IFState,
} from "@/src/nutrition/if-timer";

const PROTOCOL_ICONS: Record<IFProtocol, string> = {
  "16:8": "🌅",
  "18:6": "⏰",
  "20:4": "⚔️",
  OMAD: "🍽️",
  "5:2": "📅",
  EatStopEat: "🛑",
  Ramadan: "🌙",
};

export default function IFPage() {
  const [protocol, setProtocol] = useState<IFProtocol>("16:8");
  const [startHoursAgo, setStartHoursAgo] = useState("4");
  const [now, setNow] = useState(() => new Date());

  // Live update every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const protocols = useMemo(() => listIFProtocols(), []);

  const state: IFState | null = useMemo(() => {
    const hoursAgo = Number.parseFloat(startHoursAgo);
    if (!Number.isFinite(hoursAgo) || hoursAgo < 0) return null;
    const fastStart = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    try {
      return calculateIFState(fastStart, protocol, now);
    } catch {
      return null;
    }
  }, [protocol, startHoursAgo, now]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/tools"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-fg mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Semua tools
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600">
          <Timer className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Intermittent Fasting Timer
          </h1>
          <p className="mt-1 text-text-muted">
            7 protokol + metabolic phase tracker real-time.
          </p>
        </div>
      </div>

      {/* Protocol selector */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-text-muted mb-3">
          Pilih protokol
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {protocols.map((p) => {
            const active = protocol === p.protocol;
            return (
              <button
                key={p.protocol}
                onClick={() => setProtocol(p.protocol)}
                className={`p-3 rounded-xl text-left border-2 transition-all ${
                  active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-border bg-surface hover:border-fg/20"
                }`}
              >
                <div className="text-xl mb-1">{PROTOCOL_ICONS[p.protocol]}</div>
                <div className="font-bold text-sm">{p.protocol}</div>
                {p.fast_hours > 0 && (
                  <div className="text-[10px] text-text-muted">
                    {p.fast_hours}h fast
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <section className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-5">
            <h2 className="font-semibold tracking-tight">Setup</h2>

            <Field
              label="Mulai puasa berapa jam yang lalu?"
              hint="Hitung dari waktu makanan terakhir kamu (last meal)"
              suffix="jam"
            >
              <input
                type="number"
                value={startHoursAgo}
                onChange={(e) => setStartHoursAgo(e.target.value)}
                className={inputCls}
                step="0.25"
                min={0}
                max={72}
              />
            </Field>

            {/* Quick presets */}
            <div>
              <p className="text-xs text-text-muted mb-2">Preset cepat:</p>
              <div className="flex flex-wrap gap-2">
                {[2, 4, 8, 12, 16].map((h) => (
                  <button
                    key={h}
                    onClick={() => setStartHoursAgo(String(h))}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {state && (
              <div className="pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Mulai puasa:</span>
                  <span className="font-medium tabular-nums">
                    {state.fast_start.toLocaleString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Sekarang:</span>
                  <span className="font-medium tabular-nums">
                    {state.now.toLocaleString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-muted leading-relaxed">
                <strong className="text-fg/80">Protokol terpilih:</strong>{" "}
                {protocols.find((p) => p.protocol === protocol)?.description_id}
              </p>
            </div>
          </div>
        </section>

        {/* Live state */}
        <section className="lg:col-span-3">
          {state ? (
            <div className="space-y-4">
              {/* Big visual: ring progress */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/20">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 mb-2 text-brand-100 text-sm font-medium">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        state.state === "fasting"
                          ? "bg-white pulse-soft"
                          : "bg-accent-300 pulse-soft"
                      }`}
                    />
                    {state.state === "fasting" ? "🔵 FASTING" : "🟢 EATING WINDOW"}
                  </div>

                  <RingProgress
                    elapsed={state.elapsed_h_in_state}
                    total={
                      state.state === "fasting"
                        ? state.protocol_def.fast_hours
                        : state.protocol_def.eat_hours
                    }
                  />

                  <div className="mt-4 text-sm text-brand-100">
                    {state.next_transition_label}
                  </div>
                </div>
              </div>

              {/* Metabolic phase card */}
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex items-start gap-3">
                  <PhaseIcon phase={state.current_phase.phase} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-xs font-semibold text-text-muted tracking-wide uppercase">
                        Metabolic phase
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                        {state.current_phase.phase.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">
                      {state.current_phase.description_id}
                    </p>
                    {state.next_phase && state.hours_to_next_phase !== null && (
                      <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted">
                        <strong className="text-fg/80">Next phase:</strong>{" "}
                        {state.next_phase.phase.replace(/_/g, " ")} dalam{" "}
                        <span className="tabular-nums font-semibold text-fg">
                          {formatHours(state.hours_to_next_phase)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {state.notes.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                    <ul className="space-y-2 text-sm text-fg/80">
                      {state.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-surface border border-border text-center">
              <Timer className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">Setup protokol untuk mulai.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ============ Components ============

function RingProgress({ elapsed, total }: { elapsed: number; total: number }) {
  const safe = total > 0 ? total : 1;
  const pct = Math.min(100, (elapsed / safe) * 100);
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="white"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold tabular-nums">
          {formatHoursShort(elapsed)}
        </div>
        <div className="text-xs text-brand-100 mt-1">
          dari {total}h target
        </div>
        <div className="text-xs font-bold mt-2 tabular-nums">
          {pct.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

function PhaseIcon({ phase }: { phase: string }) {
  const map: Record<string, React.ReactNode> = {
    fed_state: <Utensils className="w-6 h-6 text-accent-500" />,
    post_absorptive: <Utensils className="w-6 h-6 text-amber-500" />,
    glycogen_depletion: <Zap className="w-6 h-6 text-orange-500" />,
    ketosis_light: <Zap className="w-6 h-6 text-rose-500" />,
    ketosis_full: <Zap className="w-6 h-6 text-rose-600" />,
    autophagy_active: <TrendingUp className="w-6 h-6 text-brand-600" />,
    extended_fast: <Moon className="w-6 h-6 text-fg" />,
  };
  return (
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-muted flex-shrink-0">
      {map[phase] ?? <Timer className="w-6 h-6 text-text-muted" />}
    </div>
  );
}

function formatHours(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours}h ${mins}m`;
}

function formatHoursShort(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  const mm = String(mins).padStart(2, "0");
  return `${hours}:${mm}`;
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 tabular-nums";

function Field({
  label,
  hint,
  suffix,
  children,
}: {
  label: string;
  hint?: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium mb-1.5">
        <span>{label}</span>
        {suffix && <span className="text-xs text-text-muted">{suffix}</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-text-muted leading-snug">{hint}</p>
      )}
    </div>
  );
}
