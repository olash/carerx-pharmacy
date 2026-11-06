# CareRx Pharmacy

An online pharmacy for Nigeria. Patients send **drug requests** (with prescription uploads) and book **live chat consultations** with a pharmacist. Staff manage everything from an **admin CMS**: inventory, quotes, fulfilment, consultations, opening hours and the team.

**Stack:** Next.js 16 (App Router, Cache Components) · Tailwind CSS v4 with **Untitled UI** design tokens and `@untitledui/icons` · Supabase (Postgres, Auth, Storage, Realtime) · deployable on Vercel.

---

## What's inside

### Patient site
| Page | What it does |
|---|---|
| `/` | Landing page: search, categories, how it works, featured stock, consultation CTA, FAQ |
| `/drugs` | Catalogue with search, category, in-stock and Rx/OTC filters |
| `/drugs/[slug]` | Medicine detail: price, stock, Rx notice, usage |
| Request list (drawer) | Cart-like list saved on the device; add unlisted medicines by name |
| `/request` | Review the list, upload a prescription (required for Rx items), choose pickup or delivery, add a note |
| `/consult` | Book a slot (generated from opening hours; taken slots hidden) |
| `/account` | My requests and consultations |
| `/account/requests/[id]` | Live status tracker, quote review, **Confirm quote** / Cancel, timeline |
| `/account/consultations/[id]` | Real-time chat with the pharmacist (text + photo/PDF attachments) |

### Admin CMS (`/admin`, staff only)
| Page | What it does |
|---|---|
| `/admin/login` | Staff sign-in. Non-staff accounts are rejected |
| `/admin` | Dashboard: requests to review, orders to fulfil, today's consultations, stock alerts |
| `/admin/inventory` | Inventory table: search and filters, **inline stock editing**, hide/show, delete, **CSV import/export** |
| `/admin/inventory/new`, `/[id]` | Add or edit a medicine: details, photo upload, price, stock, low-stock threshold, Rx flag, NAFDAC no. |
| `/admin/categories` | Manage categories |
| `/admin/requests` | Queue by stage (Needs review · Awaiting patient · To fulfil · Closed) |
| `/admin/requests/[id]` | Review the prescription, mark availability, set prices, substitute or add items, send a quote, then Ready → Out for delivery → Delivered |
| `/admin/consultations` | Upcoming and past consultations |
| `/admin/consultations/[id]` | Chat with the patient, private notes, start/end/no-show |
| `/admin/settings` | Weekly consultation hours, slot length, booking window, delivery fee, and **live chat switches** (online status, unread badges, alert sound) |
| `/admin/integrations` | (Admin only) The owner connects **their own** email (Resend) and WhatsApp (Meta Cloud API) accounts and configures consultation reminders |
| `/admin/team` | (Admin only) grant or revoke pharmacist/admin access |

### Live chat
- Each consultation has a private realtime chat room (text + photos/PDFs). Patients can write any time before the slot.
- **Pharmacist joins** from Admin → Consultations → open the booking → *Start session* (or just reply). The consultation becomes "In session" and is assigned to that pharmacist.
- **Online status** (toggle): a green dot shows when the patient is in the chat room (Supabase Presence on a private, RLS-protected channel); patients see "Pharmacist online".
- **Unread badges + alert sound** (toggles): staff get a live toast and chime for new patient messages, bookings and drug requests, with unread counts in the sidebar and consultations list. Opening a chat marks it read.

### Reminders (Admin → Integrations)
- Credentials are stored encrypted in **Supabase Vault**, never in plain tables, and never sent back to the browser.
- Supabase **pg_cron** calls `POST /api/reminders/run` every 5 minutes via **pg_net**, authenticated with a random secret kept in Vault.
- Choose when (24h / 2h / 1h / 15 min before) and who (patients and/or the pharmacy team, by email and/or WhatsApp). Each reminder is sent once, and only the most imminent one if several are due. Every send is logged.
- WhatsApp needs an approved **Utility** template (default name `consultation_reminder`):
  `Hi {{1}}, this is a reminder of your consultation with {{2}} on {{3}}. Join here: {{4}}`

### Request lifecycle
`submitted → reviewing → quoted → confirmed → ready → (out_for_delivery) → completed`, plus `cancelled` (by the patient) and `rejected` (by the pharmacist, with a reason). Patients **pay on pickup or delivery**; no payment gateway is needed. Stock is **deducted automatically** when a request is completed.

### Security
- Row Level Security on every table: patients only see their own data, and staff see everything.
- Patients can't change roles, prices or statuses directly. Patient actions go through validated `SECURITY DEFINER` RPCs.
- Prescription-only items **can't be submitted without a prescription** (enforced in Postgres).
- Consultation slots are validated against opening hours in the DB, with a unique index preventing double booking.
- Prescriptions and chat files are in **private** buckets with per-user/per-consultation policies. Pharmacist notes live in a staff-only table.

---

## Setup

### 1. Create a Supabase project
Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard) (region `eu-west-1` / `eu-west-2` is closest to Lagos).

### 2. Apply the database
```bash
npm install
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push          # applies supabase/migrations/*
```
Optionally load the sample catalogue (about 32 medicines) by pasting `supabase/seed.sql` into the SQL Editor.

### 3. Environment variables
Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Auth settings (Supabase → Authentication → URL Configuration)
- **Site URL:** your domain, e.g. `https://carerx.ng`
- **Redirect URLs:** add `https://your-domain.com/auth/confirm` (and `http://localhost:3000/auth/confirm` for local dev)

### 5. Create your admin login
1. Run the site (`npm run dev`) and **sign up** at `/signup` with your email.
2. In Supabase → SQL Editor, run `supabase/snippets/make-admin.sql` with your email.
3. Sign in at **`/admin/login`**. Add pharmacists later from **Admin → Team** (they sign up first).

### 6. Brand it
Edit `src/lib/config.ts` (name, phone, address, hours, PCN notice). To change colours, edit the `--color-brand-*` tokens in `src/app/globals.css`.

### 7. Deploy
Push to GitHub, import the repo in Vercel and add the three environment variables.

---

## Local development with a local Supabase (Docker)
```bash
npx supabase start            # starts Postgres/Auth/Storage/Realtime locally
npx supabase db reset         # applies migrations + seed
npm run dev
```
Use the `API_URL` and `PUBLISHABLE_KEY` from `npx supabase status` in `.env.local`.

## Inventory CSV format
Columns: `name, generic_name, brand, category, dosage_form, strength, pack_size, price, stock_qty, low_stock_threshold, requires_prescription, is_active, nafdac_no, description, usage_notes, slug`. `category` is a category slug or name. Booleans accept `yes/no`. Rows are matched by `slug` (or name + strength), so re-importing updates existing items. Download a template from **Admin → Inventory → Import**.

## Project structure
```
src/
  app/(site)/        patient site (landing, catalogue, request, consult, account)
  app/(auth)/        login / signup
  app/admin/         admin login + (panel) CMS
  actions/           server actions (patient + admin)
  components/ui/     Untitled-style primitives (Button, Input, Badge, Modal, Table…)
  components/        feature components (chat, request form, admin review…)
  lib/               Supabase clients, auth DAL, data access, slots, CSV
supabase/
  migrations/        schema, RLS, RPCs, storage, realtime
  seed.sql           sample catalogue
```
