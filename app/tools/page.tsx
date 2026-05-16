import Link from "next/link";
import {
  Calculator,
  Activity,
  Timer,
  Camera,
  Salad,
  Dumbbell,
  Sparkles,
  PieChart,
  UserPlus,
} from "lucide-react";

export const metadata = {
  title: "Tools · Sehatin",
  description:
    "Semua tools fitness & wellness: TDEE, BMI, IF Timer, Meal Planner, Workout Planner, Foto Analyzer.",
};

interface Tool {
  href?: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: "Gratis" | "AI";
  category: "Nutrisi" | "Fitness" | "Tracking";
  comingSoon?: boolean;
}

const TOOLS: Tool[] = [
  {
    href: "/onboarding",
    icon: <UserPlus />,
    title: "Setup Profil (Quiz)",
    desc: "Quiz interaktif 1 menit — hitung target kalori, macro, dan rekomendasi diet sesuai goal kamu. Disimpan di browser.",
    badge: "Gratis",
    category: "Tracking",
  },
  {
    href: "/tools/tdee",
    icon: <Calculator />,
    title: "TDEE & Macro Calculator",
    desc: "Hitung kebutuhan kalori harian (BMR + activity) + macro split per goal (fat loss, maintain, muscle gain).",
    badge: "Gratis",
    category: "Nutrisi",
  },
  {
    href: "/tools/macro",
    icon: <PieChart />,
    title: "Macronutrient Calculator",
    desc: "Hitung gram protein/lemak/karbo dari target kalori, atau sebaliknya. 7 preset (seimbang, fat loss, keto, dll) + custom %.",
    badge: "Gratis",
    category: "Nutrisi",
  },
  {
    href: "/tools/bmi",
    icon: <Activity />,
    title: "BMI Asia-Pacific",
    desc: "BMI dengan cut-off WHO Asia-Pacific (Kemenkes RI default). Lingkar pinggang untuk indikator obesitas sentral.",
    badge: "Gratis",
    category: "Tracking",
  },
  {
    href: "/tools/if",
    icon: <Timer />,
    title: "Intermittent Fasting Timer",
    desc: "7 protokol (16:8, 18:6, 20:4, OMAD, 5:2, Eat-Stop-Eat, Ramadan). Track elapsed time + metabolic phase real-time.",
    badge: "Gratis",
    category: "Tracking",
  },
  {
    icon: <Salad />,
    title: "Meal Plan Generator",
    desc: "Plan harian/mingguan dengan 12 diet method (keto, mediterranean, DASH, plant-based, low-purine, dll). Budget-aware pakai harga PIHPS.",
    badge: "AI",
    category: "Nutrisi",
    comingSoon: true,
  },
  {
    icon: <Dumbbell />,
    title: "Workout Plan Generator",
    desc: "Program latihan 6 goal (strength, hypertrophy, fat loss, dll) × 5 split (full body, upper/lower, PPL). 60+ exercise database.",
    badge: "AI",
    category: "Fitness",
    comingSoon: true,
  },
  {
    icon: <Camera />,
    title: "Foto → Kalori Analyzer",
    desc: "Foto makanan kamu, AI identifikasi item + estimasi porsi + hitung kalori & macro. Grounded ke 1,146 item TKPI.",
    badge: "AI",
    category: "Nutrisi",
    comingSoon: true,
  },
];

const categories = ["Nutrisi", "Fitness", "Tracking"] as const;

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
          <Sparkles className="w-3.5 h-3.5" />
          6 tools
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          Semua tools yang kamu butuhin
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          3 tools gratis bisa langsung dipakai. 3 tools AI-powered butuh API
          key Claude (segera bisa diakses).
        </p>
      </div>

      {/* Grid grouped by category */}
      <div className="mt-12 space-y-12">
        {categories.map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat);
          return (
            <div key={cat}>
              <div className="flex items-baseline gap-3 mb-5">
                <h2 className="text-xl font-bold tracking-tight">{cat}</h2>
                <span className="text-xs text-text-muted">
                  {tools.length} tool
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool, idx) => (
                  <ToolCard key={idx} tool={tool} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const inner = (
    <div
      className={`relative p-6 rounded-2xl bg-surface border border-border h-full flex flex-col ${
        tool.comingSoon
          ? "opacity-60"
          : "hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5"
      } transition-all`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 [&>svg]:w-5 [&>svg]:h-5">
          {tool.icon}
        </div>
        <span
          className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
            tool.badge === "AI"
              ? "bg-accent-100 text-accent-700"
              : "bg-brand-100 text-brand-700"
          }`}
        >
          {tool.badge}
        </span>
      </div>
      <h3 className="font-semibold tracking-tight text-lg">{tool.title}</h3>
      <p className="mt-2 text-sm text-text-muted leading-relaxed flex-1">
        {tool.desc}
      </p>
      {tool.comingSoon && (
        <span className="mt-4 text-xs font-semibold text-text-muted">
          🔜 Segera tersedia
        </span>
      )}
      {!tool.comingSoon && (
        <span className="mt-4 text-sm font-semibold text-brand-600 inline-flex items-center gap-1">
          Coba →
        </span>
      )}
    </div>
  );

  if (tool.href && !tool.comingSoon) {
    return (
      <Link href={tool.href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
