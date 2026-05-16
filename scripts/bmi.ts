/**
 * BMI calculator CLI (Asia-Pacific cutoffs).
 *
 * Usage:
 *   tsx scripts/bmi.ts --weight 75 --height 175
 *   tsx scripts/bmi.ts --weight 75 --height 175 --waist 92 --sex m
 */
import { calculateBMI, formatBmi } from "../src/nutrition/bmi.ts";

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
const required = ["weight", "height"];
const missing = required.filter((k) => !args[k]);
if (missing.length > 0) {
  console.error(`Missing args: ${missing.join(", ")}`);
  console.error(
    "Usage: tsx scripts/bmi.ts --weight KG --height CM [--waist CM --sex m|f]",
  );
  process.exit(1);
}

const result = calculateBMI({
  weight_kg: Number.parseFloat(args.weight),
  height_cm: Number.parseFloat(args.height),
  waist_cm: args.waist ? Number.parseFloat(args.waist) : undefined,
  sex: args.sex === "m" || args.sex === "f" ? (args.sex as "m" | "f") : undefined,
});

console.log(
  `Input: ${args.weight}kg, ${args.height}cm${args.waist ? `, waist ${args.waist}cm ${args.sex ?? ""}` : ""}`,
);
console.log("");
console.log(formatBmi(result));
