# MedPrep — Architecture Proposal (Milestone 0)

> **Learn the medicine. Master the Russian exam.**
>
> Status: **approved 2026-10-10.** Milestone 1 (clickable prototype) in progress.

---

## 1. What I found in the environment (checked 2026-10-10)

| Item | Result | What it means for you |
|---|---|---|
| Repository `mudicrypto/medtest` | Empty, no commits yet. Branch `claude/medprep-architecture-92tfhi` | We start from a clean slate, so there's no old code to work around. |
| Node.js | v22.22.0 | Node runs JavaScript/TypeScript outside the browser. Next.js needs it, and v22 is a current long-term-support version. |
| npm / pnpm | 10.9.4 / 10.28.0 | These are package managers. They download libraries. I'll use **pnpm** because it's faster and uses less disk space. |
| npm registry | Reachable | We can install libraries. |
| Docker, psql | Installed | We can run a local Supabase database later for testing. |
| Latest versions on npm | Next.js 16.4, React 19.3, Tailwind 4.3, supabase-js 2.117, @supabase/ssr 0.12, Zod 4.6 | The plan below uses these current versions. |

**Important:** this cloud workspace is temporary. Anything not committed and pushed to GitHub is lost when the session ends, so I'll push at the end of every milestone.

---

## 2. Stack choice and trade-offs

### 2.1 Frontend framework

| Option | Pros | Cons |
|---|---|---|
| **Next.js (App Router) — recommended** | Frontend and server code live in one project. Server code is a safe place for answer keys, API keys and AI calls. Pages load fast and work well on phones. Huge community, and easy to host on Vercel. | More concepts to learn (server vs client components). Updates arrive frequently. |
| Vite + React (browser-only app) | Simpler mental model. | Has no server, so answer keys and AI keys would need a separate backend. That breaks two of your core rules unless we build a second service. |
| Remix / React Router 7 | Clean data loading. | Smaller ecosystem, and its Supabase and Vercel guides are less mature. |

**Decision:** Next.js 16 with the App Router and TypeScript (strict mode).

### 2.2 Database and authentication

| Option | Pros | Cons |
|---|---|---|
| **Supabase — recommended** | Real PostgreSQL, which suits relational exam data. Login, email and OAuth are built in. **Row Level Security (RLS)** lets the database itself enforce "a student can only see their own data". Has a free tier and a local dev mode through Docker. | You depend on one vendor, though it's standard Postgres underneath, so you can migrate away. RLS policies must be written carefully, and I'll add tests for them. |
| Firebase | Easy setup. | Its NoSQL database fits question banks, analytics and reporting poorly. |
| Neon/Postgres + Auth.js or Clerk | Flexible. | More moving parts for a beginner to manage, and Auth.js is the source of many DIY security mistakes. |

**Decision:** Supabase for Postgres, Auth, and Storage (images in questions). Schema changes live as SQL migration files in the repo, so every change is versioned and reviewable.

### 2.3 Other choices

| Area | Choice | Why |
|---|---|---|
| Styling | **Tailwind CSS v4** with our own design tokens, plus a small set of hand-built components (Radix primitives where accessibility is tricky, e.g. dialogs and menus) | Fast to build, consistent, and with no heavy UI kit look. |
| Validation | **Zod** | Checks every form and API input on the server. |
| Spaced repetition | **FSRS** algorithm (via the `ts-fsrs` library, to be confirmed at that milestone) | It's the modern successor to SM-2 (Anki's original algorithm) and gives better review scheduling. |
| AI tutor | Server-only route that calls the **Claude API** (`claude-sonnet-5-5` by default, configurable) | The key stays on the server. The tutor receives the current question, the student's answer and our verified explanation as context. |
| Payments (later) | Stripe, with webhooks handled server-side | This is the industry standard. |
| Hosting | Vercel (app) + Supabase Cloud (database) | Both have free tiers and deploy automatically from GitHub. |
| Testing | Vitest (logic), Playwright (clickable end-to-end checks; Chromium is already installed here) | I'll only say something works after a test or a real browser run shows it. |

---

## 3. Content-integrity rules, built into the design

These rules come from your brief, and they're enforced by the data model, not just by good intentions.

1. **Every question has an `origin`:**
   - `original_practice`: written by our team. Its badge reads **"MedPrep original practice question"**.
   - `official_verified`: matches material from an official public source, with a citation and verification date. Its badge reads **"Official source — verified"**.
   - `adapted`: based on an official item but reworded or translated. Its badge reads **"Adapted from official source"**.
   - `demo`: placeholder content for the prototype. Its badge reads **"DEMO — not for study"**.
