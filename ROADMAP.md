# eaisy Dental ERP — Full Functionality Roadmap

> **Purpose**: Step-by-step atomic tasks to take every module from current state → production-ready.
> **Stack**: Vite + React SPA · Supabase (PostgreSQL, Edge Functions, Auth, Storage) · Recharts · CSS Modules
> **Database**: 46 tables (public schema) · 9 Edge Functions deployed · RLS on all tables

---

## Current State Summary

| Module | Route | Lines | Status |
|---|---|---|---|
| Login | `/login` | 97 | ✅ Functional — Supabase Auth sign-in |
| Dashboard | `/` | 539 | ⚠️ Renders KPIs + charts, but no menu sidebar |
| Naptár (Calendar) | `/naptar` | 801 | ⚠️ Weekly view works, many features incomplete |
| Páciensek (Patients) | `/paciensek` | 783 | ⚠️ List renders, CRUD partially done |
| Patient Detail | `/paciensek/[id]` | 417 | ⚠️ Read-only display, no editing |
| Ajánlatok (Quotes) | `/paciensek/ajanlatok` | ~400 | ⚠️ Table + filters done, no create/edit/send |
| Kezelés (Treatment) | `/kezeles` | ~360 | ⚠️ Treatment plan editing wired, session flow missing |
| Dental Chart | `/dental-chart` | — | ⚠️ Visual display only, not interactive |
| Pénzügy (Finance) | `/penzugy` | ~628 | ⚠️ Invoice list + cash register done, invoice creation missing |
| CRM | `/crm` | ~540 | ⚠️ Kanban DnD + tabs done, detail drawer + "Új lead" incomplete |
| Dental Tourism | `/dental-tourism` | — | ⚠️ 4 tabs render data, CRUD incomplete |
| Riportok (Reports) | `/riportok` | 468 | ⚠️ Charts render, export missing |
| Beállítások (Settings) | `/beallitasok` | 515 | ⚠️ Multi-tab with staff/NAV/EESZT, CRUD mostly wired |

**Edge Functions Deployed**: `create-test-user`, `nav-invoice`, `eeszt-ambulanslap`, `eeszt-torzslap`, `nav-status-check`, `voxis-webhook`, `eeszt-integration`, `appointment-reminders`, `gdpr-export`

---

## Phase 1: Core Patient & Appointment Loop

> **Goal**: Receptionist can create a patient, book an appointment, check them in, and the doctor can see them on the calendar.

### 1.1 Patient CRUD (Create / Read / Update / Delete)

- [ ] **1.1.1** — Wire "Új páciens" button on `/paciensek` to open a `Drawer` with form fields:
  - Required: `first_name`, `last_name`, `birth_date`
  - Optional: `taj_number` (validate with `validateTAJ`), `email`, `phone`, `phone_secondary`, `gender`, `address_street`, `address_city`, `address_postal_code`, `address_country`
  - Submit → `supabase.from('patients').insert(...)` → refresh list
- [ ] **1.1.2** — Add TAJ format validation to the form (regex: `^\d{9}$`, checksum validation already exists in `lib/validation.ts`)
- [ ] **1.1.3** — Wire edit button in patient list row → open same drawer pre-filled → `supabase.from('patients').update(...).eq('id', patientId)`
- [ ] **1.1.4** — Wire delete/archive button → confirm modal → `supabase.from('patients').update({ status: 'archived' }).eq('id', patientId)` (soft delete)
- [ ] **1.1.5** — Add pagination to patient list (currently loads all). Use cursor-based pagination with `.range(from, to)`
- [ ] **1.1.6** — Wire search (`MagnifyingGlass`) to filter with `.ilike('first_name', '%query%')` or `.or(...)` across first_name, last_name, taj_number, phone
- [ ] **1.1.7** — Wire sort (`SortAscending`), filter (`FunnelSimple`), and column visibility (`Columns`) toolbar buttons

