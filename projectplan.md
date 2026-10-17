# Alumni Hub — Project Plan

> Members-only alumni management website for our high school (Bangladesh).
> **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth, Postgres, Storage)
> **Last updated:** 2026-10-17

---

## 0. How to use this file

1. Work top to bottom. **Do Phase 0 (hardening) before any new feature.**
2. One feature = one git branch = one commit/PR. Commit the current 21 uncommitted changes first.
3. Every new SQL goes in `db/migrations/NNN_name.sql` (run it in Supabase SQL Editor, keep the file in the repo).
4. Give Claude Code **one feature section at a time** (prompt template in section 11).
5. Tick the checkboxes as you finish. A feature is done only when its **Done when** line is true.

---

## 1. Product overview

**Goal:** a private, trustworthy place where verified alumni find each other, join reunions, stay connected with teachers and the school, and support school causes.

**Users:** Alumni (approved by admin) · Teachers (listed by admin) · Admin.

**Principles**
- Mobile-first. Most members will open it on a phone.
- Approval-gated. Nothing is visible to outsiders or to unapproved signups.
- Privacy by default. Phone and birthday are hidden unless the member opts in.
- Bangla + English.
- Cheap to run. Supabase + Vercel free tiers should be enough for the first 1–2 years.
- Few features, done well. A small site that works beats a big one that feels empty.

---

## 2. Current state

### 2.1 Features already built
- [x] Email/password signup + login (Supabase Auth)
- [x] Signup application with pending approval; admin approve/reject
- [x] Dashboard (alumni count, teacher count, pending count, announcements, new members)
- [x] Alumni directory (search, batch filter, department filter, profile modal)
- [x] Teacher directory (search, faculty cards)
- [x] Events page (upcoming/past)
- [x] Profile edit with avatar upload + compression
- [x] Digital ID card page
- [x] Admin: users, teachers (CRUD, active toggle, avatar), events (CRUD, hide/show), announcements (create/delete/pin)
- [x] Role-aware sidebar and admin navigation

### 2.2 Schema already written (`supabase-schema.sql`)
| Object | Notes |
|---|---|
| `profiles` | role (`alumni`/`admin`), user_type (`alumni`/`teacher`), status (`pending`/`approved`/`rejected`), batch, department, social links, plus Phase 1 columns (blood group, donor flag, privacy toggles, DOB, profession, company, city, country) |
| `teachers`, `announcements`, `events` | admin-managed content |
| `event_rsvps` | going / maybe / not_going + guests (0–5), unique per (event, user) |
| Views | `alumni_directory` (hides phone unless `show_phone`), `event_rsvp_counts` |
| Functions/triggers | `is_admin()`, `handle_new_user`, `handle_updated_at`, `prevent_profile_privilege_escalation` |
| Storage | public `avatars` bucket, folder-scoped upload policies |

### 2.3 Phase 1 status
Schema for profile fields, privacy view and RSVP is **written**. Verify the **UI** for each is finished (forgot password, new profile fields, RSVP buttons, blood donor consent).

### 2.4 Existing routes (from the project tree)
`/` · `/login` · `/signup` · `/pending` · `/dashboard` · `/directory` · `/teachers` · `/events` · `/profile` · `/id-card` · `/admin/*`

---

## 3. Schema analysis

### 3.1 What is already good
- RLS is enabled on every table.
- `is_admin()` is SECURITY DEFINER, so policies do not recurse.
- The privilege-escalation trigger stops users approving themselves or changing their role.
- Phone number privacy is enforced in a view, not only in the UI.
- Avatar uploads are restricted to the user's own folder.

### 3.2 Findings (fix in Phase 0)

