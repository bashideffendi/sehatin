import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { DemoFloater } from "@/components/demo-floater";

export const metadata: Metadata = {
  title: "Sehatin — Nutrisi dan latihan, data Indonesia",
  description:
    "AI compose plan makan dan workout dari profil kamu, kondisi medis, alergi, dan budget. Pakai komposisi gizi TKPI Kemenkes dan harga pasar PIHPS Bank Indonesia.",
  keywords: [
    "diet Indonesia",
    "meal plan TKPI",
    "kalori makanan Indonesia",
    "BMI Asia-Pacific",
    "intermittent fasting",
    "workout program",
    "nutrisi AI",
    "PIHPS harga pangan",
  ],
  authors: [{ name: "Bashid Effendi" }],
  openGraph: {
    title: "Sehatin — Nutrisi dan latihan, data Indonesia",
    description:
      "AI compose plan makan dan workout pakai komposisi gizi TKPI Kemenkes dan harga pasar PIHPS Bank Indonesia.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* Plus Jakarta Sans + Instrument Serif — loaded via <link> for
            guaranteed first-paint application (the @import in globals.css
            is a fallback). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-paper text-ink">
        <div className="md:flex md:items-stretch md:min-h-screen">
          <Nav />
          <div className="flex-1 min-w-0 flex flex-col">
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
            <Footer />
          </div>
        </div>
        <DemoFloater />
      </body>
    </html>
  );
}
