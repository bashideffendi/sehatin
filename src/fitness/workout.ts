/**
 * Workout program generator — Claude RAG over exercise pool + protocols.
 *
 * Input: user profile (level, equipment, goal, days/week, time per session)
 * Output: structured weekly workout program JSON
 */
import { callJson, type ClaudeResponse } from "../ai/claude.ts";
import {
  filterExercises,
  toCompact,
  type CompactExercise,
  type Equipment,
  type Level,
} from "./exercises.ts";
import {
  getProtocol,
  getSplit,
  recommendSplit,
  type SplitType,
  type TrainingGoal,
} from "./protocols.ts";

export interface WorkoutExtendedFields {
  // Medical safety
  medical_conditions?: string[]; // hamil/jantung/asam_urat/dll
  // Personalization
  readiness_level?: string; // "tried_failed_before" → start gentler
  pace_preference?: string; // fast / slow / in_between
  habit_anchor?: string; // emphasize 1 habit
  // Recovery factors
  sleep_duration?: string; // lt5 / 5_6 / 7_8 / gt8
  // Body context
  target_zones?: string[]; // perut/dada/lengan/dll → muscle emphasis
  target_body_type?: string; // lean/athletic/shredded
  current_body_type?: string;
  // Underlying
  underlying_motivation?: string;
  weight_goal_magnitude?: string;
}

export interface WorkoutRequest {
  level: Level;
  goal: TrainingGoal;
  days_per_week: number; // 2-6
  session_minutes: number; // 30-90 typical
  equipment_available: Equipment[];
  split?: SplitType; // optional override; default auto-recommend
  weeks?: number; // default 4 (1 mesocycle)
  injuries_or_limitations?: string[]; // e.g., "lutut kanan sensitif"
  context_notes?: string; // "kerja kantoran 9-5, latihan pagi"
  extended?: WorkoutExtendedFields;
}

export interface WorkoutExercise {
  exercise_code: string;
  exercise_name: string;
  sets: number;
  reps: string; // "5" / "8-12" / "30s"
  rest_seconds: number;
  rpe_target?: string; // "7-8"
  notes?: string;
}

export interface WorkoutSession {
  day_label: string; // "Senin (Upper)" / "Day 1 (Push)"
  focus: string; // "push" / "lower body"
  duration_estimate_min: number;
  warmup: WorkoutExercise[];
  main: WorkoutExercise[];
  cooldown?: WorkoutExercise[];
  notes?: string;
}

export interface WorkoutWeek {
  week: number;
  sessions: WorkoutSession[];
  progression_note?: string; // mis. "Week 2: tambah 2.5kg dari minggu 1 di main lifts"
}

export interface WorkoutProgram {
  weeks: WorkoutWeek[];
  summary: {
    split: SplitType;
    sessions_per_week: number;
    estimated_duration_per_session: number;
    progression_strategy: string;
    notes: string[];
  };
}

