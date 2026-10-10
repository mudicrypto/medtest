// Builds the demo question bank files from content/demo-bank.ts:
//   content/demo-questions.csv  (import format; also a worked example)
// Then run scripts/csv-to-seed.ts to refresh supabase/seed.sql.
// Usage: pnpm content:build
import { writeFileSync } from "node:fs";
import { demoBank } from "../content/demo-bank";
import { validateRecord } from "../src/lib/content/model";
import { recordToCsv, toCsv } from "../src/lib/content/csv";

let failed = false;
const ids = new Set<string>();
for (const q of demoBank) {
  const problems = validateRecord(q);
  if (ids.has(q.id)) problems.push("duplicate id");
  ids.add(q.id);
  if (problems.length) {
    failed = true;
    console.error(`${q.id}: ${problems.join("; ")}`);
  }
}
if (failed) process.exit(1);

writeFileSync("content/demo-questions.csv", toCsv(demoBank.map(recordToCsv)) + "\n");
console.log(`Wrote content/demo-questions.csv (${demoBank.length} questions)`);
