import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>Sehatin</span>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
            <Link href="/tools" className="hover:text-fg">
              Semua Tools
            </Link>
            <Link href="/tools/tdee" className="hover:text-fg">
              TDEE
            </Link>
            <Link href="/tools/bmi" className="hover:text-fg">
              BMI
            </Link>
            <Link href="/tools/if" className="hover:text-fg">
              IF Timer
            </Link>
          </nav>

          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <span>Dibikin di Indonesia</span>
            <Heart className="w-3.5 h-3.5 fill-brand-500 text-brand-500" />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-xs text-text-muted">
          <p>
            <strong className="font-semibold text-fg/80">Disclaimer:</strong>{" "}
            Sehatin tools ini bersifat informasional dan edukatif, bukan
            pengganti konsultasi medis. Untuk kondisi kesehatan tertentu
            (diabetes, hipertensi, ginjal, kehamilan), konsultasikan dengan
            dokter atau ahli gizi profesional.
          </p>
          <p className="mt-2">
            Data: TKPI Kemenkes RI · PIHPS Bank Indonesia · Komposisi gizi
            per 100g. © {new Date().getFullYear()} Sehatin.
          </p>
        </div>
      </div>
    </footer>
  );
}
