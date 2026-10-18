# Import plan: General Medicine Primary Accreditation bank (5,071 questions)

**Status (2026-10-18): imported into the LOCAL database, revised plan.** On the
owner's instruction, **all 5,071 questions** are imported and available in
student Practice, including the 648 that were going to a "needs correction"
list. Section 8 describes how; sections 1–7 are the original dry-run analysis,
kept for the record. Nothing has been applied to a live project.

Source files (kept out of git): `content/private/general-medicine/`
- `general-medicine-pa-5071/`: 19 discipline files, `manifest.json`,
  `IMPORT_GUIDE.md`, `source_integrity_audit.json`
- `translate_all_general_medicine.py` and the first 25 translations

## 1. Validation results (dry run)

| Check | Result |
|---|---|
| Records | **5,071**, matching the manifest; every discipline file matches its count |
| IDs | 5,071 unique, `pa-general-medicine-5071-q0001` … `q5071`, safe to use as permanent app IDs |
| Source numbering | 1–5,071, complete, no gaps or repeats; each ID encodes its PDF number; PDF page kept |
| Answer keys | One marked PDF answer per question (no multi-answer questions); 1 question has **no** key |
| Russian text | Present in every question and option; no empty options |
| Exact duplicates | None. 97 pairs share a stem but have different options, so they are separate questions |
| Disciplines / topics | 19 disciplines, 33 topics; every record assigned; no unclassified topic in the data |
| English | Not present yet (only the first 25 are translated) |
| Overlap with the Cardiology specialty bank | 16 questions are identical in both; **answer keys agree in all 16**. They stay as separate records in separate banks. |

## 2. Where it goes

A new branch of topics, completely separate from the Cardiology specialty bank
(`cardiology` › Medications):

```
Primary Accreditation                      pa                      (Первичная аккредитация (ПА))
└─ General Medicine (31.05.01)             pa-general-medicine     (Лечебное дело)
   ├─ Cardiology                           pa-gm-cardiology        (Кардиология)
   │  ├─ Arterial hypertension             pa-gm-cardiology-…      (Артериальная гипертензия)
   │  └─ …
   └─ … 19 disciplines, 33 topics
```

Questions attach to the topic level. Each topic keeps its Russian name exactly as
supplied. The app also needs an English topic name; the proposed names are in
section 6, for you to confirm.

## 3. How each record is stored

| Source field | MedPrep |
|---|---|
| `id` | question ID, unchanged (progress and bookmarks key on it) |
| `question_ru`, `options_ru` | Russian question and options, copied exactly |
| `question_en`, `options_en` | English, from the translation run (labelled machine translation) |
| options 0–3 | A–D |
| `correct_option_index` | the correct letter: **the PDF answer, never the Word answer** |
| `source_question_number`, `source_page` | source reference, e.g. "5071-question PDF · question 1 (page 1)" |
| everything else (the assignment method and confidence, the matched Word question and topic, review flags, status) **and** the record's entry in `source_integrity_audit.json` | kept unchanged in a new **staff-only provenance table** for every one of the 5,071 records, never shown to students |
| `explanation_en` (empty) | stays empty: "No explanation has been added for this question yet." |

Low-confidence topic assignments (the 1,777 `topic_review` audit entries) are
imported normally and keep that audit note in the provenance table. They are not
moved to a separate topic.

## 4. Records the app cannot represent faithfully: 648

These are **not** turned into questions. They are stored unchanged, with their
translation once available, on the staff-only **Needs correction** list, and are
hidden from practice.

| Reason | Records |
|---|---|
| Not exactly 4 options (1, 2, 3, or 5–13), mostly options merged or split when the PDF text was extracted | 597 |
| PDF and Word answers differ (the PDF key is kept, but the conflict is unresolved) | 118 (69 also have the wrong number of options) |
| No answer key in the PDF | 1 |
| The same option text appears twice (in 2 of these, the marked answer is one of the duplicates) | 15 (14 also flagged above) |
| **Total, without double counting** | **648** |

That leaves **4,423 questions** that can be imported faithfully.

## 5. Schema and app changes needed (local database only)

1. **Provenance table** (staff-only) holding the original record and its audit
   entry for all 5,071 questions.
2. **English question minimum length**, from 10 characters to 1. Question
   q2861's whole stem is "ГЕПАРИН" ("Heparin"), which the current rule would
   reject.
3. **Practice page grouping.** Topics shown by branch (Primary Accreditation ›
   General Medicine › discipline), with discipline headings; the full path is
   computed from the hierarchy.
4. **Import tool.** A second bank format added to `pnpm content:import`. It is
   local-only, runs in one transaction, and verifies every record against the
   files afterwards, as for Cardiology.

## 6. Decisions for you

1. **Visibility and review status.** The bank's guide says it is *"not evidence
   that every extracted option or answer is correct … never claim independent
   medical verification"*, and you haven't given a review or rights statement for
   this bank. **Recommended:** import the 4,423 questions as **"In review"**, with
   rights **"permission pending"**. Students won't see them. **Staff accounts
   (e.g. `admin@medprep.local`) can still practise them locally**, which is
   enough to test practice, bookmarks, mistakes and results. Making them visible
   to students needs your review and rights statement for this bank.
2. **English topic names** (proposed machine translations, Russian unchanged):

