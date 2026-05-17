import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, Kicker, Btn } from "@/components/ui";

interface Props {
  searchParams: Promise<{ reason?: string }>;
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const params = await searchParams;
  const reason = params.reason ?? "Unknown error";
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <Card radius="xl" shadow="paper-1" className="max-w-md w-full p-7 sm:p-9">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-rose-50 text-rose items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <Kicker tone="muted">Auth error</Kicker>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          Login gagal
        </h1>
        <p className="mt-2 text-[13px] text-muted leading-relaxed">
          {reason}
        </p>
        <p className="mt-3 text-[12px] text-muted">
          Coba lagi atau hubungi support kalau terus gagal.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Btn variant="primary" size="md" fullWidth>
              Coba login lagi
            </Btn>
          </Link>
        </div>
      </Card>
    </div>
  );
}