2. **Every question records** its source reference, its **rights status** (`owned`, `licensed`, `public_domain`, `permission_pending`, `not_cleared`) and its **medical review status** (`draft`, `in_review`, `approved`, `retired`), plus who reviewed it and when.
3. **Students see only published content:** `review_status = approved` AND rights status is cleared. The database rules (RLS) enforce this, not just the UI.
4. **Russian original text appears only when its rights are cleared.** Otherwise we show our own English and Russian terminology only.
5. **Exam rules are configuration, not hardcoded facts.** Mock exam settings (number of questions, time limit, pass mark) are stored as an `exam_blueprint` row, with a source link and a "last verified" date. The UI shows that date. I won't put numbers in the app as "official" until you or a reviewer confirm them against the current official source (e.g. the Methodological Accreditation Centre, fmza.ru).
6. **The AI tutor is labelled as AI.** It's told not to claim exam rules or official content, and it answers from our reviewed explanation first.

---

## 4. Security model (answer keys and secrets)

- **Answer keys live in a separate table** (`question_keys`) that students can't read, because RLS has no `select` policy for them.
- **Grading happens on the server.** The browser sends "I picked option B". A server action calls a Postgres function (`submit_attempt`), which records the attempt and only *then* returns whether the answer was correct, plus the explanation.
- **Mock exams** reveal nothing until the whole exam is submitted, or until time runs out on the server clock.
- **Secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`) live only in server environment variables. They're never prefixed `NEXT_PUBLIC_` (that prefix would ship them to browsers), and they're imported only from files marked `server-only`, so the build fails if one leaks into browser code.
- **Admin and reviewer roles** are stored in a `profiles.role` column and checked by RLS and the server, never by the UI alone.
- **The AI tutor has rate limits** per user per day, to control cost and abuse.

> **Prototype exception:** the Milestone 1 clickable prototype has no server, so its *demo* answers are in the browser. That's acceptable only because it's clearly labelled demo content. Milestone 3 replaces it with the server-side model above.

---

## 5. Main routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Marketing landing page | Public |
| `/login`, `/signup`, `/auth/callback` | Accounts | Public |
| `/dashboard` | Today's reviews, progress summary, continue where you left off | Student |
| `/practice` | Choose topics and mode (tutor mode / timed) | Student |
| `/practice/session/[id]` | Answering questions one at a time, with an explanation after each | Student |
| `/questions/[id]` | Single question view (from bookmarks or search) | Student |
| `/review` | Spaced repetition queue (due today) | Student |
| `/review/mistakes` | Questions answered wrong | Student |
| `/bookmarks` | Saved questions | Student |
| `/mock-exams` | List of blueprints and past attempts | Student |
| `/mock-exams/[attemptId]` | Timed exam runner | Student |
| `/mock-exams/[attemptId]/results` | Score, topic breakdown, review | Student |
| `/terminology` | RU↔EN term trainer (flashcards, matching, listening later) | Student |
| `/analytics` | Accuracy by topic, trends, predicted readiness | Student |
| `/tutor` (also a side panel inside questions) | AI tutor chat with question context | Student |
| `/settings` | Profile, language display (show/hide Russian), subscription later | Student |
| `/admin/questions`, `/admin/sources`, `/admin/review` | Authoring, provenance, medical review workflow | Admin / reviewer |
| `/api/tutor` | Streaming AI responses (server only) | Student |
| `/api/stripe/webhook` | Payments (later) | Stripe |

---

## 6. Folder structure

```
medtest/
├─ docs/                      # Proposal, decisions, content guidelines
├─ supabase/
│  ├─ migrations/             # Versioned SQL: tables, RLS, functions
│  └─ seed.sql                # Demo data (clearly marked origin='demo')
├─ src/
│  ├─ app/                    # Next.js routes (folders = URLs)
│  │  ├─ (marketing)/         # Landing page
│  │  ├─ (auth)/              # Login / signup
│  │  ├─ (app)/               # Logged-in student area, shared sidebar layout
│  │  │  ├─ dashboard/ practice/ review/ bookmarks/
│  │  │  ├─ mock-exams/ terminology/ analytics/ tutor/ settings/
│  │  ├─ admin/               # Content & review tools
│  │  └─ api/                 # Server endpoints (tutor, webhooks)
│  ├─ components/
│  │  ├─ ui/                  # Button, Card, Badge, Progress, Dialog…
│  │  └─ features/            # QuestionCard, SourceBadge, TermCard, ExamTimer…
│  ├─ lib/
│  │  ├─ supabase/            # Browser + server clients
│  │  ├─ server/              # server-only code: grading, AI, secrets
│  │  ├─ srs/                 # Spaced repetition scheduling
│  │  └─ validation/          # Zod schemas
│  ├─ demo/                   # Prototype-only demo data (deleted later)
│  └─ styles/                 # Design tokens
├─ tests/                     # Vitest unit + Playwright e2e
└─ .env.example               # Lists required variables, no real values
```

---

## 7. Database schema (first version)

All tables have `id uuid`, `created_at` and `updated_at`. RLS is on for every table.

**Content**
- `topics`: id, slug, name_en, name_ru, parent_id (sub-topics, e.g. Cardiology → Arrhythmias), sort_order
- `content_sources`: id, title, publisher, url, accessed_at, license_notes, rights_status
- `questions`: id, topic_id, stem_en, stem_ru (nullable), origin, source_id (nullable), source_ref (e.g. item number/page), rights_status, review_status, reviewed_by, reviewed_at, difficulty, version, published_at
- `question_options`: id, question_id, position (A–D), text_en, text_ru
- `question_keys` 🔒: question_id, correct_option_id, explanation_en, explanation_ru, references (students can't read this directly)
- `terms`: id, term_ru, term_en, transliteration, definition_en, topic_id, example_ru, example_en, origin, review_status
- `exam_blueprints`: id, name, question_count, time_limit_minutes, pass_threshold, topic_weights (json), source_id, last_verified_at, is_demo

**Users & learning**
- `profiles`: id (= auth user), display_name, role (`student` | `reviewer` | `admin`), show_russian, target_exam_date
- `practice_sessions`: id, user_id, mode, topic_ids, started_at, finished_at
- `attempts`: id, user_id, question_id, session_id / mock_attempt_id, selected_option_id, is_correct, time_ms, answered_at
- `bookmarks`: user_id, question_id, note
- `srs_cards`: user_id, item_type (`question` | `term`), item_id, FSRS fields (due, stability, difficulty, reps, lapses, state), last_review
- `mock_attempts`: id, user_id, blueprint_id, question_ids (ordered), started_at, deadline_at, submitted_at, score
- `tutor_messages`: id, user_id, question_id (nullable), role, content, tokens, created_at

**Later**
- `subscriptions`: user_id, stripe_customer_id, plan, status, current_period_end

**Server functions:** `submit_attempt`, `start_mock_exam`, `submit_mock_exam`, `get_due_reviews`, plus analytics views such as `v_topic_accuracy`.

---

## 8. Design direction

- **Palette:** off-white background `#F8FAFC`, white cards, deep navy text `#0B1B34`, muted slate secondary text, restrained teal accent `#0F766E` / `#14B8A6` for actions and progress, and soft red and green reserved for answer feedback only.
- **Type:** *Inter* for the interface and *Source Serif 4* for question stems and explanations, to give them a calm, textbook feel. Both have full Cyrillic support, which is essential for Russian text.
- **Layout:** sidebar navigation on laptops and a bottom tab bar on phones. Comfortable reading width for questions. Large tap targets on answer options.
- **Russian text:** a toggle beside each question shows or hides the Russian original. Key terms are underlined and open a RU/EN tooltip.
- **Source badges:** always visible at the top of every question card.
- **Accessibility:** WCAG AA contrast, full keyboard support (keys 1–4 / A–D pick answers), and reduced-motion support.