### 1.2 Patient Detail Page (`/paciensek/[id]`)

- [ ] **1.2.1** — Add "Szerkesztés" (Edit) button → open drawer with same fields as create, pre-populated → save on submit
- [ ] **1.2.2** — Wire "Hívás" (Phone) button → `tel:` link; wire "Email" button → `mailto:` link
- [ ] **1.2.3** — Add "Előzmények" (History) tab:
  - Medical history from `patient_medical_history` table (conditions, allergies, medications, smoker status, bleeding disorder, heart condition, pregnancy, etc.)
  - If no record exists, show "Kitöltés" (Fill) button → create record
  - Toggle switches and text inputs for each field, auto-save on blur
- [ ] **1.2.4** — Add "Dokumentumok" (Documents) tab:
  - Use Supabase Storage bucket for patient documents (X-rays, consent forms, photos)
  - Upload component with drag-and-drop
  - Gallery view for images, list view for PDFs
- [ ] **1.2.5** — Add "Beleegyezések" (Consents) tab:
  - Read from `patient_consents` table
  - Types: marketing, treatment, photo, data_processing
  - Show granted_at / revoked_at status, allow toggle
- [ ] **1.2.6** — Wire "Új időpont" (New Appointment) button → navigate to `/naptar` with patient pre-selected
- [ ] **1.2.7** — Wire "Fogstátusz" (Dental Chart) button → navigate to `/dental-chart?patientId={id}`

### 1.3 Calendar / Appointment Management (`/naptar`)

- [ ] **1.3.1** — Wire "Új Időpont" (`PlusCircle`) button → open `AppointmentForm` drawer:
  - Patient picker (search by name/TAJ)
  - Doctor picker (from `staff` where `role = 'doctor'`)
  - Assistant picker (from `staff` where `role = 'nurse'` or `'assistant'`) → maps to `appointments.assistant_id`
  - Date/time picker, appointment type, chair, duration
  - Submit → `supabase.from('appointments').insert(...)` → refresh calendar
- [ ] **1.3.2** — Wire click on empty calendar slot → open `AppointmentForm` pre-filled with that day/time/doctor
- [ ] **1.3.3** — Wire click on existing Calendar Entry → open detail drawer with:
  - Patient info, appointment info, status badge
  - Action buttons: "Megérkezett" (Arrived), "Elkezdi" (Start), "Kész" (Complete), "Nem jelent meg" (No-show), "Törlés" (Cancel)
  - Each button → `supabase.from('appointments').update({ status: 'new_status' })`
  - Cancel button: show cancellation reason textarea, set `cancelled_at`, `cancellation_reason`
- [ ] **1.3.4** — Implement drag-and-drop reschedule:
  - Dragging a `CalendarEntry` to a new time slot → update `start_time` / `end_time` in Supabase
  - Show confirmation modal: "Biztosan áthelyezi {patient name} időpontját {new time}-ra?"
- [ ] **1.3.5** — Wire doctor filter toggle bar (icons at top):
  - Multi-doctor view: show all doctors side-by-side (columns per doctor)
  - Single-doctor view: toggle to show one doctor at a time
  - Filter bar with doctor avatars → click to toggle visibility
- [ ] **1.3.6** — Add day view and 3-day view toggle (currently only week view):
  - Day view: single column, all hours, larger time slots
  - 3-day view: 3 columns (today, tomorrow, day after)
- [ ] **1.3.7** — Show blocked/break times on calendar:
  - Read `working_hours` for each doctor → shade non-working hours as grey/unavailable
  - Read `break_start` / `break_end` → show break block
  - Holiday overrides: `override_date` with `is_holiday = true`
- [ ] **1.3.8** — Conflict detection: When creating/moving appointment, check for overlapping appointments on same doctor & chair. Show warning dialog if conflict.
- [ ] **1.3.9** — Wire the Search (`MagnifyingGlass`) bar to search appointments by patient name, jumping to the appointment on the calendar

