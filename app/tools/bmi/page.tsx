"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Activity, ChevronLeft, Info, AlertTriangle } from "lucide-react";
import { calculateBMI, type BmiResult } from "@/src/nutrition/bmi";
import { fmtNum } from "@/lib/utils";

// Asia-Pacific cut-off thresholds buat visual bar
const CUTOFFS = [
  { label: "Kurus", max: 18.5, color: "bg-sky-400" },
  { label: "Normal", max: 23, color: "bg-brand-500" },
  { label: "Gemuk", max: 25, color: "bg-accent-400" },
  { label: "Obesitas 1", max: 30, color: "bg-orange-500" },
  { label: "Obesitas 2", max: 40, color: "bg-rose-600" },
];

const RISK_COLORS: Record<string, string> = {
  low: "bg-brand-500 text-white",
  moderate: "bg-accent-500 text-white",
  high: "bg-orange-500 text-white",
  very_high: "bg-rose-600 text-white",
};

const RISK_LABELS: Record<string, string> = {
  low: "Rendah",
  moderate: "Sedang",
  high: "Tinggi",
  very_high: "Sangat Tinggi",
};

export default function BMIPage() {
  const [weight, setWeight] = useState("75");
  const [height, setHeight] = useState("175");
  const [waist, setWaist] = useState("");
  const [sex, setSex] = useState<"m" | "f">("m");

  const result: BmiResult | null = useMemo(() => {
    const w = Number.parseFloat(weight);
    const h = Number.parseFloat(height);
    if (!w || !h || w < 20 || h < 100) return null;
    return calculateBMI({
      weight_kg: w,
      height_cm: h,
      waist_cm: waist ? Number.parseFloat(waist) : undefined,
      sex,
    });
  }, [weight, height, waist, sex]);

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
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            BMI Calculator
          </h1>
          <p className="mt-1 text-text-muted">
            WHO Asia-Pacific cut-off (Kemenkes RI). Lebih akurat untuk populasi
            Indonesia.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <section className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-5">
            <h2 className="font-semibold tracking-tight">Data tubuh</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Berat" suffix="kg">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={inputCls}
                  step="0.1"
                />
              </Field>

              <Field label="Tinggi" suffix="cm">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={inputCls}
                  step="0.5"
                />
              </Field>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-3">
                Optional — untuk indikator obesitas sentral
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Lingkar pinggang" suffix="cm">
                  <input
                    type="number"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="80-100"
                    className={inputCls}
                    step="0.5"
                  />
                </Field>

                <Field label="Jenis kelamin">
                  <div className="grid grid-cols-2 gap-1 p-1 bg-surface-muted rounded-lg">
                    <SegBtn active={sex === "m"} onClick={() => setSex("m")}>
                      Pria
                    </SegBtn>
                    <SegBtn active={sex === "f"} onClick={() => setSex("f")}>
                      Wanita
                    </SegBtn>
                  </div>
                </Field>
              </div>
              <p className="mt-2 text-xs text-text-muted leading-snug">
                Pria &gt; 90cm atau wanita &gt; 80cm = obesitas sentral, risk
                metabolik naik 1 tier.
              </p>
            </div>
          </div>
        </section>

        {/* Result */}
        <section className="lg:col-span-3">
          {result ? (
            <div className="space-y-4">
              {/* Headline */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/20">
                <div className="text-brand-100 text-sm font-medium">BMI kamu</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-6xl font-bold tabular-nums">
                    {result.bmi}
                  </span>
                  <span className="text-xl text-brand-100">kg/m²</span>
                </div>
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur text-sm font-semibold">
                  {result.bmi_label_id}
                </div>
                {result.category_who !== result.category_asia && (
                  <p className="mt-3 text-xs text-brand-100">
                    Catatan: WHO global kategori beda — Asia-Pacific lebih ketat
                    karena distribusi lemak Asia
                  </p>
                )}
              </div>

              {/* Visual BMI bar */}
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <h3 className="font-semibold tracking-tight mb-4">
                  Posisi BMI (Asia-Pacific scale)
                </h3>
                <BMIScale bmi={result.bmi} />
              </div>

              {/* Risk + Ideal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <div className="text-xs font-semibold text-text-muted tracking-wide uppercase">
                    Risk metabolik
                  </div>
                  <span
                    className={`mt-2 inline-block px-3 py-1.5 rounded-lg text-sm font-bold ${
                      RISK_COLORS[result.health_risk_asia]
                    }`}
                  >
                    {RISK_LABELS[result.health_risk_asia]}
                  </span>
                  <p className="mt-3 text-xs text-text-muted">
                    Berdasarkan BMI + lingkar pinggang (jika ada)
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <div className="text-xs font-semibold text-text-muted tracking-wide uppercase">
                    Ideal weight range
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums">
                      {result.ideal_weight_range_kg.min}-{result.ideal_weight_range_kg.max}
                    </span>
                    <span className="text-sm text-text-muted">kg</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatDelta(result)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {result.notes.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                    <ul className="space-y-2 text-sm text-fg/80">
                      {result.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Disclaimer for high-risk */}
              {(result.health_risk_asia === "high" ||
                result.health_risk_asia === "very_high") && (
                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-fg/80">
                      Kategori ini berisiko untuk komorbid (DM, hipertensi,
                      penyakit jantung). Konsultasi dokter atau ahli gizi
                      sebelum mulai program defisit agresif.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-surface border border-border text-center">
              <Activity className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">
                Masukin berat + tinggi untuk lihat hasil.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatDelta(r: BmiResult): string {
  const { to_min, to_max } = r.weight_delta_kg;
  if (to_min > 0 && to_max > 0) {
    return `${to_min} kg di bawah batas bawah`;
  }
  if (to_min < 0 && to_max < 0) {
    return `${Math.abs(to_max)} kg di atas batas atas ideal`;
  }
  return "✓ Dalam range ideal";
}

function BMIScale({ bmi }: { bmi: number }) {
  const totalMax = 40;
  const pct = Math.min(100, (bmi / totalMax) * 100);

  return (
    <div>
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {CUTOFFS.map((c, i) => {
          const prev = i === 0 ? 0 : CUTOFFS[i - 1].max;
          const width = ((c.max - prev) / totalMax) * 100;
          return (
            <div
              key={i}
              className={c.color}
              style={{ width: `${width}%` }}
              title={`${c.label} (${prev}-${c.max})`}
            />
          );
        })}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-fg rounded-full shadow-md transition-all duration-300"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1 text-[10px] sm:text-xs">
        {CUTOFFS.map((c) => (
          <div key={c.label} className="text-center">
            <div className="font-semibold text-fg/80">{c.label}</div>
            <div className="text-text-muted tabular-nums">
              {c === CUTOFFS[0] ? `<${c.max}` : `<${c.max}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 tabular-nums";

function Field({
  label,
  suffix,
  children,
}: {
  label: string;
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
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active
          ? "bg-surface text-fg shadow-sm"
          : "text-text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
