/**
 * Landing page preview route — for design review without clearing demo data.
 * Renders LandingPage regardless of profile state.
 */
import { LandingPage } from "@/components/landing-page";

export const metadata = {
  title: "Landing preview · Sehatin",
};

export default function LandingPreviewPage() {
  return <LandingPage />;
}
