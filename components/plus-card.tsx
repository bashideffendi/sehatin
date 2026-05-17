"use client";
import { Sparkles, Check } from "lucide-react";
import { Card, Btn, Kicker, Pill } from "@/components/ui";

const FEATURES = [
  "Insights mingguan AI personal — pattern, suggestion, peringatan",
  "Re-roll meal plan unlimited (Free: 3x/bulan)",
  "Foto analyzer AI unlimited (Free: 5x/hari)",
  "Cloud sync — pindah HP/laptop seamless",
  "Mode khusus advanced — Ramadan kalender, bulking phase, contest prep",
  "Export PDF mingguan & monthly progress report",
];

export function PlusCard() {
  return (
    <Card surface="ink" radius="xl" shadow="paper-2" className="p-6 sm:p-8 relative overflow-hidden">
      <div className="dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3 mb-2">
          <Pill tone="sun" size="md" icon={<Sparkles className="w-3 h-3" />}>
            Sehatin Plus
          </Pill>
          <div className="text-right">
            <div
              className="tabular text-paper"
              style={{ fontFamily: "var(--font-serif)", fontSize: 28, lineHeight: 1 }}
            >
              Rp29rb
            </div>
            <div className="text-[10px] text-paper/60 uppercase tracking-wider font-bold mt-0.5">
              /bulan
            </div>
          </div>
        </div>
        <h2 className="mt-3 text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight text-paper">
          Plan jalan,{" "}
          <span
            className="font-normal italic text-sun"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            insight makin tajam.
          </span>
        </h2>
        <p className="mt-2 text-[13px] text-paper/75 leading-relaxed max-w-md">
          Upgrade biar AI insight personal mingguan, foto + re-roll unlimited,
          dan cloud sync. Cancel kapan aja.
        </p>
        <ul className="mt-5 space-y-2">
          {FEATURES.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-paper/85">
              <Check className="w-3.5 h-3.5 text-sun flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Btn variant="clay" size="md">
            Upgrade ke Plus
          </Btn>
          <p className="mt-2 text-[10.5px] text-paper/55">
            Coming soon — payment integration belum live. Click untuk waitlist.
          </p>
        </div>
      </div>
    </Card>
  );
}
