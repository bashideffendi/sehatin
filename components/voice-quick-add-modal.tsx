"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Sparkles, Check, Loader2 } from "lucide-react";
import { Card, Kicker, Btn, Pill } from "@/components/ui";
import { fmtKcal } from "@/lib/format";
import type { MealSlot } from "@/lib/food-log";

interface ParsedItem {
  food_name: string;
  portion_g: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  confidence: "high" | "medium" | "low";
}

interface AddPayload {
  food_name: string;
  portion_g: number;
  kcal: number;
  protein_g?: number;
  fat_g?: number;
  carb_g?: number;
}

interface Props {
  open: boolean;
  defaultSlot?: MealSlot;
  onClose: () => void;
  onAdd: (item: AddPayload, slot: MealSlot) => void;
}

// Web Speech API types — not in default lib.dom, declare minimal shape
interface ISpeechRecognitionEvent extends Event {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const SLOT_LABEL: Record<MealSlot, string> = {
  sarapan: "Sarapan",
  makan_siang: "Makan Siang",
  makan_malam: "Makan Malam",
  snack: "Snack",
};

export function VoiceQuickAddModal({ open, defaultSlot, onClose, onAdd }: Props) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<MealSlot>(defaultSlot ?? "sarapan");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SRClass = getSpeechRecognition();
    setSupported(!!SRClass);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTranscript("");
      setInterimTranscript("");
      setItems([]);
      setSummary("");
      setError(null);
      setListening(false);
    }
  }, [open]);

  const startListening = useCallback(() => {
    const SRClass = getSpeechRecognition();
    if (!SRClass) return;
    const r = new SRClass();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "id-ID";
    r.onresult = (e: ISpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const t = res[0].transcript;
        if (res.isFinal) finalText += t;
        else interimText += t;
      }
      if (finalText) setTranscript((cur) => cur + finalText);
      setInterimTranscript(interimText);
    };
    r.onerror = () => {
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
    };
    r.start();
    recognitionRef.current = r;
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterimTranscript("");
  }, []);

  const handleParse = useCallback(async () => {
    if (!transcript.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          meal_slot: slot,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        items?: ParsedItem[];
        summary?: string;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Parse gagal");
        return;
      }
      setItems(data.items ?? []);
      setSummary(data.summary ?? "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setParsing(false);
    }
  }, [transcript, slot]);

  const handleAddAll = useCallback(() => {
    for (const item of items) {
      onAdd(
        {
          food_name: item.food_name,
          portion_g: item.portion_g,
          kcal: item.kcal,
          protein_g: item.protein_g,
          fat_g: item.fat_g,
          carb_g: item.carb_g,
        },
        slot,
      );
    }
    onClose();
  }, [items, slot, onAdd, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-paper rounded-t-[28px] sm:rounded-[28px] shadow-[var(--shadow-paper-3)] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <div>
            <Kicker>Voice quick-add</Kicker>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">
              Cerita{" "}
              <span
                className="italic text-clay font-normal"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                makan kamu.
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-2 text-muted inline-flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!supported && (
            <Card surface="surface-2" radius="md" shadow="none" className="p-3 border-clay/30">
              <p className="text-clay text-sm">
                Browser kamu gak support voice recognition. Coba Chrome / Edge / Safari terbaru.
              </p>
            </Card>
          )}

          {supported && items.length === 0 && (
            <>
              {/* Slot picker */}
              <div>
                <Kicker className="mb-2">Slot</Kicker>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["sarapan", "makan_siang", "makan_malam", "snack"] as MealSlot[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setSlot(s)}
                        className={`py-2 rounded-[12px] border text-[11px] font-semibold transition-colors ${
                          slot === s
                            ? "border-forest bg-forest-50 text-forest"
                            : "border-hairline text-muted hover:border-hairline-2"
                        }`}
                      >
                        {SLOT_LABEL[s]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Mic button */}
              <div className="flex flex-col items-center py-6">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    listening
                      ? "bg-clay text-paper shadow-[var(--shadow-paper-3)] scale-110 animate-pulse"
                      : "bg-forest text-paper shadow-[var(--shadow-forest)] hover:-translate-y-0.5"
                  }`}
                  aria-label={listening ? "Stop" : "Start recording"}
                >
                  {listening ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
                <p className="mt-3 text-[12px] text-muted">
                  {listening
                    ? "Lagi dengerin... klik buat stop"
                    : 'Klik & cerita. Cth: "2 piring nasi sama es teh"'}
                </p>
              </div>

              {/* Transcript display */}
              <div className="rounded-[14px] bg-surface-2 border border-hairline p-4 min-h-[80px]">
                <Kicker className="mb-2">Transcript</Kicker>
                {transcript || interimTranscript ? (
                  <p className="text-[13px] leading-relaxed">
                    <span className="text-ink">{transcript}</span>
                    <span className="text-muted italic">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-[12px] text-muted italic">
                    Belum ada teks. Mulai bicara.
                  </p>
                )}
              </div>

              {error && (
                <Card surface="surface-2" radius="md" shadow="none" className="p-3 border-rose/30">
                  <p className="text-rose text-sm">{error}</p>
                </Card>
              )}
            </>
          )}

          {/* Parsed items review */}
          {items.length > 0 && (
            <>
              <Card surface="surface-2" radius="md" shadow="none" className="p-3">
                <Kicker className="mb-1">AI summary</Kicker>
                <p className="text-[12.5px] leading-relaxed">{summary}</p>
              </Card>

              <div>
                <Kicker className="mb-2">
                  {items.length} item dideteksi
                </Kicker>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-[14px] bg-surface border border-hairline p-3"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-bold text-[13.5px]">
                          {item.food_name}
                        </span>
                        <span
                          className="tabular leading-none flex-shrink-0"
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 20,
                          }}
                        >
                          {fmtKcal(item.kcal)}
                          <span className="text-[10px] text-muted ml-0.5">
                            kcal
                          </span>
                        </span>
                      </div>
                      <div className="text-[10.5px] text-muted tabular space-x-2">
                        <span>{item.portion_g}g</span>
                        {item.protein_g != null && (
                          <span>
                            ·{" "}
                            <span className="font-semibold text-ink/70">
                              {item.protein_g}g
                            </span>
                            P
                          </span>
                        )}
                        {item.fat_g != null && (
                          <span>
                            ·{" "}
                            <span className="font-semibold text-ink/70">
                              {item.fat_g}g
                            </span>
                            L
                          </span>
                        )}
                        {item.carb_g != null && (
                          <span>
                            ·{" "}
                            <span className="font-semibold text-ink/70">
                              {item.carb_g}g
                            </span>
                            K
                          </span>
                        )}
                        {item.confidence === "low" && (
                          <Pill tone="clay" size="sm" className="ml-2">
                            low confidence
                          </Pill>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-hairline flex items-center gap-2">
          {items.length > 0 ? (
            <>
              <button
                onClick={() => setItems([])}
                className="px-4 py-2.5 rounded-full text-[12px] font-semibold text-muted hover:text-ink"
              >
                Ulangi
              </button>
              <button
                onClick={handleAddAll}
                className="flex-1 py-2.5 rounded-full bg-forest text-paper font-bold text-[13px] hover:bg-forest-700 shadow-[var(--shadow-forest)] inline-flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Catat {items.length} item ke {SLOT_LABEL[slot]}
              </button>
            </>
          ) : (
            <button
              onClick={handleParse}
              disabled={!transcript.trim() || parsing || listening}
              className="flex-1 py-2.5 rounded-full bg-forest text-paper font-bold text-[13px] hover:bg-forest-700 shadow-[var(--shadow-forest)] disabled:opacity-50 disabled:hover:translate-y-0 inline-flex items-center justify-center gap-2"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> AI parsing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Parse pakai AI
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
