"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RotateCcw, Trash2 } from "lucide-react";
import { loadDemoData, clearAllSehatinData, isDemoLoaded } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

interface DemoButtonProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Style variant */
  variant?: "clay" | "ghost" | "ink";
  /** Where to redirect after loading. Default: /log */
  redirectTo?: string;
  /** Display label override */
  label?: string;
  /** Show clear button too */
  showClear?: boolean;
  className?: string;
}

export function DemoButton({
  size = "md",
  variant = "clay",
  redirectTo = "/log",
  label,
  showClear,
  className,
}: DemoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasDemo, setHasDemo] = useState(false);

  useEffect(() => {
    setHasDemo(isDemoLoaded());
  }, []);

  const handleLoad = () => {
    setLoading(true);
    try {
      loadDemoData();
      // Small delay to make the spinner visible, then navigate
      setTimeout(() => {
        if (redirectTo === "reload") {
          window.location.reload();
        } else {
          window.location.href = redirectTo;
        }
      }, 200);
    } catch (e) {
      setLoading(false);
      alert("Gagal load demo data: " + (e as Error).message);
    }
  };

  const handleClear = () => {
    if (!confirm("Hapus semua data Sehatin? Aksi gak bisa di-undo.")) return;
    clearAllSehatinData();
    setHasDemo(false);
    window.location.reload();
  };

  const sizeCls = {
    sm: "h-8 px-3 text-[11.5px] gap-1.5",
    md: "h-10 px-4 text-[13px] gap-2",
    lg: "h-12 px-5 text-[14px] gap-2",
  }[size];

  const variantCls = {
    clay: "bg-clay text-paper border border-clay hover:bg-clay-700 shadow-[var(--shadow-paper-1)]",
    ghost: "bg-transparent text-ink border border-hairline-2 hover:bg-surface-2",
    ink: "bg-ink text-paper border border-ink hover:bg-ink/90",
  }[variant];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        onClick={handleLoad}
        disabled={loading}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold leading-none whitespace-nowrap transition-all duration-150",
          "hover:-translate-y-px active:translate-y-0 disabled:opacity-60",
          sizeCls,
          variantCls,
        )}
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
            Loading demo...
          </>
        ) : hasDemo ? (
          <>
            <RotateCcw className="w-3.5 h-3.5" />
            {label ?? "Reload demo data"}
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            {label ?? "Load demo data"}
          </>
        )}
      </button>

      {showClear && hasDemo && (
        <button
          onClick={handleClear}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full font-semibold text-[11.5px] text-muted hover:text-rose border border-hairline hover:border-rose transition-colors"
          title="Hapus semua data"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
