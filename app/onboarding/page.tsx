"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ArrowRight,
  TrendingUp,
  Heart,
  Activity,
  Brain,
  CheckCircle2,
  MapPin,
  Loader2,
  Salad,
  Dumbbell,
  AlertCircle,
} from "lucide-react";
import {
  MascotBubble,
  MascotScene,
  OptionCard,
  WizardCta,
  WizardShell,
  NumberInput,
  LikertScale,
  BodyTypeCard,
  StatRow,
} from "@/components/wizard";
import {
  saveProfile,
  loadProfile,
  type UserProfile,
  type WeightGoalMagnitude,
  type MainMotivation,
  type BodyType,
  type TargetBody,
  type TargetZone,
  type SleepDuration,
  type WaterConsumption,
  type EatLocation,
  type LifeEvent,
  type BodyImageSatisfaction,
  type SpecialOccasion,
  type Likert,
  type MedicalCondition,
  type FoodAllergy,
  type SnackTime,
  type UnderlyingMotivation,
  type ReadinessLevel,
  type HabitAnchor,
  type PacePreference,
} from "@/lib/profile";
import { calculateTargets } from "@/src/nutrition/tdee";
import {
  applyDietPresetMacros,
  getDietPreset,
} from "@/src/nutrition/diet-methods";
import { calculateBMI } from "@/src/nutrition/bmi";
import { saveMealPlan } from "@/lib/meal-plan";
import { saveWorkoutPlan } from "@/lib/workout";
import { todayISO } from "@/lib/food-log";
import { fmtNum } from "@/lib/utils";

// =====================================================
// STEP FLOW (24 unique steps + 5 interstitials = 29 screens)
// =====================================================
type Step =
  | "welcome"
  | "weight_goal_magnitude"
  | "sex"
  | "age_bracket"
  | "is_social_1"
  | "main_motivation"
  | "current_body"
  | "target_body"
  | "target_zones"
  | "is_social_2"
  | "activity"
  | "tracker"
  | "medical"
  | "allergies"
  | "age_exact"
  | "height"
  | "weight"
  | "weight_target"
  | "is_summary"
  | "special_occasion"
  | "event_date"
  | "is_prediction_1"
  | "sleep"
  | "water"
  | "eat_locations"
  | "diet"
  | "snack_time"
  | "psy_plate"
  | "psy_emotional"
  | "psy_mindless"
  | "psy_consistency"
  | "underlying_motivation"
  | "readiness"
  | "habit_anchor"
  | "pace"
  | "is_prediction_2"
  | "life_events"
  | "body_image_sat"
  | "province"
  | "budget"
  | "equipment"
  | "calculating"
  | "result";

const STEP_ORDER: Step[] = [
  "welcome",
  "weight_goal_magnitude",
  "sex",
  "age_bracket",
  "is_social_1",
  "main_motivation",
  "current_body",
  "target_body",
  "target_zones",
  "is_social_2",
  "activity",
  "tracker",
  "medical",
  "allergies",
  "age_exact",
  "height",
  "weight",
  "weight_target",
  "is_summary",
  "special_occasion",
  "event_date",
  "is_prediction_1",
  "sleep",
  "water",
  "eat_locations",
  "diet",
  "snack_time",
  "psy_plate",
  "psy_emotional",
  "psy_mindless",
  "psy_consistency",
  "underlying_motivation",
  "readiness",
  "habit_anchor",
  "pace",
  "is_prediction_2",
  "life_events",
  "body_image_sat",
  "province",
  "budget",
  "equipment",
  "calculating",
  "result",
];

// steps that count toward progress bar (exclude welcome, interstitials, calculating, result)
const PROGRESS_STEPS: Step[] = STEP_ORDER.filter(
  (s) =>
    s !== "welcome" &&
    !s.startsWith("is_") &&
    s !== "calculating" &&
    s !== "result",
);

