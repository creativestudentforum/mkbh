# Backup And Restore Guide

Supabase free tier does not provide point-in-time recovery. Keep manual backups before launch and weekly after launch.

## Weekly Backup Checklist

1. Export database data from Supabase Table Editor or with `pg_dump`.
2. Export critical tables as CSV:
   - `profiles`
   - `teachers`
   - `events`
   - `event_rsvps`
   - `announcements`
   - `batches`
   - `albums`
   - `photos`
   - `alumni_roster`
   - `fund_entries`
   - `memorials`
3. Download or otherwise preserve important storage URLs/files for:
   - `avatars`
   - `gallery`
4. Store backups in a committee-owned Google Drive folder.
5. Keep at least 4 weekly copies.

## Command-Line Backup

If you have database connection access:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="alumni-hub-$(date +%F).dump"
```

Restore to a new database only after testing:

```bash
pg_restore --dbname "$NEW_DATABASE_URL" --clean --if-exists "alumni-hub-YYYY-MM-DD.dump"
```

## Before Risky Changes

Create a backup before:
- Running new SQL migrations
- Bulk importing a roster
- Deleting albums/photos
- Large admin cleanup work

## Restore Safety

Never restore over the production database without first testing on a separate Supabase project.
