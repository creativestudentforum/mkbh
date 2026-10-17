# Launch Checklist

## Required SQL

Run all migrations in order if they are not already applied:

1. `db/migrations/002_hardening.sql`
2. `db/migrations/003_blood_donors.sql`
3. `db/migrations/004_batches.sql`
4. `db/migrations/005_gallery.sql`
5. `db/migrations/006_alumni_roster.sql`
6. `db/migrations/007_birthdays.sql`
7. `db/migrations/008_email_notifications.sql`
8. `db/migrations/009_fund_ledger.sql`
9. `db/migrations/010_memorial_featured.sql`
10. `db/migrations/011_public_id_verification.sql`

## Supabase Auth

Set these in Supabase Authentication URL Configuration:
- Site URL: production domain
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/reset-password`
  - `https://your-domain.com/reset-password`

Set SMTP in Supabase Authentication if reliable signup/reset emails are needed.

## Vercel Environment Variables

Set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Do not add Supabase service-role key unless a future feature explicitly needs it.

## Seed Content

Before inviting members, add:
- 3 announcements
- 1 upcoming event
- Teachers list
- 1 gallery album with 5-10 photos
- Batch coordinators for pilot batches
- Payment instructions for fund page content/committee communication

## Pilot

1. Invite 1-2 batches first.
2. Import roster for those batches.
3. Approve users manually.
4. Test on Android Chrome and desktop.
5. Collect feedback for 2 weeks.

## Final Checks

Run locally before deployment:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Check these roles:
- Logged out
- Pending user
- Approved alumni
- Admin

Check these routes:
- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/directory`
- `/events`
- `/gallery`
- `/blood`
- `/fund`
- `/id-card`
- `/verify/[code]`
- `/admin/users`
