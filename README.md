# eaisy Dental ERP

AI-first dental practice management software for the Hungarian market.

## Quick Start

```bash
cd src
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Login

| Field    | Value             |
|----------|-------------------|
| Email    | `admin@eaisy.hu`  |
| Password | `Eaisy2026!`      |

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, CSS Modules
- **UI**: Custom `eaisy-components` library (26 components)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Charts**: Recharts

## Routes (13)

| Route | Module |
|-------|--------|
| `/naptar` | Calendar (drag-and-drop scheduling) |
| `/paciensek` | Patient list + detail pages |
| `/kezeles` | Treatment workflow |
| `/penzugy` | Billing, invoices, payments, price list |
| `/crm` | CRM & lead pipeline |
| `/dental-tourism` | International patients, packages, trips, quotes |
| `/riportok` | BI dashboards (Recharts) |
| `/dental-chart` | Dental chart (Zsigmondy cross) |
| `/beallitasok` | Staff, locations, working hours |
| `/login` | Authentication |

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
