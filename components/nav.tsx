"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileTabBar } from "@/components/ui";
import { loadProfile, type UserProfile } from "@/lib/profile";

/**
 * Global nav orchestrator.
 * - Desktop (md+): persistent left sidebar (220px) with logo + nav + user card
 * - Mobile: bottom tab bar (5 items, center FAB primary) — pages render
 *   their own page-level top header (greeting / title) inline.
 *
 * NOT shown on:
 * - Marketing landing page (`/` without profile) — landing has its own top nav
 * - Onboarding flow (`/onboarding`) — WizardShell provides its own chrome
 */
function isInAppPath(pathname: string, hasProfile: boolean): boolean {
  // Onboarding always uses WizardShell — no sidebar/tabbar
  if (pathname.startsWith("/onboarding")) return false;
  // Landing page = `/` without a profile (otherwise it's the dashboard)
  if (pathname === "/" && !hasProfile) return false;
  return true;
}

export function Nav() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setProfile(loadProfile());
    setMounted(true);
  }, []);

  // Avoid hydration mismatch — render nothing until we know profile state
  if (!mounted) return null;

  if (!isInAppPath(pathname ?? "/", !!profile)) return null;

  const user = profile
    ? {
        name: profile.name ?? "Profil",
        plan: "Free", // Plus tier upsell wired separately; default Free.
      }
    : null;

  return (
    <>
      <DesktopSidebar user={user} />
      <MobileTabBar />
    </>
  );
}
