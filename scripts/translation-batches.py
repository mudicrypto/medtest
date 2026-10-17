#!/usr/bin/env python3
"""Batch bookkeeping for translating the General Medicine bank (RU → EN).

  python3 -I scripts/translation-batches.py prepare        split untranslated questions into input batches
  python3 -I scripts/translation-batches.py check NNN [..] check saved output batches against their input
  python3 -I scripts/translation-batches.py status         which batches are done, which remain
  python3 -I scripts/translation-batches.py merge          build the complete bilingual package

Layout (all under content/private/general-medicine/, which git ignores):
  general-medicine-pa-5071/          the classified source bank (never modified)
  medprep_general_medicine_english_batch_001_q0001-0025.json   first 25 translations (reused)
  translation/input/batch_NNN.json   questions to translate: id, question_ru, options_ru
  translation/output/batch_NNN.json  translations: {"items": [{"id", "question_en", "options_en"}]}
  bilingual/                         the merged package (19 discipline files + manifest)

A batch counts as done only when its output passes `check`, so work can stop
and resume at any point: `status` lists exactly what's left.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path("content/private/general-medicine")
SOURCE = ROOT / "general-medicine-pa-5071"
FIRST = ROOT / "medprep_general_medicine_english_batch_001_q0001-0025.json"
INPUT = ROOT / "translation" / "input"
OUTPUT = ROOT / "translation" / "output"
PACKAGE = ROOT / "bilingual"
BATCH_SIZE = 50
CYRILLIC = re.compile(r"[А-Яа-яЁё]")


def source_records():
    out = []
    for f in sorted(SOURCE.glob("[0-9][0-9]_*.json")):
        out.extend(json.loads(f.read_text(encoding="utf-8"))["questions"])
    return out


def first_25():
    return {q["id"]: q for q in json.loads(FIRST.read_text(encoding="utf-8"))["questions"]}


def prepare():
    INPUT.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    done = first_25()
    todo = [q for q in sorted(source_records(), key=lambda q: q["source_question_number"]) if q["id"] not in done]
    for i in range(0, len(todo), BATCH_SIZE):
        n = i // BATCH_SIZE + 1
        items = [{"id": q["id"], "question_ru": q["question_ru"], "options_ru": q["options_ru"]} for q in todo[i : i + BATCH_SIZE]]
        (INPUT / f"batch_{n:03d}.json").write_text(json.dumps({"batch": n, "items": items}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(todo)} questions to translate in {-(-len(todo) // BATCH_SIZE)} batches of up to {BATCH_SIZE} (first 25 reused)")


def check_batch(n):
    """Returns a list of problems (empty = the batch is done and valid)."""
    inp = INPUT / f"batch_{n:03d}.json"
    out = OUTPUT / f"batch_{n:03d}.json"
    if not out.exists():
        return ["no output file"]
    try:
        items = json.loads(out.read_text(encoding="utf-8"))["items"]
    except Exception as e:  # noqa: BLE001
        return [f"unreadable output: {e}"]
    src = json.loads(inp.read_text(encoding="utf-8"))["items"]
    problems = []
    if [x.get("id") for x in items] != [x["id"] for x in src]:
        problems.append("IDs differ from the input (missing, extra or out of order)")
        return problems
    for x, s in zip(items, src):
        en, opts = x.get("question_en"), x.get("options_en")
        if not isinstance(en, str) or not en.strip():
            problems.append(f"{s['id']}: empty question_en")
        if not isinstance(opts, list) or len(opts) != len(s["options_ru"]) or not all(isinstance(o, str) and o.strip() for o in opts):
            problems.append(f"{s['id']}: options_en must have {len(s['options_ru'])} non-empty items")
        if CYRILLIC.search(" ".join([en or ""] + [o for o in (opts or []) if isinstance(o, str)])):
            problems.append(f"{s['id']}: Cyrillic left in the English")
    return problems


def batches():
    return sorted(int(p.stem.split("_")[1]) for p in INPUT.glob("batch_*.json"))


def check(ns):
    bad = 0
    for n in ns:
        p = check_batch(n)
        if p:
            bad += 1
            print(f"batch {n:03d}: FAILED")
            for x in p[:20]:
                print("   -", x)
        else:
            print(f"batch {n:03d}: OK")
    sys.exit(1 if bad else 0)


def status():
    all_b = batches()
    done = [n for n in all_b if not check_batch(n)]
    left = [n for n in all_b if n not in done]
    q_done = sum(len(json.loads((INPUT / f"batch_{n:03d}.json").read_text(encoding="utf-8"))["items"]) for n in done)
    print(f"batches done: {len(done)}/{len(all_b)}  |  questions translated: {q_done + len(first_25())}/{len(source_records())} (incl. first 25)")
    print("remaining:", " ".join(f"{n:03d}" for n in left) or "none")


def merge():
    left = [n for n in batches() if check_batch(n)]
    if left:
        sys.exit(f"Not complete: {len(left)} batches still to do or invalid: {left[:20]}")
    tr = {}
    for q in first_25().values():
        tr[q["id"]] = {"question_en": q["question_en"], "options_en": q["options_en"], "translation_status": q.get("translation_status", "translated_by_assistant")}
    for n in batches():
        for x in json.loads((OUTPUT / f"batch_{n:03d}.json").read_text(encoding="utf-8"))["items"]:
            tr[x["id"]] = {"question_en": x["question_en"], "options_en": x["options_en"], "translation_status": "translated_by_claude"}
    PACKAGE.mkdir(parents=True, exist_ok=True)
    files, total = [], 0
    for f in sorted(SOURCE.glob("[0-9][0-9]_*.json")):
        doc = json.loads(f.read_text(encoding="utf-8"))
        doc["metadata"]["translation"] = "English by Claude (AI) from the Russian originals; not reviewed by a clinician"
        for q in doc["questions"]:
            t = tr[q["id"]]
            q["question_en"], q["options_en"] = t["question_en"], t["options_en"]
            q["translation_status"] = t["translation_status"]
            q["translation_reviewed_by_clinician"] = False
            total += 1
        (PACKAGE / f.name).write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
        files.append(f.name)
    for extra in ["manifest.json", "IMPORT_GUIDE.md", "source_integrity_audit.json"]:
        (PACKAGE / extra.replace("manifest.json", "source_manifest.json")).write_bytes((SOURCE / extra).read_bytes())
    (PACKAGE / "manifest.json").write_text(json.dumps({
        "package": "MedPrep General Medicine Primary Accreditation (31.05.01), bilingual RU/EN",
        "total_questions": total,
        "files": files,
        "source": "5071-question PDF (Russian originals, PDF answer keys unchanged)",
        "english": "translated by Claude (AI); first 25 as supplied; not clinically reviewed",
        "answer_keys": "unchanged from source",
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"merged {total} questions into {PACKAGE}/ ({len(files)} discipline files)")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "prepare":
        prepare()
    elif cmd == "check":
        check([int(x) for x in sys.argv[2:]] or batches())
    elif cmd == "status":
        status()
    elif cmd == "merge":
        merge()
    else:
        sys.exit(__doc__)