| Discipline › topic (RU) | Proposed English |
|---|---|
| Cardiology › Артериальная гипертензия | Arterial hypertension |
| Cardiology › ИБС | Coronary artery disease |
| Cardiology › Инфаркт миокарда | Myocardial infarction |
| Cardiology › Нарушения сердечного ритма и проводимости | Cardiac arrhythmias and conduction disorders |
| Cardiology › ХСН | Chronic heart failure |
| Cardiology › Прочее / другие патологии | Other cardiac conditions |
| Cardiology › Кардиология | Cardiology (general) |
| Gastroenterology › Заболевания кишечника | Intestinal diseases |
| Gastroenterology › Заболевания печени и желчного пузыря | Liver and gallbladder diseases |
| Gastroenterology › Заболевания пищевода, желудка и 12 п.к. | Diseases of the esophagus, stomach and duodenum |
| Gastroenterology › Заболевания поджелудочной железы | Pancreatic diseases |
| Gastroenterology › Гастроэнтерология | Gastroenterology (general) |
| Pulmonology › Бронхиальная астма | Bronchial asthma |
| Pulmonology › ХОБЛ | COPD |
| Pulmonology › Пневмонии | Pneumonia |
| Pulmonology › Другие патологии (…ТЭЛА и пр | Other conditions (interstitial pulmonary fibrosis, sarcoidosis, pleurisy, pulmonary embolism, etc.) |
| Pulmonology › Пульмонология | Pulmonology (general) |
| Clinical Pharmacology › Клиническая фармакология | Clinical pharmacology |
| Endocrinology › Эндокринология | Endocrinology |
| Hematology › Гематология | Hematology |
| Infectious Diseases › Инфекционные болезни | Infectious diseases |
| Medical Rehabilitation › Медицинская реабилитология | Medical rehabilitation |
| Nephrology › Нефрология | Nephrology |
| Neurology › Неврология | Neurology |
| Obstetrics and Gynecology › Акушерство и гинекология | Obstetrics and gynecology |
| Oncology and Radiation Therapy › Онкология, лучевая терапия | Oncology and radiation therapy |
| Ophthalmology › Офтальмология | Ophthalmology |
| Pediatrics › Педиатрия | Pediatrics |
| Public Health and Healthcare Management › Общественное здоровье и здравоохранение, экономика здравоохранения | Public health and healthcare, healthcare economics |
| Rheumatology › Ревматология | Rheumatology |
| Surgery › Хирургия | Surgery |
| Traumatology and Orthopedics › Травматология и ортопедия | Traumatology and orthopedics |
| Tuberculosis Medicine › Фтизиатрия | Phthisiology (tuberculosis medicine) |

3. **Three topics simply repeat their discipline's name.** "Cardiology ›
   Кардиология" (4 records), "Gastroenterology › Гастроэнтерология" (19) and
   "Pulmonology › Пульмонология" (6) are not in the Word list. They act as
   "general" buckets. The plan keeps them as assigned; tell me if you'd rather
   reassign those 29 records.
4. **The Pulmonology topic name is cut short in the source**: "…плевриты, ТЭЛА и
   пр". It is kept exactly as supplied.

## 7. Translation

- **Runner.** `translate_all_general_medicine.py` (OpenAI API, model
  `gpt-4.1-mini`, key read from the `OPENAI_API_KEY` environment variable). It
  saves a checkpoint after every batch of 12 and resumes after interruptions. It
  reuses the first 25 translations. It never touches Russian text or answer keys.
- **Estimated cost.** The remaining 5,046 questions are about 0.9 million
  characters of Russian: roughly 0.53M input and 0.35M output tokens. With
  `gpt-4.1-mini` (at $0.40 per million input and $1.60 per million output
  tokens; check current pricing) that's about **$0.80**, or **about $1** with a
  margin for retries. With `gpt-4.1`, about $4–5.
- **Blocked in this cloud session.** `api.openai.com` is denied by the
  environment's network policy, and no `OPENAI_API_KEY` is set.
- **Validation after the run.** `python3 -I scripts/validate-translation.py
  <source> <translated> <first-25 file>` checks:
  - exactly 5,071 non-empty English questions;
  - English option counts equal to the Russian;
  - no Cyrillic left in the English;
  - Russian text, answer keys, IDs, disciplines and topics unchanged;
  - the first 25 translations kept.

## 8. What was implemented (revised plan)

- **All 5,071 questions imported.** They are bilingual: the Russian is the
  original, and the English was translated by Claude (AI), not clinically
  reviewed. Every one is available in student Practice under Primary
  Accreditation › General Medicine (31.05.01) › discipline › topic, separate
  from the Cardiology specialty bank.
- **Any number of options.** Questions keep their source options exactly: 1 to
  13 options (A–M), duplicate option text included. Nothing is padded, trimmed
  or invented.
- **PDF answer key** used as the master, unchanged, for every question.
- **No answer key (q3718).** The question is shown and can be answered, but it
  is never marked right or wrong. It is left out of scores, mistakes, review
  and mock exams.
- **Source-integrity flags (648 questions).** The question is shown with a
  note that its source text may be imperfect. The original record and its
  audit entry (2,130 entries) are kept in the staff-only provenance table and
  shown in Content admin.
- **Review and rights are not claimed.** Questions stay "In medical review"
  with rights "permission pending". The owner's release for practice is
  recorded separately (`practice_release`), and the app shows "In medical
  review" and "English: AI translation".
- **New demo mock exam** ("General Medicine practice mock", 60 questions from
  this bank only), labelled as a demo format, not the official exam format.
- **Topic counts and question lists work above 1,000 questions** (the API
  returns at most 1,000 rows per request).
- **Command.** `pnpm content:import-gm [--dry-run|--verify]`, local database
  only, one transaction. The verification compares every question, option and
  answer key with the package.
- **Before production.** Applying the migration
  `20261018090000_variable_options.sql` and importing into a live project both
  need the owner's approval. Rights and medical review should be recorded
  before real students rely on these questions.