const NAV_NO_TOPBAR: Step[] = [
  "welcome",
  "is_social_1",
  "is_social_2",
  "is_summary",
  "is_prediction_1",
  "is_prediction_2",
  "calculating",
  "result",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const existing = loadProfile();
    if (existing) setProfile(existing);
    // Mark session — user has entered the app
    import("@/lib/session").then((m) => m.markEnteredApp());
  }, []);

  useEffect(() => {
    if (step !== "calculating") return;
    const id = setTimeout(() => {
      setStep("result");
      saveProfile({
        ...profile,
        completed_at: new Date().toISOString(),
      });
    }, 2800);
    return () => clearTimeout(id);
  }, [step, profile]);

  const currentIdx = STEP_ORDER.indexOf(step);
  const progressCurrent =
    PROGRESS_STEPS.indexOf(step) === -1 ? 0 : PROGRESS_STEPS.indexOf(step) + 1;

  const update = (patch: Partial<UserProfile>) =>
    setProfile((p) => ({ ...p, ...patch }));

  const goBack = () => {
    if (step === "calculating") return;
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]!);
  };

  const goNext = (next?: Step) => {
    if (next) {
      setStep(next);
      return;
    }
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]!);
  };

  const showTopBar = !NAV_NO_TOPBAR.includes(step);

  return (
    <WizardShell
      current={progressCurrent}
      total={PROGRESS_STEPS.length}
      onBack={showTopBar && currentIdx > 1 ? goBack : undefined}
      onSkip={
        showTopBar
          ? () => {
              const idx = STEP_ORDER.indexOf(step);
              if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]!);
            }
          : undefined
      }
    >
      <div className="flex flex-col">
        {/* IDENTITY ===================================== */}
        {step === "welcome" && (
          <WelcomeStep onStart={() => goNext("weight_goal_magnitude")} />
        )}

        {step === "weight_goal_magnitude" && (
          <WeightGoalMagnitudeStep
            value={profile.weight_goal_magnitude}
            onChange={(v) => {
              update({
                weight_goal_magnitude: v,
                goal:
                  v === "lose_1_10"
                    ? "fat_loss"
                    : v === "lose_11_20"
                      ? "fat_loss"
                      : v === "lose_20plus"
                        ? "fat_loss_aggressive"
                        : v === "maintain"
                          ? "maintain"
                          : "muscle_gain",
              });
              setTimeout(() => goNext("sex"), 200);
            }}
          />
        )}

        {step === "sex" && (
          <SexStep
            value={profile.sex}
            onChange={(sex) => {
              update({ sex });
              setTimeout(() => goNext("age_bracket"), 200);
            }}
          />
        )}

        {step === "age_bracket" && (
          <AgeBracketStep
            value={profile.age_bracket}
            onChange={(age_bracket) => {
              update({ age_bracket });
              setTimeout(() => goNext("is_social_1"), 200);
            }}
          />
        )}

        {step === "is_social_1" && (
          <InterstitialSocialProof1 onNext={() => goNext("main_motivation")} />
        )}

        {/* MOTIVATION =================================== */}
        {step === "main_motivation" && (
          <MainMotivationStep
            value={profile.main_motivation}
            onChange={(v) => {
              update({ main_motivation: v });
              setTimeout(() => goNext("current_body"), 200);
            }}
          />
        )}

        {/* BODY VIZ ===================================== */}
        {step === "current_body" && (
          <CurrentBodyStep
            value={profile.current_body_type}
            sex={profile.sex}
            onChange={(v) => {
              update({ current_body_type: v });
              setTimeout(() => goNext("target_body"), 200);
            }}
          />
        )}

        {step === "target_body" && (
          <TargetBodyStep
            value={profile.target_body_type}
            sex={profile.sex}
            onChange={(v) => {
              update({ target_body_type: v });
              setTimeout(() => goNext("target_zones"), 200);
            }}
          />
        )}

        {step === "target_zones" && (
          <TargetZonesStep
            value={profile.target_zones ?? []}
            onToggle={(z) =>
              update({
                target_zones: (profile.target_zones ?? []).includes(z)
                  ? (profile.target_zones ?? []).filter((x) => x !== z)
                  : [...(profile.target_zones ?? []), z],
              })
            }
            onContinue={() => goNext("is_social_2")}
          />
        )}

        {step === "is_social_2" && (
          <InterstitialSocialProof2
            sex={profile.sex}
            ageBracket={profile.age_bracket}
            onNext={() => goNext("activity")}
          />
        )}

        {/* LIFESTYLE 1 ================================== */}
        {step === "activity" && (
          <ActivityStep
            value={profile.activity}
            onChange={(activity) => {
              update({ activity });
              setTimeout(() => goNext("tracker"), 200);
            }}
          />
        )}

        {step === "tracker" && (
          <TrackerStep
            value={profile.uses_fitness_tracker}
            onChange={(v) => {
              update({ uses_fitness_tracker: v });
              setTimeout(() => goNext("medical"), 200);
            }}
          />
        )}

        {step === "medical" && (
          <MedicalStep
            value={profile.medical_conditions ?? []}
            onToggle={(c) => {
              const list = profile.medical_conditions ?? [];
              if (c === "tidak_ada") {
                update({ medical_conditions: ["tidak_ada"] });
              } else {
                const next = list.includes(c)
                  ? list.filter((x) => x !== c)
                  : [...list.filter((x) => x !== "tidak_ada"), c];
                update({ medical_conditions: next });
              }
            }}
            onContinue={() => goNext("allergies")}
          />
        )}

        {step === "allergies" && (
          <AllergiesStep
            value={profile.food_allergies ?? []}
            onToggle={(a) => {
              const list = profile.food_allergies ?? [];
              update({
                food_allergies: list.includes(a)
                  ? list.filter((x) => x !== a)
                  : [...list, a],
              });
            }}
            onContinue={() => goNext("age_exact")}
          />
        )}

        {/* METRICS ====================================== */}
        {step === "age_exact" && (
          <AgeExactStep
            value={profile.age}
            onSet={(age) => update({ age })}
            onContinue={() => goNext("height")}
          />
        )}

        {step === "height" && (
          <HeightStep
            value={profile.height_cm}
            onSet={(v) => update({ height_cm: v })}
            onContinue={() => goNext("weight")}
          />
        )}

        {step === "weight" && (
          <WeightStep
            value={profile.weight_kg}
            onSet={(v) => update({ weight_kg: v })}
            onContinue={() => goNext("weight_target")}
          />
        )}

        {step === "weight_target" && (
          <WeightTargetStep
            value={profile.target_weight_kg}
            currentWeight={profile.weight_kg}
            onSet={(v) => update({ target_weight_kg: v })}
            onContinue={() => goNext("is_summary")}
          />
        )}

        {step === "is_summary" && (
          <InterstitialSummary
            profile={profile}
            onNext={() => goNext("special_occasion")}
          />
        )}

        {/* OCCASION ===================================== */}
        {step === "special_occasion" && (
          <SpecialOccasionStep
            value={profile.special_occasion}
            onChange={(v) => {
              update({ special_occasion: v });
              setTimeout(() => goNext("event_date"), 200);
            }}
          />
        )}

        {step === "event_date" && (
          <EventDateStep
            value={profile.target_event_date}
            onSet={(v) => update({ target_event_date: v })}
            onContinue={() => goNext("is_prediction_1")}
            onSkip={() => goNext("is_prediction_1")}
          />
        )}

        {step === "is_prediction_1" && (
          <InterstitialPrediction
            profile={profile}
            phase={1}
            onNext={() => goNext("sleep")}
          />
        )}

        {/* LIFESTYLE 2 ================================== */}
        {step === "sleep" && (
          <SleepStep
            value={profile.sleep_duration}
            onChange={(v) => {
              update({ sleep_duration: v });
              setTimeout(() => goNext("water"), 200);
            }}
          />
        )}

        {step === "water" && (
          <WaterStep
            value={profile.water_consumption}
            onChange={(v) => {
              update({ water_consumption: v });
              setTimeout(() => goNext("eat_locations"), 200);
            }}
          />
        )}

        {step === "eat_locations" && (
          <EatLocationsStep
            value={profile.eat_locations ?? []}
            onToggle={(loc) =>
              update({
                eat_locations: (profile.eat_locations ?? []).includes(loc)
                  ? (profile.eat_locations ?? []).filter((x) => x !== loc)
                  : [...(profile.eat_locations ?? []), loc],
              })
            }
            onContinue={() => goNext("diet")}
          />
        )}

        {/* DIET ========================================= */}
        {step === "diet" && (
          <DietStep
            value={profile.diet_method}
            onChange={(diet_method) => {
              update({ diet_method });
              setTimeout(() => goNext("snack_time"), 200);
            }}
          />
        )}

        {step === "snack_time" && (
          <SnackTimeStep
            value={profile.snack_time}
            onChange={(v) => {
              update({ snack_time: v });
              setTimeout(() => goNext("psy_plate"), 200);
            }}
          />
        )}

        {/* EATING PSYCHOLOGY ============================ */}
        {step === "psy_plate" && (
          <LikertStep
            statement="Aku selalu habiskan makanan di piring, walau udah kenyang"
            value={profile.eating_psychology?.plate_clearing}
            onChange={(v) => {
              update({
                eating_psychology: {
                  ...profile.eating_psychology,
                  plate_clearing: v,
                },
              });
              setTimeout(() => goNext("psy_emotional"), 250);
            }}
          />
        )}

        {step === "psy_emotional" && (
          <LikertStep
            statement="Kalau lagi stres atau bete, aku makan buat menghibur diri"
            value={profile.eating_psychology?.emotional_eating}
            onChange={(v) => {
              update({
                eating_psychology: {
                  ...profile.eating_psychology,
                  emotional_eating: v,
                },
              });
              setTimeout(() => goNext("psy_mindless"), 250);
            }}
          />
        )}

        {step === "psy_mindless" && (
          <LikertStep
            statement="Aku biasa makan sambil nonton TV / scroll HP / kerja"
            value={profile.eating_psychology?.mindless_eating}
            onChange={(v) => {
              update({
                eating_psychology: {
                  ...profile.eating_psychology,
                  mindless_eating: v,
                },
              });
              setTimeout(() => goNext("psy_consistency"), 250);
            }}
          />
        )}

        {step === "psy_consistency" && (
          <LikertStep
            statement="Aku konsisten sebentar, terus kerjaan/hidup mengganggu"
            value={profile.eating_psychology?.consistency_struggle}
            onChange={(v) => {
              update({
                eating_psychology: {
                  ...profile.eating_psychology,
                  consistency_struggle: v,
                },
              });
              setTimeout(() => goNext("underlying_motivation"), 250);
            }}
          />
        )}

        {step === "underlying_motivation" && (
          <UnderlyingMotivationStep
            value={profile.underlying_motivation}
            onChange={(v) => {
              update({ underlying_motivation: v });
              setTimeout(() => goNext("readiness"), 200);
            }}
          />
        )}

        {step === "readiness" && (
          <ReadinessStep
            value={profile.readiness_level}
            onChange={(v) => {
              update({ readiness_level: v });
              setTimeout(() => goNext("habit_anchor"), 200);
            }}
          />
        )}

        {step === "habit_anchor" && (
          <HabitAnchorStep
            value={profile.habit_anchor}
            onChange={(v) => {
              update({ habit_anchor: v });
              setTimeout(() => goNext("pace"), 200);
            }}
          />
        )}

        {step === "pace" && (
          <PaceStep
            value={profile.pace_preference}
            onChange={(v) => {
              update({ pace_preference: v });
              setTimeout(() => goNext("is_prediction_2"), 200);
            }}
          />
        )}

        {step === "is_prediction_2" && (
          <InterstitialPrediction
            profile={profile}
            phase={2}
            onNext={() => goNext("life_events")}
          />
        )}

        {/* HEALTH CONTEXT =============================== */}
        {step === "life_events" && (
          <LifeEventsStep
            value={profile.life_events ?? []}
            onToggle={(e) =>
              update({
                life_events: (profile.life_events ?? []).includes(e)
                  ? (profile.life_events ?? []).filter((x) => x !== e)
                  : [...(profile.life_events ?? []), e],
              })
            }
            onContinue={() => goNext("body_image_sat")}
          />
        )}

        {step === "body_image_sat" && (
          <BodyImageSatStep
            value={profile.body_image_satisfaction}
            onChange={(v) => {
              update({ body_image_satisfaction: v });
              setTimeout(() => goNext("province"), 200);
            }}
          />
        )}

        {/* INDONESIAN-SPECIFIC ========================== */}
        {step === "province" && (
          <ProvinceStep
            value={profile.province_id}
            onChange={(v) => {
              update({ province_id: v });
              setTimeout(() => goNext("budget"), 200);
            }}
          />
        )}

        {step === "budget" && (
          <BudgetStep
            value={profile.budget_idr_per_day}
            onChange={(v) => {
              update({ budget_idr_per_day: v });
              setTimeout(() => goNext("equipment"), 200);
            }}
          />
        )}

        {step === "equipment" && (
          <EquipmentStep
            value={profile.equipment_available ?? []}
            onToggle={(e) =>
              update({
                equipment_available: (
                  profile.equipment_available ?? []
                ).includes(e)
                  ? (profile.equipment_available ?? []).filter((x) => x !== e)
                  : [...(profile.equipment_available ?? []), e],
              })
            }
            onContinue={() => goNext("calculating")}
          />
        )}

        {step === "calculating" && <CalculatingStep />}

        {step === "result" && (
          <ResultStep
            profile={profile as UserProfile}
            onGoHome={() => router.push("/")}
            onGoTdee={() => router.push("/tools/tdee")}
          />
        )}
      </div>
    </WizardShell>
  );
}

// =====================================================
// COMPONENTS — IDENTITY
// =====================================================

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center text-center">
      <MascotScene
        emoji="🦝"
        message="Hai, aku Sehatin!"
        caption="Yuk kenalan dulu — 2-3 menit, aku tanya beberapa hal buat ngitung target kalori, susun meal plan budget-friendly, dan rekomendasi tools yang cocok. Datanya cuma disimpen di browser kamu."
      />
      <button
        onClick={onStart}
        className="mt-6 mx-auto inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-fg text-bg font-semibold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
      >
        Yuk mulai!
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const WEIGHT_GOAL_OPTIONS: {
  value: WeightGoalMagnitude;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { value: "lose_1_10", emoji: "📉", label: "Turun 1-10 kg", sub: "Defisit moderat, sustainable" },
  { value: "lose_11_20", emoji: "📉", label: "Turun 11-20 kg", sub: "Defisit moderat, journey lebih panjang" },
  { value: "lose_20plus", emoji: "📉", label: "Turun lebih dari 20 kg", sub: "Long-term plan, perlu sabar" },
  { value: "maintain", emoji: "⚖️", label: "Pertahankan berat sekarang", sub: "Fokus pola hidup sehat" },
  { value: "gain", emoji: "📈", label: "Naik berat / otot", sub: "Surplus + latihan kekuatan" },
];

