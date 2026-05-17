"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileTabBar } from "@/components/ui";
import { loadProfile, type UserProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

/**
 * Global nav orchestrator.
 * - Desktop (md+): persistent left sidebar (220px) with logo + nav + user card
 * - Mobile: bottom tab bar (5 items, center FAB primary) — pages render
 *   their own page-level top header (greeting / title) inline.
 *
 * NOT shown on:
 * - Marketing landing page (`/` when not authed) — landing has its own top nav
 * - Login (`/login`) — full-screen login form
 * - Auth (`/auth/*`) — callback handlers
 * - Onboarding flow (`/onboarding`) — WizardShell provides its own chrome
 * - Preview (`/preview/*`) — design review pages
 */
function isInAppPath(pathname: string, authed: boolean): boolean {
  if (pathname.startsWith("/onboarding")) return false;
  if (pathname.startsWith("/preview")) return false;
  if (pathname.startsWith("/login")) return false;
  if (pathname.startsWith("/auth")) return false;
  // Landing = `/` when not authenticated
  if (pathname === "/" && !authed) return false;
  return true;
}

export function Nav() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      // Check Supabase auth + load profile (still localStorage for now)
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setAuthed(!!user);
      } catch {
        // Supabase env not configured — fall back to no-auth (dev)
        setAuthed(false);
      }
      setProfile(loadProfile());
      setMounted(true);
    })();
  }, []);

  // Avoid hydration mismatch — render nothing until we know auth state
  if (!mounted) return null;

  if (!isInAppPath(pathname ?? "/", authed)) return null;

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