| # | Severity | Finding | Fix |
|---|---|---|---|
| F1 | **High** | Members-only data is readable by *any logged-in user*, including **pending/rejected** signups. `alumni_directory` is granted to all `authenticated`; teachers, announcements and events policies are `TO authenticated USING (true / is_active)`. Anyone can sign up and read the directory (and visible phones) before approval. | New `is_member()` helper (approved or admin). Add it to every read policy and to the views. |
| F2 | **High** | SECURITY DEFINER functions have no fixed `search_path` (`is_admin`, `handle_new_user`, `prevent_profile_privilege_escalation`). | Add `SET search_path = public`. |
| F3 | Medium | The privilege trigger also blocks the **SQL Editor and service role** (there `auth.uid()` is NULL, so `is_admin()` is false). Setting an admin, bulk fixes and roster-claim updates can fail. | Skip the check when `auth.uid() IS NULL`. |
| F4 | Medium | Duplicate columns: `job_title`/`profession`, `current_company`/`company`, `location`/`city`. `email` was "added" again but already existed (no-op). | Pick the new ones as canonical, copy data, stop using the old ones, drop later. |
| F5 | Medium | `batch` is free **TEXT**. "2012", "SSC 2012", "২০১২" would become three batches. | Keep it TEXT (SSC year, e.g. `'2012'`) but make it a dropdown backed by a `batches` table (Phase 2). Any sample SQL that treats batch as an integer must use text instead. |
| F6 | Medium | After the `profiles` policy became "own row or admin", any existing code that reads **other people's** profiles will silently return nothing (dashboard counts, new members, announcement author, event creator). | Audit every `.from('profiles')`; use the views for member data. |
| F7 | Medium | `alumni_directory` lacks fields the profile modal needs (`bio`, `facebook_url`, `website_url`, `created_at`). | Append the columns (a view can only add columns at the end). |
| F8 | Low | RSVP policy allows RSVPs to inactive or past events and from unapproved users. | Tighten `WITH CHECK`. |
| F9 | Low | No indexes besides primary keys. | Add indexes (below). |
| F10 | Low | `supabase-schema.sql` is not re-runnable (`CREATE TRIGGER` without `DROP IF EXISTS`, a pasted patch block in the middle). | Keep it as history; use numbered migration files from now on. |
| F11 | Low | `handle_new_user` copies only `full_name`. If signup saves batch/department with a second update call, it **fails when email confirmation is on** (no session yet). | Send the extra fields in `signUp({ options: { data } })` and read them in the trigger. Never read role/status/user_type from metadata. |
| F12 | Low | `avatars` bucket has no file size or MIME limit. | Set 2 MB and image types only. |
| F13 | Info | Teacher phone/email are visible to every member. | Decide whether that is intended. |
| F14 | Info | No `rejection_reason`, no audit trail. | Optional, Phase 3. |
| F15 | Info | `department` for a high school is really **Group** (Science / Commerce / Arts). | Rename the UI label; keep the column. |

> **Rule for every new view/table:** Supabase grants new `public` objects to `anon` by default. Always `REVOKE ALL ... FROM anon` and gate rows with `is_member()` (defense in depth).

---

## 4. Phase 0 — Hardening & cleanup (about 0.5 day)

### 4.1 Tasks
- [ ] `git commit` current work; create `db/migrations/` and copy this migration there as `002_hardening.sql`.
- [ ] Run the migration below in the SQL Editor.
- [ ] Audit code: search the repo for `.from('profiles')`. For each hit decide: own row (ok) · admin page (ok) · member data (switch to a view).
- [ ] Replace dashboard counts and "new members" with `dashboard_stats` and `alumni_directory` (ordered by `created_at desc`, limit 5).
- [ ] Server-side admin guard in `app/admin/layout.tsx`: load the user's profile; if not admin, `redirect('/')`. Hiding sidebar links is not security.
- [ ] `proxy.ts`: confirm public routes (`/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`) and that `/pending` users cannot reach member pages.
- [ ] If signup currently updates the profile in a second call, switch to `options.data` (F11).
- [ ] Replace the default favicon and metadata title.

### 4.2 Migration `002_hardening.sql`

```sql
-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (status = 'approved' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ===== Signup: copy safe fields from metadata (F11) =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, batch, department, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'batch', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===== Privilege trigger: allow SQL Editor / service role (F3) =====
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() AND (
    NEW.email     IS DISTINCT FROM OLD.email OR
    NEW.role      IS DISTINCT FROM OLD.role OR
    NEW.user_type IS DISTINCT FROM OLD.user_type OR
    NEW.status    IS DISTINCT FROM OLD.status
    -- when you add is_featured / achievement / rejection_reason, add them here
  ) THEN
    RAISE EXCEPTION 'You cannot update protected profile fields';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===== Members-only reads (F1) =====
DROP POLICY IF EXISTS "Anyone authenticated can view active teachers" ON public.teachers;
CREATE POLICY "Members can view active teachers"
  ON public.teachers FOR SELECT TO authenticated
  USING (is_active = true AND public.is_member());

DROP POLICY IF EXISTS "Anyone authenticated can view announcements" ON public.announcements;
CREATE POLICY "Members can view announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (public.is_member());

DROP POLICY IF EXISTS "Anyone authenticated can view active events" ON public.events;
CREATE POLICY "Members can view active events"
  ON public.events FOR SELECT TO authenticated
  USING (is_active = true AND public.is_member());

-- ===== Directory view: gated + extra columns appended (F1, F7) =====
CREATE OR REPLACE VIEW public.alumni_directory AS
SELECT
  id, full_name, batch, department, avatar_url, profession, company,
  city, country, linkedin_url, blood_group,
  CASE WHEN show_phone THEN phone END AS phone,
  bio, facebook_url, website_url, created_at
FROM public.profiles
WHERE status = 'approved'
  AND user_type = 'alumni'          -- remove if teacher accounts should appear here
  AND public.is_member();

REVOKE ALL ON public.alumni_directory FROM anon;
GRANT SELECT ON public.alumni_directory TO authenticated;

-- ===== Dashboard counts without opening up profiles (F6) =====
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE status = 'approved' AND user_type = 'alumni') AS alumni_count,
  (SELECT COUNT(*) FROM public.teachers WHERE is_active) AS teacher_count
WHERE public.is_member();

REVOKE ALL ON public.dashboard_stats FROM anon;
GRANT SELECT ON public.dashboard_stats TO authenticated;

-- ===== RSVP only for approved members, on active upcoming events (F8) =====
DROP POLICY IF EXISTS "own rsvp" ON public.event_rsvps;
CREATE POLICY "own rsvp"
  ON public.event_rsvps FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_member()
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id
        AND e.is_active
        AND e.event_date >= (NOW() AT TIME ZONE 'Asia/Dhaka')::date
    )
  );

-- ===== Merge duplicate columns (F4). Stop using the old ones in the UI, drop later =====
UPDATE public.profiles SET profession = job_title
  WHERE COALESCE(profession, '') = '' AND COALESCE(job_title, '') <> '';
UPDATE public.profiles SET company = current_company
  WHERE COALESCE(company, '') = '' AND COALESCE(current_company, '') <> '';
UPDATE public.profiles SET city = location
  WHERE COALESCE(city, '') = '' AND COALESCE(location, '') <> '';

-- ===== Indexes (F9) =====
CREATE INDEX IF NOT EXISTS idx_profiles_status       ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_batch        ON public.profiles (batch) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_profiles_blood        ON public.profiles (blood_group) WHERE is_blood_donor;
CREATE INDEX IF NOT EXISTS idx_events_date           ON public.events (event_date);
CREATE INDEX IF NOT EXISTS idx_rsvps_user            ON public.event_rsvps (user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_order   ON public.announcements (is_pinned DESC, created_at DESC);

-- ===== Avatar bucket limits (F12) =====
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'avatars';
```