---

## Phase 2: Treatment Workflow

> **Goal**: Doctor opens a patient's treatment session, records procedures, notes, dental chart changes, and closes the visit.

### 2.1 Treatment Session Flow (`/kezeles`)

- [ ] **2.1.1** — Add patient selector at top of kezelés page:
  - Dropdown or search field to pick a patient (from today's scheduled appointments or by search)
  - When selected, load their treatment history and dental chart
- [ ] **2.1.2** — Implement visit lifecycle:
  - "Vizit indítása" (Start Visit) button → creates record in `treatments` table with `status: 'in_progress'`, `started_at: now()`
  - Active visit panel shows: patient name, start time, elapsed timer
  - "Vizit befejezése" (End Visit) button → `completed_at: now()`, `status: 'completed'`
- [ ] **2.1.3** — Wire treatment notes textarea:
  - Auto-save to `treatments.procedure_notes` on blur
  - Rich text or markdown support optional
- [ ] **2.1.4** — Add diagnosis field → save to `treatments.diagnosis`
- [ ] **2.1.5** — Add BNO/OENO code pickers:
  - BNO (diagnosis) code dropdown → save to `treatments.bno_code`
  - OENO (procedure) code dropdown → save to `treatments.oeno_code`
- [ ] **2.1.6** — Materials used tracking:
  - Add/remove materials (JSONB field) → name, quantity, unit
  - Save to `treatments.materials_used`
- [ ] **2.1.7** — Tooth number selector for tooth-specific treatments → save to `treatments.tooth_numbers[]`
- [ ] **2.1.8** — End-of-visit: prompt "Számla készítése?" (Create invoice?) → auto-generate invoice from treatment line items

### 2.2 Dental Chart Interactive (`/dental-chart`)

- [ ] **2.2.1** — Make tooth SVGs clickable → on click, open a side panel for that tooth showing current `dental_chart` record
- [ ] **2.2.2** — Add status selector per tooth: healthy, caries, filling, crown, bridge_anchor, bridge_pontic, implant, implant_crown, missing, root_canal, veneer, temporary
- [ ] **2.2.3** — Add surface selector (O, M, D, B, L, I) for applicable statuses
- [ ] **2.2.4** — Wire save: `supabase.from('dental_chart').upsert(...)` based on `patient_id + tooth_number`
- [ ] **2.2.5** — Add history log: on each change, insert into `dental_chart_history` (previous_status, new_status, change_reason, changed_by)
- [ ] **2.2.6** — Add additional per-tooth fields: mobility (0-3), percussion sensitivity, periapical lesion, gum recession mm, pocket depth mm
- [ ] **2.2.7** — For implants: system, diameter, length, date fields
- [ ] **2.2.8** — Add history mode: date picker to view chart as it was at a specific point in time (query `dental_chart_history` up to selected date)
- [ ] **2.2.9** — Add notation toggle: FDI (European 11-48) / Zsigmondy (Hungarian cross) display switch

### 2.3 Voice Recording / Voxis AI Integration

- [ ] **2.3.1** — Wire the `VoiceRecordingBar` component:
  - Start/Stop recording button during treatment
  - On stop → send audio to `voxis-webhook` Edge Function
  - Display real-time transcription in a text panel
- [ ] **2.3.2** — Auto-populate treatment notes from transcript
- [ ] **2.3.3** — AI-suggested BNO/OENO codes from transcript (future enhancement)

---

## Phase 3: Billing & Finance

> **Goal**: Create invoices from treatments, process payments, submit to NAV, manage cash register.

### 3.1 Invoice Creation (`/penzugy`)

- [ ] **3.1.1** — Wire "Új számla" (New Invoice) button → open `InvoiceForm` drawer:
  - Patient selector (search)
  - Line items from `treatment_types` / `price_list` catalogue or free-text
  - Each line: description, quantity, unit price, VAT rate (27% default), discount %
  - Auto-calculate: net, VAT, gross per line and totals
  - Payment method selector: cash, card, transfer, szép card
  - Submit → insert into `invoices` + `invoice_items`
  - Auto-generate `invoice_number` (sequential, configurable prefix)
- [ ] **3.1.2** — Invoice detail view: click row → open drawer showing full invoice with line items, payment status, NAV status
- [ ] **3.1.3** — "Stornó" (Credit Note) button on paid invoices:
  - Creates new invoice with `invoice_type: 'credit_note'`, `original_invoice_id` pointing to original
  - Negative amounts
  - Auto-submit to NAV via `nav-invoice` Edge Function
- [ ] **3.1.4** — "Fizetés" (Record Payment) button:
  - Payment amount, method, card details (optional)
  - Insert into `payments` table
  - Update `invoices.paid_amount`, recalculate `payment_status` (unpaid/partial/paid)
  - Link to `cash_register_sessions` if applicable
- [ ] **3.1.5** — Support partial payments: multiple payments against one invoice, update running `paid_amount`

### 3.2 NAV Integration

- [ ] **3.2.1** — Auto-submit invoices to NAV on creation (if `nav_config.auto_submit = true`):
  - Call `nav-invoice` Edge Function with invoice data
  - Update `invoices.nav_status` (pending → submitted → accepted/rejected)
  - Store `nav_transaction_id`, `nav_submitted_at`, `nav_response`
- [ ] **3.2.2** — Wire "NAV állapot" (Status) button per invoice → call `nav-status-check` Edge Function → update status badge
- [ ] **3.2.3** — Manual re-submit button for failed submissions
- [ ] **3.2.4** — NAV config test button (in Settings): call `nav-status-check` with test credentials → show success/failure

### 3.3 Cash Register Sessions

- [ ] **3.3.1** — Full cash register session management in Pénztárgép tab:
  - "Kassza nyitás" (Open Session): enter opening cash balance → insert into `cash_register_sessions`
  - During session: track all cash/card/transfer payments from `payments` table
  - "Kassza zárás" (Close Session): enter actual cash balance → calculate difference → close session
- [ ] **3.3.2** — Show daily session summary: opening balance, total cash in/out, total card, total transfer, closing balance, cash difference
- [ ] **3.3.3** — Session history: list past sessions with open/close times, balance differences

### 3.4 Price List Management

- [ ] **3.4.1** — Add "Árlista" (Price List) tab to Settings or Finance:
  - CRUD for `price_list` entries linked to `treatment_types`
  - Fields: base_price (HUF), price_eur, price_gbp, valid_from, valid_until, health_fund_eligible, health_fund_price
  - Inline editing or drawer form

---

## Phase 4: CRM & Lead Management

### 4.1 Lead CRUD

- [ ] **4.1.1** — Wire "Új lead" button → open drawer with form:
  - first_name, last_name, email, phone, source (dropdown: website, facebook, google_ads, referral, walk_in, phone), source_detail
  - interested_in (multi-select from treatment types), budget_range, urgency
  - assigned_to (staff picker)
  - Submit → `supabase.from('leads').insert(...)`, initial `pipeline_stage: 'new'`
- [ ] **4.1.2** — Wire Pipeline table (Tab 1) row click → open lead detail drawer showing:
  - All lead fields, editable
  - Activity timeline from `lead_activities`
  - Tasks from `lead_tasks`
  - Action buttons: log call/email/meeting, change stage, add note
- [ ] **4.1.3** — Wire Kanban card click → same lead detail drawer
- [ ] **4.1.4** — Add "Tevékenységek" (Activities/Tab 3) content:
  - Timeline view of all `lead_activities` across all leads, filterable by type (call, email, meeting, stage_change, score_change, note)
  - "Új tevékenység" button → create `lead_activities` record

### 4.2 Lead Conversion

- [ ] **4.2.1** — "Megnyert → Páciens létrehozás" (Won → Create Patient) flow:
  - When moving lead to "Megnyert" stage, prompt: "Páciens rekord létrehozása?"
  - Auto-create `patients` record from lead data
  - Update lead: `converted_at`, `converted_to_patient_id`
- [ ] **4.2.2** — "Elveszett" (Lost) flow:
  - Prompt for `lost_reason` (dropdown: too_expensive, chose_competitor, changed_mind, no_response, other) + `lost_reason_detail`
  - Update lead: `lost_at`, `lost_reason`

### 4.3 Lead Scoring

- [ ] **4.3.1** — Wire automatic lead scoring based on `lead_scoring_rules` (9 rules in DB):
  - On lead activity creation or stage change, evaluate matching rules
  - Update `leads.lead_score`, `score_category`
  - Log score change as `lead_activities` entry

### 4.4 CRM Automation

- [ ] **4.4.1** — Wire Automatizáció toggle switches to persist state:
  - Read/write automation rule configs (currently UI-only toggles)
  - Store in `automation_campaigns` + `automation_steps` tables
- [ ] **4.4.2** — Wire Sablonok (Templates) "Szerkesztés" buttons:
  - Open template editor drawer
  - Load/save from `message_templates` table
  - Fields: name, channel (email/sms), subject, body (with {név}, {dátum}, {idő} merge tags)

---

## Phase 5: Dental Tourism

### 5.1 Consultation Management

- [ ] **5.1.1** — Wire click on consultation row → open detail drawer:
  - Show all fields from `online_consultations`
  - Assign to doctor (assigned_to picker)
  - Status flow: new → in_review → quote_sent → accepted → booked
  - Save changes on submit
- [ ] **5.1.2** — Wire "Árajánlat készítése" (Create Quote) button:
  - Open quote builder using `international_quotes` + `international_quote_items`
  - Add treatment items from `treatment_types` with EUR/GBP pricing
  - Add travel items: hotel (from `travel_partners`), transfer, interpreter
  - Calculate totals, UK comparison price, savings %
  - Save as `status: 'draft'`
- [ ] **5.1.3** — "Árajánlat küldése" (Send Quote) button:
  - Update `international_quotes.status: 'sent'`, `sent_at: now()`
  - (Future: trigger email Edge Function)

### 5.2 Travel Coordination

- [ ] **5.2.1** — Wire travel detail form on "Utazás" tab:
  - CRUD for `patient_travel_details` records
  - Flight details, hotel (link `travel_partners`), transfer booking, companions, interpreter
  - Status tracking: planned → confirmed → in_progress → completed
- [ ] **5.2.2** — Wire hotel and transfer partner pickers from `travel_partners` table

### 5.3 Aftercare

- [ ] **5.3.1** — Wire aftercare checkin creation:
  - Schedule follow-up check-ins from `aftercare_checkins`
  - Mark as completed, add review notes, flag concerns
  - Send guarantee documents (checkbox toggle)

### 5.4 Partner Management

- [ ] **5.4.1** — Add partner management section (tab or in Settings):
  - CRUD for `partner_agencies` (referral agencies with commission %)
  - CRUD for `travel_partners` (hotels, transfer companies, interpreters)

---

## Phase 6: Reports & Analytics

### 6.1 Export Functionality

- [ ] **6.1.1** — Wire "Exportálás" (Export) button on each Riportok tab:
  - CSV export: serialize current chart/table data
  - PDF export: use browser print or jsPDF
- [ ] **6.1.2** — Add date range filter to all report tabs (currently shows all-time data)
- [ ] **6.1.3** — Add "Összehasonlítás" (Comparison) mode: this period vs. previous period overlay on charts

### 6.2 Additional Report Types

- [ ] **6.2.1** — Add "CRM" report tab: lead conversion funnel, ROI per lead source, pipeline velocity
- [ ] **6.2.2** — Add "Dental Tourism" report tab: consultations by country, conversion rate, average package value
- [ ] **6.2.3** — Wire saved reports: allow saving current filter/view config to `saved_reports` table, list saved reports for re-use

---

## Phase 7: Settings & Configuration

### 7.1 Staff Management

- [ ] **7.1.1** — Verify staff CRUD drawer works end-to-end:
  - Create: all fields → insert into `staff`
  - Edit: load existing → update
  - Delete/deactivate: `is_active: false`
- [ ] **7.1.2** — Wire working hours management:
  - Per-doctor grid (Mon-Sun) with start/end times
  - Add/edit time blocks
  - Save to `working_hours` table (using `doctor_id` column)
- [ ] **7.1.3** — Add holiday/time-off override:
  - Pick a date → create `working_hours` record with `is_holiday: true`, `override_date: selected_date`

### 7.2 Role-Based Permissions

- [ ] **7.2.1** — Wire permissions grid (in Settings "Jogosultságok" tab):
  - Matrix: roles (rows) × resources (columns) × actions (can_view, can_create, can_edit, can_delete)
  - Toggle checkboxes → upsert `role_permissions`
- [ ] **7.2.2** — Enforce permissions client-side:
  - On app load, fetch current user's `staff.role`
  - Create `usePermissions()` hook that reads `role_permissions`
  - Conditionally hide/disable UI elements based on permissions
- [ ] **7.2.3** — Add middleware/guard: on each page load, verify user has `can_view` for that resource, redirect to dashboard if not

### 7.3 NAV Configuration

- [ ] **7.3.1** — Verify NAV config form saves correctly to `nav_config` table
- [ ] **7.3.2** — Wire "Kapcsolat tesztelése" (Test Connection) button → call `nav-status-check` Edge Function → show result

### 7.4 EESZT Configuration

- [ ] **7.4.1** — Verify EESZT config form saves correctly to `eeszt_config` table
- [ ] **7.4.2** — Wire "Teszt" button → call `eeszt-integration` Edge Function → show result
- [ ] **7.4.3** — Wire EESZT auto-submission on visit completion:
  - When a treatment visit is completed, auto-create `eeszt_submissions` record
  - Call `eeszt-ambulanslap` or `eeszt-torzslap` Edge Function depending on submission type

### 7.5 Audit Log

- [ ] **7.5.1** — Display `audit_log` entries in Settings audit tab:
  - Table: timestamp, user, table, action, record ID
  - Expandable rows to show old_data / new_data diff
- [ ] **7.5.2** — Create Postgres trigger to auto-populate `audit_log` on INSERT/UPDATE/DELETE for critical tables (patients, appointments, invoices, treatments)

---

## Phase 8: Cross-Cutting Features

### 8.1 Dashboard Sidebar Menu

- [ ] **8.1.1** — Ensure Dashboard (`/`) renders inside `AppShell` (which includes `SideNav` + `TopNav`)
  - Currently the dashboard might be missing the menu — verify and fix

### 8.2 Smart Search (Global)

- [ ] **8.2.1** — Wire `SmartSearch` component in `TopNav`:
  - Search across patients, appointments, leads, invoices
  - Show categorized results dropdown
  - Navigate to relevant page on selection

### 8.3 Notification System

- [ ] **8.3.1** — Wire `NotificationModal` component to show in-app notifications:
  - Upcoming appointments, overdue invoices, lead tasks due
  - Bell icon badge with unread count
- [ ] **8.3.2** — Appointment reminders:
  - `appointment-reminders` Edge Function already deployed
  - Wire cron/schedule to trigger 24h before each appointment
  - Mark `appointments.reminder_sent = true`, `reminder_sent_at`

### 8.4 GDPR Compliance

- [ ] **8.4.1** — Wire "Adat exportálás" button in patient detail:
  - Call `gdpr-export` Edge Function with patient ID
  - Download JSON/PDF with all patient data
- [ ] **8.4.2** — Wire "Adat törlés" (Data Deletion) request flow:
  - Anonymize patient record (replace PII with "[TÖRÖLVE]")
  - Log deletion request in audit_log

### 8.5 Consent Management

- [ ] **8.5.1** — Wire patient consent tracking:
  - On patient create/edit, show consent checkboxes (marketing, treatment, photo, data_processing)
  - Save to `patient_consents` table with `granted_at` timestamp
  - Allow revocation (set `revoked_at`)
  - Show consent status on patient detail page

---

## Phase 9: Polish & Production Readiness

### 9.1 Error Handling

- [ ] **9.1.1** — Add toast notification system for all Supabase operations (success/error feedback)
- [ ] **9.1.2** — Add loading skeletons for all data-fetching pages
- [ ] **9.1.3** — Add empty state illustrations for lists with no data

### 9.2 Responsive Design

- [ ] **9.2.1** — Test and fix all pages at tablet (768px) and mobile (375px) breakpoints
- [ ] **9.2.2** — Collapse sidebar → hamburger menu on mobile

### 9.3 Performance

- [ ] **9.3.1** — Add Supabase query optimizations: select only needed columns, add `.limit()` where appropriate
- [ ] **9.3.2** — Implement data caching with React Query or SWR for frequently accessed data (staff list, treatment types, price list)
- [ ] **9.3.3** — Add Supabase Realtime subscriptions for live updates on calendar and dashboard

### 9.4 Security

- [ ] **9.4.1** — Verify all RLS policies are correct and restrictive (run `mcp_supabase_get_advisors` security check)
- [ ] **9.4.2** — Ensure auth guard redirects to `/login` if no session on every protected page
- [ ] **9.4.3** — Encrypt sensitive fields at rest (NAV keys, EESZT API keys — currently stored as `_encrypted` suffix)

---

## Database Tables Status

| Table | Rows | Frontend Integration | Notes |
|---|---|---|---|
| `clinics` | 1 | ⚠️ Settings only | Multi-tenant anchor |
| `locations` | 1 | ✅ Settings CRUD | Per-clinic locations |
| `staff` | 4 | ✅ Settings CRUD | 4 demo staff |
| `patients` | 20 | ⚠️ Read-only list | Create/edit/delete needed |
| `patient_medical_history` | 0 | ❌ Not displayed | Need UI in patient detail |
| `patient_consents` | 0 | ❌ Not displayed | Need consent tracking UI |
| `appointments` | 22 | ⚠️ Calendar reads | Create/edit/DnD needed |
| `appointment_types_config` | 8 | ✅ Used in form dropdowns | 8 types configured |
| `chairs` | 3 | ✅ Used in calendar | 3 chairs configured |
| `working_hours` | 14 | ⚠️ Settings reads | Edit UI needed |
| `treatment_types` | 13 | ✅ Used in treatment plan | Catalogue reference |
| `treatments` | 0 | ❌ No records | Need visit recording flow |
| `treatment_plans` | 10 | ✅ Kezelés page | Editable list done |
| `treatment_plan_items` | 10 | ✅ Kezelés page | Linked to plans |
| `dental_chart` | 10 | ⚠️ Display only | Need interactive editing |
| `dental_chart_history` | 0 | ❌ Not used | Need change tracking |
| `invoices` | 15 | ⚠️ Read-only list | Creation flow needed |
| `invoice_items` | 0 | ❌ Not displayed | Need line items in invoice form |
| `payments` | 12 | ⚠️ Used in finance stats | Record payment UI needed |
| `cash_register_sessions` | 0 | ❌ Not used | Need open/close session flow |
| `price_list` | 13 | ❌ Not managed | Need management UI |
| `nav_config` | 0 | ⚠️ Settings form | Save + test needed |
| `eeszt_config` | 0 | ⚠️ Settings form | Save + test needed |
| `eeszt_submissions` | 0 | ❌ Not used | Need auto-submit on visit |
| `leads` | 12 | ✅ CRM Kanban + Pipeline | Create/detail needed |
| `lead_activities` | 15 | ⚠️ Not displayed | Need timeline in lead detail |
| `lead_tasks` | 0 | ❌ Not used | Need task management |
| `lead_scoring_rules` | 9 | ❌ Not applied | Need auto-scoring engine |
| `message_templates` | 0 | ❌ Not used | Need template CRUD |
| `automation_campaigns` | 0 | ❌ Not used | Need to persist toggle states |
| `automation_steps` | 0 | ❌ Not used | Linked to campaigns |
| `partner_agencies` | 0 | ❌ Not managed | Need CRUD UI |
| `travel_partners` | 0 | ❌ Not managed | Need CRUD UI |
| `international_patient_details` | 0 | ❌ Not used | Need in tourism flow |
| `patient_travel_details` | 3 | ⚠️ Display only | Need CRUD UI |
| `treatment_packages` | 4 | ✅ Displayed | Need in quote builder |
| `online_consultations` | 8 | ⚠️ Display only | Need detail/edit drawer |
| `international_quotes` | 0 | ❌ Not created | Need quote builder |
| `international_quote_items` | 0 | ❌ Not created | Need line items |
| `patient_aftercare` | 3 | ⚠️ Display only | Need checkin management |
| `aftercare_checkins` | 0 | ❌ Not used | Need checkin CRUD |
| `kpi_definitions` | 0 | ❌ Not used | Future KPI tracking |
| `kpi_values` | 0 | ❌ Not used | Future KPI tracking |
| `saved_reports` | 0 | ❌ Not used | Need save report flow |
| `audit_log` | 0 | ⚠️ Display only | Need Postgres trigger |
| `role_permissions` | 55 | ⚠️ Display only | Need enforcement |

---

## Edge Function Status

| Function | Purpose | Wired? |
|---|---|---|
| `create-test-user` | Demo user creation | ✅ Used at setup |
| `nav-invoice` | Submit invoice to Hungarian NAV | ⚠️ Deployed, not called from UI |
| `nav-status-check` | Check NAV status | ⚠️ Deployed, not called from UI |
| `eeszt-ambulanslap` | Submit ambuláns lap to EESZT | ⚠️ Deployed, not called from UI |
| `eeszt-torzslap` | Submit törzslap to EESZT | ⚠️ Deployed, not called from UI |
| `eeszt-integration` | EESZT connection test | ⚠️ Deployed, not called from UI |
| `voxis-webhook` | Voice AI transcript receiver | ⚠️ Deployed, not called from UI |
| `appointment-reminders` | Send SMS/email reminders | ⚠️ Deployed, no cron trigger |
| `gdpr-export` | Export patient data (GDPR) | ⚠️ Deployed, not called from UI |

---

## Priority Recommendation

| Priority | Phase | Impact | Effort |
|---|---|---|---|
| 🔴 P0 | Phase 1 (Patient + Appointment) | Core workflow | Medium |
| 🔴 P0 | Phase 3.1 (Invoice Creation) | Revenue critical | Medium |
| 🟠 P1 | Phase 2.1 (Treatment Session) | Doctor workflow | High |
| 🟠 P1 | Phase 4.1 (Lead CRUD) | Sales workflow | Medium |
| 🟡 P2 | Phase 2.2 (Dental Chart) | Clinical quality | High |
| 🟡 P2 | Phase 7.2 (Permissions) | Security | Medium |
| 🟢 P3 | Phase 5 (Dental Tourism) | Revenue expansion | High |
| 🟢 P3 | Phase 6 (Reports Export) | Business intelligence | Low |
| 🟢 P3 | Phase 8 (Cross-cutting) | UX polish | Medium |
| ⚪ P4 | Phase 9 (Polish) | Production readiness | Medium |