---

## 9. Implementation sequence (milestones)

Each milestone ends with: tests run, results reported honestly, commit, push, and a pause for your approval.

| # | Milestone | What you get | Backend? |
|---|---|---|---|
| **0** | **This proposal** | Plan to approve or change | — |
| **1** | **Clickable frontend prototype** | Landing page, dashboard, practice session (answer → explanation), mistake review, bookmarks, mock exam runner + results, terminology flashcards, analytics charts, AI tutor panel (scripted demo replies). All content is labelled **DEMO**. State is kept in the browser only. | No |
| 2 | Supabase setup + auth | Real sign-up and login, profiles, protected routes, `.env` setup guide | Yes |
| 3 | Content schema + secure grading | Migrations, RLS, server-side grading, admin import of questions with provenance fields | Yes |
| 4 | Practice, bookmarks, mistakes on real data | Prototype screens wired to the database | Yes |
| 5 | Spaced repetition (FSRS) for questions and terms | Daily review queue | Yes |
| 6 | Mock exams with server timing | Blueprint-driven exams, results | Yes |
| 7 | Analytics | Topic accuracy, trends, readiness | Yes |
| 8 | AI tutor | Context-aware, streaming, rate-limited, server-only key | Yes |
| 9 | Admin & medical review workflow | Authoring, source tracking, reviewer sign-off | Yes |
| 10 | Deployment | Vercel + Supabase Cloud, custom domain | Yes |
| 11 | Subscriptions | Stripe plans, paywall rules | Yes |

### What Milestone 1 will do, step by step

1. `pnpm create next-app` creates the project skeleton (TypeScript, Tailwind, App Router, ESLint).
2. Set up design tokens, fonts and base UI components.
3. Build the screens listed above with demo data from `src/demo/`.
4. Run `pnpm lint`, `pnpm typecheck` and `pnpm build`, which check for code errors and confirm the app compiles.
5. Run Playwright in the pre-installed Chromium to click through the main flows, and take phone and laptop screenshots to show you.
6. Commit and push to `claude/medprep-architecture-92tfhi`.

---

## 10. Decisions (answered 2026-10-10)

1. **Stack:** approved: Next.js + Tailwind + Supabase + Claude API for the tutor.
2. **Name:** keep **MedPrep** for now.
3. **Content rights:** the product owner (a physician at Sechenov University) reports permission to use the question material, and that the questions have been approved. **Action for Milestone 3:** record the permission document (who granted it, scope, date) as a `content_sources` row, so every imported question links to its rights evidence.
4. **Medical review:** qualified doctors will review all content. The `review_status` workflow (draft → in_review → approved) stays mandatory before publication.