function WeightGoalMagnitudeStep({
  value,
  onChange,
}: {
  value?: WeightGoalMagnitude;
  onChange: (v: WeightGoalMagnitude) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Apa goal berat badan kamu?" />
      <div className="space-y-3 pt-4">
        {WEIGHT_GOAL_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

function SexStep({
  value,
  onChange,
}: {
  value?: "m" | "f";
  onChange: (s: "m" | "f") => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Jenis kelamin kamu?" />
      <div className="space-y-3 pt-4">
        <OptionCard
          emoji="👨"
          label="Pria"
          sublabel="Male"
          selected={value === "m"}
          onClick={() => onChange("m")}
        />
        <OptionCard
          emoji="👩"
          label="Wanita"
          sublabel="Female"
          selected={value === "f"}
          onClick={() => onChange("f")}
        />
      </div>
    </div>
  );
}

const AGE_BRACKETS: { value: NonNullable<UserProfile["age_bracket"]>; label: string; sub: string }[] = [
  { value: "18-24", label: "18-24 tahun", sub: "Metabolisme tinggi, optimal building" },
  { value: "25-34", label: "25-34 tahun", sub: "Peak adult, fokus konsistensi" },
  { value: "35-44", label: "35-44 tahun", sub: "Metabolisme mulai turun, recovery penting" },
  { value: "45-54", label: "45-54 tahun", sub: "Mobility + cardio prioritas" },
  { value: "55plus", label: "55+ tahun", sub: "Functional fitness + nutrisi padat" },
];

function AgeBracketStep({
  value,
  onChange,
}: {
  value?: UserProfile["age_bracket"];
  onChange: (v: NonNullable<UserProfile["age_bracket"]>) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Range usia kamu?" />
      <div className="space-y-3 pt-4">
        {AGE_BRACKETS.map((o) => (
          <OptionCard
            key={o.value}
            emoji="🎂"
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// INTERSTITIALS
// =====================================================

function InterstitialSocialProof1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
      <div className="text-7xl mb-4">🇮🇩</div>
      <p className="text-4xl font-bold tracking-tight text-brand-600">
        3+ juta orang
      </p>
      <p className="mt-2 text-text-muted">
        di Asia Tenggara udah pakai tools fitness & wellness pintar
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-md">
        {[
          { rating: "5.0", text: "Akhirnya bisa konsisten" },
          { rating: "4.6", text: "14K ratings" },
          { rating: "4.9", text: "Cocok buat pemula" },
        ].map((t, i) => (
          <div
            key={i}
            className="px-4 py-2 rounded-2xl bg-surface border border-border text-sm shadow-sm"
          >
            <span className="font-bold text-accent-500">{t.rating} ⭐</span>{" "}
            <span className="text-text-muted">{t.text}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-fg text-bg font-semibold shadow-lg hover:-translate-y-0.5"
      >
        Lanjut <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function InterstitialSocialProof2({
  sex,
  ageBracket,
  onNext,
}: {
  sex?: "m" | "f";
  ageBracket?: UserProfile["age_bracket"];
  onNext: () => void;
}) {
  // Fake personalized stat — bitepal pattern
  const labelSex = sex === "m" ? "pria" : sex === "f" ? "wanita" : "orang";
  const labelAge = ageBracket ? ` ${ageBracket} tahun` : "";
  const count = Math.floor(48000 + Math.random() * 14000); // 48k-62k

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
      <div className="text-5xl mb-4">🤝</div>
      <h2 className="text-2xl font-bold tracking-tight">Kamu nggak sendirian</h2>
      <p className="mt-3 text-text-muted max-w-xs">
        <span className="font-bold text-fg text-3xl block mb-1">
          {fmtNum(count)} {labelSex}
        </span>
        {labelAge && (
          <span>
            usia {ageBracket} udah mulai journey-nya dengan kita.
          </span>
        )}
      </p>
      <button
        onClick={onNext}
        className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-fg text-bg font-semibold shadow-lg hover:-translate-y-0.5"
      >
        Lanjut <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function InterstitialSummary({
  profile,
  onNext,
}: {
  profile: Partial<UserProfile>;
  onNext: () => void;
}) {
  const bmi = useMemo(() => {
    if (!profile.weight_kg || !profile.height_cm) return null;
    return calculateBMI({
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
    });
  }, [profile.weight_kg, profile.height_cm]);

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Ringkasan kamu</h2>
        <p className="mt-2 text-text-muted">
          Aku udah punya gambaran awal nih.
        </p>
      </div>

      {bmi && (
        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="text-xs font-semibold text-text-muted tracking-wide uppercase mb-2">
            BMI (Asia-Pacific)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums">{bmi.bmi}</span>
            <span className="text-text-muted">kg/m²</span>
          </div>
          <span className="mt-2 inline-block px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 text-xs font-bold">
            {bmi.bmi_label_id}
          </span>
        </div>
      )}

      <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
        <StatRow
          icon={<Activity className="w-4 h-4 text-sky-500" />}
          label="Activity level"
          value={profile.activity?.replace("_", " ") ?? "—"}
        />
        <StatRow
          icon={<span>🔥</span>}
          label="Estimasi metabolisme"
          value={
            profile.activity === "sedentary"
              ? "Lambat"
              : profile.activity === "active" ||
                  profile.activity === "very_active"
                ? "Cepat"
                : "Normal"
          }
        />
        <StatRow
          icon={<Heart className="w-4 h-4 text-rose-500" />}
          label="Motivasi utama"
          value={
            profile.main_motivation === "lose_weight"
              ? "Turun BB"
              : profile.main_motivation === "heart_health"
                ? "Kesehatan jantung"
                : profile.main_motivation === "firm_toned"
                  ? "Body shape"
                  : profile.main_motivation === "stress_relief"
                    ? "Stress relief"
                    : profile.main_motivation === "energy"
                      ? "Energi"
                      : "—"
          }
        />
      </div>

      {bmi &&
        (bmi.health_risk_asia === "high" ||
          bmi.health_risk_asia === "very_high" ||
          bmi.health_risk_asia === "moderate") && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
              ⚠️ Catatan kesehatan
            </p>
            <p className="text-fg/80">
              Rentang BMI ini bisa terkait risk lebih tinggi untuk hipertensi,
              diabetes tipe 2, dan masalah sendi (Kemenkes RI). Tapi tenang —
              langkah kecil bawa perubahan besar.
            </p>
          </div>
        )}

      <button
        onClick={onNext}
        className="w-full px-6 py-4 rounded-2xl bg-fg text-bg font-semibold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        Lanjut
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function InterstitialPrediction({
  profile,
  phase,
  onNext,
}: {
  profile: Partial<UserProfile>;
  phase: 1 | 2;
  onNext: () => void;
}) {
  const target = profile.target_weight_kg ?? profile.weight_kg ?? 0;
  const current = profile.weight_kg ?? 0;
  const deltaKg = current - target;
  // Rough: ~0.5kg/week loss (sustainable) → weeks needed
  // Phase 2 shaves 1 week off (positive reinforcement)
  const baseWeeks = Math.max(2, Math.round(Math.abs(deltaKg) * 2));
  const weeks = phase === 1 ? baseWeeks : Math.max(2, baseWeeks - 1);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [weeks]);

  if (deltaKg <= 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="text-2xl font-bold tracking-tight">
          Berat target kamu udah pas
        </h2>
        <p className="mt-3 text-text-muted max-w-xs">
          Fokus jaga konsistensi gaya hidup sehat. Aku bantu maintain.
        </p>
        <button
          onClick={onNext}
          className="mt-8 px-8 py-4 rounded-2xl bg-fg text-bg font-semibold shadow-lg"
        >
          Lanjut →
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
      {phase === 2 && (
        <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mb-3">
          ✨ Update lebih akurat
        </span>
      )}
      <p className="text-text-muted text-sm">Kami prediksi</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">
        tanggal{" "}
        <span className="text-brand-600">{targetDate}</span>
      </p>
      <p className="mt-2 text-xl font-semibold">
        kamu bakal {fmtNum(target)} kg
      </p>

      <div className="mt-8 w-full max-w-xs">
        <WeightCurve
          startKg={current}
          endKg={target}
          weeks={weeks}
        />
      </div>

      <p className="mt-6 text-sm text-text-muted max-w-xs">
        {phase === 1
          ? "Estimasi awal berdasarkan profil dasar kamu. Bakal di-refine setelah beberapa pertanyaan lagi."
          : "Berdasarkan jawaban kamu, momentum kamu cukup kuat. Target lebih cepat dari estimasi awal!"}
      </p>

      <button
        onClick={onNext}
        className="mt-8 px-8 py-4 rounded-2xl bg-fg text-bg font-semibold shadow-lg hover:-translate-y-0.5"
      >
        Mantap, lanjut →
      </button>
    </div>
  );
}

function WeightCurve({
  startKg,
  endKg,
  weeks,
}: {
  startKg: number;
  endKg: number;
  weeks: number;
}) {
  const w = 280;
  const h = 100;
  const padding = 16;
  const path = `M ${padding} ${padding} Q ${w / 2} ${padding + 10}, ${w - padding} ${h - padding}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#weightGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx={padding} cy={padding} r="5" fill="#f97316" />
      <circle
        cx={w - padding}
        cy={h - padding}
        r="5"
        fill="#10b981"
        stroke="white"
        strokeWidth="2"
      />
      <text
        x={padding}
        y={padding - 6}
        fontSize="11"
        fill="#78716c"
        textAnchor="start"
      >
        {startKg} kg
      </text>
      <text
        x={w - padding}
        y={h - padding + 14}
        fontSize="11"
        fontWeight="bold"
        fill="#10b981"
        textAnchor="end"
      >
        {endKg} kg ✓
      </text>
      <text x={padding} y={h - 4} fontSize="9" fill="#78716c">
        Hari ini
      </text>
      <text x={w - padding} y={padding} fontSize="9" fill="#78716c" textAnchor="end">
        {weeks} minggu
      </text>
    </svg>
  );
}

// =====================================================
// MOTIVATION
// =====================================================

const MOTIVATION_OPTIONS: {
  value: MainMotivation;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { value: "lose_weight", emoji: "📉", label: "Turun berat badan", sub: "Body composition shift" },
  { value: "heart_health", emoji: "❤️", label: "Kesehatan jantung", sub: "Tekanan darah & kolesterol" },
  { value: "firm_toned", emoji: "💪", label: "Body shape & tone", sub: "Tampil lebih firm" },
  { value: "stress_relief", emoji: "🧘", label: "Kurangi stres", sub: "Mental wellness + ritual" },
  { value: "energy", emoji: "⚡", label: "Boost energi harian", sub: "Gak gampang capek" },
  { value: "longevity", emoji: "🌱", label: "Hidup lebih lama & sehat", sub: "Long-term health" },
];

function MainMotivationStep({
  value,
  onChange,
}: {
  value?: MainMotivation;
  onChange: (v: MainMotivation) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Apa motivasi utama kamu?" />
      <div className="space-y-3 pt-4">
        {MOTIVATION_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// BODY VIZ
// =====================================================

function CurrentBodyStep({
  value,
  sex,
  onChange,
}: {
  value?: BodyType;
  sex?: "m" | "f";
  onChange: (v: BodyType) => void;
}) {
  const cards: { value: BodyType; emoji: string; label: string; desc: string }[] = [
    { value: "kurus", emoji: "🧍", label: "Kurus", desc: "BB di bawah normal, kurang massa" },
    { value: "regular", emoji: "🙂", label: "Regular", desc: "Tampak proporsional" },
    { value: "berisi", emoji: "🙆", label: "Berisi", desc: "Sedikit di atas ideal" },
    { value: "ekstra", emoji: "🫃", label: "Ekstra", desc: "Punya banyak lemak terutama di perut" },
  ];
  return (
    <div className="space-y-6">
      <MascotBubble message="Body type kamu sekarang gimana?" />
      <div className="space-y-3 pt-4">
        {cards.map((c) => (
          <BodyTypeCard
            key={c.value}
            emoji={c.emoji}
            label={c.label}
            desc={c.desc}
            selected={value === c.value}
            onClick={() => onChange(c.value)}
          />
        ))}
      </div>
    </div>
  );
}

function TargetBodyStep({
  value,
  sex,
  onChange,
}: {
  value?: TargetBody;
  sex?: "m" | "f";
  onChange: (v: TargetBody) => void;
}) {
  const cards: {
    value: TargetBody;
    emoji: string;
    label: string;
    desc: string;
  }[] = [
    { value: "fit_strong", emoji: "💪", label: "Fit & strong", desc: "Sehat fungsional, mampu aktivitas berat" },
    { value: "lean", emoji: "🏃", label: "Lean", desc: "Kurus tapi tegap, low body fat" },
    { value: "athletic", emoji: "🤸", label: "Athletic", desc: "Otot kelihatan, performa tinggi" },
    { value: "shredded", emoji: "🏋️", label: "Shredded", desc: "Otot definisi maksimal, body fat sangat rendah" },
  ];
  return (
    <div className="space-y-6">
      <MascotBubble message="Body type yang kamu pengen?" />
      <div className="space-y-3 pt-4">
        {cards.map((c) => (
          <BodyTypeCard
            key={c.value}
            emoji={c.emoji}
            label={c.label}
            desc={c.desc}
            selected={value === c.value}
            onClick={() => onChange(c.value)}
          />
        ))}
      </div>
    </div>
  );
}

const TARGET_ZONES: { value: TargetZone; emoji: string; label: string }[] = [
  { value: "perut", emoji: "🪨", label: "Perut" },
  { value: "dada", emoji: "🛡️", label: "Dada" },
  { value: "lengan", emoji: "💪", label: "Lengan" },
  { value: "punggung", emoji: "🔱", label: "Punggung" },
  { value: "paha", emoji: "🦵", label: "Paha" },
  { value: "bokong", emoji: "🍑", label: "Bokong" },
  { value: "betis", emoji: "🐂", label: "Betis" },
];

function TargetZonesStep({
  value,
  onToggle,
  onContinue,
}: {
  value: TargetZone[];
  onToggle: (z: TargetZone) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Bagian tubuh mana yang mau di-shape?" />
      <p className="text-sm text-text-muted text-center -mt-2">
        Pilih beberapa (multi-select)
      </p>
      <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
        {TARGET_ZONES.map((z) => {
          const selected = value.includes(z.value);
          return (
            <button
              key={z.value}
              onClick={() => onToggle(z.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                selected
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-border bg-surface hover:border-fg/20"
              }`}
            >
              <span className="text-3xl">{z.emoji}</span>
              <span className="font-semibold text-sm">{z.label}</span>
              {selected && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
            </button>
          );
        })}
      </div>
      <WizardCta onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

// =====================================================
// LIFESTYLE 1
// =====================================================

const ACTIVITY_OPTIONS = [
  {
    value: "sedentary" as const,
    emoji: "🪑",
    label: "Gak aktif",
    sub: "Kerja meja seharian, naik tangga aja udah ngos-ngosan",
  },
  {
    value: "light" as const,
    emoji: "🚶",
    label: "Sedikit aktif",
    sub: "Olahraga ringan 1-3x seminggu",
  },
  {
    value: "moderate" as const,
    emoji: "🏃",
    label: "Cukup aktif",
    sub: "Olahraga rutin 3-5x seminggu",
  },
  {
    value: "active" as const,
    emoji: "💪",
    label: "Aktif banget",
    sub: "Olahraga 6-7x seminggu",
  },
  {
    value: "very_active" as const,
    emoji: "🏋️",
    label: "Super aktif",
    sub: "Fitness atau pekerjaan fisik = lifestyle",
  },
];

function ActivityStep({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: (typeof ACTIVITY_OPTIONS)[number]["value"]) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Seaktif apa kamu sekarang?" />
      <div className="space-y-3 pt-4">
        {ACTIVITY_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

function TrackerStep({
  value,
  onChange,
}: {
  value?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Pake smartwatch atau fitness tracker?" />
      <div className="space-y-3 pt-4">
        <OptionCard
          emoji="⌚"
          label="Iya"
          sublabel="Apple Watch / Garmin / Mi Band / dll"
          selected={value === true}
          onClick={() => onChange(true)}
        />
        <OptionCard
          emoji="📱"
          label="Belum"
          sublabel="Cuma HP, atau gak track sama sekali"
          selected={value === false}
          onClick={() => onChange(false)}
        />
      </div>
    </div>
  );
}

// =====================================================
// METRICS
// =====================================================

function AgeExactStep({
  value,
  onSet,
  onContinue,
}: {
  value?: number;
  onSet: (v: number) => void;
  onContinue: () => void;
}) {
  const [v, setV] = useState(String(value ?? ""));
  const valid = useMemo(() => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 12 && n <= 100;
  }, [v]);
  return (
    <div className="space-y-6">
      <MascotBubble message="Usia kamu tepatnya berapa?" />
      <div className="pt-4 max-w-md mx-auto">
        <NumberInput
          value={v}
          onChange={(x) => {
            setV(x);
            const n = Number.parseInt(x, 10);
            if (Number.isFinite(n)) onSet(n);
          }}
          suffix="tahun"
          placeholder="28"
          min={12}
          max={100}
        />
      </div>
      <WizardCta onClick={onContinue} disabled={!valid} />
    </div>
  );
}

function HeightStep({
  value,
  onSet,
  onContinue,
}: {
  value?: number;
  onSet: (v: number) => void;
  onContinue: () => void;
}) {
  const [v, setV] = useState(String(value ?? ""));
  const valid = useMemo(() => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 100 && n <= 230;
  }, [v]);
  return (
    <div className="space-y-6">
      <MascotBubble message="Berapa tinggi kamu?" />
      <div className="pt-4 max-w-md mx-auto">
        <NumberInput
          value={v}
          onChange={(x) => {
            setV(x);
            const n = Number.parseFloat(x);
            if (Number.isFinite(n)) onSet(n);
          }}
          suffix="cm"
          placeholder="170"
          step={0.5}
        />
      </div>
      <WizardCta onClick={onContinue} disabled={!valid} />
    </div>
  );
}

function WeightStep({
  value,
  onSet,
  onContinue,
}: {
  value?: number;
  onSet: (v: number) => void;
  onContinue: () => void;
}) {
  const [v, setV] = useState(String(value ?? ""));
  const valid = useMemo(() => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 30 && n <= 250;
  }, [v]);
  return (
    <div className="space-y-6">
      <MascotBubble message="Berat sekarang berapa?" />
      <div className="pt-4 max-w-md mx-auto">
        <NumberInput
          value={v}
          onChange={(x) => {
            setV(x);
            const n = Number.parseFloat(x);
            if (Number.isFinite(n)) onSet(n);
          }}
          suffix="kg"
          placeholder="65"
          step={0.1}
        />
      </div>
      <WizardCta onClick={onContinue} disabled={!valid} />
    </div>
  );
}

function WeightTargetStep({
  value,
  currentWeight,
  onSet,
  onContinue,
}: {
  value?: number;
  currentWeight?: number;
  onSet: (v: number) => void;
  onContinue: () => void;
}) {
  const [v, setV] = useState(String(value ?? ""));
  const valid = useMemo(() => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 30 && n <= 250;
  }, [v]);
  return (
    <div className="space-y-6">
      <MascotBubble message="Berat targetnya berapa?" />
      <div className="pt-4 max-w-md mx-auto space-y-2">
        <NumberInput
          value={v}
          onChange={(x) => {
            setV(x);
            const n = Number.parseFloat(x);
            if (Number.isFinite(n)) onSet(n);
          }}
          suffix="kg"
          placeholder={currentWeight ? String(currentWeight - 5) : "60"}
          step={0.1}
        />
        {currentWeight && Number.parseFloat(v) > 0 && (
          <p className="text-xs text-text-muted text-center">
            Selisih:{" "}
            <strong className="text-fg">
              {Math.abs(currentWeight - Number.parseFloat(v)).toFixed(1)} kg
            </strong>
          </p>
        )}
      </div>
      <WizardCta onClick={onContinue} disabled={!valid} />
    </div>
  );
}

// =====================================================
// OCCASION
// =====================================================

const OCCASION_OPTIONS: {
  value: SpecialOccasion;
  emoji: string;
  label: string;
}[] = [
  { value: "liburan", emoji: "✈️", label: "Liburan" },
  { value: "pernikahan", emoji: "💍", label: "Pernikahan" },
  { value: "acara_olahraga", emoji: "🏃", label: "Lomba / acara olahraga" },
  { value: "reuni", emoji: "👥", label: "Reuni" },
  { value: "ramadan", emoji: "🌙", label: "Ramadan / Lebaran" },
  { value: "tidak_ada", emoji: "—", label: "Tidak ada acara spesifik" },
];

function SpecialOccasionStep({
  value,
  onChange,
}: {
  value?: SpecialOccasion;
  onChange: (v: SpecialOccasion) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Ada acara spesial yang mau kamu kejar?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Goal lebih kuat kalau ada timeline konkret
      </p>
      <div className="space-y-3 pt-2">
        {OCCASION_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

function EventDateStep({
  value,
  onSet,
  onContinue,
  onSkip,
}: {
  value?: string;
  onSet: (v: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <div className="space-y-6">
      <MascotBubble message="Kapan tanggal acaranya?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Data kamu cuma disimpan di browser, gak dishare ke siapapun.
      </p>
      <div className="pt-4 max-w-md mx-auto">
        <input
          type="date"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            onSet(e.target.value);
          }}
          className="w-full px-5 py-4 rounded-2xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-lg font-semibold tabular-nums"
        />
      </div>
      <div className="space-y-3 max-w-md mx-auto">
        <button
          onClick={onContinue}
          disabled={!v}
          className={`w-full px-6 py-4 rounded-2xl font-semibold transition-all ${
            v
              ? "bg-fg text-bg shadow-lg hover:-translate-y-0.5"
              : "bg-surface-muted text-text-muted cursor-not-allowed"
          }`}
        >
          Lanjut
        </button>
        <button
          onClick={onSkip}
          className="w-full px-6 py-3 text-text-muted hover:text-fg text-sm"
        >
          Skip pertanyaan ini
        </button>
      </div>
    </div>
  );
}

// =====================================================
// LIFESTYLE 2
// =====================================================

const SLEEP_OPTIONS: { value: SleepDuration; label: string; sub: string }[] = [
  { value: "lt5", label: "Kurang dari 5 jam", sub: "Sleep deprived, recovery jelek" },
  { value: "5_6", label: "5-6 jam", sub: "Below recommended, masih OK tapi tight" },
  { value: "7_8", label: "7-8 jam", sub: "Sweet spot, optimal recovery 🎯" },
  { value: "gt8", label: "Lebih dari 8 jam", sub: "Cukup, atau kebanyakan?" },
];

function SleepStep({
  value,
  onChange,
}: {
  value?: SleepDuration;
  onChange: (v: SleepDuration) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Tidur kamu berapa jam per malam?" />
      <div className="space-y-3 pt-4">
        {SLEEP_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji="😴"
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

const WATER_OPTIONS: { value: WaterConsumption; label: string; sub: string }[] = [
  { value: "tea_coffee_only", label: "Cuma teh / kopi", sub: "Air putih jarang" },
  { value: "lt2_glass", label: "Kurang dari 2 gelas", sub: "Underhydrated" },
  { value: "2_6_glass", label: "2-6 gelas", sub: "Lumayan tapi belum cukup" },
  { value: "7_10_glass", label: "7-10 gelas", sub: "Bagus banget 💧" },
  { value: "gt10_glass", label: "Lebih dari 10 gelas", sub: "Hydration champion" },
];

function WaterStep({
  value,
  onChange,
}: {
  value?: WaterConsumption;
  onChange: (v: WaterConsumption) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Minum air putih per hari berapa gelas?" />
      <div className="space-y-3 pt-4">
        {WATER_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji="💧"
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

const EAT_LOCATIONS: { value: EatLocation; emoji: string; label: string; sub: string }[] = [
  { value: "masak_rumah", emoji: "🍳", label: "Masak di rumah", sub: "Most controlled" },
  { value: "warung_warteg", emoji: "🍛", label: "Warteg / warung", sub: "Murah tapi tinggi natrium" },
  { value: "kantor_kantin", emoji: "🏢", label: "Kantin kantor / kampus", sub: "Menu campur" },
  { value: "resto", emoji: "🍽️", label: "Restoran / mall", sub: "Porsi besar biasanya" },
  { value: "delivery_gofood", emoji: "🛵", label: "GoFood / GrabFood", sub: "Variasi tapi mahal" },
];

function EatLocationsStep({
  value,
  onToggle,
  onContinue,
}: {
  value: EatLocation[];
  onToggle: (l: EatLocation) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Di mana kamu biasa makan?" />
      <p className="text-sm text-text-muted text-center -mt-2">Pilih beberapa</p>
      <div className="space-y-3 pt-2">
        {EAT_LOCATIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value.includes(o.value)}
            onClick={() => onToggle(o.value)}
          />
        ))}
      </div>
      <WizardCta onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

// =====================================================
// DIET
// =====================================================

const DIET_OPTIONS = [
  { value: "standard" as const, emoji: "🥗", label: "Standar seimbang", sub: "Pedoman gizi seimbang Kemenkes" },
  { value: "low_carb" as const, emoji: "🥑", label: "Low-Carb", sub: "Karbo 100-150g/hari" },
  { value: "keto" as const, emoji: "🥓", label: "Keto", sub: "Karbo <50g, fat dominan" },
  { value: "high_protein" as const, emoji: "🍗", label: "Tinggi protein", sub: "Cocok buat muscle gain" },
  { value: "mediterranean" as const, emoji: "🐟", label: "Mediterania", sub: "Ikan, sayur, lemak baik" },
  { value: "dash" as const, emoji: "💧", label: "DASH (anti hipertensi)", sub: "Rendah natrium" },
  { value: "plant_based" as const, emoji: "🌱", label: "Plant-based / Vegan", sub: "100% nabati" },
  { value: "vegetarian" as const, emoji: "🥬", label: "Vegetarian", sub: "Tanpa daging, susu+telur OK" },
  { value: "low_gi" as const, emoji: "🩺", label: "Low-GI (Diabetes-friendly)", sub: "Karbo low glycemic index" },
  { value: "ramadan" as const, emoji: "🌙", label: "Ramadan / Puasa", sub: "Eating window sahur-buka" },
];

function DietStep({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: (typeof DIET_OPTIONS)[number]["value"]) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Pola makan kamu kayak gimana?" />
      <div className="space-y-3 pt-4">
        {DIET_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// LIKERT (used 4x)
// =====================================================

function LikertStep({
  statement,
  value,
  onChange,
}: {
  statement: string;
  value?: Likert;
  onChange: (v: Likert) => void;
}) {
  return (
    <div className="py-8">
      <LikertScale
        statement={statement}
        value={value}
        onChange={onChange}
        leftLabel="Sama sekali"
        rightLabel="Banget"
      />
    </div>
  );
}

// =====================================================
// HEALTH CONTEXT
// =====================================================

const LIFE_EVENT_OPTIONS: {
  value: LifeEvent;
  emoji: string;
  label: string;
}[] = [
  { value: "medicine_hormonal", emoji: "💊", label: "Obat / gangguan hormonal" },
  { value: "busy_kerja_keluarga", emoji: "⏰", label: "Kerjaan / keluarga sibuk" },
  { value: "stress_mental", emoji: "🧠", label: "Stres / kesehatan mental" },
  { value: "kerjaan_baru", emoji: "💼", label: "Kerjaan baru" },
  { value: "pandemi", emoji: "🦠", label: "Pandemi Covid-19" },
  { value: "cedera", emoji: "🤕", label: "Cedera / sakit" },
  { value: "menikah", emoji: "💑", label: "Setelah menikah" },
  { value: "hamil_melahirkan", emoji: "🤰", label: "Hamil / melahirkan" },
  { value: "tidak_ada", emoji: "—", label: "Nggak ada yang spesifik" },
];

function LifeEventsStep({
  value,
  onToggle,
  onContinue,
}: {
  value: LifeEvent[];
  onToggle: (e: LifeEvent) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Ada peristiwa yang bikin berat naik?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Pilih yang relate. Bantu aku ngerti konteks kamu (gak ada penilaian!)
      </p>
      <div className="space-y-3 pt-2">
        {LIFE_EVENT_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            selected={value.includes(o.value)}
            onClick={() => onToggle(o.value)}
          />
        ))}
      </div>
      <WizardCta onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

const BODY_IMAGE_OPTIONS: {
  value: BodyImageSatisfaction;
  label: string;
  sub: string;
}[] = [
  { value: "lt1y", label: "Kurang dari setahun lalu", sub: "Body image masih oke-oke aja" },
  { value: "1_2y", label: "1-2 tahun lalu", sub: "Lumayan lama nggak puas" },
  { value: "gt3y", label: "Lebih dari 3 tahun lalu", sub: "Udah lama gak satisfied" },
  { value: "tidak_pernah", label: "Belum pernah, sejujurnya", sub: "Sama, gapapa — mulai dari sini" },
];

function BodyImageSatStep({
  value,
  onChange,
}: {
  value?: BodyImageSatisfaction;
  onChange: (v: BodyImageSatisfaction) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Kapan terakhir kamu happy sama body image kamu?" />
      <div className="space-y-3 pt-4">
        {BODY_IMAGE_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji="🪞"
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// INDONESIAN-SPECIFIC
// =====================================================

const PROVINCES: { id: number | "national"; label: string }[] = [
  { id: "national", label: "Nasional (rata-rata)" },
  { id: 13, label: "DKI Jakarta" },
  { id: 12, label: "Jawa Barat" },
  { id: 11, label: "Banten" },
  { id: 14, label: "Jawa Tengah" },
  { id: 15, label: "DI Yogyakarta" },
  { id: 16, label: "Jawa Timur" },
  { id: 17, label: "Bali" },
  { id: 1, label: "Aceh" },
  { id: 2, label: "Sumatera Utara" },
  { id: 3, label: "Sumatera Barat" },
  { id: 4, label: "Riau" },
  { id: 5, label: "Kepulauan Riau" },
  { id: 6, label: "Jambi" },
  { id: 7, label: "Bengkulu" },
  { id: 8, label: "Sumatera Selatan" },
  { id: 9, label: "Kepulauan Bangka Belitung" },
  { id: 10, label: "Lampung" },
  { id: 18, label: "Nusa Tenggara Barat" },
  { id: 19, label: "Nusa Tenggara Timur" },
  { id: 21, label: "Kalimantan Selatan" },
  { id: 22, label: "Kalimantan Tengah" },
  { id: 23, label: "Kalimantan Timur" },
  { id: 24, label: "Kalimantan Utara" },
  { id: 25, label: "Gorontalo" },
  { id: 26, label: "Sulawesi Selatan" },
  { id: 27, label: "Sulawesi Tenggara" },
  { id: 28, label: "Sulawesi Tengah" },
  { id: 29, label: "Sulawesi Utara" },
  { id: 30, label: "Sulawesi Barat" },
  { id: 31, label: "Maluku" },
  { id: 32, label: "Maluku Utara" },
  { id: 33, label: "Papua" },
  { id: 34, label: "Papua Barat" },
];

function ProvinceStep({
  value,
  onChange,
}: {
  value?: number | "national";
  onChange: (v: number | "national") => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Kamu tinggal di provinsi mana?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Buat hitung budget meal plan pakai harga pasar real di kotamu (PIHPS BI)
      </p>
      <div className="pt-4 max-w-md mx-auto">
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
          <select
            value={String(value ?? "")}
            onChange={(e) => {
              const v = e.target.value;
              onChange(v === "national" ? "national" : Number.parseInt(v, 10));
            }}
            className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-base font-semibold appearance-none"
          >
            <option value="">Pilih provinsi...</option>
            {PROVINCES.map((p) => (
              <option key={String(p.id)} value={String(p.id)}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const BUDGET_OPTIONS = [
  { value: 30000, emoji: "🪙", label: "Rp 30k/hari", sub: "Hemat banget, warteg + masak sendiri" },
  { value: 50000, emoji: "💵", label: "Rp 50k/hari", sub: "Standar mahasiswa / fresh grad" },
  { value: 75000, emoji: "💸", label: "Rp 75k/hari", sub: "Comfortable, variasi lauk lebih luas" },
  { value: 100000, emoji: "💳", label: "Rp 100k/hari", sub: "Bisa mall food / GoFood occasional" },
  { value: 150000, emoji: "💎", label: "Rp 150k+/hari", sub: "Premium / restoran sering" },
];

function BudgetStep({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Budget makan kamu sekitar berapa per hari?" />
      <div className="space-y-3 pt-4">
        {BUDGET_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

const EQUIPMENT_OPTIONS = [
  { value: "bodyweight" as const, emoji: "🤸", label: "Bodyweight aja", sub: "Push-up, squat, plank, dll" },
  { value: "dumbbell" as const, emoji: "🏋️", label: "Dumbbell", sub: "1-2 dumbbell ringan-medium" },
  { value: "resistance_band" as const, emoji: "🎗️", label: "Resistance band", sub: "Murah, fleksibel, home-friendly" },
  { value: "pullup_bar" as const, emoji: "🚧", label: "Pull-up bar", sub: "Door-mount atau outdoor" },
  { value: "bench" as const, emoji: "🪑", label: "Bench / kursi sturdy", sub: "Buat bench press, dip, dll" },
  { value: "barbell" as const, emoji: "🏋️‍♀️", label: "Barbell / gym lengkap", sub: "Akses ke fitness center" },
  { value: "kettlebell" as const, emoji: "💀", label: "Kettlebell", sub: "Swing, goblet squat, dll" },
  { value: "cardio_equipment" as const, emoji: "🚴", label: "Sepeda / treadmill", sub: "Cardio machine" },
];

function EquipmentStep({
  value,
  onToggle,
  onContinue,
}: {
  value: string[];
  onToggle: (e: (typeof EQUIPMENT_OPTIONS)[number]["value"]) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Equipment apa yang kamu punya?" />
      <p className="text-sm text-text-muted text-center -mt-2">
        Buat susun workout plan
      </p>
      <div className="space-y-3 pt-2">
        {EQUIPMENT_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value.includes(o.value)}
            onClick={() => onToggle(o.value)}
          />
        ))}
      </div>
      <WizardCta onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

// =====================================================
// CALCULATING + RESULT
// =====================================================

function CalculatingStep() {
  const [phase, setPhase] = useState(0);
  const messages = [
    "Lagi nyusun rencana...",
    "Hitung BMR + TDEE...",
    "Adjust macro split sesuai diet method...",
    "Lookup harga PIHPS provinsi kamu...",
    "Personalisasi based on lifestyle...",
    "Hampir kelar! ✨",
  ];
  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => Math.min(p + 1, messages.length - 1));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-5xl animate-pulse">
          🦝
        </div>
        <div className="absolute -inset-2 rounded-full border-4 border-brand-300/40 border-t-brand-500 animate-spin" />
      </div>
      <p className="mt-8 text-lg font-semibold tracking-tight">
        {messages[phase]}
      </p>
      <div className="mt-3 flex gap-1.5">
        {messages.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= phase ? "bg-brand-500" : "bg-surface-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

type AutoGenState = "idle" | "running" | "done" | "error";

function ResultStep({
  profile,
  onGoHome,
  onGoTdee,
}: {
  profile: UserProfile;
  onGoHome: () => void;
  onGoTdee: () => void;
}) {
  const [autoGen, setAutoGen] = useState<AutoGenState>("idle");
  const [planDone, setPlanDone] = useState(false);
  const [workoutDone, setWorkoutDone] = useState(false);
  const [autoGenErrors, setAutoGenErrors] = useState<string[]>([]);

  const targets = useMemo(() => {
    if (
      !profile.age ||
      !profile.sex ||
      !profile.weight_kg ||
      !profile.height_cm ||
      !profile.activity ||
      !profile.goal
    ) {
      return null;
    }
    try {
      const base = calculateTargets({
        age: profile.age,
        sex: profile.sex,
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        activity: profile.activity,
        goal: profile.goal,
      });
      if (profile.diet_method) {
        const preset = getDietPreset(profile.diet_method);
        const override = applyDietPresetMacros(preset, base.target_kcal);
        if (override) {
          return {
            ...base,
            protein_g: override.protein_g,
            fat_g: override.fat_g,
            carb_g: override.carb_g,
          };
        }
      }
      return base;
    } catch {
      return null;
    }
  }, [profile]);

  if (!targets) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Data belum lengkap.</p>
      </div>
    );
  }

  const dietPreset = profile.diet_method
    ? getDietPreset(profile.diet_method)
    : null;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-4xl mb-3 shadow-lg">
          🎉
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Profil kamu siap!
        </h1>
        <p className="mt-2 text-text-muted">
          Aku udah punya gambaran lengkap. Berikut target harian kamu.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/20">
        <div className="flex items-center gap-2 text-brand-100 text-sm font-medium">
          <Flame className="w-4 h-4" />
          Target kalori harian
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums">
            {fmtNum(targets.target_kcal)}
          </span>
          <span className="text-brand-100">kcal</span>
        </div>
        <div className="mt-2 text-sm text-brand-100">
          {targets.goal_adjustment_pct > 0 ? "+" : ""}
          {targets.goal_adjustment_pct.toFixed(0)}% vs TDEE ({fmtNum(targets.tdee)} kcal)
          {dietPreset?.macro_split && <> · {dietPreset.label_id}</>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MacroPill
          icon={<Beef className="w-4 h-4" />}
          label="Protein"
          grams={targets.protein_g}
          color="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
        />
        <MacroPill
          icon={<Droplet className="w-4 h-4" />}
          label="Lemak"
          grams={targets.fat_g}
          color="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        />
        <MacroPill
          icon={<Wheat className="w-4 h-4" />}
          label="Karbo"
          grams={targets.carb_g}
          color="bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
        />
      </div>

      {/* Personalized insights based on full profile */}
      <PersonalizedInsights profile={profile} />

      <div className="p-5 rounded-2xl bg-surface border border-border">
        <h3 className="font-semibold mb-3 tracking-tight">Ringkasan profil</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <StatItem label="Usia" value={`${profile.age} thn`} />
          <StatItem label="JK" value={profile.sex === "m" ? "Pria" : "Wanita"} />
          <StatItem label="Berat" value={`${profile.weight_kg} kg`} />
          <StatItem label="Target" value={`${profile.target_weight_kg ?? "—"} kg`} />
          <StatItem label="Tinggi" value={`${profile.height_cm} cm`} />
          <StatItem
            label="Aktivitas"
            value={profile.activity?.replace("_", " ") ?? "—"}
          />
          <StatItem label="Diet" value={dietPreset?.label_id ?? "—"} />
          <StatItem
            label="Tidur"
            value={
              profile.sleep_duration === "lt5"
                ? "<5h"
                : profile.sleep_duration === "5_6"
                  ? "5-6h"
                  : profile.sleep_duration === "7_8"
                    ? "7-8h"
                    : profile.sleep_duration === "gt8"
                      ? ">8h"
                      : "—"
            }
          />
          {profile.budget_idr_per_day && (
            <div className="col-span-2">
              <div className="text-text-muted text-xs">Budget makan/hari</div>
              <div className="font-semibold tabular-nums">
                Rp {fmtNum(profile.budget_idr_per_day)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-generate AI plan + workout */}
      {autoGen === "idle" && (
        <div className="space-y-3 pt-2">
          <button
            onClick={() =>
              handleAutoGenerate(profile, {
                setAutoGen,
                setPlanDone,
                setWorkoutDone,
                setAutoGenErrors,
                onGoHome,
              })
            }
            className="w-full px-6 py-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold shadow-lg shadow-brand-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate plan + workout pertama (~60s)
          </button>
          <button
            onClick={onGoHome}
            className="w-full px-6 py-3 rounded-2xl bg-surface border-2 border-border font-semibold hover:border-brand-300 transition-all"
          >
            Lewati, ke dashboard
          </button>
          <button
            onClick={onGoTdee}
            className="w-full text-xs text-text-muted hover:text-fg font-medium underline-offset-2 hover:underline pt-1"
          >
            Lihat detail TDEE & macro
          </button>
        </div>
      )}

      {autoGen === "running" && (
        <div className="p-5 rounded-2xl bg-brand-50/60 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30">
          <div className="text-center mb-4">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-500/20 text-brand-600 items-center justify-center mb-2">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="font-bold tracking-tight">
              AI lagi compose rencana kamu...
            </div>
            <div className="text-xs text-text-muted mt-1">
              Plan & workout di-generate bareng. Biasanya 30-90 detik, jangan
              refresh.
            </div>
          </div>
          <div className="space-y-2">
            <GenStatusRow
              icon={<Salad className="w-4 h-4" />}
              label="Meal plan (3 hari)"
              done={planDone}
            />
            <GenStatusRow
              icon={<Dumbbell className="w-4 h-4" />}
              label="Workout program (2 minggu)"
              done={workoutDone}
            />
          </div>
        </div>
      )}

      {autoGen === "done" && (
        <div className="p-5 rounded-2xl bg-brand-50 dark:bg-brand-500/15 border border-brand-300 dark:border-brand-500/40 text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-500/25 text-brand-600 items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="font-bold tracking-tight">
            Plan + workout siap!
          </div>
          <div className="text-xs text-text-muted mt-1">
            Ngarah ke dashboard...
          </div>
        </div>
      )}

      {autoGen === "error" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
            <div className="inline-flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300 text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              Sebagian gagal di-generate
            </div>
            <ul className="text-xs text-rose-700 dark:text-rose-300 leading-snug space-y-0.5">
              {autoGenErrors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
            <div className="mt-2 text-[11px] text-rose-700/70 dark:text-rose-300/70">
              Yang berhasil udah ke-save. Bisa generate ulang dari /plan atau
              /workout nanti.
            </div>
          </div>
          <button
            onClick={onGoHome}
            className="w-full px-6 py-3 rounded-2xl bg-fg text-bg font-semibold hover:-translate-y-0.5 transition-all"
          >
            Lanjut ke dashboard
          </button>
        </div>
      )}

      {autoGen === "idle" && (
        <p className="text-xs text-text-muted text-center pt-2">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Profil tersimpan di browser. Plan & workout pakai data ini buat
          personalisasi.
        </p>
      )}
    </div>
  );
}

function GenStatusRow({
  icon,
  label,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface">
      <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-sm font-medium">{label}</div>
      {done ? (
        <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
      ) : (
        <Loader2 className="w-4 h-4 animate-spin text-text-muted flex-shrink-0" />
      )}
    </div>
  );
}

async function handleAutoGenerate(
  profile: UserProfile,
  ctx: {
    setAutoGen: (s: AutoGenState) => void;
    setPlanDone: (b: boolean) => void;
    setWorkoutDone: (b: boolean) => void;
    setAutoGenErrors: (e: string[]) => void;
    onGoHome: () => void;
  },
) {
  ctx.setAutoGen("running");
  ctx.setPlanDone(false);
  ctx.setWorkoutDone(false);
  ctx.setAutoGenErrors([]);

  const localErrors: string[] = [];

  const planP = (async () => {
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          days: 3,
          meals_per_day: 3,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        hint?: string;
        targets?: Parameters<typeof saveMealPlan>[0]["targets"];
        plan?: Parameters<typeof saveMealPlan>[0]["plan"];
      };
      if (!data.ok || !data.plan || !data.targets) {
        throw new Error(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Gagal generate plan",
        );
      }
      saveMealPlan({
        start_date: todayISO(),
        days: 3,
        diet_method: profile.diet_method,
        budget_idr_per_day: profile.budget_idr_per_day,
        targets: data.targets,
        plan: data.plan,
      });
      ctx.setPlanDone(true);
    } catch (e) {
      localErrors.push(`Meal plan: ${(e as Error).message}`);
    }
  })();

  const workoutP = (async () => {
    try {
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          days_per_week: 3,
          session_minutes: 45,
          weeks: 2,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        hint?: string;
        level?: Parameters<typeof saveWorkoutPlan>[0]["level"];
        goal?: Parameters<typeof saveWorkoutPlan>[0]["goal"];
        split?: Parameters<typeof saveWorkoutPlan>[0]["split"];
        program?: Parameters<typeof saveWorkoutPlan>[0]["program"];
      };
      if (
        !data.ok ||
        !data.program ||
        !data.level ||
        !data.goal ||
        !data.split
      ) {
        throw new Error(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Gagal generate workout",
        );
      }
      saveWorkoutPlan({
        start_date: todayISO(),
        level: data.level,
        goal: data.goal,
        split: data.split,
        days_per_week: 3,
        session_minutes: 45,
        weeks: 2,
        program: data.program,
      });
      ctx.setWorkoutDone(true);
    } catch (e) {
      localErrors.push(`Workout: ${(e as Error).message}`);
    }
  })();

  await Promise.allSettled([planP, workoutP]);

  if (localErrors.length > 0) {
    ctx.setAutoGenErrors(localErrors);
    ctx.setAutoGen("error");
  } else {
    ctx.setAutoGen("done");
    setTimeout(() => ctx.onGoHome(), 900);
  }
}

function PersonalizedInsights({ profile }: { profile: UserProfile }) {
  const insights: { icon: React.ReactNode; text: string }[] = [];

  if (profile.eating_psychology?.plate_clearing && profile.eating_psychology.plate_clearing >= 4) {
    insights.push({
      icon: <span>🍽️</span>,
      text: "Kamu tipe yang habiskan piring — coba pakai piring lebih kecil + sayur 1/2 piring dulu.",
    });
  }
  if (profile.eating_psychology?.emotional_eating && profile.eating_psychology.emotional_eating >= 4) {
    insights.push({
      icon: <Brain className="w-4 h-4" />,
      text: "Emotional eating cukup tinggi — coba alternatif non-makan: jalan 5 menit, journaling, telepon teman.",
    });
  }
  if (profile.eating_psychology?.mindless_eating && profile.eating_psychology.mindless_eating >= 4) {
    insights.push({
      icon: <span>📱</span>,
      text: "Sering makan sambil scroll? Coba minimal 1 meal/hari tanpa screen — mindful eating.",
    });
  }
  if (profile.sleep_duration === "lt5" || profile.sleep_duration === "5_6") {
    insights.push({
      icon: <span>😴</span>,
      text: "Tidur kurang dari 7 jam ngaruh ke metabolisme + craving. Coba bedtime lebih awal 30 menit.",
    });
  }
  if (profile.water_consumption === "tea_coffee_only" || profile.water_consumption === "lt2_glass") {
    insights.push({
      icon: <Droplet className="w-4 h-4" />,
      text: "Hidrasi rendah — target 8 gelas/hari (2L). Sediakan botol di meja kerja.",
    });
  }
  if (profile.eat_locations?.includes("warung_warteg")) {
    insights.push({
      icon: <span>🍛</span>,
      text: "Sering warteg? Pilih protein (ayam/ikan/tahu/tempe) + 2 sayur + nasi 1/2 porsi. Hindari kuah santan.",
    });
  }
  if (profile.life_events?.includes("stress_mental")) {
    insights.push({
      icon: <Heart className="w-4 h-4" />,
      text: "Stres ngaruh ke kortisol & weight gain. Selain nutrisi, prioritasin stress management.",
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-600" />
        <h3 className="font-semibold tracking-tight text-brand-700 dark:text-brand-300">
          Insight buat kamu
        </h3>
      </div>
      <ul className="space-y-2 text-sm">
        {insights.map((i, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">{i.icon}</span>
            <span className="text-fg/80">{i.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-text-muted text-xs">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}

// =====================================================
// MEDICAL CONDITIONS (CRITICAL — Indonesia komorbid umum)
// =====================================================
const MEDICAL_OPTIONS: { value: MedicalCondition; emoji: string; label: string }[] = [
  { value: "hipertensi", emoji: "🩸", label: "Hipertensi / tekanan darah tinggi" },
  { value: "diabetes_tipe2", emoji: "🍬", label: "Diabetes tipe 2" },
  { value: "diabetes_tipe1", emoji: "💉", label: "Diabetes tipe 1" },
  { value: "kolesterol_tinggi", emoji: "🧈", label: "Kolesterol tinggi" },
  { value: "asam_urat_gout", emoji: "🦶", label: "Asam urat / gout" },
  { value: "ginjal_kronik", emoji: "🫘", label: "Penyakit ginjal kronik" },
  { value: "jantung", emoji: "❤️", label: "Penyakit jantung" },
  { value: "thyroid", emoji: "🦋", label: "Thyroid (hyper/hypo)" },
  { value: "hamil", emoji: "🤰", label: "Hamil" },
  { value: "menyusui", emoji: "🍼", label: "Menyusui" },
  { value: "pcos", emoji: "🌸", label: "PCOS" },
  { value: "ibs_lambung", emoji: "🌀", label: "IBS / GERD / asam lambung" },
  { value: "celiac_gluten", emoji: "🌾", label: "Celiac / sensitif gluten" },
  { value: "tidak_ada", emoji: "✅", label: "Tidak ada / saya sehat" },
];

function MedicalStep({
  value,
  onToggle,
  onContinue,
}: {
  value: MedicalCondition[];
  onToggle: (c: MedicalCondition) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Ada kondisi medis tertentu yang aku perlu tau?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Aman, ini disimpan di browser kamu. Penting biar aku gak kasih plan yang
        bahaya (misal: kamu hamil tapi disuruh defisit agresif).
      </p>
      <div className="space-y-2 pt-2 max-w-md mx-auto">
        {MEDICAL_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            selected={value.includes(o.value)}
            onClick={() => onToggle(o.value)}
          />
        ))}
      </div>
      <WizardCta onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

// =====================================================
// FOOD ALLERGIES
// =====================================================
const ALLERGY_OPTIONS: { value: FoodAllergy; emoji: string; label: string }[] = [
  { value: "kacang_tanah", emoji: "🥜", label: "Kacang tanah" },
  { value: "kacang_pohon", emoji: "🌰", label: "Kacang pohon (almond, kenari)" },
  { value: "susu_laktosa", emoji: "🥛", label: "Susu / laktosa" },
  { value: "telur", emoji: "🥚", label: "Telur" },
  { value: "gandum_gluten", emoji: "🌾", label: "Gandum / gluten" },
  { value: "seafood_kerang", emoji: "🦐", label: "Seafood (udang, kerang, cumi)" },
  { value: "ikan", emoji: "🐟", label: "Ikan" },
  { value: "kedelai", emoji: "🫘", label: "Kedelai (tempe, tahu, kecap)" },
  { value: "wijen", emoji: "🟤", label: "Wijen" },
  { value: "lain", emoji: "❓", label: "Lainnya / tidak ada" },
];

function AllergiesStep({
  value,
  onToggle,
  onContinue,
}: {
  value: FoodAllergy[];
  onToggle: (a: FoodAllergy) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Ada alergi atau intoleransi makanan?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Pilih semuanya yang relevan. Meal plan bakal otomatis exclude.
      </p>
      <div className="space-y-2 pt-2 max-w-md mx-auto">
        {ALLERGY_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            selected={value.includes(o.value)}
            onClick={() => onToggle(o.value)}
          />
        ))}
      </div>
      <WizardCta onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

// =====================================================
// SNACK TIME
// =====================================================
const SNACK_OPTIONS: { value: SnackTime; emoji: string; label: string; sub: string }[] = [
  { value: "morning", emoji: "🌅", label: "Pagi", sub: "Antara sarapan & makan siang" },
  { value: "afternoon", emoji: "☀️", label: "Siang", sub: "Setelah makan siang" },
  { value: "evening", emoji: "🌆", label: "Sore", sub: "Sebelum/setelah makan malam" },
  { value: "late_night", emoji: "🌙", label: "Malam / tengah malam", sub: "Setelah jam 21:00" },
  { value: "rarely_snack", emoji: "🚫", label: "Jarang ngemil", sub: "3 kali makan utama aja" },
];

function SnackTimeStep({
  value,
  onChange,
}: {
  value?: SnackTime;
  onChange: (v: SnackTime) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Kapan biasanya kamu pengen ngemil?" />
      <div className="space-y-3 pt-4">
        {SNACK_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// UNDERLYING MOTIVATION
// =====================================================
const UNDERLYING_OPTIONS: {
  value: UnderlyingMotivation;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { value: "feel_better_body", emoji: "✨", label: "Merasa nyaman di tubuh sendiri", sub: "Body comfort" },
  { value: "boost_energy_mood", emoji: "⚡", label: "Naikkin energi & mood", sub: "Lebih semangat sehari-hari" },
  { value: "improve_health", emoji: "🩺", label: "Kesehatan jangka panjang", sub: "Cegah penyakit" },
  { value: "feel_confident", emoji: "💎", label: "Pede sama diri sendiri", sub: "Self-confidence" },
  { value: "want_balance", emoji: "⚖️", label: "Hidup lebih balance", sub: "Tanpa restriksi ekstrem" },
];

function UnderlyingMotivationStep({
  value,
  onChange,
}: {
  value?: UnderlyingMotivation;
  onChange: (v: UnderlyingMotivation) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Alasan terdalam kamu pengen lebih sehat apa?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Beyond just turun berat — apa yang benerin mendorong kamu?
      </p>
      <div className="space-y-3 pt-2">
        {UNDERLYING_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// READINESS
// =====================================================
const READINESS_OPTIONS: {
  value: ReadinessLevel;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { value: "ready_all_in", emoji: "🚀", label: "All in!", sub: "Siap habis-habisan" },
  { value: "motivated_need_support", emoji: "🤝", label: "Motivated tapi butuh support", sub: "Ada coach + accountability" },
  { value: "take_slow", emoji: "🐢", label: "Pelan aja yang penting konsisten", sub: "Sustainable pace" },
  { value: "not_sure_start", emoji: "❓", label: "Belum yakin mulai dari mana", sub: "Butuh guidance step-by-step" },
  { value: "tried_failed_before", emoji: "🔄", label: "Udah coba tapi gagal", sub: "Kali ini mau approach beda" },
];

function ReadinessStep({
  value,
  onChange,
}: {
  value?: ReadinessLevel;
  onChange: (v: ReadinessLevel) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Seberapa siap kamu mulai journey ini?" />
      <div className="space-y-3 pt-4">
        {READINESS_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// HABIT ANCHOR (Tiny Habits — single commitment)
// =====================================================
const HABIT_OPTIONS: {
  value: HabitAnchor;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { value: "stop_skipping_meals", emoji: "🍽️", label: "Stop skip makan", sub: "Terutama sarapan" },
  { value: "reduce_emotional_eating", emoji: "🧘", label: "Kurangi emotional eating", sub: "Cari coping non-makan" },
  { value: "plan_meals_ahead", emoji: "📅", label: "Plan menu mingguan", sub: "Anti dadakan" },
  { value: "snack_more_mindfully", emoji: "🥕", label: "Snack lebih sehat", sub: "Buah/kacang vs gorengan" },
  { value: "track_food_consistently", emoji: "📊", label: "Track makanan harian", sub: "Awareness dulu" },
  { value: "eat_more_vegetables", emoji: "🥬", label: "Sayur 1/2 piring", sub: "Volume booster" },
  { value: "drink_more_water", emoji: "💧", label: "Minum air 2L/hari", sub: "Hidrasi consistent" },
];

function HabitAnchorStep({
  value,
  onChange,
}: {
  value?: HabitAnchor;
  onChange: (v: HabitAnchor) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Satu kebiasaan apa yang siap kamu ubah duluan?" />
      <p className="text-sm text-text-muted text-center -mt-2 max-w-md mx-auto">
        Mulai dari 1 aja — tiny habits compound. Pilih yang paling relate.
      </p>
      <div className="space-y-3 pt-2">
        {HABIT_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// PACE
// =====================================================
const PACE_OPTIONS: {
  value: PacePreference;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { value: "as_fast_possible", emoji: "⚡", label: "Secepat mungkin", sub: "Aggressive deficit, butuh disiplin tinggi" },
  { value: "slow_steady", emoji: "🐢", label: "Pelan-pelan tapi konsisten", sub: "Sustainable, low burnout" },
  { value: "in_between", emoji: "⚖️", label: "Di antara keduanya", sub: "Balance, fleksibel" },
];

function PaceStep({
  value,
  onChange,
}: {
  value?: PacePreference;
  onChange: (v: PacePreference) => void;
}) {
  return (
    <div className="space-y-6">
      <MascotBubble message="Kamu prefer pace yang gimana?" />
      <div className="space-y-3 pt-4">
        {PACE_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            emoji={o.emoji}
            label={o.label}
            sublabel={o.sub}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}

function MacroPill({
  icon,
  label,
  grams,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  grams: number;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-2xl ${color}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {grams}
        <span className="text-sm font-normal opacity-70 ml-1">g</span>
      </div>
    </div>
  );
}
