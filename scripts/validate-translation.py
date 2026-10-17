#!/usr/bin/env python3
"""Checks a translated General Medicine bank against its Russian source.

Usage:
  python3 -I scripts/validate-translation.py SOURCE_DIR TRANSLATED_DIR [FIRST_25_FILE]

Passes only if, for every one of the source records:
  - the English question is non-empty and the English options are non-empty,
    with exactly as many English options as Russian ones;
  - the English text contains no Cyrillic (nothing left untranslated);
  - the Russian question and options, answer keys, ID, source number,
    discipline and topic are unchanged;
and the first 25 existing translations were kept as supplied.
Reads files only; changes nothing.
"""
import json
import pathlib
import re
import sys

CYRILLIC = re.compile(r"[А-Яа-яЁё]")
UNCHANGED = [
    "question_ru", "options_ru", "correct_option_index", "correct_option_indices_source",
    "source_question_number", "source_page", "discipline_ru", "discipline_en", "topic_ru",
    "source_topic_ru", "status", "review_flags",
]


def load(directory):
    records = {}
    for f in sorted(pathlib.Path(directory).glob("[0-9][0-9]_*.json")):
        for q in json.loads(f.read_text(encoding="utf-8"))["questions"]:
            q["_file"] = f.name
            records[q["id"]] = q
    return records


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    source, translated = load(sys.argv[1]), load(sys.argv[2])
    problems = []
    if len(translated) != len(source):
        problems.append(f"record count: {len(translated)} translated vs {len(source)} source")
    missing = sorted(set(source) - set(translated))
    if missing:
        problems.append(f"{len(missing)} records missing from the translation, e.g. {missing[:3]}")

    stats = {"english": 0, "options_ok": 0, "unchanged": 0, "no_cyrillic": 0}
    for qid, s in source.items():
        t = translated.get(qid)
        if not t:
            continue
        en, opts = t.get("question_en"), t.get("options_en")
        if isinstance(en, str) and en.strip():
            stats["english"] += 1
        else:
            problems.append(f"{qid}: empty English question")
        if isinstance(opts, list) and len(opts) == len(s["options_ru"]) and all(isinstance(o, str) and o.strip() for o in opts):
            stats["options_ok"] += 1
        else:
            problems.append(f"{qid}: English options missing, empty or a different count ({len(opts or [])} vs {len(s['options_ru'])})")
        changed = [k for k in UNCHANGED if t.get(k) != s.get(k)] + (["file"] if t["_file"] != s["_file"] else [])
        if changed:
            problems.append(f"{qid}: changed {changed}")
        else:
            stats["unchanged"] += 1
        if not CYRILLIC.search(" ".join([en or ""] + [o or "" for o in (opts or [])])):
            stats["no_cyrillic"] += 1
        else:
            problems.append(f"{qid}: English text contains Cyrillic")

    if len(sys.argv) > 3:
        first = json.loads(pathlib.Path(sys.argv[3]).read_text(encoding="utf-8"))["questions"]
        kept = sum(
            1 for q in first
            if q["id"] in translated
            and translated[q["id"]].get("question_en") == q["question_en"]
            and translated[q["id"]].get("options_en") == q["options_en"]
        )
        print(f"first {len(first)} existing translations kept as supplied: {kept}/{len(first)}")
        if kept != len(first):
            problems.append(f"only {kept}/{len(first)} of the existing translations were kept")

    n = len(source)
    print(f"source records: {n}")
    print(f"non-empty English question: {stats['english']}/{n}")
    print(f"English options present, non-empty, same count as Russian: {stats['options_ok']}/{n}")
    print(f"Russian text, answer keys, IDs, disciplines, topics unchanged: {stats['unchanged']}/{n}")
    print(f"no Cyrillic left in English: {stats['no_cyrillic']}/{n}")
    if problems:
        print(f"\nFAILED: {len(problems)} problem(s)")
        for p in problems[:40]:
            print("  -", p)
        sys.exit(1)
    print("\nPASSED")


if __name__ == "__main__":
    main()
