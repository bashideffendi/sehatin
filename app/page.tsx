"use client";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/landing-page";
import { Dashboard } from "@/components/dashboard";
import { loadProfile, type UserProfile } from "@/lib/profile";

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  // Blank during hydration to avoid landing-flash for returning users
  if (!hydrated) {
    return <div className="min-h-[60vh]" aria-hidden />;
  }

  if (isProfileComplete(profile)) {
    return <Dashboard profile={profile} />;
  }

  return <LandingPage />;
}
