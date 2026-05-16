/**
 * Meal plan CLI.
 *
 * Usage:
 *   tsx scripts/plan.ts --age 30 --sex m --weight 75 --height 175 \
 *     --activity moderate --goal fat_loss --province 13 --budget 75000 --days 3
 *
 *   tsx scripts/plan.ts ... --dry-run    # preview prompt, no API call
 *
 *   tsx scripts/plan.ts ... --no-seafood --vegetarian
 */
import dotenv from "dotenv";
dotenv.config({ override: true });
import { getDb, getDbPath } from "../src/db/client.ts";
import { calculateTargets } from "../src/nutrition/tdee.ts";
import {
  formatPlanSummary,
  generateMealPlan,
  type MealPlanRequest,
} from "../src/nutrition/meal-plan.ts";
import {
  listDietMethods,
  type DietMethod,
} from "../src/nutrition/diet-methods.ts";

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

// --list-diets short-circuit
if (args["list-diets"]) {
  console.log("Diet methods yang available (pakai --diet METHOD):");
  console.log("");
  for (const d of listDietMethods()) {
    console.log(`  ${d.method.padEnd(16)} ${d.label_id}`);
  }
  process.exit(0);
}

const required = ["age", "sex", "weight", "height", "activity", "goal"];
const missing = required.filter((k) => !args[k]);
if (missing.length > 0) {
  console.error(`Missing args: ${missing.join(", ")}`);
  console.error(`Required: --age --sex m|f --weight KG --height CM --activity sedentary|light|moderate|active|very_active --goal fat_loss|maintain|recomp|slow_gain|muscle_gain`);
  console.error(`Optional: --bf BF% --days N --province ID --market 1|2 --budget IDR --diet METHOD --vegetarian --no-seafood --no-pork --avoid-kategori "X,Y" --alergi "X,Y" --notes "..." --dry-run`);
  console.error(`Lihat list diet methods: tsx scripts/plan.ts --list-diets`);
  process.exit(1);
}

const profile = {
  age: Number.parseInt(args.age as string, 10),
  sex: args.sex as "m" | "f",
  weight_kg: Number.parseFloat(args.weight as string),
  height_cm: Number.parseFloat(args.height as string),
  activity: args.activity as "sedentary" | "light" | "moderate" | "active" | "very_active",
  goal: args.goal as "fat_loss" | "fat_loss_aggressive" | "maintain" | "recomp" | "slow_gain" | "muscle_gain",
  body_fat_pct: args.bf ? Number.parseFloat(args.bf as string) : undefined,
};

const targets = calculateTargets(profile);

const provinceArg = args.province as string | undefined;
const province_id: number | "national" =
  !provinceArg || provinceArg === "national" || provinceArg === "nasional"
    ? "national"
    : Number.parseInt(provinceArg, 10);

const req: MealPlanRequest = {
  profile,
  targets,
  days: args.days ? Number.parseInt(args.days as string, 10) : 3,
  province_id,
  market_type:
    args.market === "2"
      ? 2
      : (1 as 1 | 2),
  budget_idr_per_day: args.budget
    ? Number.parseInt(args.budget as string, 10)
    : undefined,
  diet_method: args.diet ? (args.diet as DietMethod) : undefined,
  preferences: {
    halal: true,
    vegetarian: args.vegetarian === true,
    no_seafood: args["no-seafood"] === true,
    no_pork: args["no-pork"] === true,
    alergi: args.alergi ? String(args.alergi).split(",").map((s) => s.trim()) : undefined,
    avoid_kategori: args["avoid-kategori"]
      ? String(args["avoid-kategori"]).split(",").map((s) => s.trim())
      : undefined,
  },
  context_notes: args.notes ? String(args.notes) : undefined,
};

console.log(`Profile: ${args.age}y ${args.sex} ${args.weight}kg ${args.height}cm ${args.activity} ${args.goal}`);
console.log(`Plan: ${req.days} hari, provinsi ${province_id}, pasar ${req.market_type === 1 ? "tradisional" : "modern"}${req.budget_idr_per_day ? `, budget Rp ${req.budget_idr_per_day.toLocaleString("id-ID")}/hari` : ""}${req.diet_method ? `, diet ${req.diet_method}` : ""}`);
console.log("");

const db = getDb(getDbPath());

const dryRun = args["dry-run"] === true;
const result = await generateMealPlan(db, req, { dryRun });
console.log(formatPlanSummary(result));

if (dryRun) {
  console.log("");
  console.log("=== DRY RUN: PROMPT PREVIEW ===");
  console.log(`System prompt: ${result.prompt.system.length} chars`);
  console.log(`Context block: ${result.prompt.context.length} chars (cached on first real run)`);
  console.log(`User prompt:   ${result.prompt.user.length} chars`);
  console.log("");
  console.log("--- Context block (first 1000 chars) ---");
  console.log(result.prompt.context.substring(0, 1000));
  console.log("");
  console.log("--- User prompt ---");
  console.log(result.prompt.user);
}

db.close();
