/**
 * Workout program generator CLI.
 *
 * Usage:
 *   tsx scripts/workout.ts --level beginner --goal hypertrophy --days 3 --minutes 45 --equipment "bodyweight,dumbbell"
 *   tsx scripts/workout.ts --level intermediate --goal strength --days 4 --minutes 60 --equipment "barbell,dumbbell,bench,pullup_bar" --weeks 4
 *   tsx scripts/workout.ts ... --dry-run
 *   tsx scripts/workout.ts --list-goals
 *   tsx scripts/workout.ts --list-splits
 */
import dotenv from "dotenv";
dotenv.config({ override: true });
import {
  filterExercises,
  type Equipment,
  type Level,
} from "../src/fitness/exercises.ts";
import {
  listGoals,
  listSplits,
  type SplitType,
  type TrainingGoal,
} from "../src/fitness/protocols.ts";
import {
  formatWorkoutSummary,
  generateWorkout,
  type WorkoutRequest,
} from "../src/fitness/workout.ts";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const nxt = argv[i + 1];
      if (nxt === undefined || nxt.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = nxt;
        i++;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);

if (args["list-goals"]) {
  console.log("Training goals yang available (pakai --goal):");
  console.log("");
  for (const g of listGoals()) {
    console.log(`  ${g.goal.padEnd(20)} ${g.protocol.sets_per_exercise}x${g.protocol.reps}, rest ${g.protocol.rest_seconds}s`);
    console.log(`    ${g.protocol.notes.substring(0, 80)}...`);
    console.log("");
  }
  process.exit(0);
}

if (args["list-splits"]) {
  console.log("Split types yang available (pakai --split, optional override):");
  console.log("");
  for (const s of listSplits()) {
    console.log(`  ${s.split.padEnd(18)} ${s.label_id}  (${s.sessions_per_week_recommendation.min}-${s.sessions_per_week_recommendation.max}x/minggu)`);
    console.log(`    ${s.notes_id.substring(0, 90)}`);
    console.log("");
  }
  process.exit(0);
}

if (args["list-pool"]) {
  const equipment = (args.equipment as string)?.split(",").map((s) => s.trim()) as Equipment[] | undefined;
  const level = args.level as Level | undefined;
  const filtered = filterExercises({
    equipment_available: equipment,
    level_max: level,
  });
  console.log(`Exercise pool (${filtered.length} items, filtered by equipment + level):`);
  console.log("");
  for (const ex of filtered) {
    console.log(`  [${ex.code.padEnd(10)}] ${ex.name_id.padEnd(28)} ${ex.category.padEnd(8)} ${ex.level.padEnd(12)} ${ex.equipment.join(",")}`);
  }
  process.exit(0);
}

const required = ["level", "goal", "days", "minutes", "equipment"];
const missing = required.filter((k) => !args[k]);
if (missing.length > 0) {
  console.error(`Missing args: ${missing.join(", ")}`);
  console.error(
    `Required: --level beginner|intermediate|advanced --goal GOAL --days N --minutes N --equipment "list,csv"`,
  );
  console.error(`Optional: --split SPLIT --weeks N --injuries "X,Y" --notes "..." --dry-run`);
  console.error(`Discover: --list-goals, --list-splits, --list-pool --equipment "..." --level ...`);
  console.error(`Equipment options: bodyweight, dumbbell, barbell, kettlebell, resistance_band, machine, pullup_bar, bench, cardio_equipment, none`);
  process.exit(1);
}

const req: WorkoutRequest = {
  level: args.level as Level,
  goal: args.goal as TrainingGoal,
  days_per_week: Number.parseInt(args.days as string, 10),
  session_minutes: Number.parseInt(args.minutes as string, 10),
  equipment_available: (args.equipment as string).split(",").map((s) => s.trim()) as Equipment[],
  split: (args.split as SplitType) || undefined,
  weeks: args.weeks ? Number.parseInt(args.weeks as string, 10) : 4,
  injuries_or_limitations: args.injuries
    ? String(args.injuries).split(",").map((s) => s.trim())
    : undefined,
  context_notes: args.notes ? String(args.notes) : undefined,
};

console.log(`Workout: ${args.level} ${args.goal} ${args.days}x/week ${args.minutes}min`);
console.log(`Equipment: ${args.equipment}`);
if (req.injuries_or_limitations) console.log(`Injuries: ${req.injuries_or_limitations.join(", ")}`);
console.log("");

const dryRun = args["dry-run"] === true;
const result = await generateWorkout(req, { dryRun });
console.log(formatWorkoutSummary(result));
