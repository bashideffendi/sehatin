"use client";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/landing-page";
import { Dashboard } from "@/components/dashboard";
import { ProfileBlockingModal } from "@/components/profile-blocking-modal";
import { loadProfile, type UserProfile } from "@/lib/profile";
import { hasEnteredApp } from "@/lib/session";

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
  const [entered, setEntered] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setEntered(hasEnteredApp());
    setHydrated(true);
  }, []);

  // Blank during hydration to avoid landing-flash for returning users
  if (!hydrated) {
    return <div className="min-h-[60vh]" aria-hidden />;
  }

  // 1. Belum pernah masuk app → Landing
  if (!entered) {
    return <LandingPage />;
  }

  // 2. Udah masuk + profile complete → Dashboard normal
  if (isProfileComplete(profile)) {
    return <Dashboard profile={profile} />;
  }

  // 3. Udah masuk tapi profile belum lengkap → Dashboard skeleton + blocking modal
  return (
    <>
      {/* Render dashboard with empty profile as visual backdrop (blurred by modal) */}
      <div className="pointer-events-none select-none opacity-40">
        <Dashboard
          profile={
            // Stub profile dengan minimal placeholder field biar Dashboard ga crash
            (profile ?? { v: 2, name: "kamu" }) as UserProfile
          }
        />
      </div>
      <ProfileBlockingModal />
    </>
  );
}
