import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  CookingPot,
  Camera,
  Salad,
  Dumbbell,
  Timer,
  Activity,
  Calculator,
} from "lucide-react";
import { Pill, Btn, Card, Kicker } from "@/components/ui";
import { DemoButton } from "@/components/demo-button";

export function LandingPage() {
  return (
    <div className="bg-paper">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* gradient orbs */}
        <div
          className="orb"
          style={{
            width: 380,
            height: 380,
            background:
              "radial-gradient(circle, var(--color-forest-300) 0%, transparent 70%)",
            top: -80,
            right: -80,
          }}
        />
        <div
          className="orb"
          style={{
            width: 320,
            height: 320,
            background:
              "radial-gradient(circle, var(--color-clay-300) 0%, transparent 70%)",
            top: 120,
            left: -120,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="max-w-xl">
            <Pill tone="forest" size="md">
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              Untuk Indonesia
            </Pill>

            <h1 className="mt-6 text-[44px] sm:text-[58px] lg:text-[68px] font-extrabold leading-[1.02] tracking-tight">
              Sehat, tapi{" "}
              <span
                className="font-normal italic text-forest"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                tanpa drama
              </span>{" "}
              diet bule.
            </h1>

            <p className="mt-5 text-[15px] sm:text-base text-muted leading-relaxed max-w-md">
              Plan makan dan latihan dari profil, alergi, kondisi medis, dan
              budget — pakai data resmi TKPI Kemenkes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="primary" size="lg" iconRight={<ArrowRight />}>
                <Link href="/onboarding" className="contents">
                  Mulai quiz
                </Link>
              </Btn>
              <Btn variant="ghost" size="lg">
                <Link href="/tools" className="contents">
                  Lihat tools
                </Link>
              </Btn>
            </div>

            {/* Demo data shortcut — skip onboarding for review */}
            <div className="mt-4 inline-flex items-center gap-2 flex-wrap">
              <DemoButton size="sm" variant="clay" redirectTo="/log" />
              <span className="text-[11px] text-muted">
                Skip onboarding · Bashid persona · 7-day plan + 30d weight + workout
              </span>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex items-baseline gap-x-6 gap-y-2 flex-wrap text-sm">
              <span>
                <span
                  className="serif text-2xl tabular"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  1.146
                </span>{" "}
                <span className="text-muted">makanan</span>
              </span>
              <span>
                <span
                  className="serif text-2xl tabular"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  33
                </span>{" "}
                <span className="text-muted">provinsi</span>
              </span>
              <span>
                <span
                  className="serif text-2xl tabular"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  60+
                </span>{" "}
                <span className="text-muted">gerakan</span>
              </span>
            </div>
          </div>

          {/* Phone mockup teaser — visible desktop+ only */}
          <div className="hidden lg:flex items-center justify-center">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ============ VALUE PROPS ============ */}
      <section className="border-t border-hairline bg-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <Kicker>Yang beda</Kicker>
            <h2 className="mt-3 text-3xl sm:text-[40px] font-extrabold tracking-tight leading-[1.1]">
              App diet lain gak kenal{" "}
              <span
                className="font-normal italic text-clay"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                nasi padang.
              </span>
            </h2>
            <p className="mt-3 text-muted">
              Database TKPI Kemenkes, harga real PIHPS Bank Indonesia,
              komposisi gizi pas buat warteg dan padang.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            <ValueCard
              icon={<Wallet className="w-5 h-5" />}
              tone="forest"
              numeral="01"
              title="Budget warteg"
              text="Set budget makan harian. AI compose plan pakai harga pasar real-time PIHPS BI, 33 provinsi. Tahu beda harga ayam Jakarta vs Manado."
            />
            <ValueCard
              icon={<CookingPot className="w-5 h-5" />}
              tone="clay"
              numeral="02"
              title="Komposisi lokal"
              text="Rendang, gado-gado, soto, nasi padang — semua punya nilai gizi akurat dari TKPI Kemenkes resmi. Bukan tebakan dari database asing."
            />
            <ValueCard
              icon={<Camera className="w-5 h-5" />}
              tone="sky"
              numeral="03"
              title="Foto, beres"
              text="Foto piring kamu. AI identifikasi tiap lauk, estimasi porsi, hitung total kalori. Termasuk makanan rumah dan warung yang gak ada di database manapun."
            />
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (forest dark section) ============ */}
      <section className="relative overflow-hidden bg-forest text-paper">
        <div className="dot-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <Kicker tone="paper">Cara kerja</Kicker>
            <h2 className="mt-3 text-3xl sm:text-[44px] font-extrabold tracking-tight leading-[1.05] text-paper">
              Tiga menit setup,{" "}
              <span
                className="font-normal italic"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                satu plan personal.
              </span>
            </h2>
          </div>

          <div className="grid gap-8 md:gap-10 md:grid-cols-3">
            <ProcessStep
              n="01"
              title="Quiz"
              text="Jawab 40+ pertanyaan singkat: usia, target, kondisi medis, alergi, budget, jadwal."
            />
            <ProcessStep
              n="02"
              title="Compose"
              text="AI baca profil + harga lokal + komposisi TKPI, lalu compose meal plan & workout pertama kamu."
            />
            <ProcessStep
              n="03"
              title="Live track"
              text="Catat makan harian dengan foto, search, atau manual. Plan vs realisasi side-by-side."
            />
          </div>

          <div className="mt-12">
            <Btn variant="clay" size="lg" iconRight={<ArrowRight />}>
              <Link href="/onboarding" className="contents">
                Mulai quiz
              </Link>
            </Btn>
          </div>
        </div>
      </section>

      {/* ============ TOOLS ============ */}
      <section className="border-t border-hairline bg-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <Kicker>Tools</Kicker>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
                Tools yang tersedia
              </h2>
              <p className="mt-2 text-muted">
                Dari kalkulator dasar sampai AI generator.
              </p>
            </div>
            <Link
              href="/tools"
              className="text-sm font-semibold text-forest hover:text-forest-700 inline-flex items-center gap-1"
            >
              Lihat semua →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolMini
              href="/tools/tdee"
              icon={<Calculator />}
              title="TDEE & Macro"
              text="Kebutuhan kalori harian, macro split via Mifflin-St Jeor."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/macro"
              icon={<Calculator />}
              title="Macro Calculator"
              text="Konversi kalori ke gram makro. 12 preset diet siap pakai."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/bmi"
              icon={<Activity />}
              title="BMI Asia-Pacific"
              text="Cut-off Kemenkes RI plus lingkar pinggang."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/if"
              icon={<Timer />}
              title="IF Timer"
              text="7 protokol intermittent fasting plus tracker fase metabolik."
              badge="Gratis"
            />
            <ToolMini
              href="/plan"
              icon={<Salad />}
              title="Meal Plan AI"
              text="12 metode diet plus budget-aware compose dari TKPI + PIHPS."
              badge="AI"
            />
            <ToolMini
              href="/workout"
              icon={<Dumbbell />}
              title="Workout Program AI"
              text="6 goal × 5 split + progressive overload. Equipment-aware."
              badge="AI"
            />
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="bg-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <Card surface="ink" radius="xl" shadow="paper-2">
            <div className="p-8 sm:p-12 text-paper">
              <div className="max-w-2xl">
                <Kicker tone="paper">Siap mulai</Kicker>
                <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Quiz{" "}
                  <span
                    className="font-normal italic text-sun"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    60 detik
                  </span>
                  .
                </h2>
                <p className="mt-3 text-paper/80">
                  Plan langsung jalan. Gak butuh kartu kredit.
                </p>
              </div>
              <div className="mt-6">
                <Btn
                  variant="clay"
                  size="lg"
                  iconRight={<ArrowRight />}
                >
                  <Link href="/onboarding" className="contents">
                    Mulai sekarang
                  </Link>
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ValueCard({
  icon,
  tone,
  numeral,
  title,
  text,
}: {
  icon: React.ReactNode;
  tone: "forest" | "clay" | "sky";
  numeral: string;
  title: string;
  text: string;
}) {
  const iconBg = {
    forest: "bg-forest-50 text-forest",
    clay: "bg-clay-50 text-clay",
    sky: "bg-sky-50 text-sky",
  }[tone];
  return (
    <Card radius="lg" shadow="paper-1" className="p-6 sm:p-7">
      <div className="flex items-start justify-between mb-5">
        <div
          className={`inline-flex items-center justify-center w-10 h-10 rounded-[10px] ${iconBg}`}
        >
          {icon}
        </div>
        <span
          className="text-muted font-normal italic"
          style={{ fontFamily: "var(--font-serif)", fontSize: 22 }}
        >
          {numeral}
        </span>
      </div>
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] text-muted leading-relaxed">{text}</p>
    </Card>
  );
}

