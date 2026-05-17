"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Salad,
  Hash,
  Dumbbell,
  Wrench,
  User,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Hari ini", icon: <Home className="w-4 h-4" /> },
  { href: "/plan", label: "Plan", icon: <Salad className="w-4 h-4" /> },
  { href: "/log", label: "Catatan", icon: <Hash className="w-4 h-4" /> },
  {
    href: "/workout",
    label: "Workout",
    icon: <Dumbbell className="w-4 h-4" />,
  },
  { href: "/tools", label: "Tools", icon: <Wrench className="w-4 h-4" /> },
  { href: "/aku", label: "Profil", icon: <User className="w-4 h-4" /> },
];

interface DesktopSidebarProps {
  /** User display info — rendered in bottom card */
  user?: {
    name?: string;
    plan?: string;
  } | null;
  className?: string;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopSidebar({ user, className }: DesktopSidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col flex-shrink-0",
        "w-[220px] h-screen sticky top-0",
        "bg-paper border-r border-hairline",
        className,
      )}
      aria-label="Navigasi utama"
    >
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="inline-flex items-center">
          <Logo size="md" />
        </Link>
      </div>

      <nav className="flex-1 px-3 pt-2 pb-4 space-y-1 overflow-y-auto">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-semibold transition-colors",
                active
                  ? "bg-forest-50 text-forest"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className={cn(active ? "text-forest" : "text-muted")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user ? (
        <div className="m-3 p-3 rounded-[14px] bg-paper-deep border border-hairline">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-forest text-paper inline-flex items-center justify-center font-bold text-sm">
              {(user.name ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold truncate">
                {user.name ?? "Profil"}
              </div>
              <div className="text-[10.5px] text-muted truncate">
                {user.plan ?? "Free"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="m-3">
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-forest text-paper font-semibold text-[12.5px] shadow-[var(--shadow-forest)] hover:bg-forest-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Mulai
          </Link>
        </div>
      )}
    </aside>
  );
}
