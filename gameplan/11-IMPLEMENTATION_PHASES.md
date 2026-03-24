# eaisy — Implementation Phases

## Overview

This document provides a detailed, step-by-step implementation guide for building the eaisy dental software. Each phase builds upon the previous one, ensuring a stable foundation before adding complexity.

> **⚠️ IMPORTANT**: Before implementing any phase, read the relevant agent skills:
> - `eaisy-components` — Component API reference
> - `eaisy-build-workflow` — Step-by-step build process with safeguards
> - `eaisy-supabase-patterns` — Database/auth/Edge Function patterns

## Current Status

The project already has a working foundation:
- ✅ **26 custom components** built and working
- ✅ **Calendar module** (weekly view, overlapping events, date picker, drawer)
- ✅ **Kezelés page** (consultation default, treatment plan views)
- ✅ **Dental chart showcase** (Zsigmondy cross visualization)
- ✅ **Supabase CLI** initialized, MCP configured
- ⬜ **Database tables** not yet created
- ⬜ **Authentication** not yet implemented
- ⬜ **Data connectivity** not yet wired up

## Phase Summary

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| Phase 1 | 2 weeks | Database & Auth | In Progress |
| Phase 2 | 3 weeks | Core Operations (data-connected) | Pending |
| Phase 3 | 3 weeks | AI Features | Pending |
| Phase 4 | 3 weeks | Growth Features | Pending |
| Phase 5 | 2 weeks | Scale & Compliance | Pending |

---

## Phase 1: Database & Auth (2 weeks)

> Foundation is partially done — components exist, need DB + Auth + data wiring.

### Week 1: Database Schema & Auth

#### Day 1-2: Core Database Tables

Create migrations via Supabase MCP (`mcp_supabase_apply_migration`):

```
- [ ] Enable required extensions (uuid-ossp, pg_trgm, unaccent)
- [ ] Create `locations` table
- [ ] Create `staff` table
- [ ] Create `patients` table (with Hungarian-specific fields)
- [ ] Create `patient_medical_history` table
- [ ] Create `dental_chart` + `dental_chart_history` tables
- [ ] Create `treatment_types` + seed data
- [ ] Create `treatments` table
- [ ] Enable RLS on all tables
- [ ] Create audit_log table and trigger function
```

#### Day 3-4: Calendar & Appointment Tables

```
- [ ] Create `chairs` table
- [ ] Create `appointment_types_config` + seed data
- [ ] Create `appointments` table with all indexes
- [ ] Create `working_hours` table
- [ ] Enable RLS + audit triggers
```

#### Day 5: Authentication

```
- [ ] Install @supabase/ssr package
- [ ] Create `src/lib/supabase-browser.ts` (client component client)
- [ ] Create `src/lib/supabase-server.ts` (server component client)
- [ ] Create `src/middleware.ts` (auth middleware)
- [ ] Create login page (`src/app/login/page.tsx`)
- [ ] Set up user roles in Supabase (custom claims)
- [ ] Set up .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Week 2: Wire Up Existing Pages

#### Day 1-2: Calendar Data Connection

```
- [ ] Connect /naptar page to `appointments` table
- [ ] Implement real appointment fetching (replace mock data)
- [ ] Implement new appointment creation (via drawer form)
- [ ] Implement appointment editing
- [ ] Add realtime subscription for live updates
- [ ] Wire filter sidebar to Supabase queries
```

#### Day 3-4: Patient Data Connection

```
- [ ] Create patient list page (`src/app/paciensek/page.tsx`)
- [ ] Wire Table component to `patients` table
- [ ] Implement patient search (pg_trgm)
- [ ] Wire PatientMasterDrawer to real data
- [ ] Connect kezelés page to `treatments` table
- [ ] Connect dental chart to `dental_chart` table
```

#### Day 5: Storage Setup

```
- [ ] Create storage buckets (patient-documents, xrays, profile-photos)
- [ ] Configure storage RLS policies
- [ ] Wire x-ray viewer in ContentTabbedPanel to Supabase Storage
```

### Safeguards for Phase 1

```
After each migration:
  1. Run `mcp_supabase_get_advisors(type: 'security')` to check for missing RLS
  2. Verify table exists with `mcp_supabase_list_tables`
  3. Test select/insert/update with `mcp_supabase_execute_sql`

After each page connection:
  1. Run `npm run build` to verify no TypeScript errors
  2. Launch browser to verify page loads with real data
  3. Test error states (empty data, network error)
