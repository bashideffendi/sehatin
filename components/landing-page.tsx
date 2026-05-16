import Link from "next/link";
import {
  Calculator,
  Activity,
  Timer,
  Camera,
  Salad,
  Dumbbell,
  Sparkles,
  TrendingUp,
  Wallet,
  CookingPot,
} from "lucide-react";

export function LandingPage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden gradient-mesh">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold tracking-wide border border-brand-200">
              <Sparkles className="w-3.5 h-3.5" />
              Fitness & wellness untuk Indonesia
            </span>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Sehat itu{" "}
              <span className="bg-gradient-to-br from-brand-500 to-brand-700 bg-clip-text text-transparent">
                gampang
              </span>{" "}
              dan{" "}
              <span className="bg-gradient-to-br from-accent-400 to-accent-600 bg-clip-text text-transparent">
                fun
              </span>
              .
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl leading-relaxed">
              Meal plan budget-aware pakai harga pasar real, workout sesuai
              equipment dan goal kamu, BMI dengan cut-off Asia-Pacific, IF
              timer dengan metabolic phase. Semua dalam bahasa Indonesia.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5 transition-all"
              >
                Mulai Quiz 1 menit
                <TrendingUp className="w-4 h-4" />
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-fg/10 hover:border-brand-300 hover:bg-brand-50/50 font-semibold transition-all"
              >
                Lihat tools
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                1,146 makanan TKPI Kemenkes
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                Harga real 33 provinsi (PIHPS BI)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                60+ exercise database
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VALUE PROPS ============ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Kenapa Sehatin beda?
            </h2>
            <p className="mt-4 text-lg text-text-muted">
              Kompetitor (MyFitnessPal, Fitatu, dll) generic banget buat
              makanan Indonesia. Sehatin native ID.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <ValuePropCard
              icon={<Wallet className="w-6 h-6" />}
              accent="brand"
              title="Budget-aware"
              text="Input budget makan kamu (Rp 30k/hari? 60k? 100k?). Meal plan adjust pakai harga pasar real 33 provinsi."
            />
            <ValuePropCard
              icon={<CookingPot className="w-6 h-6" />}
              accent="accent"
              title="Makanan Indonesia"
              text="Rendang, nasi padang, gado-gado, soto. Komposisi gizi sesuai TKPI Kemenkes, bukan database asing yang ngarang."
            />
            <ValuePropCard
              icon={<Camera className="w-6 h-6" />}
              accent="sky"
              title="Foto = kalori"
              text="Foto piring kamu, AI identifikasi item + estimasi porsi + hitung kalori. Buat makanan rumah/warteg yang gak ada di database."
            />
          </div>
        </div>
      </section>

      {/* ============ TOOLS SHOWCASE ============ */}
      <section className="bg-surface-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Tools yang bisa kamu pakai
              </h2>
              <p className="mt-3 text-text-muted">
                Dari kalkulator deterministic sampai AI-powered planner.
              </p>
            </div>
            <Link
              href="/tools"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              Lihat semua →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolMini
              href="/tools/tdee"
              icon={<Calculator />}
              title="TDEE & Macro"
              text="Hitung kalori harian + macro split pakai Mifflin-St Jeor."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/macro"
              icon={<Calculator />}
              title="Macro Calculator"
              text="Konversi kalori ↔ gram makro. 7 preset diet siap pakai."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/bmi"
              icon={<Activity />}
              title="BMI Asia-Pacific"
              text="Cut-off Kemenkes RI. Lingkar pinggang untuk obesitas sentral."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/if"
              icon={<Timer />}
              title="IF Timer"
              text="7 protokol (16:8, OMAD, Ramadan...) + metabolic phase tracker."
              badge="Gratis"
            />
            <ToolMini
              href="/plan"
              icon={<Salad />}
              title="Meal Plan"
              text="12 diet method (keto, mediterranean, DASH, plant-based) + budget."
              badge="AI"
            />
            <ToolMini
              href="/workout"
              icon={<Dumbbell />}
              title="Workout Plan"
              text="6 goal × 5 split + progressive overload. Equipment-aware."
              badge="AI"
            />
            <ToolMini
              href="/log"
              icon={<Camera />}
              title="Foto Analyzer"
              text="Foto makanan → identifikasi + kalori + macro grounded TKPI."
              badge="AI"
            />
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Siap mulai?
          </h2>
          <p className="mt-4 text-lg text-text-muted">
            Setup profil 1 menit, AI bikin meal plan + workout pertama kamu.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
          >
            Mulai Quiz 1 menit
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function ValuePropCard({
  icon,
  title,
  text,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: "brand" | "accent" | "sky";
}) {
  const accentMap = {
    brand: "from-brand-500/15 to-brand-500/5 text-brand-600 ring-brand-200",
    accent:
      "from-accent-500/15 to-accent-500/5 text-accent-600 ring-accent-200",
    sky: "from-sky-500/15 to-sky-500/5 text-sky-600 ring-sky-200",
  } as const;

  return (
    <div className="relative p-6 rounded-2xl bg-surface border border-border hover:border-fg/15 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ring-1 ${accentMap[accent]}`}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-text-muted leading-relaxed">{text}</p>
    </div>
  );
}

function ToolMini({
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
  const content = (
    <div
      className={`relative p-5 rounded-2xl bg-surface border border-border h-full ${
        comingSoon
          ? "opacity-70"
          : "hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5"
      } transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand-600 [&>svg]:w-5 [&>svg]:h-5">
          {icon}
        </div>
        <span
          className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
            badge === "AI"
              ? "bg-accent-100 text-accent-700"
              : "bg-brand-100 text-brand-700"
          }`}
        >
          {badge}
        </span>
      </div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-text-muted leading-relaxed">{text}</p>
      {comingSoon && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold text-text-muted">
          segera
        </span>
      )}
    </div>
  );

  if (href && !comingSoon) {
    return (
      <Link href={href} className="group block">
        {content}
      </Link>
    );
  }
  return content;
}
