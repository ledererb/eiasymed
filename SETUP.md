# eaisy Dental ERP — Developer Setup Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | v20+ | [nodejs.org](https://nodejs.org) or `brew install node` |
| **npm** | v10+ | Comes with Node.js |
| **Git** | any recent | `brew install git` or [git-scm.com](https://git-scm.com) |

> **Note**: The project uses **Next.js 16** with React 19. Make sure your Node version is compatible.

---

## 1. Clone the Repository

```bash
git clone https://github.com/ledererb/eiasymed.git
cd eiasymed
```

---

## 2. Install Dependencies

The Next.js app lives inside the `src/` directory:

```bash
cd src
npm install
```

This installs all dependencies defined in `package.json`:
- **React 19** + **Next.js 16** (App Router)
- **@supabase/supabase-js** + **@supabase/ssr** (database, auth)
- **@phosphor-icons/react** (icon library)
- **date-fns** (date utilities)
- **recharts** (charts/graphs)

---

## 3. Configure Environment Variables

Create the local environment file:

```bash
cp .env.example .env.local
```

If `.env.example` doesn't exist, create `.env.local` manually inside `src/`:

```bash
# src/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://tietuujlesnyfeiyfixt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask the project owner for this key>
```

> ⚠️ **Never commit `.env.local` to Git.** It is already in `.gitignore`.
>
> Ask the project owner (Balázs) for the Supabase anon key.

---

## 4. Run the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**.

---

## 5. Login

Use the test credentials:

| Field | Value |
|---|---|
| Email | `test@eaisy.hu` |
| Password | Ask the project owner |

After login, you'll be redirected to the Dashboard.

---

## 6. Project Structure

```
eiasymed/
├── src/                          # Next.js app root
│   ├── src/
│   │   ├── app/                  # Pages (App Router)
│   │   │   ├── page.tsx          # Dashboard (/)
│   │   │   ├── login/            # Login page
│   │   │   ├── naptar/           # Calendar
│   │   │   ├── paciensek/        # Patients (list + [id] detail + ajanlatok)
│   │   │   ├── kezeles/          # Treatment
│   │   │   ├── dental-chart/     # Dental chart
│   │   │   ├── penzugy/          # Finance & billing
│   │   │   ├── crm/              # CRM / Lead management
│   │   │   ├── dental-tourism/   # Dental tourism module
│   │   │   ├── riportok/         # Reports & analytics
│   │   │   └── beallitasok/      # Settings
│   │   ├── components/           # Reusable UI components (32 components)
│   │   ├── lib/                  # Supabase clients, validation, utilities
│   │   └── middleware.ts         # Auth middleware
│   ├── public/                   # Static assets
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
├── supabase/                     # Supabase config & migrations
├── gameplan/                     # Project planning docs
├── ROADMAP.md                    # Full functionality roadmap
└── SETUP.md                     # ← You are here
```

---

## 7. Available Scripts

Run these from the `src/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + CSS Modules |
| Icons | Phosphor Icons |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Edge Functions | Supabase Edge Functions (Deno) |
| Hosting | Vercel |

---

## 9. Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, then commit
git add -A
git commit -m "feat: description of your changes"

# Push to remote
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub against the `start` branch.

### Commit Convention

| Prefix | Use for |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `style:` | CSS / visual changes |
| `refactor:` | Code restructuring |
| `docs:` | Documentation |
| `chore:` | Config, dependencies |

---

## 10. Supabase Database

The database has **46 tables** including:
- `patients`, `appointments`, `staff`, `locations`, `chairs`
- `invoices`, `invoice_items`, `payments`, `cash_register_sessions`
- `treatment_types`, `treatments`, `treatment_plans`, `treatment_plan_items`
- `dental_chart`, `dental_chart_history`
- `leads`, `lead_activities`, `lead_tasks`, `lead_scoring_rules`
- `online_consultations`, `international_quotes`, `patient_travel_details`
- `role_permissions`, `audit_log`, `nav_config`, `eeszt_config`

All tables have **Row Level Security (RLS)** enabled.

9 **Edge Functions** are deployed:
`nav-invoice`, `nav-status-check`, `eeszt-ambulanslap`, `eeszt-torzslap`, `eeszt-integration`, `voxis-webhook`, `appointment-reminders`, `gdpr-export`, `create-test-user`

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL is undefined` | Make sure `.env.local` exists in `src/` |
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, run `npm install` again |
| Port 3000 in use | `npx kill-port 3000` or use `npm run dev -- -p 3001` |
| Login fails | Confirm credentials with project owner; check Supabase dashboard |