```

---

## Phase 2: Core Operations (3 weeks)

### Week 3: Billing Foundation

```
- [ ] Create invoice tables (invoices, invoice_items, payments)
- [ ] Create cash_register_sessions table
- [ ] Create price_list table + seed data
- [ ] Create nav_config table
- [ ] Build billing list page (`src/app/penzugy/page.tsx`)
- [ ] Build invoice creation flow
- [ ] Wire TreatmentPlanRow to real treatment data
```

### Week 4: NAV Integration & CRM

```
- [ ] Build NAV API Edge Function (invoice submission)
- [ ] Build NAV transaction status checker
- [ ] Create lead tables (leads, lead_activities, lead_tasks)
- [ ] Create message_templates table
- [ ] Build CRM dashboard page (`src/app/crm/page.tsx`)
- [ ] Build lead pipeline (Kanban) view
- [ ] Build lead detail drawer
```

### Week 5: Treatment Planning

```
- [ ] Wire treatment plan creation flow end-to-end
- [ ] Implement interactive dental chart (click to edit tooth status)
- [ ] Build treatment history timeline
- [ ] Connect billing to treatment completion
- [ ] Build patient document management (upload/view)
```

### Safeguards for Phase 2

```
After each Edge Function deployment:
  1. Test via curl or Supabase dashboard
  2. Check edge function logs: `mcp_supabase_get_logs(service: 'edge-function')`
  3. Verify JWT auth is working

Before building each page:
  1. Check Figma for design (if available)
  2. Read module spec from gameplan
  3. Read eaisy-build-workflow skill for layout pattern
  4. Execute npm run build after every significant change
```

---

## Phase 3: AI Features (3 weeks)

### Week 6: Voxis AI Voice Transcription

```
- [ ] Build Edge Function for ElevenLabs STT integration
- [ ] Wire VoiceRecordingBar to real recording/transcription
- [ ] Build treatment note auto-generation from transcription
- [ ] Auto-populate dental chart from voice notes
```

### Week 7: Visibill AI Auto-Invoicing

```
- [ ] Build Edge Function for GPT-4 invoice generation
- [ ] Wire treatment completion → auto-invoice draft
- [ ] Build review/approve flow for auto-generated invoices
- [ ] Connect to NAV submission pipeline
```

### Week 8: Marketing Automation

```
- [ ] Create automation_campaigns + automation_steps tables
- [ ] Build n8n workflows for appointment reminders
- [ ] Build lead nurture email sequences
- [ ] Wire lead scoring rules
- [ ] Build recall/reactivation campaigns
```

---

## Phase 4: Growth Features (3 weeks)

### Week 9-10: Dental Tourism Module

```
- [ ] Create DT-specific tables (international_patient_details, travel, quotes)
- [ ] Build DT dashboard page (`src/app/dental-tourism/page.tsx`)
- [ ] Build online consultation review page
- [ ] Build quote builder with multi-currency
- [ ] Build patient travel management
- [ ] Build aftercare check-in system
```

### Week 11: BI & Analytics

```
- [ ] Create KPI tables + materialized views
- [ ] Create saved_reports table
- [ ] Build executive dashboard (`src/app/riportok/page.tsx`)
- [ ] Build KPICard component using eaisy design system
- [ ] Integrate Recharts for visualizations
- [ ] Build report builder
- [ ] Set up n8n scheduled report generation
```

---

## Phase 5: Scale & Compliance (2 weeks)

### Week 12: EESZT Integration

```
- [ ] EESZT API Edge Functions
- [ ] Patient data exchange
- [ ] E-recept integration
- [ ] Ambulánslap automation
```

### Week 13: Multi-Location & Staff

```
- [ ] Multi-location filtering across all modules
- [ ] Staff schedule management
- [ ] Doctor commission tracking
- [ ] Advanced role-based access (refine RLS policies)
- [ ] Performance optimization (query analysis, caching)
```

---

## Command Safeguards (Apply to ALL Phases)

### Terminal Execution

| Command | WaitMs | Recovery |
|---------|--------|----------|
| `npm run dev` | 2000 async | Check terminal, restart if crashed |
| `npm run build` | 10000 async | Read error, fix file, retry (max 3) |
| `npm install` | 8000 async | Verify package.json updated |
| `npx supabase db push` | 8000 async | Check migration logs |

### File Operations

- Never overwrite files > 200 lines without reading first
- Verify writes by reading back first lines
- Use `replace_file_content` for targeted edits, never full-file for existing files
- Always check barrel export (`index.ts`) when adding new components

### Browser Verification

After every page change:
1. Verify dev server is running
2. Navigate to page, wait 3s
3. Screenshot initial state
4. Test interactive elements
5. Screenshot each state change

---

**Previous**: [10-INTEGRATION_WORKFLOWS.md](./10-INTEGRATION_WORKFLOWS.md)
**Start**: [00-MASTER_PLAN.md](./00-MASTER_PLAN.md)
