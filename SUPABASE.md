# eaisy Dental ERP — Supabase Configuration

> **Copy-paste ready.** Use this to set up the project on any workstation.

---

## Quick Setup

Create the file `src/.env.local` with these exact contents:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tietuujlesnyfeiyfixt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZXR1dWpsZXNueWZlaXlmaXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk2MDgsImV4cCI6MjA4OTk1NTYwOH0.SwJkx8yE2IbcoyUAbhiZxCfZvEGxPmFOmHFU2EEJ6f0
```

Then:

```bash
cd src
npm install
npm run dev
```

---

## Supabase Project Details

| Key | Value |
|---|---|
| **Project Ref** | `tietuujlesnyfeiyfixt` |
| **API URL** | `https://tietuujlesnyfeiyfixt.supabase.co` |
| **Dashboard** | [https://supabase.com/dashboard/project/tietuujlesnyfeiyfixt](https://supabase.com/dashboard/project/tietuujlesnyfeiyfixt) |
| **Region** | (check dashboard) |

---

## API Keys

### Legacy Anon Key (used in `.env.local`)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZXR1dWpsZXNueWZlaXlmaXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk2MDgsImV4cCI6MjA4OTk1NTYwOH0.SwJkx8yE2IbcoyUAbhiZxCfZvEGxPmFOmHFU2EEJ6f0
```

### Publishable Key (newer format)

```
sb_publishable_G4ZBq3D6Rr7TvWYmaxYuKA_wgBsG7Mm
```

> The app currently uses the **legacy anon key** in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Test User Credentials

| Field | Value |
|---|---|
| **Email** | `test@eaisy.hu` |
| **Password** | `testtest123` |

> Created via the `create-test-user` Edge Function.

---

## Edge Functions (9 deployed)

| Function | Purpose | JWT Required |
|---|---|---|
| `create-test-user` | Creates demo login user | ❌ No |
| `nav-invoice` | Submit invoice to Hungarian NAV | ✅ Yes |
| `nav-status-check` | Check NAV submission status | ✅ Yes |
| `eeszt-ambulanslap` | Submit ambuláns lap to EESZT | ✅ Yes |
| `eeszt-torzslap` | Submit törzslap to EESZT | ✅ Yes |
| `eeszt-integration` | EESZT connection test | ✅ Yes |
| `voxis-webhook` | Voice AI transcript receiver | ❌ No |
| `appointment-reminders` | SMS/email appointment reminders | ❌ No |
| `gdpr-export` | Export patient data (GDPR) | ✅ Yes |

Call pattern for JWT-protected functions:

```typescript
const { data: { session } } = await supabase.auth.getSession();

const resp = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/function-name`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ /* payload */ }),
  }
);
```

---

## Database Summary

**46 tables** in `public` schema, all with RLS enabled.

Core tables with data:

| Table | Rows | Description |
|---|---|---|
| `clinics` | 1 | Multi-tenant anchor |
| `locations` | 1 | Clinic locations |
| `staff` | 4 | Doctors, assistants, admin |
| `patients` | 20 | Patient records |
| `appointments` | 22 | Scheduled appointments |
| `appointment_types_config` | 8 | Appointment type definitions |
| `chairs` | 3 | Treatment chairs/rooms |
| `working_hours` | 14 | Doctor schedules |
| `treatment_types` | 13 | Treatment catalogue |
| `treatment_plans` | 10 | Patient treatment plans |
| `treatment_plan_items` | 10 | Line items in plans |
| `dental_chart` | 10 | Per-tooth status records |
| `invoices` | 15 | Billing invoices |
| `payments` | 12 | Payment records |
| `price_list` | 13 | Price per treatment type |
| `leads` | 12 | CRM leads |
| `lead_activities` | 15 | Lead interaction timeline |
| `lead_scoring_rules` | 9 | Auto-scoring config |
| `online_consultations` | 8 | Dental tourism inquiries |
| `treatment_packages` | 4 | Tourism treatment bundles |
| `patient_travel_details` | 3 | Travel logistics |
| `patient_aftercare` | 3 | Post-treatment follow-up |
| `role_permissions` | 55 | RBAC permission matrix |

---

## Vercel Deployment

The app is deployed on Vercel. Environment variables are set in the Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL` → same as above
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → same as above

---

## File Locations

| What | Where |
|---|---|
| `.env.local` | `src/.env.local` (not committed) |
| Supabase browser client | `src/src/lib/supabase-browser.ts` |
| Supabase server client | `src/src/lib/supabase-server.ts` |
| Auth middleware | `src/src/middleware.ts` |
| Supabase migrations | `supabase/` directory |
