import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Activity,
  Timer,
  Camera,
  Salad,
  Dumbbell,
  Droplet,
  Flame,
} from "lucide-react";
import { Pill, Btn, Card, Kicker } from "@/components/ui";

export const metadata = {
  title: "Tools · Sehatin",
  description:
    "Kalkulator BMI, TDEE, Macro, IF Timer, dan AI generator untuk pengguna Indonesia.",
};

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <Kicker>Tools</Kicker>
        <h1 className="mt-2 text-4xl sm:text-[52px] font-extrabold tracking-tight leading-[1.05]">
          Kalkulator{" "}
          <span
            className="font-normal italic text-clay"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            & timer.
          </span>
        </h1>
        <p className="mt-3 text-muted text-sm sm:text-base">
          Gratis pakai · gak perlu daftar · bahasa Indonesia.
        </p>
      </div>

      {/* IF Timer feature card */}
      <Card
        radius="xl"
        shadow="paper-2"
        className="paper-grain p-6 sm:p-10 mb-6 sm:mb-8 relative overflow-hidden"
      >
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-10 items-center">
          <div>
            <Pill tone="clay" size="md" icon={<Timer className="w-3 h-3" />}>
              IF Timer
            </Pill>
            <h2 className="mt-3 text-2xl sm:text-[40px] font-extrabold tracking-tight leading-[1.05]">
              7 protokol{" "}
              <span
                className="font-normal italic text-clay"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                intermittent fasting.
              </span>
            </h2>
            <p className="mt-3 text-[13.5px] sm:text-sm text-muted leading-relaxed max-w-md">
              16:8, 18:6, 20:4, OMAD, ADF, 5:2, Warrior. Mode Ramadan
              auto-aktif menyesuaikan sahur–buka. Tracker fase metabolik
              (glikogen, ketosis, autofagi).
            </p>
            <div className="mt-6">
              <Btn variant="clay" size="md" iconRight={<ArrowRight />}>
                <Link href="/tools/if" className="contents">
                  Buka timer
                </Link>
              </Btn>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <TimerPreview />
          </div>
        </div>
      </Card>

      {/* Tools grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          href="/tools/bmi"
          icon={<Activity />}
          title="BMI Asia-Pacific"
          text="Cut-off Kemenkes RI · lingkar pinggang untuk obesitas sentral."
          badge="Gratis"
        />
        <ToolCard
          href="/tools/tdee"
          icon={<Droplet />}
          title="TDEE & BMR"
          text="Mifflin-St Jeor · 5 level aktivitas · target defisit/surplus."
          badge="Gratis"
        />
        <ToolCard
          href="/tools/macro"
          icon={<Calculator />}
          title="Macro split"
          text="12 preset diet — keto, mediterranean, plant-based, balanced."
          badge="Gratis"
        />
        <ToolCard
          icon={<Droplet />}
          title="Hidrasi"
          text="Goal harian berdasar BB & aktivitas. Notifikasi pintar."
          badge="Gratis"
          comingSoon
        />
        <ToolCard
          href="/plan"
          icon={<Salad />}
          title="Meal Plan AI"
          text="AI compose 7 hari · budget warteg · halal default."
          badge="AI"
        />
        <ToolCard
          href="/workout"
          icon={<Dumbbell />}
          title="Workout AI"
          text="6 goal × 5 split · home/gym · progressive overload."
          badge="AI"
        />
        <ToolCard
          href="/log"
          icon={<Camera />}
          title="Foto Analyzer"
          text="Foto piring → AI identifikasi item + estimasi porsi + kalori."
          badge="AI"
        />
        <ToolCard
          icon={<Flame />}
          title="Streak coach"
          text="Insight mingguan dari pola makan + workout. AI personal."
          badge="AI"
          comingSoon
        />
      </div>
    </div>
  );
}

function ToolCard({
  href,
  icon,
  title,
  text,
  badge,
  comingSoon,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  badge: "Gratis" | "AI";
  comingSoon?: boolean;
}) {
  const card = (
    <Card
      lift={!comingSoon}
      radius="md"
      shadow="paper-1"
      className={`p-5 h-full ${comingSoon ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] bg-forest-50 text-forest [&>svg]:w-5 [&>svg]:h-5">
          {icon}
        </div>
        <Pill tone={badge === "AI" ? "clay" : "default"} size="sm">
          {badge}
        </Pill>
      </div>
      <h3 className="font-bold tracking-tight">{title}</h3>
      <p className="mt-1 text-[12.5px] text-muted leading-relaxed">{text}</p>
      {comingSoon ? (
        <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wider text-muted">
          Segera
        </span>
      ) : null}
    </Card>
  );

  if (href && !comingSoon) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}

function TimerPreview() {
  const size = 220;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = 0.77;
  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="if-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-clay)" />
            <stop offset="100%" stopColor="var(--color-sun)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-clay-50)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#if-stroke)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[9px] font-bold uppercase tracking-wider text-clay">
          Fasting
        </div>
        <div
          className="tabular mt-1"
          style={{ fontFamily: "var(--font-serif)", fontSize: 38, lineHeight: 1 }}
        >
          12:22
        </div>
        <div className="mt-2">
          <Pill tone="clay" size="sm">
            Ketosis ringan
          </Pill>
        </div>
      </div>
    </div>
  );
}
