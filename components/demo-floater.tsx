"use client";
import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, Trash2, X, FlaskConical } from "lucide-react";
import { loadDemoData, clearAllSehatinData, isDemoLoaded } from "@/lib/demo-data";

/**
 * Floating dev helper: bottom-right pill button to toggle demo data.
 * Shown only client-side. Hideable via X.
 */
export function DemoFloater() {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasDemo, setHasDemo] = useState(false);

  useEffect(() => {
    setHasDemo(isDemoLoaded());
    // Allow hiding via localStorage flag
    if (typeof window !== "undefined") {
      setHidden(window.localStorage.getItem("sehatin:demo_floater_hidden") === "1");
    }
  }, []);

  const handleLoad = () => {
    setLoading(true);
    try {
      loadDemoData();
      setTimeout(() => window.location.reload(), 200);
    } catch (e) {
      setLoading(false);
      alert("Gagal: " + (e as Error).message);
    }
  };

  const handleClear = () => {
    if (!confirm("Hapus semua data Sehatin? Aksi gak bisa di-undo.")) return;
    clearAllSehatinData();
    window.location.reload();
  };

  const handleHide = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sehatin:demo_floater_hidden", "1");
    }
    setHidden(true);
  };

  if (hidden) return null;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-11 h-11 rounded-full bg-ink text-paper shadow-[var(--shadow-paper-3)] inline-flex items-center justify-center hover:-translate-y-0.5 transition-all"
        title="Demo data"
        aria-label="Demo data controls"
      >
        <FlaskConical className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-[280px] bg-ink text-paper rounded-2xl shadow-[var(--shadow-paper-3)] p-4 border border-paper/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-paper/60">
            Demo controls
          </div>
          <div className="mt-0.5 text-[13px] font-bold tracking-tight">
            {hasDemo ? "Demo data aktif" : "Load dummy data?"}
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="w-6 h-6 rounded-full hover:bg-paper/10 inline-flex items-center justify-center flex-shrink-0"
          aria-label="Minimize"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[11px] text-paper/70 leading-relaxed mb-3">
        {hasDemo
          ? 'Profile "Bashid Effendi" + 7-day plan + 30d weight + workout sesi terisi.'
          : "Profile + meal plan + workout + 30d weight log buat enak review tanpa onboarding."}
      </p>

      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleLoad}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-full bg-clay text-paper text-[11.5px] font-bold hover:bg-clay-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
              Loading...
            </>
          ) : hasDemo ? (
            <>
              <RotateCcw className="w-3 h-3" />
              Reload demo
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              Load demo data
            </>
          )}
        </button>
        {hasDemo && (
          <button
            onClick={handleClear}
            className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-full bg-paper/10 text-paper text-[11px] font-semibold hover:bg-paper/15"
          >
            <Trash2 className="w-3 h-3" />
            Clear semua data
          </button>
        )}
      </div>

      <button
        onClick={handleHide}
        className="mt-3 w-full text-[10px] text-paper/40 hover:text-paper/70 underline-offset-2 hover:underline"
      >
        Sembunyikan floater
      </button>
    </div>
  );
}
