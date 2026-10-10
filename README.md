# MedPrep

> Learn the medicine. Master the Russian exam.

Exam preparation for English-speaking medical graduates taking Russian Primary
Accreditation in General Medicine (Лечебное дело).

**Status:** Milestone 1, a clickable frontend prototype. All questions, terms and
progress are **demo content**, stored only in your browser. There is no database
or real login yet. See [docs/PROPOSAL.md](docs/PROPOSAL.md) for the full plan and
[docs/screenshots](docs/screenshots) for phone and laptop previews.

## Run it on your computer

You need **Node.js 20.9 or newer** (download it from nodejs.org) and **pnpm**
(after installing Node, run `npm install -g pnpm`).

```bash
pnpm install   # downloads the libraries the app uses (one time, about 1 minute)
pnpm dev       # starts the app in development mode
```

Then open <http://localhost:3000> in your browser. Press `Ctrl+C` in the
terminal to stop it.

## Checks

| Command | What it does |
|---|---|
| `pnpm lint` | Looks for common code mistakes |
| `pnpm typecheck` | Checks that the TypeScript types are consistent |
| `pnpm test` | Runs unit tests (scheduling, analytics, demo content integrity) |
| `pnpm build` | Builds the production version, which fails if anything is broken |
| `pnpm test:e2e` | Starts the built app and clicks through it in a real browser at phone and laptop sizes (run `pnpm build` first; needs Playwright's Chromium) |

## Where things are

- `src/app/` holds the pages. Each folder is a URL; `(app)` contains the logged-in screens.
- `src/components/` holds reusable pieces such as the question card, tutor, charts and navigation.
- `src/lib/` holds the logic: spaced repetition, analytics, types, and the demo browser store.
- `src/demo/` holds **demo-only** questions, answer keys, terms and history. In the real app the answer keys move to the server.
- `tests/` holds the unit tests and browser tests.