Signup code change (only if you currently save extra fields in a second call):

```ts
await supabase.auth.signUp({
  email, password,
  options: { data: { full_name, batch, department, phone } },
})
```

### 4.3 Verify Phase 0
Test with **four** accounts: admin, approved alumni, pending alumni, logged out.
- [ ] Pending user: `supabase.from('alumni_directory').select('*')` → `[]`; same for `events`, `announcements`, `teachers`.
- [ ] Approved user: `supabase.from('profiles').select('*')` → only their own row.
- [ ] Approved user: update own `status` or `role` → error.
- [ ] Logged out: every table and view → permission denied or empty.
- [ ] Dashboard, directory, profile modal, events still render.

**Done when:** all boxes above pass and nothing in the UI shows empty data by accident.

---

## 5. Design system & UX plan (this is what makes it look good)

### 5.1 Principles
- **Calm and trustworthy:** lots of white space, one brand colour, one accent. No more than two font families.
- **Phone first:** design at 360 px wide, then enhance for desktop.
- **Every screen has four states:** loading, empty, error, success. Never a blank page.
- **People first:** avatars and names are the visual centre of this app.

### 5.2 Tokens
Use your **school logo colours** if possible. Starting point (Tailwind v4 `@theme` in `app/globals.css`; on v3 put them in `tailwind.config`):

```css
@theme {
  --color-brand-50:  #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-500: #4f46e5;
  --color-brand-600: #4338ca;
  --color-brand-700: #3730a3;
  --color-brand-900: #1e1b4b;
  --color-accent-500: #f59e0b;   /* highlights, pinned, featured */
  --radius-card: 1rem;
}
```
Neutrals: Tailwind `slate`. Success `emerald`, danger `rose`, warning `amber`.

### 5.3 Typography
- `next/font/google`: **Inter** (Latin) + **Noto Sans Bengali** (subset `bengali`). Font stack: Inter, Noto Sans Bengali, system-ui.
- Body 16 px public pages, 14 px dense admin tables. Bangla text needs about 1.6 line-height.
- Page title `text-2xl font-semibold`, section title `text-lg font-semibold`, helper text `text-sm text-slate-500`.

### 5.4 Layout
- **Mobile:** top bar (logo, avatar menu) + **bottom tab bar** (Home, Directory, Events, Gallery, More). Admin links live under "More".
- **Desktop:** left sidebar (collapsible), content max width about 1152 px, 24–32 px page padding.
- Cards: `rounded-2xl border border-slate-200 bg-white shadow-sm`; 16 px spacing on mobile, 24 px on desktop.
- Tap targets at least 44 px.

### 5.5 Component inventory (`components/ui/`)
Build once, reuse everywhere. Icons: `lucide-react`. Toasts: `sonner`. Forms: `react-hook-form` + `zod` (validate again on the server).

