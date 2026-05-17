import Link from "next/link";
import { Logo } from "@/components/ui";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-paper">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-[12.5px] text-muted">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/tools" className="hover:text-ink transition-colors">
            Tools
          </Link>
          <Link href="/plan" className="hover:text-ink transition-colors">
            Plan
          </Link>
          <Link href="/aku" className="hover:text-ink transition-colors">
            Profil
          </Link>
        </nav>
        <div>© 2026 · Made in Indonesia 🇮🇩</div>
      </div>
    </footer>
  );
}
