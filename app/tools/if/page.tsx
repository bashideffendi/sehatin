"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Settings, Droplet } from "lucide-react";
import {
  calculateIFState,
  listIFProtocols,
  type IFProtocol,
  type IFState,
} from "@/src/nutrition/if-timer";
import { Pill, Btn, Card, Kicker } from "@/components/ui";

const PROTOCOL_LIST: IFProtocol[] = ["16:8", "18:6", "20:4", "OMAD"];

const PHASES: {
  id:
    | "fed_state"
    | "post_absorptive"
    | "glycogen_depletion"
    | "ketosis_light"
    | "ketosis_full"
    | "autophagy_active"
    | "extended_fast";
  label: string;
  range: string;
  meaning: string;
}[] = [
  { id: "fed_state", label: "Anabolic", range: "0–4 jam", meaning: "Pencernaan & penyimpanan" },
  { id: "post_absorptive", label: "Glikogen", range: "4–12 jam", meaning: "Pakai cadangan glukosa" },
  { id: "ketosis_light", label: "Ketosis", range: "12–18 jam", meaning: "Mulai bakar lemak" },
  { id: "autophagy_active", label: "Autofagi", range: "18–24 jam", meaning: "Sel daur ulang" },
  { id: "extended_fast", label: "Deep ketosis", range: "24+ jam", meaning: "Produksi keton tinggi" },
];

function activePhaseIdx(elapsedHours: number): number {
  if (elapsedHours < 4) return 0;
  if (elapsedHours < 12) return 1;
  if (elapsedHours < 18) return 2;
  if (elapsedHours < 24) return 3;
  return 4;
}

