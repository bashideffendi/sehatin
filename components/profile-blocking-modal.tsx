"use client";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, Kicker, Btn, Pill } from "@/components/ui";

/**
 * Blocks the dashboard when user has "entered app" but profile isn't filled.
 * Force them to /onboarding before they can use the app.
 */
export function ProfileBlockingModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md">
      <Card
        radius="xl"
        shadow="paper-3"
        className="relative overflow-hidden paper-grain max-w-md w-full p-7 sm:p-9 pointer-events-auto"
      >
        {/* Sun radial accent */}
        <span
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245,206,90,0.4) 0%, transparent 70%)",
          }}
        />
        {/* Clay radial accent */}
        <span
          className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(217,124,79,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          <Pill tone="clay" size="md" icon={<Sparkles className="w-3 h-3" />}>
            Yuk setup dulu
          </Pill>
          <h2 className="mt-4 text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-tight">
            Plan kamu{" "}
            <span
              className="font-normal italic text-clay"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              belum personal.
            </span>
          </h2>
          <p className="mt-3 text-[13.5px] text-muted leading-relaxed">
            Quiz 60 detik buat baca kondisi kamu — alergi, hipertensi, budget,
            target. Tanpa ini, dashboard kosong dan plan-nya generic.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link href="/onboarding">
              <Btn
                variant="primary"
                size="lg"
                fullWidth
                iconRight={<ArrowRight />}
              >
                Mulai quiz
              </Btn>
            </Link>
            <p className="text-[10.5px] text-muted text-center mt-1">
              Tersimpan di akun kamu — bisa edit kapan aja di Profil.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
