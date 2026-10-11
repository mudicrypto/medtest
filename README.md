# MedPrep

> Learn the medicine. Master the Russian exam.

Exam preparation for English-speaking medical graduates taking Russian Primary
Accreditation in General Medicine (Лечебное дело).

**Status:** the student app is being finished and polished **locally**, before
it's connected to a real Supabase project.

What works:
- accounts: sign up, sign in, password reset, settings;
- practice by topic, with answers **graded on the server**, explanations, and a
  results screen that reviews every answer;
- Daily review (spaced repetition), Mistakes, Bookmarks, timed mock exams,
  Russian ↔ English terminology flashcards, and progress charts;
- clear loading, empty, offline and "couldn't load, try again" states;
- a content admin area for importing questions (CSV) and medical review.

Each student's progress is saved to their account, so it follows them across
devices. **All questions, terminology cards and mock exam formats are currently
demo content, labelled DEMO.** They are not official exam material. The AI tutor
is a scripted prototype and is switched off (`src/lib/features.ts`).

- **Run it locally (start here):** [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)
- Connect your own Supabase project later: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
- Add and review questions: [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)
- Plan: [docs/PROPOSAL.md](docs/PROPOSAL.md) · Screenshots: [docs/screenshots](docs/screenshots)

## Run it on your computer

You need **Node.js 20.9+**, **pnpm** and **Docker Desktop**. The full guide is
in [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

```bash
pnpm install          # download libraries (one time)
pnpm db:start         # start the private local database (Docker)
pnpm local:setup      # point the app at it and create demo accounts
pnpm dev              # open http://localhost:3000
```

Sign in as `student@medprep.local` (password `Medprep-local-1`). Nothing here
touches your real Supabase project.

## Checks

| Command | What it does |
|---|---|
| `pnpm lint` | Looks for common code mistakes |
| `pnpm typecheck` | Checks TypeScript types |
| `pnpm test` | Unit tests: scheduling, analytics, demo content integrity |
| `pnpm test:db` | Database security tests: profiles, question visibility, answer keys, grading, import, private progress, terminology (needs `pnpm db:start`) |
| `pnpm build` | Production build, which fails if anything is broken |
| `pnpm test:e2e` | Clicks through the built app in a real browser, including sign-up via the test inbox and what students see if the database is unreachable (it briefly switches off the local database API, then restarts it). Needs `pnpm db:start` and `pnpm build` |
| `pnpm db:types` | Regenerates `src/lib/supabase/database.types.ts` from the local database |
| `pnpm content:seed` | Rebuilds `supabase/seed.sql` (local demo data) from `content/demo-questions.csv` |
| `pnpm local:setup` | Points `.env.local` at the local database and creates the demo accounts (local only) |

## Where things are

The app is in layers, so the data source can change without touching the screens:

| Layer | Where | Talks to |
|---|---|---|
| **Content** | `content/demo-questions.csv` → `supabase/seed.sql`; terminology in the `terms` table (`supabase/migrations/20261014090000_terms.sql`); demo mock formats in `src/demo/blueprints.ts` | — |
| **Data access** (server only) | `src/lib/content/` (questions, terms, admin), `src/lib/progress/server.ts`, `src/lib/auth.ts`, `src/lib/supabase/` | Supabase |
| **Server functions** the screens call | `src/app/(app)/question-actions.ts`, `progress-actions.ts`, `settings/actions.ts`, `src/app/(auth)/actions.ts` | data access |
| **Screens** | `src/app/(app)/*/` (signed in), `src/app/(auth)/` (sign in/up) | server functions, `src/lib/progress-store.tsx` |
| **UI components** | `src/components/` (question card, answer review, flashcard, charts, error/empty/offline states) | nothing directly |

Supabase is only ever used on the server. Answer keys reach the browser only
after an answer has been graded.

More detail:
- `src/proxy.ts` runs before every page: it keeps the login fresh and sends signed-out visitors to sign in.
- `src/lib/progress-store.tsx` holds the student's progress in the browser while they use the app; every change is saved through `src/app/(app)/progress-actions.ts`.
- `src/lib/features.ts` switches unfinished features off (the AI tutor prototype).
- `src/app/(app)/error.tsx`, `not-found.tsx` and `src/components/load-error.tsx`, `offline-notice.tsx` are the error, not-found and offline states.
- `src/app/(app)/admin/` holds the content admin: import, question review, sources.
- `scripts/local-setup.ts` sets up local development (`pnpm local:setup`).
- `tests/` holds unit tests, database security tests and browser tests.
