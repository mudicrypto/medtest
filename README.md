# MedPrep

> Learn the medicine. Master the Russian exam.

Exam preparation for English-speaking medical graduates taking Russian Primary
Accreditation in General Medicine (Лечебное дело).

**Status: Milestone 2.** Real accounts are working: sign up with email
confirmation, sign in and out, password reset, a profile, and protected pages.
Practice questions, terms and progress are still **demo content** stored in the
browser; they move into the database in Milestones 3–4.

- Plan: [docs/PROPOSAL.md](docs/PROPOSAL.md)
- Connect your Supabase project: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
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
| `pnpm test:db` | Database security tests (needs `pnpm db:start`) |
| `pnpm build` | Production build, which fails if anything is broken |
| `pnpm test:e2e` | Clicks through the built app in a real browser, including sign-up via the test inbox (needs `pnpm db:start` and `pnpm build`) |
| `pnpm db:types` | Regenerates `src/lib/supabase/database.types.ts` from the local database |

## Where things are

- `src/app/(auth)/` holds sign in, sign up, forgot and reset password, and their server actions.
- `src/app/auth/callback/` is where links in emails land.
- `src/app/(app)/` holds the signed-in screens, including `settings/`.
- `src/proxy.ts` runs before every page: it keeps the login fresh and sends signed-out visitors to sign in.
- `src/lib/auth.ts` is the single place the server asks "who is signed in?".
- `src/lib/supabase/` holds the Supabase connection and generated database types.
- `supabase/migrations/` holds the database tables and security rules (SQL).
- `src/demo/` holds **demo-only** questions, keys, terms and history.
- `tests/` holds unit tests, database security tests and browser tests.
