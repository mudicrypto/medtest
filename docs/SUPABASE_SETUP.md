# Connecting MedPrep to your Supabase project

This guide connects the app to **your real Supabase project** in the cloud. You
only do it once. Each step says what it's for.

> **Golden rule:** two values are safe to share and to use in the app: the
> **Project URL** and the **publishable key** (called the "anon key" on older
> projects). The **secret / service_role key** and the **database password**
> must never be pasted into chat, code, or any `NEXT_PUBLIC_` setting.

## 1. Create the project

1. Sign in at **supabase.com**, then click **New project**.
2. Name: `medprep`. Database password: click **Generate** and save it in a password manager.
3. Region: the one closest to most students. Plan: Free.
4. Wait about 2 minutes while it sets up.

## 2. Copy the two public values

Open **Project Settings → API** (on newer projects the keys are on a separate
**API Keys** page). Copy:

- **Project URL**, e.g. `https://abcdxyz.supabase.co`
- **Publishable key**, starting `sb_publishable_` (or the **anon** key)

## 3. Tell Supabase where the app lives

Open **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` for now. Change it to the real web
  address when we deploy (Milestone 10).
- **Redirect URLs:** add `http://localhost:3000/**`

*Why:* links in confirmation and password-reset emails are only allowed to send
people back to these addresses. This stops attackers from using our emails to
send people to fake sites.

## 4. Match the password and email rules

Open **Authentication → Providers → Email** (or **Sign In / Providers**):

- **Confirm email:** on
- **Minimum password length:** 8, with **letters and digits** required

These match the rules the app checks, so students see one consistent message.

> Supabase's built-in email sender is limited to a few emails per hour and is
> meant for testing. Before real students sign up, we'll connect a proper email
> service (for example Resend or Postmark) under **Authentication → SMTP**.
> That's planned for the deployment milestone.

## 5. Create the database tables

The tables and security rules live in `supabase/migrations/`. To apply them to
your project, run these on your computer in the project folder:

```bash
pnpm exec supabase login                             # opens the browser to authorise the CLI
pnpm exec supabase link --project-ref <your-ref>     # <your-ref> is the "abcdxyz" part of your URL
pnpm exec supabase db push                           # applies every migration that isn't applied yet
```

`link` asks for the database password from step 1. Type it into your terminal
only.

## 6. Configure the app

Copy `.env.example` to a new file called `.env.local`, then fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdxyz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` is never committed to GitHub. Then run `pnpm dev` and open
<http://localhost:3000>, and create an account to check everything works.

## Troubleshooting

| What you see | What it means / what to do |
|---|---|
| "Supabase is not configured" | `.env.local` is missing or a value is empty. Restart `pnpm dev` after editing it. |
| Confirmation link says "invalid or has expired" | Open the link in the **same browser** you signed up in, and check the Redirect URLs from step 3. |
| "Please confirm your email first" | Click the link in the email. Check spam, or use **Resend email** on the sign-up screen. |
| "Too many attempts" | Supabase's limit on how many emails can be sent. Wait an hour, or set up SMTP (see step 4). |
