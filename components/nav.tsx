"use client";
import { useState, useEffect } from "react";
import { DesktopSidebar, MobileTabBar } from "@/components/ui";
import { loadProfile, type UserProfile } from "@/lib/profile";

/**
 * Global nav orchestrator.
 * - Desktop (md+): persistent left sidebar (220px) with logo + nav + user card
 * - Mobile: bottom tab bar (5 items, center FAB primary) — pages render
 *   their own page-level top header (greeting / title) inline.
 */
export function Nav() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

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
