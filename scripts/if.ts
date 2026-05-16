/**
 * Intermittent Fasting timer CLI.
 *
 * Usage:
 *   tsx scripts/if.ts --protocol 16:8 --start "2026-05-16 20:00"
 *   tsx scripts/if.ts --protocol 18:6 --start "2026-05-16T20:00"
 *   tsx scripts/if.ts --protocol OMAD --start-hours-ago 22
 *   tsx scripts/if.ts --list   # list semua protocol yang available
 */
import {
  calculateIFState,
  formatIFState,
  listIFProtocols,
  type IFProtocol,
} from "../src/nutrition/if-timer.ts";

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

if (args.list) {
  console.log("Protocols yang available:");
  console.log("");
  for (const p of listIFProtocols()) {
    console.log(`  ${p.protocol.padEnd(12)} (${p.fast_hours}h fast / ${p.eat_hours}h eat)`);
    console.log(`    ${p.description_id}`);
    console.log("");
  }
  process.exit(0);
}

if (!args.protocol) {
  console.error("Usage: tsx scripts/if.ts --protocol PROTO --start \"YYYY-MM-DD HH:MM\"");
  console.error("       tsx scripts/if.ts --protocol OMAD --start-hours-ago N");
  console.error("       tsx scripts/if.ts --list");
  process.exit(1);
}

let fastStart: Date;
if (args["start-hours-ago"]) {
  const hours = Number.parseFloat(args["start-hours-ago"] as string);
  fastStart = new Date(Date.now() - hours * 60 * 60 * 1000);
} else if (args.start) {
  // Accept "2026-05-16 20:00" or "2026-05-16T20:00"
  const isoish = String(args.start).replace(" ", "T");
  fastStart = new Date(isoish);
  if (Number.isNaN(fastStart.getTime())) {
    console.error(`Cannot parse --start "${args.start}". Pakai format "2026-05-16 20:00".`);
    process.exit(1);
  }
} else {
  console.error("Need --start \"YYYY-MM-DD HH:MM\" atau --start-hours-ago N");
  process.exit(1);
}

const protocol = args.protocol as IFProtocol;
const state = calculateIFState(fastStart, protocol);
console.log(formatIFState(state));
