"use client";
import { useEffect, useState } from "react";
import { Moon, PartyPopper, Briefcase, Cookie } from "lucide-react";
import { Card, Kicker } from "@/components/ui";
import {
  loadProfile,
  saveProfile,
  type UserProfile,
  type ModeKhusus,
} from "@/lib/profile";

const MODES: {
  value: ModeKhusus;
  label: string;
  desc: string;
  icon: React.ReactNode;
  tone: "sun" | "clay" | "sky" | "forest";
}[] = [
  {
    value: "ramadan",
    label: "Ramadan",
    desc: "Sahur–buka window, workout low-intensity",
    icon: <Moon className="w-4 h-4" />,
    tone: "sun",
  },
  {
    value: "kondangan_recovery",
    label: "Kondangan recovery",
    desc: "Pulih dari over-eating event, plan defisit ringan",
    icon: <PartyPopper className="w-4 h-4" />,
    tone: "clay",
  },
  {
    value: "dinas",
    label: "Dinas",
    desc: "Perjalanan, food choices terbatas (hotel/airport)",
    icon: <Briefcase className="w-4 h-4" />,
    tone: "sky",
  },
  {
    value: "cheat_day",
    label: "Cheat day",
    desc: "Hari ini intentional cheat — plan minim restriction",
    icon: <Cookie className="w-4 h-4" />,
    tone: "forest",
  },
];

export function ModeKhususCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const toggle = (mode: ModeKhusus) => {
    setProfile((cur) => {
      if (!cur) return cur;
      const current = cur.active_modes ?? [];
      const next: ModeKhusus[] = current.includes(mode)
        ? current.filter((m) => m !== mode)
        : [...current, mode];
      const updated: UserProfile = {
        ...cur,
        active_modes: next,
        updated_at: new Date().toISOString(),
      };
      saveProfile(updated);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      return updated;
    });
  };

  if (!profile) return null;

  const active = profile.active_modes ?? [];

  return (
    <Card radius="lg" shadow="paper-1" className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Kicker>Mode khusus</Kicker>
        {savedFlash && (
          <span className="text-[10px] font-semibold text-forest">
            ✓ Tersimpan
          </span>
        )}
      </div>
      <p className="text-[12.5px] text-muted leading-relaxed mb-4">
        Konteks sementara yang nge-adjust generate plan kamu. Multi-select OK
        (e.g. Ramadan + Dinas).
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {MODES.map((m) => {
          const on = active.includes(m.value);
          const toneBg = {
            sun: on ? "bg-sun-50 border-sun text-sun-700" : "border-hairline",
            clay: on ? "bg-clay-50 border-clay text-clay" : "border-hairline",
            sky: on ? "bg-sky-50 border-sky text-sky" : "border-hairline",
            forest: on
              ? "bg-forest-50 border-forest text-forest"
              : "border-hairline",
          }[m.tone];
          return (
            <button
              key={m.value}
              onClick={() => toggle(m.value)}
              className={`text-left p-3 rounded-[14px] border-2 transition-colors ${toneBg}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[13px] inline-flex items-center gap-1.5">
                  {m.icon}
                  {m.label}
                </span>
                <span
                  className={`inline-block w-8 h-4 rounded-full relative transition-colors ${
                    on ? "bg-forest" : "bg-hairline-2"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-paper transition-transform ${
                      on ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </div>
              <div className="text-[11px] text-muted leading-snug">
                {m.desc}
              </div>
            </button>
          );
        })}
      </div>
      {active.length > 0 && (
        <p className="mt-3 text-[11px] text-muted leading-snug">
          <span className="font-semibold text-ink">{active.length} mode aktif</span>{" "}
          — re-generate plan untuk apply.
        </p>
      )}
    </Card>
  );
}