const SYSTEM_PROMPT = `Kamu adalah strength coach Indonesia. Tugas: compose program latihan terstruktur sesuai profile user + protocol parameter + exercise pool yang diberikan.

OUTPUT WAJIB JSON valid, tanpa markdown fence.

Aturan penting:
1. EXERCISE: pakai HANYA exercise_code dari pool. Kode case-sensitive.
2. PROTOCOL: ikuti sets/reps/rest sesuai protocol parameter user (strength vs hypertrophy vs HIIT beda).
3. STRUCTURE per sesi:
   - WARMUP 5-10 menit: 2-3 mobility/aktivasi (kategori "mobility" atau bodyweight ringan)
   - MAIN 20-50 menit: 4-7 exercise per protocol
   - COOLDOWN 3-5 menit (optional): 1-2 stretching/mobility
4. SPLIT structure: ikuti weekly_pattern dari split definition (full_body, upper_lower, PPL, dll).
5. PROGRESSION 4 minggu typical:
   - Week 1: baseline
   - Week 2: tambah 1 rep atau 2.5kg (deload jika muscle soreness berat)
   - Week 3: peak intensity (push 1-2 rep di atas)
   - Week 4: deload (kurangi volume 30-40%) atau test
6. UNILATERAL: kalau exercise unilateral, set hitung per sisi (eg. "3 sets × 8 reps per kaki").
7. SAFETY GENERAL:
   - Pemula: hindari exercise advanced (pistol squat, muscle-up).
   - Kalau ada injuries: hindari exercise yang stress area itu, ganti modifikasi.
   - Compound > isolation untuk pemula.

🚨 SAFETY MEDIS (NON-NEGOTIABLE — patuhi 100%, kalau conflict dengan goal, prioritas safety):
- HAMIL: NO supine post trimester-1, NO heavy lifting bracing valsalva, NO plyometric/jumping, NO posisi tengkurap, NO contact sport. OK: jalan, prenatal yoga, swimming, light resistance band, modified squat. WAJIB konsul SpOG sebelum mulai. Tambah note disclaimer.
- MENYUSUI: avoid heavy weight di awal post-partum. Diastasis recti check dulu sebelum core work (no crunch, no plank tradisional kalau ada gap >2 jari). Focus mobility + glute + back.
- JANTUNG / HIPERTENSI BERAT: NO isometric heavy (planks panjang OK), NO valsalva. Cardio LISS prioritas. Konsul kardiolog. Heart rate cap diperlukan.
- DIABETES: monitor gula darah pre/post workout. Carry karbo cepat. Avoid puasa + workout intens.
- ASAM URAT (gout acute): skip latihan intens saat flare. LISS cardio + mobility aja sampai reda.
- GINJAL KRONIK: avoid extreme heat (gym hot yoga), monitor hidrasi. Hindari heavy supplementation (kreatin perlu konsul).
- CEDERA LUTUT: skip pistol squat, deep squat, jump, lunge dalam. OK: bridge, ham curl, leg press partial ROM, swimming.
- CEDERA PUNGGUNG: skip deadlift heavy, bent-over row, crunch. OK: dead bug, bird dog, hip thrust supported, plank short.

8. REALISM: total durasi sesi (warmup + main + cooldown) harus muat dalam session_minutes.

🎯 PERSONALISASI:
9. READINESS:
   - "tried_failed_before" / "not_sure_start" → start GENTLE (volume rendah, 70% protocol target). Build confidence dulu. Pakai bodyweight dominan minggu 1-2 bahkan kalau punya barbell. Notes empati: "Kali ini kita mulai pelan, build sustainable."
   - "ready_all_in" → optimal volume per protocol, push edge.
   - "motivated_need_support" → standard volume + extra form cues + progression markers visible.
10. PACE: aggressive (fast) → progression cepat (+5% volume tiap minggu). Slow → +2-3% per minggu, deload 1x/bulan eksplisit.
11. TARGET ZONES: kalau user pilih zone tertentu (perut/dada/lengan/paha/bokong), tambah 1-2 isolation accessory untuk zone itu di main per session.
12. HABIT ANCHOR: kalau user pilih habit non-workout (mis. "drink more water"), integrate di session notes ("post-workout: refill botol & habiskan sebelum tidur").
13. SLEEP RECOVERY:
   - lt5 / 5_6 jam → REDUCE volume 20%, increase rest antar set +30s. Cardio LISS > HIIT. Notes: "Recovery jelek, prioritas tidur 7+ jam dulu, baru push volume."
   - 7_8 → optimal, full protocol.
14. UNDERLYING MOTIVATION:
    - feel_better_body → emphasize daily ease tasks (functional movement)
    - energy_mood → morning cardio + mid-day mobility break
    - improve_health → cite health markers (BP, blood sugar, VO2max)
    - feel_confident → strength-focus + visible progress
    - want_balance → no extreme volume, sustainable

Struktur output:
{
  "weeks": [
    {
      "week": 1,
      "sessions": [
        {
          "day_label": "<Senin (Full Body A)>",
          "focus": "<push/pull/legs/full/upper/lower>",
          "duration_estimate_min": <number>,
          "warmup": [
            {"exercise_code": "<code>", "exercise_name": "<nama>", "sets": <n>, "reps": "<str>", "rest_seconds": <n>, "notes": "<opsional>"}
          ],
          "main": [...],
          "cooldown": [...] (optional),
          "notes": "<opsional 1 kalimat fokus sesi>"
        }
      ],
      "progression_note": "<opsional, perubahan dari minggu sebelumnya>"
    }
  ],
  "summary": {
    "split": "<split_type>",
    "sessions_per_week": <n>,
    "estimated_duration_per_session": <n>,
    "progression_strategy": "<short>",
    "notes": ["<insight>", "<insight>"]
  }
}

PENTING: stick to exercise_code dari pool. Jangan ngarang nama atau kode.`;

