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
import { Pill, Btn, Card, Kicker, Logo } from "@/components/ui";
import { DemoButton } from "@/components/demo-button";
import { markEnteredApp } from "@/lib/session";

export function LandingPage() {
  return (
    <div className="bg-paper">
      {/* ============ MARKETING TOP NAV ============ */}
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center">
            <Logo size="md" />
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/tools"
              className="px-3 py-2 rounded-full text-[13px] font-semibold text-muted hover:text-ink hover:bg-surface-2 transition-colors"
            >
              Tools
            </Link>
            <a
              href="#yang-beda"
              className="px-3 py-2 rounded-full text-[13px] font-semibold text-muted hover:text-ink hover:bg-surface-2 transition-colors"
            >
              Yang beda
            </a>
            <a
              href="#cara-kerja"
              className="px-3 py-2 rounded-full text-[13px] font-semibold text-muted hover:text-ink hover:bg-surface-2 transition-colors"
            >
              Cara kerja
            </a>
          </nav>
          <Link href="/onboarding">
            <Btn variant="primary" size="sm" iconRight={<ArrowRight />}>
              Mulai quiz
            </Btn>
          </Link>
        </div>
      </header>

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
              Plan makan dari kondisi kamu — alergi, hipertensi, budget, jadwal
              kerja. Buat orang Indonesia yang gak mau dietnya bingung liat
              nasi padang.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="primary" size="lg" iconRight={<ArrowRight />}>
                <Link href="/onboarding" className="contents">
                  Mulai quiz
                </Link>
              </Btn>
              <Btn variant="ghost" size="lg">
                <Link href="/tools" className="contents">
                  Coba tools dulu
                </Link>
              </Btn>
            </div>

            {/* Demo data shortcut — skip onboarding for review */}
            <div className="mt-4 inline-flex items-center gap-2 flex-wrap">
              <DemoButton size="sm" variant="clay" redirectTo="/log" />
              <span className="text-[11px] text-muted">
                Skip quiz · langsung liat plan jadinya kayak gimana
              </span>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex items-baseline gap-x-6 gap-y-2 flex-wrap text-sm">
              <span>
                <span
                  className="serif text-2xl tabular"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  2.015
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
      <section id="yang-beda" className="border-t border-hairline bg-paper scroll-mt-20">
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
              MyFitnessPal gak punya rendang. Apps bule gak ngerti porsi
              warteg. Kita bikin yang sesuai.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            <ValueCard
              icon={<Wallet className="w-5 h-5" />}
              tone="forest"
              numeral="01"
              title="Plan se-budget kamu"
              text="Tulis budget harian. Plan ngitung pake harga pasar 33 provinsi. Ayam di Jakarta vs Manado beda, jadi pake yang real."
            />
            <ValueCard
              icon={<CookingPot className="w-5 h-5" />}
              tone="clay"
              numeral="02"
              title="Gizi yang bener"
              text="Rendang, gado-gado, soto — angka gizinya dari TKPI Kemenkes. Bukan ngarang. Bukan terjemahan dari beef stew."
            />
            <ValueCard
              icon={<Camera className="w-5 h-5" />}
              tone="sky"
              numeral="03"
              title="Foto piring, selesai"
              text="Lagi makan di warung yang gak ada di mana-mana? Foto aja. AI baca tiap lauk + porsi, langsung masuk catatan."
            />
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (forest dark section) ============ */}
      <section id="cara-kerja" className="relative overflow-hidden bg-forest text-paper scroll-mt-20">
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
              text="40+ pertanyaan singkat. Usia, target, kondisi medis, alergi, budget, jam kerja — yang bener-bener ngaruh."
            />
            <ProcessStep
              n="02"
              title="Compose"
              text="AI baca profil kamu + harga pasar + gizi TKPI. Meal plan + workout langsung jadi, gak perlu mikir."
            />
            <ProcessStep
              n="03"
              title="Live track"
              text="Catat makan via foto, search, atau manual. Liat plan vs apa yang beneran masuk perut — side-by-side."
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
                Pake yang kamu butuh.
              </h2>
              <p className="mt-2 text-muted">
                Gak perlu daftar buat hitung BMI atau jalanin IF Timer.
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
              text="Berapa kalori sih kebutuhan harian kamu? Pakai Mifflin-St Jeor."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/macro"
              icon={<Calculator />}
              title="Macro split"
              text="Kalori jadi gram protein/lemak/karbo. 12 preset diet siap pakai."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/bmi"
              icon={<Activity />}
              title="BMI Asia-Pacific"
              text="Cut-off Kemenkes. Plus lingkar pinggang buat obesitas sentral."
              badge="Gratis"
            />
            <ToolMini
              href="/tools/if"
              icon={<Timer />}
              title="IF Timer"
              text="7 protokol puasa. Tracker fase metabolik glikogen → ketosis."
              badge="Gratis"
            />
            <ToolMini
              href="/plan"
              icon={<Salad />}
              title="Meal Plan AI"
              text="12 metode diet. AI compose sesuai budget + kondisi kamu."
              badge="AI"
            />
            <ToolMini
              href="/workout"
              icon={<Dumbbell />}
              title="Workout AI"
              text="6 goal × 5 split. Equipment-aware, progressive overload."
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
                <Kicker tone="paper">Yuk mulai</Kicker>
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
                  Plan langsung jadi. Gak ada kartu kredit, gak ada trial 7
                  hari, gak ada email konfirmasi.
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