function fmtClock(d: Date): string {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function fmtElapsed(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.floor((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export default function IFPage() {
  const [protocol, setProtocol] = useState<IFProtocol>("16:8");
  const [startHoursAgo, setStartHoursAgo] = useState("12.37");
  const [now, setNow] = useState(() => new Date());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

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

  const allProtocols = useMemo(() => listIFProtocols(), []);

  if (!state) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  const fastHours = state.protocol_def.fast_hours;
  const eatHours = state.protocol_def.eat_hours;
  const isFasting = state.state === "fasting";
  const elapsed = state.elapsed_h_in_state;
  const targetHours = isFasting ? fastHours : eatHours;
  const phaseIdx = activePhaseIdx(elapsed);
  const eatStart = new Date(state.fast_start.getTime() + fastHours * 60 * 60 * 1000);

  // Phase label for pill
  const phaseLabel = (() => {
    switch (state.current_phase.phase) {
      case "fed_state":
        return "Anabolic";
      case "post_absorptive":
        return "Glikogen";
      case "ketosis_light":
        return "Ketosis ringan";
      case "ketosis_full":
        return "Ketosis penuh";
      case "autophagy_active":
        return "Autofagi";
      case "extended_fast":
        return "Deep ketosis";
      default:
        return state.current_phase.phase.replace(/_/g, " ");
    }
  })();

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/tools"
          className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-ink border border-hairline"
          aria-label="Kembali ke tools"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-bold tracking-tight">IF Timer</h1>
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-ink border border-hairline"
          aria-label="Adjust"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Protocol picker */}
      <div className="mb-6">
        <div className="bg-surface-2 rounded-full p-1 flex">
          {PROTOCOL_LIST.map((p) => {
            const active = protocol === p;
            return (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={`flex-1 py-2 rounded-full text-[12.5px] font-bold transition-all ${
                  active
                    ? "bg-surface text-ink shadow-[var(--shadow-paper-1)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Big circular timer */}
      <div className="mb-6">
        <BigTimer
          elapsed={elapsed}
          totalHours={targetHours}
          isFasting={isFasting}
          phaseLabel={phaseLabel}
        />
      </div>

      {/* 2-col times */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card radius="md" shadow="paper-1" className="p-4">
          <Kicker>Mulai puasa</Kicker>
          <div
            className="tabular mt-1"
            style={{ fontFamily: "var(--font-serif)", fontSize: 28, lineHeight: 1 }}
          >
            {fmtClock(state.fast_start)}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {state.fast_start.toDateString() === now.toDateString()
              ? "hari ini"
              : "kemarin"}
            {" · setelah dinner"}
          </div>
        </Card>
        <Card radius="md" shadow="paper-1" className="p-4">
          <Kicker>Window buka</Kicker>
          <div
            className="tabular mt-1"
            style={{ fontFamily: "var(--font-serif)", fontSize: 28, lineHeight: 1 }}
          >
            {fmtClock(eatStart)}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {state.next_transition_label}
          </div>
        </Card>
      </div>

      {/* Metabolic phases */}
      <Card radius="md" shadow="paper-1" className="p-4 sm:p-5 mb-4">
        <Kicker>Fase metabolik</Kicker>
        <ul className="mt-3 space-y-2.5">
          {PHASES.map((ph, i) => {
            const active = i === phaseIdx;
            return (
              <li key={ph.id} className="flex items-center gap-3 text-[13px]">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    active
                      ? "bg-clay ring-4 ring-clay-50"
                      : i < phaseIdx
                        ? "bg-forest"
                        : "bg-hairline-2"
                  }`}
                />
                <span
                  className={`font-bold ${active ? "text-clay" : i < phaseIdx ? "text-ink" : "text-muted"} min-w-[88px]`}
                >
                  {ph.label}
                </span>
                <span className="text-muted text-[11.5px] tabular min-w-[64px]">
                  {ph.range}
                </span>
                <span className="text-muted text-[11.5px] text-right flex-1 truncate">
                  {ph.meaning}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Notes (collapsed) */}
      {state.notes.length > 0 && (
        <Card radius="md" shadow="paper-1" className="p-4 mb-4 bg-sun-50 border-sun/30">
          <ul className="space-y-1.5 text-[12.5px] text-ink-2 leading-snug">
            {state.notes.slice(0, 2).map((n, i) => (
              <li key={i}>• {n}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Footer actions */}
      <div className="grid grid-cols-[1fr_2fr] gap-3 sticky bottom-24 md:bottom-4">
        <Btn variant="surface" size="lg" icon={<Droplet />}>
          Catat air
        </Btn>
        <Btn variant="clay" size="lg">
          {isFasting ? "Buka window sekarang" : "Mulai puasa"}
        </Btn>
      </div>

      {/* Settings panel — slide-in style */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowSettings(false)}>
          <Card
            radius="xl"
            shadow="paper-3"
            className="w-full sm:max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold tracking-tight text-lg mb-1">
              Atur timer
            </h2>
            <p className="text-[12.5px] text-muted mb-4">
              Set jam terakhir kamu makan biar timer akurat.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Mulai puasa berapa jam yg lalu?
                </label>
                <input
                  type="number"
                  value={startHoursAgo}
                  onChange={(e) => setStartHoursAgo(e.target.value)}
                  step="0.25"
                  min={0}
                  max={72}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-hairline-2 bg-surface focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 tabular text-base font-semibold"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[2, 4, 8, 12, 16].map((h) => (
                  <button
                    key={h}
                    onClick={() => setStartHoursAgo(String(h))}
                    className="px-3 py-1.5 rounded-full border border-hairline text-[11.5px] font-semibold hover:border-forest-300 hover:bg-forest-50"
                  >
                    {h}h lalu
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-2">
                  Protokol
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {allProtocols.map((p) => (
                    <button
                      key={p.protocol}
                      onClick={() => setProtocol(p.protocol)}
                      className={`px-2 py-2 rounded-[10px] border-2 text-[11.5px] font-bold ${
                        protocol === p.protocol
                          ? "border-clay bg-clay-50 text-clay"
                          : "border-hairline hover:border-fg/20"
                      }`}
                    >
                      {p.protocol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Btn variant="primary" size="md" fullWidth onClick={() => setShowSettings(false)}>
                Selesai
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function BigTimer({
  elapsed,
  totalHours,
  isFasting,
  phaseLabel,
}: {
  elapsed: number;
  totalHours: number;
  isFasting: boolean;
  phaseLabel: string;
}) {
  const size = 280;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, elapsed / Math.max(totalHours, 0.01));
  const cx = size / 2;
  const cy = size / 2;
  const elapsedSec = Math.floor((elapsed % 1) * 3600) % 60;

  // Generate tick marks (24 per hour cycle = 24 ticks)
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
    const tickLength = i % 6 === 0 ? 7 : 4;
    const tickWidth = i % 6 === 0 ? 2 : 1;
    const innerR = r - stroke / 2 - 6;
    const outerR = innerR + tickLength;
    return {
      x1: cx + Math.cos(angle) * innerR,
      y1: cy + Math.sin(angle) * innerR,
      x2: cx + Math.cos(angle) * outerR,
      y2: cy + Math.sin(angle) * outerR,
      w: tickWidth,
    };
  });

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="if-big-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-clay)" />
            <stop offset="100%" stopColor="var(--color-sun)" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-clay-50)"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#if-big-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      {/* Ticks layer (not rotated) */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 pointer-events-none"
      >
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--color-clay)"
            strokeWidth={t.w}
            opacity={0.55}
            strokeLinecap="round"
          />
        ))}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <div className="text-[10px] font-bold uppercase tracking-wider text-clay tabular">
          {isFasting ? "Fasting" : "Eating"} ·{" "}
          <span className="tabular">{totalHours.toFixed(0)}:00 jam</span>
        </div>
        <div
          className="tabular mt-1"
          style={{ fontFamily: "var(--font-serif)", fontSize: 56, lineHeight: 1 }}
        >
          {fmtElapsed(elapsed)}
        </div>
        <div className="text-[11px] text-muted mt-1 tabular">
          :{String(elapsedSec).padStart(2, "0")} detik
        </div>
        <div className="mt-3">
          <Pill tone="clay" size="md">
            {phaseLabel}
          </Pill>
        </div>
      </div>
    </div>
  );
}