function buildContextBlock(pool: CompactExercise[]): string {
  const lines: string[] = [];
  lines.push("=== EXERCISE POOL ===");
  lines.push(
    "Format: code|name|category|level|muscle|equipment[|unilateral]",
  );
  for (const ex of pool) {
    const row = [
      ex.code,
      ex.name,
      ex.cat,
      ex.level,
      ex.muscle.join("/"),
      ex.eq.join(","),
    ];
    if (ex.unilat) row.push("unilat");
    lines.push(row.join("|"));
  }
  return lines.join("\n");
}

function buildUserPrompt(req: WorkoutRequest, split: SplitType): string {
  const protocol = getProtocol(req.goal);
  const splitDef = getSplit(split);

  const lines: string[] = [];
  lines.push(
    `Compose program latihan ${req.weeks ?? 4} minggu untuk user berikut.`,
  );
  lines.push("");
  lines.push("PROFILE:");
  lines.push(`- Level: ${req.level}`);
  lines.push(`- Goal: ${req.goal}`);
  lines.push(`- Sessions per minggu: ${req.days_per_week}`);
  lines.push(`- Durasi per sesi: ${req.session_minutes} menit`);
  lines.push(`- Equipment available: ${req.equipment_available.join(", ")}`);
  if (req.injuries_or_limitations && req.injuries_or_limitations.length > 0) {
    lines.push(`- Injuries/limitations: ${req.injuries_or_limitations.join(", ")}`);
  }
  if (req.context_notes) {
    lines.push(`- Catatan: ${req.context_notes}`);
  }

  // Extended fields from full profile
  const ext = req.extended;
  if (ext) {
    if (ext.medical_conditions && ext.medical_conditions.length > 0) {
      const conds = ext.medical_conditions.filter((c) => c !== "tidak_ada");
      if (conds.length > 0) {
        lines.push("");
        lines.push("🚨 KONDISI MEDIS (patuhi SAFETY rules system prompt):");
        for (const c of conds) lines.push(`  - ${c}`);
      }
    }
    if (ext.readiness_level) {
      lines.push(`- Readiness: ${ext.readiness_level}`);
    }
    if (ext.pace_preference) {
      lines.push(`- Pace preference: ${ext.pace_preference}`);
    }
    if (ext.habit_anchor) {
      lines.push(`- Habit anchor (integrate di session notes): ${ext.habit_anchor}`);
    }
    if (ext.sleep_duration) {
      lines.push(`- Sleep: ${ext.sleep_duration} (recovery factor)`);
    }
    if (ext.target_zones && ext.target_zones.length > 0) {
      lines.push(`- Target zones (tambah 1-2 isolation per session): ${ext.target_zones.join(", ")}`);
    }
    if (ext.target_body_type) {
      lines.push(`- Target body: ${ext.current_body_type ?? "?"} → ${ext.target_body_type}`);
    }
    if (ext.underlying_motivation) {
      lines.push(`- Underlying motivation: ${ext.underlying_motivation}`);
    }
    if (ext.weight_goal_magnitude) {
      lines.push(`- Weight goal magnitude: ${ext.weight_goal_magnitude}`);
    }
  }

  lines.push("");
  lines.push("PROTOCOL PARAMETER:");
  lines.push(`- Sets per exercise: ${protocol.sets_per_exercise}`);
  lines.push(`- Reps: ${protocol.reps}`);
  lines.push(`- Rest: ${protocol.rest_seconds}s`);
  lines.push(`- Intensitas: ${protocol.intensity_pct_1rm}`);
  lines.push(`- Exercise per sesi: ${protocol.exercise_count_per_session}`);
  lines.push(`- Notes: ${protocol.notes}`);
  lines.push("");
  lines.push("SPLIT STRUCTURE:");
  lines.push(`- Split: ${splitDef.label_id}`);
  lines.push(`- Weekly pattern: ${splitDef.weekly_pattern.join(" → ")}`);
  lines.push(`- Notes: ${splitDef.notes_id}`);
  lines.push("");
  lines.push(
    `Generate ${req.weeks ?? 4} minggu program dengan progression. Output JSON sesuai struktur di system prompt. Pakai HANYA exercise_code dari pool.`,
  );
  return lines.join("\n");
}

export interface GenerateWorkoutOptions {
  dryRun?: boolean;
}

export interface WorkoutGenerateResult {
  prompt: {
    system: string;
    context: string;
    user: string;
  };
  pool: CompactExercise[];
  split: SplitType;
  program?: WorkoutProgram;
  response?: ClaudeResponse<WorkoutProgram>;
}

