"use client";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/landing-page";
import { Dashboard } from "@/components/dashboard";
import { ProfileBlockingModal } from "@/components/profile-blocking-modal";
import { loadProfile, type UserProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { migrateLocalStorageToSupabase } from "@/lib/supabase/migrate-from-localstorage";

const REQUIRED_FIELDS: (keyof UserProfile)[] = [
  "age",
  "sex",
  "weight_kg",
  "height_cm",
  "activity",
  "goal",
];

function isProfileComplete(p: UserProfile | null): p is UserProfile {
  if (!p) return false;
  return REQUIRED_FIELDS.every((k) => {
    const v = p[k];
    return v !== undefined && v !== null && v !== "";
  });
}

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authed, setAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      // Check Supabase auth session (graceful if env vars missing)
      let isAuthed = false;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        isAuthed = !!user;
      } catch (e) {
        console.warn(
          "[home] Supabase not configured, falling back to no-auth",
          e,
        );
      }
      setAuthed(isAuthed);

      // If authed AND there's localStorage data, run one-time migration
      if (isAuthed) {
        try {
          await migrateLocalStorageToSupabase();
        } catch (e) {
          console.warn("[home] migration failed (non-fatal)", e);
        }
      }

      // Load profile (still from localStorage for now — Phase 2 will switch to Supabase queries)
      setProfile(loadProfile());
      setHydrated(true);
    })();
  }, []);

  // Blank during hydration to avoid landing-flash for returning users
  if (!hydrated) {
    return <div className="min-h-[60vh]" aria-hidden />;
  }

  // 1. Not authenticated → Landing
  if (!authed) {
    return <LandingPage />;
  }

  // 2. Authed + profile complete → Dashboard normal
  if (isProfileComplete(profile)) {
    return <Dashboard profile={profile} />;
  }

  // 3. Authed but profile incomplete → Dashboard skeleton + blocking modal
  return (
    <>
      <div className="pointer-events-none select-none opacity-40">
        <Dashboard
          profile={(profile ?? { v: 2, name: "kamu" }) as UserProfile}
        />
      </div>
      <ProfileBlockingModal />
    </>
  );
}