| Component | Notes |
|---|---|
| Button | variants: primary, secondary, ghost, danger; loading spinner; disabled state |
| Input, Select, Textarea, Switch, Checkbox | label + helper + inline error built in |
| Avatar | photo with **initials fallback**, sizes xs–xl |
| Badge | batch badge (clickable → batch page), status badge, role badge |
| Card, StatCard | dashboard numbers |
| PageHeader | title, subtitle, action button |
| Modal / Sheet | modal on desktop, bottom sheet on mobile (profile modal) |
| ConfirmDialog | for every delete/reject |
| Skeleton | one per list/card layout |
| EmptyState | icon + one sentence + a call-to-action |
| SearchInput | debounced, writes to URL `searchParams` |
| Pagination | 20 per page |
| DataTable | admin lists; turns into stacked cards on mobile |
| ImageUploader | compress, preview, progress |
| Lightbox | gallery |

### 5.6 Page-by-page polish

| Page | What to do |
|---|---|
| **Landing `/`** (public) | Hero with school name/logo and one "Join / Login" button; live counts (alumni, batches, teachers); "Notable alumni" strip; next upcoming event; short "how it works" (Sign up → Admin approves → Connect). |
| **Login / Signup** | Single centred card, school logo, clear errors, show/hide password, "Forgot password?" link, consent checkbox on signup. |
| **Pending** | Friendly status page: "Application received. An admin will review it." Show what was submitted; a Log out button. |
| **Dashboard** | Greeting by name; 3–4 StatCards; pinned announcement on top; next event card with RSVP button; new members (avatars); today's birthdays (Phase 3). |
| **Directory** | Sticky search + filter chips (Batch, Group, City, Profession); card grid with avatar, name, batch badge, profession; modal/sheet for details with call / WhatsApp / LinkedIn buttons. |
| **Teachers** | Cards with large photo, designation, subject; a short bio on tap. |
| **Events** | Date block on the left of each card (day / month); RSVP buttons in the card; "42 going" counter; past events in a muted section. |
| **Profile edit** | Sectioned form (Basic, Professional, Blood donor, Privacy), completeness progress bar, avatar crop preview, sticky Save bar on mobile. |
| **ID card** | Printable card (school logo, photo, name, batch, member ID, QR). "Download as image/PDF" button. |
| **Admin** | Same shell with an "Admin" badge; tabs for Users / Teachers / Events / Announcements; pending count badge in the nav. |

### 5.7 State patterns
- Every route segment gets `loading.tsx` (skeletons), and the app gets `error.tsx` and `not-found.tsx`.
- Mutations: disable the button + spinner → toast on success/failure → `revalidatePath`.
- Destructive actions always use ConfirmDialog.
- Forms show inline errors under the field, never only a toast.

### 5.8 Accessibility & performance
- Text contrast at least 4.5:1; visible `focus-visible` ring; every input has a label; every image has `alt`.
- `next/image` with `sizes`; avatars stored as 256 px WebP, gallery images 1600 px max.
- Lazy-load below-the-fold lists; paginate directory and gallery.
- Target Lighthouse mobile score of 90 or more on landing, directory and events.

### 5.9 Branding checklist
- [ ] Logo (SVG), favicon, app icons (192/512)
- [ ] Open Graph image (1200×630) and page titles
- [ ] School name, tagline, motto in one config file (`lib/site.ts`)

---

## 6. Roadmap

Rough effort is for one developer working with Claude Code. Build in this order.

### Phase 1 — Foundation & finishing what is started (about 4–5 days)

#### 1.0 Design foundation (1 day)
- [ ] Tokens, fonts, `components/ui/*` basics (Button, Input, Card, Avatar, Badge, Skeleton, EmptyState, Modal, Toast)
- [ ] App shell: sidebar on desktop, bottom tabs on mobile
- [ ] Landing page, `loading.tsx`, `error.tsx`, `not-found.tsx`

**Done when:** login, dashboard and directory use the shared components and look good at 360 px.

