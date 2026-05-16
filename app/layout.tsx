import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Sehatin — Fitness & wellness tools Indonesia",
  description:
    "Meal plan budget-aware, workout sesuai equipment, IF timer, BMI Asia-Pacific. Data makanan & harga real Indonesia. Fun, mudah, science-based.",
  keywords: [
    "fitness Indonesia",
    "meal plan",
    "BMI calculator",
    "intermittent fasting",
    "TKPI",
    "diet Indonesia",
  ],
  authors: [{ name: "Bashid Effendi" }],
  openGraph: {
    title: "Sehatin — Fitness & wellness tools Indonesia",
    description:
      "Meal plan budget-aware, workout sesuai equipment, IF timer, BMI Asia-Pacific.",
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
