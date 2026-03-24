# eaisy Dental ERP — Master Implementation Plan

## Project Overview

eaisy (internally MOLaiRE) is a comprehensive, AI-first dental practice management software designed for the Hungarian market with international (Dental Tourism) capabilities. The system integrates with Hungarian regulatory systems (EESZT, NAV) and provides modern features like AI-powered transcription, automated billing, and business intelligence.

## Quick Reference

| Document | Purpose |
|----------|---------|
| [01-TECHNICAL_FOUNDATION.md](./01-TECHNICAL_FOUNDATION.md) | Tech stack, architecture, authentication |
| [02-MODULE_CALENDAR.md](./02-MODULE_CALENDAR.md) | Appointment scheduling system |
| [03-MODULE_PATIENT_RECORDS.md](./03-MODULE_PATIENT_RECORDS.md) | Patient management & dental chart |
| [04-MODULE_CRM.md](./04-MODULE_CRM.md) | CRM & Lead Management |
| [05-MODULE_BILLING.md](./05-MODULE_BILLING.md) | Billing, NAV, Visibill AI |
| [06-MODULE_DENTAL_TOURISM.md](./06-MODULE_DENTAL_TOURISM.md) | International patient management |
| [07-MODULE_BI_ANALYTICS.md](./07-MODULE_BI_ANALYTICS.md) | Business Intelligence & Analytics |
| [08-DATABASE_SCHEMA.md](./08-DATABASE_SCHEMA.md) | Complete database schema |
| [09-API_ENDPOINTS.md](./09-API_ENDPOINTS.md) | REST API reference |
| [10-INTEGRATION_WORKFLOWS.md](./10-INTEGRATION_WORKFLOWS.md) | n8n automation workflows |
| [11-IMPLEMENTATION_PHASES.md](./11-IMPLEMENTATION_PHASES.md) | Detailed implementation roadmap |

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router), TypeScript
- **Styling**: CSS Modules per component, design tokens in `src/styles/tokens.css`
- **Component Library**: Custom `eaisy-components` (see `.agents/skills/eaisy-components/SKILL.md`)
- **Icons**: Phosphor Icons (`@phosphor-icons/react`)
- **Font**: Inter (via `next/font/google`)
- **Charts**: Recharts (for BI dashboards)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Realtime**: Supabase Realtime
- **Project Ref**: `tietuujlesnyfeiyfixt`

### Integrations
- **Automation**: n8n (self-hosted at n8n.thinkaikontir.hu)
- **Email**: Mailgun
- **SMS**: Twilio
- **Payments**: Stripe (international), local POS
- **AI/ML**: OpenAI GPT-4, ElevenLabs STT
- **Voice**: LiveKit/Pipecat (future)

### External Systems
- **NAV Online Számla**: Hungarian tax authority invoice reporting
- **EESZT**: Hungarian eHealth system
- **Facebook Lead Ads**: Lead capture
- **WhatsApp Business API**: Patient communication

## Module Priority & Dependencies

```
Phase 1 (MVP Foundation) ← PARTIALLY COMPLETE
├── Technical Foundation (Auth, DB, Core Components) ✅ Components built
├── Calendar Module (appointments are central) ✅ Weekly view built
└── Patient Records (basic patient data) ✅ Kezelés page built

Phase 2 (Core Operations)
├── Dental Chart (Fogstátusz) ✅ Showcase built
├── Billing & Invoicing (NAV integration)
└── CRM Basics (lead capture, pipeline)

Phase 3 (AI & Automation)
├── Voxis AI (voice transcription)
├── Visibill AI (auto-invoicing)
└── Marketing Automation

Phase 4 (Growth Features)
├── Dental Tourism Module
├── BI/Analytics
└── Advanced CRM (scoring, automation)

Phase 5 (Compliance & Scale)
├── EESZT Full Integration
├── Multi-location support
└── Staff Management
```

## Design System Reference

All UI is built using the **eaisy component library**. See `.agents/skills/eaisy-components/SKILL.md` for the complete API reference including:
- 26 custom components (Button, Badge, Table, Drawer, CalendarEntry, etc.)
- Design tokens (colors, typography, spacing, shadows, radii)
- Screen composition patterns
- Styling conventions