#### 1.1 Forgot / reset password (1–2 h)
**Routes:** `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/auth/callback/route.ts`
- Forgot: `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` })`
- Callback: read `code`, call `exchangeCodeForSession(code)`, redirect to `next`.
- Reset: new password form → `supabase.auth.updateUser({ password })` → redirect to `/login`.
- [ ] Add the three routes to the public list in `proxy.ts`.
- [ ] Supabase Dashboard → Authentication → URL Configuration: add Site URL and Redirect URLs (localhost and production).
- [ ] "Forgot password?" link on login.

**Done when:** a user can reset their password from email on both localhost and production.
**Note:** Supabase's built-in email is rate-limited. Set up custom SMTP in Phase 3.

#### 1.2 Profile fields & privacy UI (3–4 h)
- [ ] Profile form sections: **Basic** (name, photo, batch dropdown, group, phone) · **Professional** (profession, company, city, country, LinkedIn, Facebook, website, bio) · **Blood donor** (blood group, "I am a donor", last donation date) · **Privacy** ("Show my phone", "Show my birthday") · Date of birth.
- [ ] Use `profession`, `company`, `city` only. Stop reading/writing `job_title`, `current_company`, `location`.
- [ ] Rule: donor toggle requires a blood group and a phone number.
- [ ] Validate BD phone: `^01[3-9]\d{8}$`; store in that normalized form.
- [ ] Profile completeness bar (photo, batch, profession, city = 25% each).
- [ ] Directory and profile modal read from `alumni_directory`.

**Done when:** a member can hide or show their phone and the directory respects it for other users.

#### 1.3 Event RSVP UI (3–4 h)
**Files:** `app/events/actions.ts` (server action `rsvp`), `app/events/rsvp-button.tsx`, `app/admin/events/[id]/rsvps/page.tsx`
- [ ] Upcoming event card: Going / Maybe / Can't go + guests dropdown (0–5) + "N going" from `event_rsvp_counts`.
- [ ] `useTransition` for loading state; no RSVP UI on past events.
- [ ] Admin page: RSVP list (name, batch, phone, guests), total headcount, CSV export.

```ts
'use server'
export async function rsvp(eventId: string, status: 'going'|'maybe'|'not_going', guests: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('event_rsvps').upsert(
    { event_id: eventId, user_id: user.id, status, guests },
    { onConflict: 'event_id,user_id' }
  )
  if (error) throw new Error('Could not save RSVP')
  revalidatePath('/events')
}
```
**Done when:** an approved user can change their RSVP; an unapproved user and a past event are rejected by the database.

---

### Phase 2 — Community features (about 4–5 days)

#### 2.1 Blood donor finder (3 h)
```sql
CREATE OR REPLACE VIEW public.blood_donors AS
SELECT id, full_name, batch, blood_group, city, phone, avatar_url,
       (last_donation_date IS NULL
        OR last_donation_date <= CURRENT_DATE - INTERVAL '120 days') AS available
FROM public.profiles
WHERE status = 'approved' AND is_blood_donor AND blood_group IS NOT NULL
  AND public.is_member();

REVOKE ALL ON public.blood_donors FROM anon;
GRANT SELECT ON public.blood_donors TO authenticated;
```
- **Route:** `app/blood/page.tsx`. Filters: blood group, city, "available only".
- Card: avatar, name, batch, city, blood group badge, **Call** (`tel:`) and **WhatsApp** (`https://wa.me/880…`) buttons.
- Consent text next to the donor toggle: "My phone number will be visible to members in Blood Finder."
- Banner: "This is a contact directory only. Medical screening is done at the hospital."
- [ ] Sidebar link "Blood".

**Done when:** a donor who enables the toggle appears; turning it off removes them immediately.

#### 2.2 Batch pages (3–4 h)
```sql
CREATE TABLE public.batches (
  year TEXT PRIMARY KEY,                       -- SSC year, e.g. '2012'
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_photo_url TEXT,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read batches" ON public.batches
  FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "Admins manage batches" ON public.batches
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Coordinator edits own batch" ON public.batches
  FOR UPDATE TO authenticated
  USING (coordinator_id = auth.uid()) WITH CHECK (coordinator_id = auth.uid());

-- Seed: change 1985 to your school's first batch year
INSERT INTO public.batches (year)
SELECT generate_series(1985, 2026)::text ON CONFLICT DO NOTHING;

CREATE OR REPLACE VIEW public.batch_stats AS
SELECT batch AS year, COUNT(*) AS members
FROM public.alumni_directory GROUP BY batch;
REVOKE ALL ON public.batch_stats FROM anon;
GRANT SELECT ON public.batch_stats TO authenticated;
```
- **Routes:** `app/batches/page.tsx` (grid with member counts), `app/batches/[year]/page.tsx` (group photo, coordinator, description, member list), `app/admin/batches/page.tsx`.
- `params` is a Promise in Next 16: `const { year } = await params`.
- Batch is a **string** here: `.eq('batch', year)`.
- [ ] Batch dropdown in signup and profile reads from `batches`.
- [ ] Batch badges in the directory link to `/batches/[year]`.
- [ ] Coordinator may edit description and group photo of their own batch.

**Done when:** every directory batch badge opens a real batch page.

#### 2.3 Photo gallery (4–5 h)
```sql
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_photos_album ON public.photos (album_id, created_at DESC);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read albums" ON public.albums FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "Admins manage albums" ON public.albums FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Members read photos" ON public.photos FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "Admins manage photos" ON public.photos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 3145728, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins upload gallery" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin());
CREATE POLICY "Admins delete gallery" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.is_admin());
```
- **Routes:** `app/gallery/page.tsx` (album grid), `app/gallery/[albumId]/page.tsx` (photo grid + lightbox, 24 per page), `app/admin/gallery/page.tsx` (create album, multi-upload, delete).
- Upload flow: select files → compress on the client (reuse the avatar compressor, max 1600 px, WebP, quality 0.8) → `storage.from('gallery').upload(`${albumId}/${crypto.randomUUID()}.webp`)` → `getPublicUrl` → insert into `photos`.
- Make sure the Supabase domain is in `images.remotePatterns` in `next.config.ts`.
- Free storage is 1 GB. At about 250 KB per photo that is roughly 4,000 photos, so compression is not optional.
- Public bucket means anyone holding a link can view the image. Acceptable for alumni photos; do not put private documents in it.

