"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Salad, Plus, Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Match prefix instead of exact (e.g. /tools/* matches /tools) */
  matchPrefix?: boolean;
}

const TABS: TabItem[] = [
  { href: "/", label: "Hari ini", icon: <Home className="w-5 h-5" /> },
  { href: "/plan", label: "Plan", icon: <Salad className="w-5 h-5" /> },
  // FAB — slot rendered separately, this is just the layout anchor
  { href: "/log", label: "Catat", icon: <Plus className="w-6 h-6" /> },
  {
    href: "/workout",
    label: "Workout",
    icon: <Dumbbell className="w-5 h-5" />,
  },
  { href: "/aku", label: "Aku", icon: <User className="w-5 h-5" /> },
];

function isActive(pathname: string, href: string, matchPrefix?: boolean) {
  if (href === "/") return pathname === "/";
  if (matchPrefix) return pathname.startsWith(href);
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileTabBar({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40",
        "bg-paper/85 backdrop-blur-md border-t border-hairline",
        "px-2 pt-2 pb-3 safe-bottom",
        className,
      )}
      aria-label="Navigasi utama"
    >
      <div className="flex items-end justify-between max-w-md mx-auto">
        {TABS.map((tab, i) => {
          const active = isActive(pathname, tab.href, tab.matchPrefix);
          const isCenter = i === 2; // Catat FAB
          if (isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative -mt-6 inline-flex flex-col items-center justify-center",
                  "w-14 h-14 rounded-full",
                  "bg-forest text-paper shadow-[var(--shadow-forest)]",
                  "active:scale-95 transition-transform",
                )}
                aria-label={tab.label}
              >
                {tab.icon}
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg",
                active ? "text-forest" : "text-muted hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
