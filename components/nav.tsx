"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/log", label: "Catatan" },
  { href: "/plan", label: "Plan" },
  { href: "/workout", label: "Workout" },
  { href: "/tools", label: "Tools" },
  { href: "/tools/tdee", label: "TDEE" },
  { href: "/tools/bmi", label: "BMI" },
  { href: "/tools/macro", label: "Macro" },
  { href: "/tools/if", label: "IF Timer" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
          >
            <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <span>
              Sehat<span className="text-brand-600">in</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 text-sm font-medium text-fg/70 hover:text-fg hover:bg-surface-muted rounded-lg"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/settings"
              className="ml-1 w-9 h-9 inline-flex items-center justify-center rounded-lg text-fg/70 hover:text-fg hover:bg-surface-muted"
              title="Pengaturan"
              aria-label="Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <Link
              href="/onboarding"
              className="ml-1 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 rounded-lg shadow-sm"
            >
              Mulai
            </Link>
          </nav>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1">
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-surface-muted text-fg/70"
              aria-label="Pengaturan"
              title="Pengaturan"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="p-2 -mr-2 rounded-lg hover:bg-surface-muted"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-200",
            open ? "max-h-96 pb-4" : "max-h-0",
          )}
        >
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-fg/80 hover:text-fg hover:bg-surface-muted rounded-lg"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
