# Admin Handover Guide

## Daily Tasks

### Approve or reject users
1. Open `Admin -> User Management`.
2. Review pending users.
3. Check the `Roster match` badge when available.
4. Open the user details before approving.
5. Click `Approve` if the person is verified.
6. Click `Reject` if the person is not verified. Add a short reason when prompted.

Approval and rejection emails are sent only when `RESEND_API_KEY` and `EMAIL_FROM` are configured.

### Add announcements
1. Open `Dashboard`.
2. Click `New` in the announcements card.
3. Add a clear title and short message.
4. Pin important announcements.

### Manage events
1. Open `Admin -> Manage Events`.
2. Create or edit events.
3. Use the RSVP icon on an event to open the RSVP list.
4. Export RSVP CSV when needed.

### Manage gallery
1. Open `Admin -> Manage Gallery`.
2. Create an album.
3. Select the album.
4. Upload photos. The app compresses them before upload.
5. Remove wrong photos from the selected album.

### Manage fund ledger
1. Open `Admin -> Manage Fund`.
2. Verify pending member payment submissions after checking the actual transaction.
3. Reject invalid submissions.
4. Add manual expenses or verified income using `Add Entry`.

### Manage batches
1. Open `Admin -> Manage Batches`.
2. Assign a batch coordinator.
3. Add a group photo URL and description.
4. Coordinators can edit their own batch page description and photo URL.

### Manage memorials
1. Get family consent before publishing a memorial entry.
2. Open `Admin -> Manage Memorial`.
3. Add name, batch, date, photo URL, and short bio.

## Import Old Alumni Roster

1. Save the Excel sheet as CSV UTF-8.
2. Required headers: `full_name,batch,department,phone,email`.
3. Open `Admin -> Alumni Roster`.
4. Upload the CSV.
5. Review invalid rows.
6. Import valid rows.

The roster is used only to help admins verify pending signups. It does not auto-approve anyone.

## Export Members

1. Open `Admin -> User Management`.
2. Click `Export CSV`.
3. The file includes a UTF-8 BOM so Bangla should open correctly in Excel.
4. Do not share exports outside authorized committee members.

## Digital ID Verification

Members can open `Digital ID`, download the card, and scan the QR code. The public verification page shows only name, batch, and verified status.

## Emergency Notes

- If users cannot log in, check Supabase Auth and Vercel environment variables.
- If password reset emails do not arrive, check Supabase SMTP settings and Resend/domain settings.
- If member pages show empty data for approved users, check whether the hardening migrations and RLS policies were run correctly.