function ProcessStep({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div
        className="font-normal italic text-sun mb-3"
        style={{ fontFamily: "var(--font-serif)", fontSize: 56, lineHeight: 1 }}
      >
        {n}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-paper">{title}</h3>
      <p className="mt-2 text-[13.5px] text-paper/75 leading-relaxed">{text}</p>
    </div>
  );
}

function ToolMini({
  href,
  icon,
  title,
  text,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  badge: "Gratis" | "AI";
}) {
  return (
    <Link href={href} className="group block">
      <Card lift radius="md" shadow="paper-1" className="p-5 h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] bg-forest-50 text-forest [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
          <Pill
            tone={badge === "AI" ? "clay" : "forest"}
            size="sm"
          >
            {badge}
          </Pill>
        </div>
        <h3 className="font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-[13px] text-muted leading-relaxed">{text}</p>
      </Card>
    </Link>
  );
}

/** Decorative phone mockup with dashboard preview — desktop hero only. */
function PhoneMockup() {
  return (
    <div className="relative">
      <div
        className="bg-ink rounded-[44px] shadow-[var(--shadow-paper-3)]"
        style={{ width: 280, height: 560, padding: 14 }}
      >
        <div
          className="bg-paper rounded-[32px] h-full overflow-hidden relative paper-grain"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-ink rounded-full z-10" />
          <div className="p-4 pt-9">
            <div className="text-[10px] text-muted">SELASA · 8 SEPT</div>
            <div className="mt-1 text-lg font-extrabold leading-tight">
              Selamat pagi,{" "}
              <span
                className="font-normal italic text-forest"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Bashid
              </span>
            </div>
            <div className="mt-4 p-4 rounded-[18px] bg-forest text-paper">
              <div className="text-[9px] uppercase tracking-wider text-paper/70 font-bold">
                Kalori
              </div>
              <div
                className="mt-1 tabular"
                style={{ fontFamily: "var(--font-serif)", fontSize: 36 }}
              >
                1.342
              </div>
              <div className="text-[10px] text-paper/80">/ 2.150 kcal</div>
              <div className="mt-3 h-1.5 bg-paper/15 rounded-full overflow-hidden">
                <div className="h-full w-[62%] bg-paper rounded-full" />
              </div>
            </div>
            <div className="mt-3 p-3 rounded-[14px] bg-surface border border-hairline">
              <div className="text-[9px] uppercase tracking-wider text-muted font-bold">
                Plan hari ini
              </div>
              <div className="mt-1 text-[12px] font-semibold">
                Mediterranean ·{" "}
                <span className="tabular">Rp48.000</span>
              </div>
              <ul className="mt-2 space-y-1 text-[10.5px]">
                <li className="flex justify-between line-through text-muted">
                  <span>Bubur Manado</span>
                  <span className="tabular">320</span>
                </li>
                <li className="flex justify-between">
                  <span>Tahu isi + teh</span>
                  <span className="tabular">220</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
