"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  Plus,
  Loader2,
  Camera,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  loadFoods,
  searchFoods,
  macrosForPortion,
  type FoodSearchEntry,
} from "@/lib/foods-search";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  MEAL_SLOT_EMOJI,
  type MealSlot,
} from "@/lib/food-log";
import { loadProfile } from "@/lib/profile";
import { cn, fmtNum } from "@/lib/utils";

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const MEDIA_TYPES: ReadonlySet<string> = new Set<ImageMediaType>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Confidence styling shared between detected items + overall badge
type Confidence = "low" | "medium" | "high";

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  low: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
  medium:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  high: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 border-brand-200 dark:border-brand-500/30",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: "rendah",
  medium: "sedang",
  high: "tinggi",
};

// Map Claude's meal_type_guess (with spaces) → our MealSlot enum (with underscores)
const MEAL_GUESS_MAP: Record<string, MealSlot> = {
  sarapan: "sarapan",
  "makan siang": "makan_siang",
  "makan malam": "makan_malam",
  snack: "snack",
};

// Schema of /api/analyze response (kept in-sync with src/nutrition/analyze.ts)
interface DetectedItem {
  food_code: string | null;
  food_name: string;
  portion_g: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  confidence: Confidence;
  reasoning?: string;
}

interface AnalysisResult {
  detected_items: DetectedItem[];
  totals: {
    kcal: number;
    protein_g: number;
    fat_g: number;
    carb_g: number;
  };
  confidence_overall: Confidence;
  meal_type_guess?:
    | "sarapan"
    | "makan siang"
    | "makan malam"
    | "snack"
    | "unknown";
  notes: string[];
  swap_suggestions?: { current: string; swap_to: string; benefit: string }[];
  health_warnings?: string[];
}

type Mode = "search" | "manual" | "photo";

interface Props {
  open: boolean;
  defaultSlot?: MealSlot;
  defaultMode?: Mode;
  onClose: () => void;
  onAdd: (data: {
    meal_slot: MealSlot;
    food_code?: string;
    food_name: string;
    portion_g: number;
    kcal: number;
    protein_g?: number;
    fat_g?: number;
    carb_g?: number;
    source: "search" | "manual" | "photo";
    notes?: string;
  }) => void;
}

