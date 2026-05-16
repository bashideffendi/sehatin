import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
