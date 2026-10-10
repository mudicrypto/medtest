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
  const keyOnlyPhrases = ["Courvoisier's law", "Light's criteria classify", "ophthalmic division of the trigeminal", "Fluids first, then insulin"];
  const offenders: string[] = [];
  for (const f of files(".next/static")) {
    const text = readFileSync(f, "utf8");
    for (const phrase of keyOnlyPhrases) if (text.includes(phrase)) offenders.push(`${f}: ${phrase}`);
  }
  expect(offenders).toEqual([]);
});
