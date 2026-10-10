# MedPrep

> Learn the medicine. Master the Russian exam.

Exam preparation for English-speaking medical graduates taking Russian Primary
Accreditation in General Medicine (Лечебное дело).

**Status: Milestone 4.** Real accounts, plus a database-backed question bank:
- questions and answer keys live in Supabase, and **every answer is graded on the server**;
- each question records its source, rights and medical-review status;
- the admin area imports CSV spreadsheets and handles the review workflow.

Each student's progress is saved to their account, so it follows them across
devices: answer history, mistakes, bookmarks, the review schedule for questions
and terms, mock exam results, and the Russian-text preference. Terminology cards
and mock exam formats are still demo content.

**Milestone 5:** the 20 terminology cards now live in the database (`terms`
table) with their original IDs, so existing review progress is kept. Students
only see terms whose rights are cleared and that are approved (or labelled
demo); only admins can change them.

- Plan: [docs/PROPOSAL.md](docs/PROPOSAL.md)
- Connect your Supabase project: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
- Add and review questions: [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)
- Screenshots: [docs/screenshots](docs/screenshots)

## Run it on your computer

You need **Node.js 20.9+** (from nodejs.org) and **pnpm** (`npm install -g pnpm`).

```bash
pnpm install          # download libraries (one time)
cp .env.example .env.local   # then fill it in, see docs/SUPABASE_SETUP.md
pnpm dev              # start the app at http://localhost:3000
```

### Optional: a private local database for development and tests

If you install **Docker Desktop**, you can run a complete copy of Supabase on
your computer. Nothing is shared with the cloud project.

```bash
pnpm db:start         # start local Supabase (first run downloads ~1–2 GB)
pnpm db:reset         # rebuild the local database from supabase/migrations
pnpm db:stop          # stop it
```

While it's running, emails (confirmations, password resets) are caught by a
local test inbox at <http://127.0.0.1:54324> instead of being sent. Put the
local URL and publishable key printed by `pnpm db:start` into `.env.local`.

## Checks

| Command | What it does |
|---|---|
| `pnpm lint` | Looks for common code mistakes |
| `pnpm typecheck` | Checks TypeScript types |
| `pnpm test` | Unit tests: scheduling, analytics, demo content integrity |
| `pnpm test:db` | Database security tests: profiles, question visibility, answer keys, grading, import, private progress, terminology (needs `pnpm db:start`) |
| `pnpm build` | Production build, which fails if anything is broken |
| `pnpm test:e2e` | Clicks through the built app in a real browser, including sign-up via the test inbox (needs `pnpm db:start` and `pnpm build`) |
| `pnpm db:types` | Regenerates `src/lib/supabase/database.types.ts` from the local database |
| `pnpm content:seed` | Rebuilds `supabase/seed.sql` (local demo data) from `content/demo-questions.csv` |

## Where things are

- `src/app/(auth)/` holds sign in, sign up, forgot and reset password, and their server actions.
- `src/app/auth/callback/` is where links in emails land.
- `src/app/(app)/` holds the signed-in screens, including `settings/`.
- `src/proxy.ts` runs before every page: it keeps the login fresh and sends signed-out visitors to sign in.
- `src/lib/auth.ts` is the single place the server asks "who is signed in?".
- `src/lib/supabase/` holds the Supabase connection and generated database types.
- `supabase/migrations/` holds the database tables and security rules (SQL).
- `src/app/(app)/admin/` holds the content admin: import, question review, sources.
- `src/app/(app)/question-actions.ts` holds the server functions students call to load questions and submit answers.
- `src/lib/content/` holds the CSV format and validation, plus question queries.
- `content/demo-questions.csv` holds the 18 demo questions (also a worked example of the CSV format).
- `src/lib/progress-store.tsx` holds the student's progress in the browser while they use the app; every change is saved through `src/app/(app)/progress-actions.ts`.
- `src/demo/` holds **demo-only** mock exam formats. Terminology cards are in the `terms` table (added with the 20 demo cards by `supabase/migrations/20261014090000_terms.sql`).
- `tests/` holds unit tests, database security tests and browser tests.
