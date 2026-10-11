# Working on MedPrep locally (no Supabase account needed)

You can run and test the whole app on your own computer. It uses a **private
copy of Supabase that runs inside Docker**. It is never connected to your real
Supabase project, and nothing you do here reaches it.

This local copy works exactly like the real thing: the same tables, security
rules and server-side grading. When you later connect your own project
([SUPABASE_SETUP.md](SUPABASE_SETUP.md)), the app doesn't need to change.

## What's in the local database

- **18 demo questions** across 9 topics, and **20 demo terminology cards**
  (IDs `t-01` … `t-20`). All of them are labelled **DEMO — not for study** in
  the app. They are examples for trying the app, **not official exam material**.
- **Two demo mock-exam formats**, labelled "Demo format". They are not the
  official exam format.
- Any accounts you create. Emails, such as sign-up confirmations and password
  resets, go to a local test inbox. They are never sent.

The demo questions come from `content/demo-questions.csv`, which is turned into
`supabase/seed.sql`. The terminology cards are added by
`supabase/migrations/20261014090000_terms.sql`.

## One-time setup

1. Install **Node.js 20.9+** (nodejs.org), **pnpm** (`npm install -g pnpm`) and
   **Docker Desktop** (docker.com). Open Docker Desktop and leave it running.
2. In the project folder, run:

```bash
pnpm install          # download libraries
pnpm db:start         # start the local database (the first time downloads ~1–2 GB)
pnpm local:setup      # point the app at it and create two demo accounts
```

`pnpm local:setup`:
- writes `.env.local` with the local database address and key. If your
  `.env.local` already points at a real Supabase project, it stops and changes
  nothing;
- creates two accounts, both with the password `Medprep-local-1`:
  - **student@medprep.local**, a student;
  - **admin@medprep.local**, an admin who can open **Content admin**.

You can run it again at any time. It's safe to repeat.

## Every day

```bash
pnpm db:start         # if the database isn't already running
pnpm dev              # then open http://localhost:3000
```

Sign in as `student@medprep.local`, or create a new account. To confirm a new
account, open the test inbox at <http://127.0.0.1:54324> and click the link.

When you're done: `pnpm db:stop`. Your local data is kept for next time.

## Starting over

```bash
pnpm db:reset         # wipes the LOCAL database and reloads the demo content
pnpm local:setup      # recreate the two demo accounts
```

This deletes every local account and all local progress. It only affects the
copy on your computer.

## Running the checks

| Command | What it checks | Needs |
|---|---|---|
| `pnpm lint` | Common code mistakes | — |
| `pnpm typecheck` | TypeScript types | — |
| `pnpm test` | Scheduling, analytics and content logic | — |
| `pnpm test:db` | Database security: who can see and change what | `pnpm db:start` |
| `pnpm build` | Production build | — |
| `pnpm test:e2e` | Clicks through the built app at laptop and phone sizes | `pnpm db:start`, then `pnpm build` |

The browser tests create their own throwaway accounts and clean up the test
questions they add. One group of them briefly switches off the local database
API to check what students see during an outage. It switches it back on
afterwards.

## Troubleshooting

| What you see | What to do |
|---|---|
| "The local database isn't running" | Open Docker Desktop, wait until it says it's running, then `pnpm db:start`. |
| "Supabase is not configured" in the app | Run `pnpm local:setup`, then restart `pnpm dev`. |
| Sign-in says the password is wrong | Run `pnpm local:setup` again; if you reset the database, the demo accounts were deleted. |
| `local:setup` says `.env.local` points at a real project | That's the safety check. Rename `.env.local` to `.env.cloud` to work locally; rename it back to use your project. |
| Port already in use | Another copy is running. Run `pnpm db:stop`, then `pnpm db:start`. |
