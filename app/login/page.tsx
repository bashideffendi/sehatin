"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, Kicker, Btn, Pill, Logo } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
      }
      // OAuth redirects, so no further code here
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo size="lg" />
          </Link>
        </div>

        <Card
          radius="xl"
          shadow="paper-2"
          className="relative overflow-hidden paper-grain p-7 sm:p-9"
        >
          {/* Sun radial accent */}
          <span
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(245,206,90,0.35) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            <Kicker>Masuk</Kicker>
            <h1 className="mt-2 text-[28px] sm:text-[34px] font-extrabold tracking-tight leading-tight">
              Welcome{" "}
              <span
                className="font-normal italic text-clay"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                back.
              </span>
            </h1>
            <p className="mt-2 text-[13px] text-muted leading-relaxed">
              Login via magic link atau Google. Data plan kamu kebawa
              antar-device otomatis.
            </p>

            {sent ? (
              <div className="mt-6 rounded-[14px] bg-forest-50 border border-forest/20 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[14px] text-forest">
                      Link udah dikirim
                    </div>
                    <p className="mt-1 text-[12px] text-ink-2 leading-relaxed">
                      Cek inbox <span className="font-semibold">{email}</span>.
                      Klik link di email buat masuk. Bisa tutup tab ini.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false);
                        setEmail("");
                      }}
                      className="mt-3 text-[11.5px] font-semibold text-forest hover:underline"
                    >
                      Kirim ulang
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Google OAuth */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-surface border border-hairline-2 hover:border-forest hover:bg-forest-50 transition-colors font-semibold text-[14px] disabled:opacity-60"
                >
                  <GoogleIcon />
                  Login dengan Google
                </button>

                <div className="my-4 flex items-center gap-2 text-[10px] text-muted">
                  <div className="h-px flex-1 bg-hairline" />
                  <span className="font-bold uppercase tracking-wider">
                    atau
                  </span>
                  <div className="h-px flex-1 bg-hairline" />
                </div>

                {/* Magic link */}
                <form onSubmit={handleMagicLink}>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="email"
                      autoFocus
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kamu@email.com"
                      disabled={loading}
                      className="w-full h-12 pl-11 pr-4 rounded-full border border-hairline-2 bg-surface focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 text-[14px]"
                    />
                  </div>

                  {error && (
                    <p className="mt-3 text-[12px] text-rose">{error}</p>
                  )}

                  <Btn
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    iconRight={!loading ? <ArrowRight /> : undefined}
                    type="submit"
                    className="mt-4"
                  >
                    Kirim magic link
                  </Btn>
                </form>
              </>
            )}

            <div className="mt-6 text-center text-[11px] text-muted">
              Belum punya akun? Tinggal masukin email — auto bikin.
            </div>
          </div>
        </Card>

        {/* Back to landing */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-[12px] font-semibold text-muted hover:text-ink"
          >
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
