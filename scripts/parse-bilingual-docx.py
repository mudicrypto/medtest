#!/usr/bin/env python3
"""Parses a bilingual (RU then EN) question block from a Word document.

  python3 -I scripts/parse-bilingual-docx.py INPUT.docx OUTPUT.json

Expected layout (as in the Cardiology blocks supplied by the owner):
  "NN  RUSSIAN QUESTION"                 header paragraph, NN = source number
  numbered list paragraphs                Russian options
  [red line under the question]           source warning, e.g. options cut off
  "NN  ENGLISH QUESTION"                  same number again
  numbered list paragraphs                English options
  [red line]                              English version of the warning
The correct option is bold green (1B7F3B); an option with no green mark means
no answer is marked. "Notes on the source screenshots" at the end is kept as
document-level notes.

Nothing is changed: texts are copied as they are (only surrounding whitespace
is trimmed); a question's Russian and English halves must agree on number,
option count and marked answer, or parsing fails.
"""
import json
import re
import sys

import docx

GREEN = "1B7F3B"
RED = "B00020"
HEADER = re.compile(r"^(\d+)\s{2,}(.+)$", re.S)


def is_list_item(p):
    ppr = p._p.pPr
    return ppr is not None and ppr.numPr is not None


def colours(p):
    return {str(r.font.color.rgb) for r in p.runs if r.text.strip() and r.font.color and r.font.color.rgb}


def main(src, dst):
    d = docx.Document(src)
    paras = [p for p in d.paragraphs if p.text.strip()]
    notes_at = next((i for i, p in enumerate(paras) if p.text.strip() == "Notes on the source screenshots"), len(paras))
    title, legend = paras[0].text.strip(), paras[1].text.strip()
    halves = []  # each: {number, text, options, correct, warnings}
    cur = None
    for p in paras[2:notes_at]:
        text = p.text.strip()
        m = HEADER.match(text)
        if m and not is_list_item(p):
            cur = {"number": int(m.group(1)), "text": m.group(2).strip(), "options": [], "correct": [], "warnings": []}
            halves.append(cur)
        elif cur is None:
            raise SystemExit(f"Unexpected paragraph before the first question: {text[:80]!r}")
        elif is_list_item(p):
            if GREEN in colours(p):
                cur["correct"].append(len(cur["options"]))
            cur["options"].append(text)
        elif colours(p) == {RED}:
            cur["warnings"].append(text)
        else:
            raise SystemExit(f"Unrecognised paragraph in question {cur['number']}: {text[:80]!r}")

    if len(halves) % 2:
        raise SystemExit(f"Odd number of question halves ({len(halves)}): a Russian or English half is missing.")
    questions, problems = [], []
    for ru, en in zip(halves[0::2], halves[1::2]):
        n = ru["number"]
        if en["number"] != n:
            problems.append(f"No. {n}: English half has number {en['number']}")
        if len(ru["options"]) != len(en["options"]):
            problems.append(f"No. {n}: {len(ru['options'])} Russian vs {len(en['options'])} English options")
        if ru["correct"] != en["correct"]:
            problems.append(f"No. {n}: marked answer differs ({ru['correct']} vs {en['correct']})")
        if len(ru["correct"]) > 1:
            problems.append(f"No. {n}: more than one answer marked")
        questions.append({
            "source_question_number": n,
            "question_ru": ru["text"],
            "question_en": en["text"],
            "options_ru": ru["options"],
            "options_en": en["options"],
            "correct_option_index": ru["correct"][0] if ru["correct"] else None,
            "source_warnings_ru": ru["warnings"],
            "source_warnings_en": en["warnings"],
        })
    if problems:
        raise SystemExit("Russian and English halves disagree:\n  " + "\n  ".join(problems))
    numbers = [q["source_question_number"] for q in questions]
    if len(set(numbers)) != len(numbers):
        raise SystemExit("Duplicate source numbers in the document.")
    notes = [p.text.strip() for p in paras[notes_at + 1 :]]
    out = {"source_file": src.split("/")[-1], "title": title, "legend": legend, "notes": notes, "questions": questions}
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    keyed = sum(q["correct_option_index"] is not None for q in questions)
    warned = sum(bool(q["source_warnings_en"]) for q in questions)
    counts = {}
    for q in questions:
        counts[len(q["options_ru"])] = counts.get(len(q["options_ru"]), 0) + 1
    print(f"{title}: {len(questions)} questions | answer marked: {keyed} | with source warnings: {warned} | option counts: {dict(sorted(counts.items()))}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
