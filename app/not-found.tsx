import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          Halaman gak ketemu
        </h1>
        <p className="mt-3 text-text-muted">
          Sepertinya halaman yang kamu cari belum ada atau udah pindah.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Balik ke beranda
        </Link>
      </div>
    </div>
  );
}
