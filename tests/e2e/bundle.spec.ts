import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Answer keys must never be shipped to browsers. Scan every file the browser
// can download (.next/static) for text that exists only in answer keys.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

test("no answer-key text in browser code", () => {
  // Text that exists only in answer keys: explanations, per-option notes, exam pearls.
  const keyOnlyPhrases = [
    "preload-dependent, so avoid nitrates",
    "LAD occlusion causes anterior ST elevation",
    "Never delay steroids in suspected adrenal crisis",
    "An effusion is an exudate if ANY of these is true",
    "ophthalmic division of the trigeminal",
  ];
  const offenders: string[] = [];
  for (const f of files(".next/static")) {
    const text = readFileSync(f, "utf8");
    for (const phrase of keyOnlyPhrases) if (text.includes(phrase)) offenders.push(`${f}: ${phrase}`);
  }
  expect(offenders).toEqual([]);
});