**Done when:** admin uploads 10 photos to an album and members browse them in a lightbox on a phone.

---

### Phase 3 — Operations (about 4–5 days)

#### 3.1 Bulk import: alumni roster (4 h)
Pre-load the old alumni list so the site is not empty on day one, and help admins verify signups.

```sql
CREATE TABLE public.alumni_roster (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  batch TEXT NOT NULL,
  department TEXT DEFAULT '',
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.alumni_roster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage roster" ON public.alumni_roster
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
```
- **Route:** `app/admin/roster/page.tsx` + `actions.ts`.
- Flow: save Excel as **CSV UTF-8** (needed for Bangla names) with columns `full_name,batch,department,phone,email` → parse in the browser with `papaparse` → show a **preview table** (bad rows in red) → server action inserts and reports "120 added, 8 skipped (duplicates)".
- Normalize before insert: phone `+880…`/`880…` → `0…`; email `trim().toLowerCase()`.
- **Pending page for admins:** look up each pending user's email/phone in the roster and show "✅ Roster match: Batch 2012". On approve, set `claimed_by`.
- Do **not** auto-approve. A phone number is not verified, so one admin click is the safe default.

**Done when:** admin imports a 100-row CSV and sees roster matches on pending signups.

#### 3.2 Email notifications (3 h)
- `npm i resend`; env: `RESEND_API_KEY`, `EMAIL_FROM` (never prefix with `NEXT_PUBLIC_`).
- `lib/email.ts` with `sendEmail(to, subject, html)` (catch errors, never block the main action) and `sendBulk(emails, subject, html)` (BCC in batches of 50).
- Send on: approval, rejection (with reason), and optionally on new announcement/event ("Send email" checkbox, off by default).
- Without your own domain, use Gmail SMTP + `nodemailer` with an App Password to start.
- [ ] Put the same SMTP in Supabase → Authentication → SMTP Settings so signup/reset emails are reliable.
- [ ] Optional: `rejection_reason TEXT` on `profiles` (add it to the protected fields in the trigger).

**Done when:** an approved user receives an email within a minute.

#### 3.3 Directory upgrade, CSV export, birthdays (3 h)
- [ ] Filters: profession, city/country. Pagination with `.range(from, to)` and `{ count: 'exact' }`, 20 per page. Search and filters in the URL.
- [ ] Admin CSV export: `app/admin/users/export/route.ts`. Check admin first (403 otherwise). Prefix the file with `\uFEFF` so Excel shows Bangla correctly; wrap cells containing commas/quotes in `"` and double the inner quotes.
- [ ] Birthday widget on dashboard:

```sql
CREATE OR REPLACE VIEW public.todays_birthdays AS
SELECT id, full_name, batch, avatar_url FROM public.profiles
WHERE status = 'approved' AND show_birthday AND date_of_birth IS NOT NULL
  AND to_char(date_of_birth, 'MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Dhaka', 'MM-DD')
  AND public.is_member();
REVOKE ALL ON public.todays_birthdays FROM anon;
GRANT SELECT ON public.todays_birthdays TO authenticated;
```

**Done when:** an admin can export the member list and open it in Excel with readable Bangla.

---

### Phase 4 — Trust & culture (about 5–6 days)

#### 4.1 Manual fund ledger (5 h)
Gives members the "where did the money go" answer without a payment gateway.

```sql
CREATE TABLE public.fund_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  category TEXT DEFAULT 'other',        -- donation, membership_fee, event, scholarship, other
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  method TEXT,                          -- bkash, nagad, cash, bank
  trx_id TEXT,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('pending','verified','rejected')),
  receipt_url TEXT,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_fund_trx ON public.fund_entries (trx_id) WHERE trx_id IS NOT NULL;
ALTER TABLE public.fund_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read verified or own" ON public.fund_entries FOR SELECT TO authenticated
  USING ((status = 'verified' AND public.is_member()) OR member_id = auth.uid() OR public.is_admin());
CREATE POLICY "Member submits payment" ON public.fund_entries FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid() AND kind = 'income' AND status = 'pending' AND public.is_member());
CREATE POLICY "Admins manage fund" ON public.fund_entries FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE VIEW public.fund_summary AS
SELECT COALESCE(SUM(amount) FILTER (WHERE kind = 'income'), 0)  AS income,
       COALESCE(SUM(amount) FILTER (WHERE kind = 'expense'), 0) AS expense
FROM public.fund_entries WHERE status = 'verified' AND public.is_member();
REVOKE ALL ON public.fund_summary FROM anon;
GRANT SELECT ON public.fund_summary TO authenticated;
```
- **Routes:** `app/fund/page.tsx` (totals, balance, verified list, "I sent money" form with method, amount, TrxID), `app/admin/fund/page.tsx` (verify/reject pending, add expense with optional receipt photo).
- Flow: member sends money to the committee's bKash/Nagad number → submits TrxID → entry is `pending` → treasurer checks the TrxID in the app → **Verify** → it counts in the public totals.
- Show the committee's payment numbers and account holder name clearly on the page.
- Treasurer role: if more than one person manages money, add `role = 'treasurer'` later; for now admins only.