export async function generateWorkout(
  req: WorkoutRequest,
  opts: GenerateWorkoutOptions = {},
): Promise<WorkoutGenerateResult> {
  // Determine split
  const split =
    req.split ??
    recommendSplit({
      level: req.level,
      days_per_week: req.days_per_week,
      goal: req.goal,
    });

  // Build exercise pool filtered by equipment + level
  const exercises = filterExercises({
    equipment_available: req.equipment_available,
    level_max: req.level,
  });
  const pool = exercises.map(toCompact);

  const context = buildContextBlock(pool);
  const userPrompt = buildUserPrompt(req, split);

  const result: WorkoutGenerateResult = {
    prompt: {
      system: SYSTEM_PROMPT,
      context,
      user: userPrompt,
    },
    pool,
    split,
  };

  if (opts.dryRun) return result;

  const response = await callJson<WorkoutProgram>({
    systemPrompt: SYSTEM_PROMPT,
    cacheSystem: true,
    cachedContext: context,
    cacheContext: true,
    userPrompt,
    maxTokens: 12000,
  });

  result.response = response;
  result.program = response.data;
  return result;
}

export function formatWorkoutSummary(result: WorkoutGenerateResult): string {
  const lines: string[] = [];
  lines.push(`=== POOL ===`);
  lines.push(`Exercise pool: ${result.pool.length} items (filtered by equipment + level)`);
  lines.push(`Split: ${result.split}`);
  lines.push("");
  if (!result.program) {
    lines.push("(Dry run — no Claude call, prompt siap.)");
    lines.push(
      `Estimated input tokens: ~${Math.round((result.prompt.system.length + result.prompt.context.length + result.prompt.user.length) / 4)}`,
    );
    return lines.join("\n");
  }
  const p = result.program;
  lines.push(`=== PROGRAM SUMMARY ===`);
  lines.push(`Split: ${p.summary.split}`);
  lines.push(`Sessions/minggu: ${p.summary.sessions_per_week}`);
  lines.push(`Durasi/sesi: ${p.summary.estimated_duration_per_session} menit`);
  lines.push(`Progression: ${p.summary.progression_strategy}`);
  for (const n of p.summary.notes) lines.push(`  - ${n}`);
  lines.push("");
  for (const week of p.weeks) {
    lines.push(`╔═══ MINGGU ${week.week} ${week.progression_note ? `(${week.progression_note})` : ""} ═══╗`);
    for (const session of week.sessions) {
      lines.push("");
      lines.push(`  ▸ ${session.day_label}  [${session.focus}, ~${session.duration_estimate_min} mnt]`);
      if (session.warmup.length > 0) {
        lines.push("    WARMUP:");
        for (const ex of session.warmup) {
          lines.push(
            `      - ${ex.exercise_name} (${ex.exercise_code}): ${ex.sets}x${ex.reps}${ex.rest_seconds > 0 ? `, rest ${ex.rest_seconds}s` : ""}`,
          );
        }
      }
      lines.push("    MAIN:");
      for (const ex of session.main) {
        const rpe = ex.rpe_target ? `, RPE ${ex.rpe_target}` : "";
        lines.push(
          `      - ${ex.exercise_name} (${ex.exercise_code}): ${ex.sets}x${ex.reps}, rest ${ex.rest_seconds}s${rpe}`,
        );
        if (ex.notes) lines.push(`        note: ${ex.notes}`);
      }
      if (session.cooldown && session.cooldown.length > 0) {
        lines.push("    COOLDOWN:");
        for (const ex of session.cooldown) {
          lines.push(
            `      - ${ex.exercise_name} (${ex.exercise_code}): ${ex.sets}x${ex.reps}`,
          );
        }
      }
      if (session.notes) lines.push(`    📝 ${session.notes}`);
    }
  }
  if (result.response) {
    lines.push("");
    lines.push("=== USAGE ===");
    const u = result.response.usage;
    lines.push(`Model: ${result.response.model}`);
    lines.push(`Input: ${u.input_tokens} tokens`);
    if (u.cache_creation_input_tokens) {
      lines.push(`  Cache creation: ${u.cache_creation_input_tokens}`);
    }
    if (u.cache_read_input_tokens) {
      lines.push(`  Cache read: ${u.cache_read_input_tokens}`);
    }
    lines.push(`Output: ${u.output_tokens} tokens`);
  }
  return lines.join("\n");
}
