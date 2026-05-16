/**
 * Intermittent Fasting timer & metabolic state tracker.
 *
 * Protocols supported:
 *   - 16:8  (Leangains)        — fast 16h, eat 8h. Most common.
 *   - 18:6                     — fast 18h, eat 6h. Stricter.
 *   - 20:4  (Warrior)          — fast 20h, eat 4h. Aggressive.
 *   - OMAD  (One Meal A Day)   — 23h fast, 1h eating.
 *   - 5:2                      — 5 normal days + 2 days @ 500-600 kcal.
 *   - EatStopEat               — 24h full fast 1-2x/week.
 *   - Ramadan                  — variable, default ~14-16h fast Maghrib→Subuh.
 *
 * Metabolic phase estimasi based on hours fasted (rough generalisation,
 * varies per individual fitness/metabolism). Source: physiology textbook
 * + various IF research (Cabo, Mattson 2019; Longo lab work).
 */

export type IFProtocol =
  | "16:8"
  | "18:6"
  | "20:4"
  | "OMAD"
  | "5:2"
  | "EatStopEat"
  | "Ramadan";

export interface IFProtocolDef {
  fast_hours: number;
  eat_hours: number;
  description_id: string;
}

const PROTOCOLS: Record<IFProtocol, IFProtocolDef> = {
  "16:8": {
    fast_hours: 16,
    eat_hours: 8,
    description_id: "Fast 16 jam, eating window 8 jam (paling umum, e.g., 12.00-20.00).",
  },
  "18:6": {
    fast_hours: 18,
    eat_hours: 6,
    description_id: "Fast 18 jam, eating window 6 jam (lebih strict dari 16:8).",
  },
  "20:4": {
    fast_hours: 20,
    eat_hours: 4,
    description_id: "Warrior diet — fast 20 jam, eating window 4 jam.",
  },
  OMAD: {
    fast_hours: 23,
    eat_hours: 1,
    description_id: "One Meal A Day — 23 jam fast, 1 jam eating. 1 meal besar.",
  },
  "5:2": {
    fast_hours: 0, // tidak time-based, calorie-based
    eat_hours: 24,
    description_id: "5 hari makan normal + 2 hari hanya 500-600 kcal (wanita) / 600-800 (pria). Tidak time-based.",
  },
  EatStopEat: {
    fast_hours: 24,
    eat_hours: 0,
    description_id: "Full 24-jam fast, 1-2x per minggu, lalu hari biasa makan normal.",
  },
  Ramadan: {
    fast_hours: 14, // varies, ~13-16h depending on equator/region
    eat_hours: 10,
    description_id: "Puasa Ramadan — dari Subuh sampai Maghrib (Indonesia ~13-14 jam fast). Buka + sahur dalam window.",
  },
};

export interface MetabolicPhase {
  phase: string;
  description_id: string;
  starts_at_h: number;
}

const PHASES: MetabolicPhase[] = [
  {
    phase: "fed_state",
    description_id:
      "Fed state — proses pencernaan + insulin tinggi + glikogen reload. Tubuh pakai glukosa dari makanan.",
    starts_at_h: 0,
  },
  {
    phase: "post_absorptive",
    description_id:
      "Post-absorptive — insulin turun, hati mulai release glikogen jadi glukosa.",
    starts_at_h: 4,
  },
  {
    phase: "glycogen_depletion",
    description_id:
      "Glikogen mulai depleted, switch ke lipolysis (lemak jadi asam lemak bebas).",
    starts_at_h: 12,
  },
  {
    phase: "ketosis_light",
    description_id:
      "Ketosis ringan — keton mulai diproduksi hati dari asam lemak. Brain fuel transition.",
    starts_at_h: 16,
  },
  {
    phase: "ketosis_full",
    description_id:
      "Ketosis penuh — sebagian besar energi dari keton. Growth hormone naik. Insulin sensitivity meningkat.",
    starts_at_h: 24,
  },
  {
    phase: "autophagy_active",
    description_id:
      "Autophagy peak — sel mulai recycle protein rusak / organel. Riset (Mizushima dkk) suggest health span benefits.",
    starts_at_h: 36,
  },
  {
    phase: "extended_fast",
    description_id:
      "Extended fast — risk muscle wasting bertambah. Konsultasi profesional jika rutin > 48 jam.",
    starts_at_h: 48,
  },
];

function getPhase(elapsed_h: number): MetabolicPhase {
  let current = PHASES[0];
  for (const p of PHASES) {
    if (elapsed_h >= p.starts_at_h) current = p;
  }
  return current;
}

function nextPhase(elapsed_h: number): MetabolicPhase | null {
  for (const p of PHASES) {
    if (elapsed_h < p.starts_at_h) return p;
  }
  return null;
}

export interface IFState {
  protocol: IFProtocol;
  protocol_def: IFProtocolDef;
  fast_start: Date;
  now: Date;
  state: "fasting" | "eating";
  elapsed_h_in_state: number;
  remaining_h_in_state: number;
  next_transition: Date;
  next_transition_label: string;
  current_phase: MetabolicPhase;
  next_phase: MetabolicPhase | null;
  hours_to_next_phase: number | null;
  notes: string[];
}

/**
 * Compute current IF state.
 *
 * @param fastStart - When fast started (last meal time).
 * @param protocol  - Protocol selected.
 * @param now       - "Current" time, default = system now.
 */