**Done when:** a member submits a payment, the admin verifies it, and the public total goes up.

#### 4.2 In memoriam (2 h)
```sql
CREATE TABLE public.memorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  batch TEXT DEFAULT '',
  date_of_death DATE,
  bio TEXT DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read memorials" ON public.memorials FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "Admins manage memorials" ON public.memorials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
```
Routes: `app/memorial/page.tsx` (quiet, respectful card grid), `app/admin/memorial`. Get family consent before publishing a name or photo.

#### 4.3 Featured alumni (2 h)
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS achievement TEXT DEFAULT '';
-- 1) add is_featured / achievement to the protected fields in prevent_profile_privilege_escalation
-- 2) append is_featured, achievement to the END of alumni_directory (CREATE OR REPLACE VIEW)
```
- Admin users page: "Featured" toggle + achievement text.
- Show "Notable alumni" on the landing page and dashboard.
- **Do not skip step 1**, or any member can feature themselves from the browser.

#### 4.4 Bangla / English (4–6 h) — do this last
- Cookie-based, no route restructuring: `lib/i18n/en.ts`, `lib/i18n/bn.ts`, `getT()` reads the `lang` cookie on the server; a `LangToggle` sets the cookie and calls `router.refresh()`.
- Translate in this order: navigation, login/signup, dashboard, directory, events. The rest gradually.
- Use Bangla digits for dates only if you test them; otherwise keep numerals as is.

#### 4.5 Optional: public ID-card verification
- `profiles.public_code TEXT UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,10)`.
- QR on the ID card points to `/verify/[code]`, which shows only **name, batch, "Verified member"**. Use a SECURITY DEFINER function that returns just those fields; grant execute to `anon` for that one function only.

---

### Phase 5 — Launch (about 3–4 days)

- [ ] **Legal basics:** Privacy page and Terms page; consent checkbox on signup ("I agree my details are visible to approved members as per my privacy settings").
- [ ] **PWA:** `manifest.webmanifest`, icons, "Add to home screen" works on Android.
- [ ] **SEO:** metadata and OG image for landing; `robots.txt` blocks everything except the landing page.
- [ ] **Deploy:** Vercel + your domain. Supabase Auth Site URL and redirect URLs set to production.
- [ ] **Env vars on Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key), `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`. Do not add the service-role key unless a feature truly needs it, and never expose it to the browser.
- [ ] **Backups:** free Supabase has no point-in-time restore. Export the database weekly (`pg_dump` or CSV from admin export) and keep a copy in Google Drive.
- [ ] **Monitoring:** Vercel Analytics; optional Sentry.
- [ ] **Seed content:** 3 announcements, 1 upcoming event, teachers, 1 gallery album, batch coordinators set.
- [ ] **Pilot:** invite 1–2 batches via roster import + Facebook/WhatsApp group; collect feedback for 2 weeks before opening to all batches.
- [ ] **Admin handover doc:** how to approve users, add events, upload photos, verify payments (one page, with screenshots).

---

## 7. Route map

| Route | Who | Status |
|---|---|---|
| `/` | public | landing — 1.0 |
| `/login`, `/signup` | public | done |
| `/forgot-password`, `/reset-password`, `/auth/callback` | public | 1.1 |
| `/pending` | pending user | done |
| `/dashboard` | member | done (use views in Phase 0) |
| `/directory`, `/teachers` | member | done (upgrade in 3.3) |
| `/events` | member | done (RSVP in 1.3) |
| `/profile`, `/id-card` | member | done (fields in 1.2) |
| `/blood` | member | 2.1 |
| `/batches`, `/batches/[year]` | member | 2.2 |
| `/gallery`, `/gallery/[albumId]` | member | 2.3 |
| `/fund` | member | 4.1 |
| `/memorial` | member | 4.2 |
| `/verify/[code]` | public | 4.5 (optional) |
| `/admin/users`, `/teachers`, `/events`, `/announcements` | admin | done |
| `/admin/events/[id]/rsvps` | admin | 1.3 |
| `/admin/batches`, `/gallery`, `/roster`, `/fund`, `/memorial` | admin | 2.2 – 4.2 |
| `/admin/users/export` | admin | 3.3 |

**Sidebar (member):** Dashboard, Directory, Batches, Teachers, Events, Gallery, Blood, Fund, Memorial, Profile, ID card.
**Sidebar (admin extra):** Users (pending badge), Teachers, Events, Announcements, Batches, Gallery, Roster, Fund, Memorial.

---

## 8. Security checklist (re-check before every release)

- [ ] RLS enabled on every table; no table readable by `anon`.
- [ ] Every new view: `REVOKE ALL ... FROM anon`, gated by `is_member()`.
- [ ] Every read policy for member data includes `is_member()`.
- [ ] Any new admin-only column on `profiles` is added to the privilege trigger.
- [ ] Admin pages check the role on the **server** (layout/server action), not only in the sidebar.
- [ ] Every server action calls `auth.getUser()` first and validates input with zod.
- [ ] Secrets (`RESEND_API_KEY`, service-role key) never have the `NEXT_PUBLIC_` prefix.
- [ ] Upload buckets have size and MIME limits; compress on the client.
- [ ] Phone numbers and birthdays only appear when the owner opted in (or in the blood finder with explicit consent text).
- [ ] CSV export is admin-only and logged to the console/server log at minimum.

---

## 9. Test matrix

Use five accounts: **admin**, **approved alumni**, **pending**, **rejected**, **logged out**.

| Resource | Admin | Approved | Pending / Rejected | Logged out |
|---|---|---|---|---|
| Own profile (read/update safe fields) | yes | yes | read own | no |
| Other members via `alumni_directory` | yes | yes | **no** | **no** |
| Change own `role` / `status` | yes | **blocked** | **blocked** | no |
| Events, announcements, teachers | yes | yes | **no** | **no** |
| RSVP | yes | active upcoming events only | **no** | no |
| Gallery, batches, fund (verified), memorial | yes | read | **no** | **no** |
| Submit fund payment | yes | own, `pending` only | **no** | no |
| Roster, CSV export, RSVP list | yes | **no** | **no** | no |

Also test on a real phone (Android Chrome) at least once per phase.

---

## 10. Definition of done (every feature)

1. SQL saved in `db/migrations/` and run successfully.
2. Works for approved user and admin; blocked for pending and logged-out.
3. Has loading, empty and error states; looks right at 360 px.
4. No `console.error`, `npm run lint` and `npx tsc --noEmit` pass.
5. Committed on its own branch with a clear message.

---

## 11. Claude Code prompt templates

**Feature prompt**
```
Project: Next.js 16 App Router + Supabase (see CLAUDE.md, AGENTS.md and projectplan.md).
Task: implement section 6 → <feature number and name> from projectplan.md.
Rules:
- Read supabase-schema.sql, db/migrations/ and the existing related pages first.
- Put new SQL in db/migrations/<NNN_name>.sql — do not run it, I will run it in the SQL Editor.
- Reuse components in components/ui and my existing Supabase server/client helpers.
- Member data must come from views or is_member()-gated policies, never open reads.
- Every page needs loading, empty and error states and must work at 360px width.
- Do not touch unrelated files.
When done: list files changed, the SQL to run, and how to test with admin / approved / pending accounts.
```

**Design pass prompt**
```
Read section 5 of projectplan.md. Restyle <page> using the design tokens and components.
Do not change data fetching or business logic. Add loading.tsx, an empty state and a mobile layout.
```

**Security review prompt**
```
Review all server actions, route handlers and Supabase queries against section 8 of projectplan.md.
List anything that reads member data without a view or is_member() gate, and anything that trusts client input.
Do not change code yet — report findings first.
```

---

## 12. Not now (skip on purpose)

Native mobile app (use the PWA) · discussion forum/chat (use the existing WhatsApp/Facebook group) · WhatsApp automation · mentorship matching · merchandise store · full job board · business directory · online payment gateway (bKash/Nagad/SSLCommerz merchant approval is slow; use the manual ledger first) · advanced moderation / activity logs.

Revisit after 3 months of real usage, and only the ones members actually ask for.

---

## 13. Open decisions

- [ ] School name, logo, brand colours (replace the sample palette in 5.2)
- [ ] First batch year and last batch year (for the `batches` seed)
- [ ] Is "department" really Group (Science / Commerce / Arts)? Rename the UI label.
- [ ] Should teacher accounts exist in `profiles` (`user_type = 'teacher'`), or only in the `teachers` table?
- [ ] Should teacher phone/email be visible to all members?
- [ ] Who is the treasurer? Which bKash/Nagad number and account name will be shown?
- [ ] Custom domain name, and Resend (needs a domain) vs Gmail SMTP
- [ ] Who are the first 2 pilot batches and their coordinators?
- [ ] Who is the backup admin if the main admin is unavailable?
