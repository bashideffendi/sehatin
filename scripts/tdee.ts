/**
 * Quick TDEE/macro calculator CLI.
 *
 * Usage:
 *   tsx scripts/tdee.ts --age 30 --sex m --weight 75 --height 175 --activity moderate --goal fat_loss
 *   tsx scripts/tdee.ts --age 28 --sex f --weight 60 --height 165 --activity light --goal recomp --bf 24
 */
import {
  calculateTargets,
  formatTargets,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "../src/nutrition/tdee.ts";

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const value = argv[i + 1] ?? "";
      args[key] = value;
      i++;
    }
  }
  return args;
}

const args = parseArgs(process.argv);

const required = ["age", "sex", "weight", "height", "activity", "goal"];
const missing = required.filter((k) => !args[k]);
if (missing.length > 0) {
  console.error(`Missing required args: ${missing.join(", ")}`);
  console.error(
    "Usage: tsx scripts/tdee.ts --age N --sex m|f --weight KG --height CM --activity sedentary|light|moderate|active|very_active --goal fat_loss|maintain|recomp|slow_gain|muscle_gain [--bf BODY_FAT_PCT]",
  );
  process.exit(1);
}

const profile = {
  age: Number.parseInt(args.age, 10),
  sex: args.sex as Sex,
  weight_kg: Number.parseFloat(args.weight),
  height_cm: Number.parseFloat(args.height),
  activity: args.activity as ActivityLevel,
  goal: args.goal as Goal,
  body_fat_pct: args.bf ? Number.parseFloat(args.bf) : undefined,
};

console.log(`Profile: ${args.age}y ${args.sex} ${args.weight}kg ${args.height}cm ${args.activity} ${args.goal}${args.bf ? ` BF${args.bf}%` : ""}`);
console.log("");

const targets = calculateTargets(profile);
console.log(formatTargets(targets));