export function AddFoodModal({
  open,
  defaultSlot = "sarapan",
  defaultMode = "search",
  onClose,
  onAdd,
}: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSearchEntry | null>(null);
  const [portion, setPortion] = useState("100");

  // Manual entry
  const [manualName, setManualName] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualCarb, setManualCarb] = useState("");

  // Photo mode
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoMediaType, setPhotoMediaType] = useState<ImageMediaType | null>(
    null,
  );
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [editedPortions, setEditedPortions] = useState<Record<number, string>>(
    {},
  );

  // Preload foods data when modal opens, sync slot+mode with props
  useEffect(() => {
    if (!open) return;
    setSlot(defaultSlot);
    setMode(defaultMode);
    void loadFoods().catch(() => {
      /* ignore — will retry on search */
    });
  }, [open, defaultSlot, defaultMode]);

  // Debounced search
  useEffect(() => {
    if (mode !== "search" || !open) return;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const hits = await searchFoods(query, { limit: 30 });
        if (!cancel) setResults(hits);
      } catch {
        if (!cancel) setResults([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    }, 150);
    return () => {
      cancel = true;
      clearTimeout(id);
    };
  }, [query, mode, open]);

  const macros = useMemo(() => {
    if (!selected) return null;
    const p = Number.parseFloat(portion);
    if (!Number.isFinite(p) || p <= 0) return null;
    return macrosForPortion(selected, p);
  }, [selected, portion]);

  const handleAddFromSearch = () => {
    if (!selected || !macros) return;
    const p = Number.parseFloat(portion);
    onAdd({
      meal_slot: slot,
      food_code: selected.code,
      food_name: selected.name,
      portion_g: p,
      kcal: macros.kcal,
      protein_g: macros.protein_g,
      fat_g: macros.fat_g,
      carb_g: macros.carb_g,
      source: "search",
    });
    handleClose();
  };

  const handleAddManual = () => {
    const kcal = Number.parseFloat(manualKcal);
    if (!manualName.trim() || !Number.isFinite(kcal) || kcal < 0) return;
    onAdd({
      meal_slot: slot,
      food_name: manualName.trim(),
      portion_g: Number.parseFloat(portion) || 100,
      kcal: Math.round(kcal),
      protein_g: Number.parseFloat(manualProtein) || undefined,
      fat_g: Number.parseFloat(manualFat) || undefined,
      carb_g: Number.parseFloat(manualCarb) || undefined,
      source: "manual",
    });
    handleClose();
  };

  // ============ Photo handlers ============

  const resetPhoto = () => {
    setPhotoPreview(null);
    setPhotoMediaType(null);
    setPhotoBase64(null);
    setPhotoNote("");
    setAnalyzing(false);
    setAnalysisError(null);
    setAnalysis(null);
    setSelectedItems(new Set());
    setEditedPortions({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!MEDIA_TYPES.has(file.type)) {
      setAnalysisError(
        `Format ${file.type || "tidak dikenali"} tidak didukung. Pakai JPG, PNG, WebP, atau GIF.`,
      );
      return;
    }
    // Cap raw size ~6 MB → ~8 MB base64 (matches /api/analyze 8 MB limit)
    if (file.size > 6 * 1024 * 1024) {
      setAnalysisError(
        "Gambar terlalu besar (max ~6 MB). Compress dulu atau pilih foto lain.",
      );
      return;
    }
    setAnalysisError(null);
    setAnalysis(null);
    setSelectedItems(new Set());
    setEditedPortions({});
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(
        /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/,
      );
      if (!match || !match[1] || !match[2]) {
        setAnalysisError("Gagal baca gambar.");
        return;
      }
      setPhotoPreview(dataUrl);
      setPhotoMediaType(match[1] as ImageMediaType);
      setPhotoBase64(match[2]);
    };
    reader.onerror = () => setAnalysisError("Gagal baca gambar.");
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!photoBase64 || !photoMediaType) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const profile = loadProfile();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile ?? undefined,
          image_base64: photoBase64,
          image_media_type: photoMediaType,
          user_note: photoNote.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        analysis?: AnalysisResult;
      };
      if (!data.ok) {
        setAnalysisError(data.error || "Gagal analisis foto.");
        return;
      }
      if (!data.analysis) {
        setAnalysisError("Server tidak return analisis.");
        return;
      }
      const result = data.analysis;
      setAnalysis(result);
      // Auto-select all detected items
      const initial = new Set<number>();
      result.detected_items.forEach((_, i) => initial.add(i));
      setSelectedItems(initial);
      // Auto-set slot from meal_type_guess
      if (result.meal_type_guess && result.meal_type_guess !== "unknown") {
        const mapped = MEAL_GUESS_MAP[result.meal_type_guess];
        if (mapped) setSlot(mapped);
      }
    } catch (e) {
      setAnalysisError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleItem = (idx: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const setItemPortion = (idx: number, value: string) => {
    setEditedPortions((prev) => ({ ...prev, [idx]: value }));
  };

  const photoTotals = useMemo(() => {
    if (!analysis) return null;
    let kcal = 0;
    let p = 0;
    let f = 0;
    let c = 0;
    analysis.detected_items.forEach((item, i) => {
      if (!selectedItems.has(i)) return;
      const raw = editedPortions[i];
      const edited = raw ? Number.parseFloat(raw) : NaN;
      const factor =
        Number.isFinite(edited) && edited > 0 && item.portion_g > 0
          ? edited / item.portion_g
          : 1;
      kcal += item.kcal * factor;
      p += item.protein_g * factor;
      f += item.fat_g * factor;
      c += item.carb_g * factor;
    });
    return {
      kcal: Math.round(kcal),
      protein_g: Math.round(p * 10) / 10,
      fat_g: Math.round(f * 10) / 10,
      carb_g: Math.round(c * 10) / 10,
    };
  }, [analysis, selectedItems, editedPortions]);

  const handleAddFromPhoto = () => {
    if (!analysis) return;
    for (let i = 0; i < analysis.detected_items.length; i++) {
      if (!selectedItems.has(i)) continue;
      const item = analysis.detected_items[i];
      if (!item) continue;
      const raw = editedPortions[i];
      const edited = raw ? Number.parseFloat(raw) : NaN;
      let portion_g = item.portion_g;
      let kcal = item.kcal;
      let protein_g = item.protein_g;
      let fat_g = item.fat_g;
      let carb_g = item.carb_g;
      if (
        Number.isFinite(edited) &&
        edited > 0 &&
        edited !== item.portion_g &&
        item.portion_g > 0
      ) {
        const factor = edited / item.portion_g;
        portion_g = edited;
        kcal = Math.round(item.kcal * factor);
        protein_g = Math.round(item.protein_g * factor * 10) / 10;
        fat_g = Math.round(item.fat_g * factor * 10) / 10;
        carb_g = Math.round(item.carb_g * factor * 10) / 10;
      }
      onAdd({
        meal_slot: slot,
        food_code: item.food_code || undefined,
        food_name: item.food_name,
        portion_g,
        kcal,
        protein_g,
        fat_g,
        carb_g,
        source: "photo",
        notes: item.reasoning,
      });
    }
    handleClose();
  };

  const photoSelectedCount = selectedItems.size;

  const handleClose = () => {
    setQuery("");
    setSelected(null);
    setPortion("100");
    setManualName("");
    setManualKcal("");
    setManualProtein("");
    setManualFat("");
    setManualCarb("");
    setResults([]);
    setMode("search");
    resetPhoto();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[95vh] flex flex-col bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold tracking-tight">Catat makanan</h2>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg hover:bg-surface-muted flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot picker */}
        <div className="px-4 pt-4">
          <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
            Slot
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={cn(
                  "px-2 py-2 rounded-xl border-2 text-xs font-semibold flex flex-col items-center gap-1 transition-all",
                  slot === s
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                    : "border-border bg-surface text-fg/70 hover:border-fg/20",
                )}
              >
                <span className="text-lg">{MEAL_SLOT_EMOJI[s]}</span>
                <span>{MEAL_SLOT_LABEL[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="px-4 pt-4">
          <div className="inline-flex p-1 bg-surface-muted rounded-xl">
            <button
              onClick={() => setMode("search")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                mode === "search"
                  ? "bg-surface text-fg shadow-sm"
                  : "text-text-muted hover:text-fg",
              )}
            >
              🔍 Cari TKPI
            </button>
            <button
              onClick={() => setMode("photo")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                mode === "photo"
                  ? "bg-surface text-fg shadow-sm"
                  : "text-text-muted hover:text-fg",
              )}
            >
              📷 Foto
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                mode === "manual"
                  ? "bg-surface text-fg shadow-sm"
                  : "text-text-muted hover:text-fg",
              )}
            >
              ✍️ Manual
            </button>
          </div>
        </div>

        {/* Body — Search mode */}
        {mode === "search" && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!selected ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari makanan (mis. 'nasi', 'ayam', 'tempe')..."
                    className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="mt-3 space-y-1.5 pb-2">
                  {loading && (
                    <div className="flex items-center justify-center py-8 text-text-muted">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                  {!loading && query && results.length === 0 && (
                    <p className="text-center text-sm text-text-muted py-8">
                      Gak ketemu &quot;{query}&quot;. Coba kata lain atau pakai
                      mode Manual.
                    </p>
                  )}
                  {!loading &&
                    results.map((f) => (
                      <button
                        key={f.code}
                        onClick={() => setSelected(f)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-brand-500/10 transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {f.name}
                          </span>
                          <span className="text-xs tabular-nums text-text-muted flex-shrink-0">
                            {f.kcal ?? "?"} kcal/100g
                          </span>
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {f.kategori} · {f.tipe}
                        </div>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-surface-muted">
                  <div className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-1">
                    Terpilih
                  </div>
                  <div className="font-semibold">{selected.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {selected.kategori} · {selected.tipe} ·{" "}
                    {selected.kcal ?? "?"} kcal/100g
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    ← Ganti
                  </button>
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-1.5 block">
                    Porsi (gram)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={portion}
                      onChange={(e) => setPortion(e.target.value)}
                      min={1}
                      step={5}
                      className="w-full px-3 py-3 pr-12 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xl font-bold tabular-nums"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-semibold">
                      g
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[50, 100, 150, 200, 250].map((g) => (
                      <button
                        key={g}
                        onClick={() => setPortion(String(g))}
                        className="px-3 py-1 rounded-full border border-border text-xs font-medium hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
                {macros && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                    <div className="text-xs text-brand-100 uppercase tracking-wide font-semibold">
                      Hasil
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">
                        {fmtNum(macros.kcal)}
                      </span>
                      <span className="text-sm text-brand-100">kcal</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-brand-100">Protein</div>
                        <div className="font-bold tabular-nums">
                          {macros.protein_g}g
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-100">Lemak</div>
                        <div className="font-bold tabular-nums">
                          {macros.fat_g}g
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-100">Karbo</div>
                        <div className="font-bold tabular-nums">
                          {macros.carb_g}g
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Body — Photo mode */}
        {mode === "photo" && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!photoPreview ? (
              <>
                {/* Upload zone */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-500/10 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-sm font-semibold">
                    Ambil atau pilih foto makanan
                  </div>
                  <div className="text-xs text-text-muted">
                    JPG / PNG / WebP · max 6 MB
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {analysisError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs leading-snug">
                    {analysisError}
                  </div>
                )}
                <div className="p-3 rounded-xl bg-surface-muted text-xs text-text-muted leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-brand-600" />
                  AI bakal identifikasi makanan, estimasi porsi, dan hitung
                  kalori dari database TKPI Kemenkes. Hasilnya bisa di-edit
                  sebelum di-log.
                </div>
              </>
            ) : !analysis ? (
              <>
                {/* Preview + analyze CTA */}
                <div className="relative rounded-2xl overflow-hidden bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview foto makanan"
                    className="w-full max-h-72 object-contain"
                  />
                  <button
                    onClick={resetPhoto}
                    disabled={analyzing}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center disabled:opacity-50"
                    aria-label="Ganti foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-1.5 block">
                    Catatan untuk AI (opsional)
                  </label>
                  <textarea
                    value={photoNote}
                    onChange={(e) => setPhotoNote(e.target.value)}
                    disabled={analyzing}
                    placeholder="contoh: nasi padangnya cuma setengah piring, pake rendang sama daun singkong"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 text-sm resize-none"
                  />
                </div>
                {analysisError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs leading-snug">
                    {analysisError}
                  </div>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className={cn(
                    "w-full px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all",
                    analyzing
                      ? "bg-surface-muted text-text-muted cursor-wait"
                      : "bg-fg text-bg hover:-translate-y-0.5 shadow-lg",
                  )}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Lagi nyari makanan di foto...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analisis dengan AI
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Header strip: thumb + confidence + meal guess + reset */}
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Foto"
                    className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide",
                          CONFIDENCE_STYLE[analysis.confidence_overall],
                        )}
                      >
                        Confidence {CONFIDENCE_LABEL[analysis.confidence_overall]}
                      </span>
                      {analysis.meal_type_guess &&
                        analysis.meal_type_guess !== "unknown" && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wide">
                            tebak: {analysis.meal_type_guess}
                          </span>
                        )}
                    </div>
                    <div className="mt-1 text-xs text-text-muted">
                      {analysis.detected_items.length} item terdeteksi
                    </div>
                  </div>
                  <button
                    onClick={resetPhoto}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 flex-shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Foto baru
                  </button>
                </div>

                {/* Health warnings — top priority */}
                {analysis.health_warnings &&
                  analysis.health_warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 space-y-1">
                      <div className="text-xs font-bold text-rose-700 dark:text-rose-300 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Peringatan
                        kesehatan
                      </div>
                      {analysis.health_warnings.map((w, i) => (
                        <p
                          key={i}
                          className="text-xs text-rose-700 dark:text-rose-300 leading-snug"
                        >
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                {/* Detected items list */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide uppercase text-text-muted">
                    Item — pilih + atur porsi
                  </div>
                  {analysis.detected_items.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-4">
                      Gak ada makanan terdeteksi di foto ini.
                    </p>
                  ) : (
                    analysis.detected_items.map((item, i) => {
                      const checked = selectedItems.has(i);
                      const portionValue =
                        editedPortions[i] ?? String(item.portion_g);
                      const edited = Number.parseFloat(portionValue);
                      const factor =
                        Number.isFinite(edited) &&
                        edited > 0 &&
                        item.portion_g > 0
                          ? edited / item.portion_g
                          : 1;
                      const liveKcal = Math.round(item.kcal * factor);
                      const liveP = Math.round(item.protein_g * factor * 10) / 10;
                      const liveF = Math.round(item.fat_g * factor * 10) / 10;
                      const liveC = Math.round(item.carb_g * factor * 10) / 10;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-colors",
                            checked
                              ? "border-brand-400 bg-brand-50/40 dark:bg-brand-500/10"
                              : "border-border bg-surface opacity-60",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <label className="flex items-center pt-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleItem(i)}
                                className="w-4 h-4 accent-brand-600"
                                aria-label={`Pilih ${item.food_name}`}
                              />
                            </label>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <div className="font-semibold text-sm leading-tight">
                                  {item.food_name}
                                  {!item.food_code && (
                                    <span className="ml-1.5 text-[10px] font-medium text-text-muted">
                                      (no TKPI match)
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                                    CONFIDENCE_STYLE[item.confidence],
                                  )}
                                >
                                  {CONFIDENCE_LABEL[item.confidence]}
                                </span>
                              </div>
                              {item.reasoning && (
                                <div className="mt-0.5 text-xs text-text-muted italic leading-snug">
                                  {item.reasoning}
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={portionValue}
                                    onChange={(e) =>
                                      setItemPortion(i, e.target.value)
                                    }
                                    disabled={!checked}
                                    min={1}
                                    step={5}
                                    className="w-16 px-2 py-1 rounded-md border border-border bg-surface text-xs font-semibold tabular-nums focus:outline-none focus:border-brand-500 disabled:opacity-50"
                                    aria-label="Porsi gram"
                                  />
                                  <span className="text-xs text-text-muted">
                                    g
                                  </span>
                                </div>
                                <div className="text-xs tabular-nums text-text-muted">
                                  <span className="font-bold text-fg">
                                    {fmtNum(liveKcal)}
                                  </span>{" "}
                                  kcal · P{liveP} F{liveF} C{liveC}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Live totals */}
                {photoTotals && photoSelectedCount > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                    <div className="text-xs text-brand-100 uppercase tracking-wide font-semibold">
                      Total yang akan di-log
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">
                        {fmtNum(photoTotals.kcal)}
                      </span>
                      <span className="text-sm text-brand-100">
                        kcal · {photoSelectedCount} item
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-brand-100">Protein</div>
                        <div className="font-bold tabular-nums">
                          {photoTotals.protein_g}g
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-100">Lemak</div>
                        <div className="font-bold tabular-nums">
                          {photoTotals.fat_g}g
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-100">Karbo</div>
                        <div className="font-bold tabular-nums">
                          {photoTotals.carb_g}g
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Caveat notes */}
                {analysis.notes && analysis.notes.length > 0 && (
                  <div className="p-3 rounded-xl bg-surface-muted space-y-0.5">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                      Catatan AI
                    </div>
                    {analysis.notes.map((n, i) => (
                      <p
                        key={i}
                        className="text-xs text-fg/80 leading-snug"
                      >
                        • {n}
                      </p>
                    ))}
                  </div>
                )}

                {/* Swap suggestions */}
                {analysis.swap_suggestions &&
                  analysis.swap_suggestions.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-1">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        💡 Ide swap lebih sehat
                      </div>
                      {analysis.swap_suggestions.map((s, i) => (
                        <p
                          key={i}
                          className="text-xs text-amber-800 dark:text-amber-200 leading-snug"
                        >
                          <span className="font-semibold">{s.current}</span> →{" "}
                          <span className="font-semibold">{s.swap_to}</span>
                          <span className="text-amber-700/80 dark:text-amber-300/80">
                            {" "}
                            · {s.benefit}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        {/* Body — Manual mode */}
        {mode === "manual" && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <Field label="Nama makanan">
              <input
                autoFocus
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="contoh: Nasi padang"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500"
              />
            </Field>
            <Field label="Porsi (gram)">
              <input
                type="number"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                min={1}
                step={5}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums"
              />
            </Field>
            <Field label="Kalori (kcal total)">
              <input
                type="number"
                value={manualKcal}
                onChange={(e) => setManualKcal(e.target.value)}
                min={0}
                step={10}
                placeholder="contoh: 650"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums"
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Protein (g)">
                <input
                  type="number"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(e.target.value)}
                  min={0}
                  step="0.1"
                  placeholder="-"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums text-sm"
                />
              </Field>
              <Field label="Lemak (g)">
                <input
                  type="number"
                  value={manualFat}
                  onChange={(e) => setManualFat(e.target.value)}
                  min={0}
                  step="0.1"
                  placeholder="-"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums text-sm"
                />
              </Field>
              <Field label="Karbo (g)">
                <input
                  type="number"
                  value={manualCarb}
                  onChange={(e) => setManualCarb(e.target.value)}
                  min={0}
                  step="0.1"
                  placeholder="-"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums text-sm"
                />
              </Field>
            </div>
            <p className="text-xs text-text-muted leading-snug">
              Tip: kalau gak tau macro detail, kosongin aja — minimum cuma kcal
              total yang dibutuhin.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {mode === "search" && (
            <button
              onClick={handleAddFromSearch}
              disabled={!selected || !macros}
              className={cn(
                "w-full px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all",
                selected && macros
                  ? "bg-fg text-bg hover:-translate-y-0.5 shadow-lg"
                  : "bg-surface-muted text-text-muted cursor-not-allowed",
              )}
            >
              <Plus className="w-4 h-4" />
              Tambah ke {MEAL_SLOT_LABEL[slot]}
            </button>
          )}
          {mode === "manual" && (
            <button
              onClick={handleAddManual}
              disabled={
                !manualName.trim() ||
                !Number.isFinite(Number.parseFloat(manualKcal))
              }
              className={cn(
                "w-full px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all",
                manualName.trim() && manualKcal
                  ? "bg-fg text-bg hover:-translate-y-0.5 shadow-lg"
                  : "bg-surface-muted text-text-muted cursor-not-allowed",
              )}
            >
              <Plus className="w-4 h-4" />
              Tambah ke {MEAL_SLOT_LABEL[slot]}
            </button>
          )}
          {mode === "photo" && (
            <button
              onClick={handleAddFromPhoto}
              disabled={!analysis || photoSelectedCount === 0}
              className={cn(
                "w-full px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all",
                analysis && photoSelectedCount > 0
                  ? "bg-fg text-bg hover:-translate-y-0.5 shadow-lg"
                  : "bg-surface-muted text-text-muted cursor-not-allowed",
              )}
            >
              <Plus className="w-4 h-4" />
              {!analysis
                ? "Analisis foto dulu"
                : photoSelectedCount === 0
                  ? "Pilih item yang mau di-log"
                  : `Tambah ${photoSelectedCount} item ke ${MEAL_SLOT_LABEL[slot]}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