### Color Palette (from `tokens.css`)
```css
--color-primary-500: #186D98;  /* Links, accents, badge text */
--color-primary-900: #082432;  /* Dark nav bg, headings, body text */
--color-brand-500: #C43284;    /* Brand accent (patient names, CTAs) */
--color-neutral-50: #F5F5F5;   /* Page background */
--color-neutral-100: #EDEDED;  /* Divider lines, light borders */
--color-white: #FFFFFF;        /* Card backgrounds */
```

### Typography
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

## Key Business Rules

1. **Hungarian Locale**: Date format `YYYY.MM.DD`, currency `Ft`, time 24h
2. **NAV Compliance**: All invoices must be reported within 5 days
3. **GDPR**: Patient consent required for marketing communications
4. **Data Retention**: Medical records retained per Hungarian law
5. **Multi-tenant Ready**: Single database with RLS for future SaaS

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External Services
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI Services
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# NAV Online Számla
NAV_TECHNICAL_USER=
NAV_TECHNICAL_USER_PASSWORD=
NAV_SIGNATURE_KEY=
NAV_EXCHANGE_KEY=
NAV_TAX_NUMBER=

# n8n
N8N_WEBHOOK_URL=
```

## Getting Started

### For AI Agent Implementation

1. **Read the agent skills** in `.agents/skills/` before implementing:
   - `eaisy-components` — Full component API reference
   - `eaisy-build-workflow` — Step-by-step build process with safeguards
   - `eaisy-supabase-patterns` — Database/auth/Edge Function patterns
2. **Read the relevant module spec** from this `gameplan/` directory
3. **Check Figma** for UI design reference (when available)
4. **Start with database schema** from `08-DATABASE_SCHEMA.md`
5. **Follow the phase order** in `11-IMPLEMENTATION_PHASES.md`

### File Structure

```
src/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with Inter font
│   │   ├── page.tsx            # Component showcase / landing
│   │   ├── naptar/             # Calendar module ✅
│   │   ├── kezeles/            # Treatment module ✅
│   │   ├── dental-chart/       # Dental chart showcase ✅
│   │   ├── crm/                # CRM module (planned)
│   │   ├── penzugy/            # Billing module (planned)
│   │   └── riportok/           # BI/Analytics (planned)
│   ├── components/             # 26 eaisy components
│   │   ├── index.ts            # Barrel exports
│   │   ├── Button/
│   │   ├── Table/
│   │   ├── Drawer/
│   │   └── ...
│   ├── styles/
│   │   ├── tokens.css          # All design tokens
│   │   └── globals.css         # Global styles
│   └── lib/
│       ├── supabase-browser.ts # Client-side Supabase client
│       └── supabase-server.ts  # Server-side Supabase client
├── supabase/
│   ├── config.toml             # Local Supabase config
│   ├── migrations/             # Database migrations
│   └── functions/              # Edge Functions
└── .agents/
    └── skills/                 # Agent skills
```

## Implementation Checklist

### Phase 1: Foundation ← IN PROGRESS
- [x] Component library (26 components built)
- [x] Calendar module MVP (weekly view, overlapping, date picker, drawer)
- [x] Kezelés page (consultation default, treatment plan views)
- [x] Dental chart showcase (Zsigmondy cross)
- [ ] Supabase database schema creation
- [ ] Authentication flow (login, roles)
- [ ] Patient list & basic records (data-connected)

### Phase 2: Core Operations
- [ ] Dental chart (full interactive FDI notation)
- [ ] Treatment planning (data-connected)
- [ ] Invoice creation
- [ ] NAV Online Számla integration
- [ ] Basic CRM (lead list, pipeline)

### Phase 3: AI Features
- [ ] Voxis AI transcription
- [ ] Visibill auto-invoicing
- [ ] Email/SMS automation
- [ ] Lead scoring

### Phase 4: Growth
- [ ] Dental Tourism portal
- [ ] Multi-currency billing
- [ ] BI dashboards
- [ ] Custom reports

### Phase 5: Scale
- [ ] EESZT full integration
- [ ] Multi-location
- [ ] Staff management
- [ ] Advanced analytics

---

**Next Steps**: Start with [01-TECHNICAL_FOUNDATION.md](./01-TECHNICAL_FOUNDATION.md) for architecture details.
