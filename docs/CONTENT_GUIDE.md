# Content guide: adding and reviewing questions

This guide is for the people who manage the question bank: admins and medical
reviewers.

## Roles

| Role | Can do |
|---|---|
| **student** (everyone, by default) | Practise published questions. Never sees answer keys before answering. |
| **reviewer** | See every question, including drafts and answer keys. Change review status (approve, send back, retire). |
| **admin** | Everything a reviewer can do, plus import questions and register sources. |

### Making yourself an admin (one time)

1. Sign up in the app with your normal email and confirm it.
2. In Supabase, open **SQL Editor → New query** and run this, using your own email:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

3. Reload the app. A **Content admin** button appears under your name.

To make a doctor a **reviewer**, ask them to sign up first, then run the same
query with `'reviewer'` and their email. Only someone with access to your
Supabase project can change roles; nobody can do it from inside the app.

## What students see

A question is shown to students only when **all** of these are true:

1. **Rights** are `owned`, `licensed` or `public_domain`.
2. **Review status** is `approved`. Demo questions are the exception: they show
   while not retired, always labelled **DEMO**.
3. It is **not retired**.

The database enforces this rule itself, so a mistake in the app can't expose
unreviewed content. Answer keys are stored in a separate table that students
can never read. A student only receives a key in the reply to an answer they
have submitted.

## Step 1: register the source

Before importing official or adapted material, open **Content admin → Sources**
and add the source:

- **Title:** e.g. "Sechenov University question bank"
- **Rights status:** usually "Licensed / permission granted"
- **Granted by / Date granted**
- **Permission evidence:** what the permission is and where the document is
  kept (e.g. "Signed letter from Dept. X, ref. 123, stored in the shared drive").

This is the written record that we may use the material.

## Step 2: prepare the spreadsheet

Download the **Template** from **Content admin → Import**. Each row is one
question. Columns:

| Column | Required | Notes |
|---|---|---|
| `slug` | yes | Your ID for the question, unique and permanent. Lowercase letters, numbers, hyphens, e.g. `card-0001`. Re-importing the same slug **updates** that question. |
| `topic` | yes | One of: cardiology, pulmonology, gastroenterology, endocrinology, infectious-diseases, neurology, obstetrics, pediatrics, surgery |
| `difficulty` | no | 1, 2 or 3 (default 2) |
| `stem_en` | yes | The question in English |
| `stem_ru` | no | Russian original text |
| `option_a_en` … `option_d_en` | yes | The four answers in English |
| `option_a_ru` … `option_d_ru` | no | The four answers in Russian |
| `correct` | yes | A, B, C or D |
| `explanation_en` | yes | Why the answer is correct, shown after answering |
| `explanation_ru` | no | Russian explanation |
| `tutor_hint` | no | Short hint the tutor uses |
| `key_terms` | no | `русский = English; русский = English` |
| `origin` | yes | `original_practice`, `official_verified`, `adapted` or `demo` |
| `rights_status` | yes | `owned`, `licensed`, `public_domain`, `permission_pending`, `not_cleared` |
| `review_status` | no | `draft`, `in_review` (default) or `approved` |
| `source_ref` | no | Item or page number in the source, e.g. "Item 1043" |
| `review_note` | no | e.g. "Approved by Dept. of Therapy, Sechenov, 2026" |

**Saving from Excel:** use **File → Save As → CSV UTF-8 (Comma delimited)**.
Plain "CSV" can garble Russian text.

**Which origin should I use?**

- Taken word-for-word from the official bank, with permission → `official_verified`
- Based on an official item but reworded or translated → `adapted`
- Written by your team → `original_practice`

Official and adapted rows must be imported with a **source** selected.

## Step 3: import

1. Open **Content admin → Import**, choose the file, and choose the source (or
   "None" for original content).
2. Click **Check file**. Nothing is saved yet. You'll see how many rows are
   new or updates, plus every problem with its line number.
3. Fix any problems in the spreadsheet and check again. The **Import** button
   only appears when the file is completely clean.
4. Click **Import**. The whole file is saved in one go: if anything fails,
   nothing is saved, so a spreadsheet is never half-imported.

## Step 4: review

Open **Content admin → Questions** and filter by **In review**. Open each
question to see the answer key, explanation and provenance, then choose:

- **Approve:** students can see it (if the rights are cleared).
- **In review / Draft:** hidden from students.
- **Retire:** withdrawn permanently; it also disappears from students' lists.

The app records who changed the status and when, plus your optional note.

> If your questions were already approved by qualified reviewers before import,
> set `review_status` to `approved` and fill in `review_note` with who approved
> them. The import records you as the person who published them.

## Removing the demo questions

When real content is in, retire the 18 demo questions: open **Questions**,
filter **Origin → Demo**, and set each to **Retire**. In production, simply
don't import `content/demo-questions.csv` in the first place.