export function calculateIFState(
  fastStart: Date,
  protocol: IFProtocol,
  now: Date = new Date(),
): IFState {
  const def = PROTOCOLS[protocol];
  const elapsedMs = now.getTime() - fastStart.getTime();
  const elapsedH = elapsedMs / (1000 * 60 * 60);

  const fastTotal = def.fast_hours;
  const eatTotal = def.eat_hours;
  const cycleTotal = fastTotal + eatTotal;

  // Position within current cycle (handle multi-day if needed)
  const cyclePos = elapsedH % cycleTotal;

  let state: "fasting" | "eating";
  let elapsed_in_state: number;
  let remaining_in_state: number;
  let next_transition: Date;
  let next_transition_label: string;

  if (cyclePos < fastTotal) {
    state = "fasting";
    elapsed_in_state = cyclePos;
    remaining_in_state = fastTotal - cyclePos;
    next_transition = new Date(now.getTime() + remaining_in_state * 60 * 60 * 1000);
    next_transition_label = `Eating window mulai dalam ${remaining_in_state.toFixed(1)}h`;
  } else {
    state = "eating";
    elapsed_in_state = cyclePos - fastTotal;
    remaining_in_state = eatTotal - elapsed_in_state;
    next_transition = new Date(now.getTime() + remaining_in_state * 60 * 60 * 1000);
    next_transition_label = `Fasting mulai dalam ${remaining_in_state.toFixed(1)}h`;
  }

  // Metabolic phase based on total elapsed fast
  // For fasting state: elapsed_in_state hours.
  // For eating state: 0 (post-prandial).
  const fastingHours = state === "fasting" ? elapsed_in_state : 0;
  const current_phase = getPhase(fastingHours);
  const next_phase = nextPhase(fastingHours);
  const hours_to_next_phase = next_phase
    ? Math.max(0, next_phase.starts_at_h - fastingHours)
    : null;

  const notes: string[] = [];

  if (state === "fasting" && fastingHours > 16 && protocol === "16:8") {
    notes.push(
      "Sudah melewati target 16h — bisa buka window atau extend ke 18:6 hari ini.",
    );
  }
  if (state === "fasting" && fastingHours > 24 && protocol !== "EatStopEat") {
    notes.push(
      "Sudah lebih dari 24h fasting — pastikan elektrolit (garam, K, Mg) cukup. Pertimbangkan buka jika belum biasa.",
    );
  }
  if (state === "eating" && eatTotal < 4) {
    notes.push(
      `Eating window ${eatTotal}h sempit — bagi minimal 2 meal dengan protein + sayur, hindari binge.`,
    );
  }
  if (protocol === "Ramadan" && state === "eating" && elapsed_in_state < 1) {
    notes.push(
      "Buka puasa — start dengan kurma + air + sup ringan, makan utama setelah maghrib supaya lambung tidak shock.",
    );
  }

  return {
    protocol,
    protocol_def: def,
    fast_start: fastStart,
    now,
    state,
    elapsed_h_in_state: Math.round(elapsed_in_state * 100) / 100,
    remaining_h_in_state: Math.round(remaining_in_state * 100) / 100,
    next_transition,
    next_transition_label,
    current_phase,
    next_phase,
    hours_to_next_phase: hours_to_next_phase !== null
      ? Math.round(hours_to_next_phase * 100) / 100
      : null,
    notes,
  };
}

export function listIFProtocols(): Array<{
  protocol: IFProtocol;
  fast_hours: number;
  eat_hours: number;
  description_id: string;
}> {
  return (Object.entries(PROTOCOLS) as Array<[IFProtocol, IFProtocolDef]>).map(
    ([p, def]) => ({
      protocol: p,
      fast_hours: def.fast_hours,
      eat_hours: def.eat_hours,
      description_id: def.description_id,
    }),
  );
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtDuration(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours}h ${mins}m`;
}

export function formatIFState(s: IFState): string {
  const lines: string[] = [];
  lines.push(`Protocol:     ${s.protocol}  (${s.protocol_def.description_id})`);
  lines.push(`Fast started: ${s.fast_start.toLocaleString("id-ID")}`);
  lines.push(`Now:          ${s.now.toLocaleString("id-ID")}`);
  lines.push("");
  lines.push(`State:        ${s.state === "fasting" ? "🔵 FASTING" : "🟢 EATING WINDOW"}`);
  lines.push(`  Elapsed:    ${fmtDuration(s.elapsed_h_in_state)} ${s.state === "fasting" ? `(target ${s.protocol_def.fast_hours}h)` : `(window ${s.protocol_def.eat_hours}h)`}`);
  lines.push(`  Remaining:  ${fmtDuration(s.remaining_h_in_state)}`);
  lines.push(`  ${s.next_transition_label} di ${fmtTime(s.next_transition)}`);
  lines.push("");
  lines.push(`Metabolic phase: ${s.current_phase.phase}`);
  lines.push(`  ${s.current_phase.description_id}`);
  if (s.next_phase && s.hours_to_next_phase !== null) {
    lines.push(
      `  Next: ${s.next_phase.phase} dalam ${fmtDuration(s.hours_to_next_phase)}`,
    );
  }
  if (s.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");
    for (const n of s.notes) lines.push(`  - ${n}`);
  }
  return lines.join("\n");
}
