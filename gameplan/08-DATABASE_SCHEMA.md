# MOLaiRE - Complete Database Schema

## Overview

This document contains the complete, consolidated database schema for the MOLaiRE dental software. All tables are designed for PostgreSQL 15+ with Supabase.

## Schema Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    patients     │────▶│  appointments   │◀────│     staff       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐     ┌─────────────────┐              │
│  dental_chart   │     │   treatments    │◀─────────────┘
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    invoices     │────▶│    payments     │
                        └─────────────────┘     └─────────────────┘
                        
┌─────────────────┐     ┌─────────────────┐
│     leads       │────▶│ lead_activities │
└─────────────────┘     └─────────────────┘
```

## 1. Core Tables

### 1.1 locations

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(200) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  
  -- Address
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_postal_code VARCHAR(10) NOT NULL,
  address_country VARCHAR(2) DEFAULT 'HU',
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Business
  tax_number VARCHAR(13), -- Hungarian format: 12345678-2-42
  company_name VARCHAR(200),
  
  -- Settings
  timezone VARCHAR(50) DEFAULT 'Europe/Budapest',
  currency VARCHAR(3) DEFAULT 'HUF',
  
  -- Working hours (default)
  default_opening_time TIME DEFAULT '08:00',
  default_closing_time TIME DEFAULT '20:00',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 staff

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth link
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
  
  -- Personal
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  
  -- Employment
  role VARCHAR(30) NOT NULL,
  -- Roles: super_admin, clinic_admin, doctor, receptionist, hygienist, 
  --        assistant, accountant, marketing, dt_coordinator
  
  title VARCHAR(100), -- Dr., etc.
  specialization VARCHAR(100),
  license_number VARCHAR(50),
  
  -- Location
  primary_location_id UUID REFERENCES locations(id),
  
  -- Schedule
  working_hours JSONB,
  -- {"monday": {"start": "08:00", "end": "16:00"}, ...}
  
  -- Display
  avatar_url TEXT,
  color VARCHAR(7), -- Calendar color
  
  -- Commission (for doctors)
  commission_type VARCHAR(20), -- percentage, fixed
  commission_rate DECIMAL(5, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  employment_start_date DATE,
  employment_end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_location ON staff(primary_location_id);
```

### 1.3 patients

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR(10), -- male, female, other
  
  -- Hungarian Identifiers
  taj_number VARCHAR(9), -- Social Security Number (TAJ)
  tax_id VARCHAR(10),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20),
  phone_secondary VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_postal_code VARCHAR(10),
  address_country VARCHAR(2) DEFAULT 'HU',
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  
  -- Preferences
  preferred_language VARCHAR(2) DEFAULT 'hu',
  preferred_doctor_id UUID REFERENCES staff(id),
  preferred_contact_method VARCHAR(20) DEFAULT 'phone',
  
  -- Marketing
  marketing_consent BOOLEAN DEFAULT FALSE,
  marketing_consent_date TIMESTAMPTZ,
  referral_source VARCHAR(50),
  referral_patient_id UUID REFERENCES patients(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, deceased
  is_vip BOOLEAN DEFAULT FALSE,
  
  -- Notes
  internal_notes TEXT,
  
  -- Photo
  avatar_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id),
  
  CONSTRAINT valid_taj CHECK (taj_number IS NULL OR taj_number ~ '^\d{9}$')
);

-- Indexes
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_taj ON patients(taj_number) WHERE taj_number IS NOT NULL;
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_patients_search ON patients USING gin(
  to_tsvector('hungarian', coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
);
```

### 1.4 patient_medical_history

```sql
CREATE TABLE patient_medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL UNIQUE,
  
  -- Medical Conditions
  conditions JSONB DEFAULT '[]',
  
  -- Allergies
  allergies JSONB DEFAULT '[]',
  
  -- Medications
  current_medications JSONB DEFAULT '[]',
  
  -- Risk Factors
  is_smoker BOOLEAN DEFAULT FALSE,
  smoking_details VARCHAR(100),
  alcohol_consumption VARCHAR(50),
  
  -- Dental Specific
  has_dental_anxiety BOOLEAN DEFAULT FALSE,
  anxiety_level INT,
  previous_dental_trauma BOOLEAN DEFAULT FALSE,
  trauma_details TEXT,
  
  -- Bleeding/Coagulation
  bleeding_disorder BOOLEAN DEFAULT FALSE,
  on_blood_thinners BOOLEAN DEFAULT FALSE,
  blood_thinner_details VARCHAR(200),
  
  -- Cardiovascular
  heart_condition BOOLEAN DEFAULT FALSE,
  heart_condition_details TEXT,
  has_pacemaker BOOLEAN DEFAULT FALSE,
  
  -- Other
  pregnant BOOLEAN DEFAULT FALSE,
  pregnancy_week INT,
  breastfeeding BOOLEAN DEFAULT FALSE,
  
  -- Infectious
  hepatitis BOOLEAN DEFAULT FALSE,
  hepatitis_type VARCHAR(5),
  hiv_positive BOOLEAN DEFAULT FALSE,
  
  -- Review
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES staff(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2. Calendar & Appointments

### 2.1 chairs

```sql
CREATE TABLE chairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  location_id UUID REFERENCES locations(id) NOT NULL,
  
  name VARCHAR(50) NOT NULL,
  code VARCHAR(10) NOT NULL,
  
  chair_type VARCHAR(30) DEFAULT 'standard',
  color VARCHAR(7) DEFAULT '#3B82F6',
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_id, code)
);
```

### 2.2 appointment_types_config

```sql
CREATE TABLE appointment_types_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  
  color VARCHAR(7) NOT NULL,
  icon VARCHAR(30),
  
  default_duration_minutes INT NOT NULL DEFAULT 30,
  min_duration_minutes INT DEFAULT 15,
  max_duration_minutes INT DEFAULT 180,
  
  requires_confirmation BOOLEAN DEFAULT TRUE,
  allow_online_booking BOOLEAN DEFAULT FALSE,
  buffer_before_minutes INT DEFAULT 0,
  buffer_after_minutes INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 appointments

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  patient_id UUID REFERENCES patients(id) NOT NULL,
  doctor_id UUID REFERENCES staff(id) NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  chair_id UUID REFERENCES chairs(id),
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  appointment_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  -- scheduled, confirmed, arrived, in_progress, completed, no_show, cancelled
  
  treatment_type_id UUID REFERENCES treatment_types(id),
  treatment_notes TEXT,
  
  booked_by UUID REFERENCES staff(id),
  booking_source VARCHAR(30) DEFAULT 'reception',
  
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  confirmation_received BOOLEAN DEFAULT FALSE,
  
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES staff(id),
  cancellation_reason TEXT,
  
  internal_notes TEXT,
  patient_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_time ON appointments(start_time, end_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(DATE(start_time));
```

### 2.4 working_hours

```sql
CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  doctor_id UUID REFERENCES staff(id),
  chair_id UUID REFERENCES chairs(id),
  location_id UUID REFERENCES locations(id),
  
  day_of_week INT NOT NULL,
  
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  break_start TIME,
  break_end TIME,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  override_date DATE,
  is_holiday BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6)
);
```

## 3. Clinical Records

### 3.1 treatment_types

```sql
CREATE TABLE treatment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  
  category VARCHAR(50) NOT NULL,
  
  oeno_code VARCHAR(10),
  
  base_price DECIMAL(12, 2),
  estimated_duration_minutes INT DEFAULT 30,
  
  requires_xray BOOLEAN DEFAULT FALSE,
  requires_anesthesia BOOLEAN DEFAULT FALSE,
  tooth_specific BOOLEAN DEFAULT TRUE,
  
  health_fund_eligible BOOLEAN DEFAULT FALSE,
  health_fund_code VARCHAR(20),
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 dental_chart

```sql
CREATE TABLE dental_chart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  
  tooth_number VARCHAR(2) NOT NULL,
  
  status VARCHAR(30) NOT NULL DEFAULT 'healthy',
  surfaces VARCHAR(10),
  
  mobility INT,
  percussion_sensitive BOOLEAN DEFAULT FALSE,
  periapical_lesion BOOLEAN DEFAULT FALSE,
  gum_recession_mm INT,
  pocket_depth_mm INT,
  
  prosthetic_type VARCHAR(30),
  prosthetic_material VARCHAR(50),
  prosthetic_shade VARCHAR(20),
  
  implant_system VARCHAR(100),
  implant_diameter DECIMAL(3,1),
  implant_length DECIMAL(3,1),
  implant_date DATE,
  
  notes TEXT,
  
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES staff(id),
  
  UNIQUE(patient_id, tooth_number)
);

CREATE INDEX idx_dental_chart_patient ON dental_chart(patient_id);
```

### 3.3 dental_chart_history

```sql
CREATE TABLE dental_chart_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  dental_chart_id UUID REFERENCES dental_chart(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  tooth_number VARCHAR(2) NOT NULL,
  
  previous_status VARCHAR(30),
  previous_surfaces VARCHAR(10),
  previous_data JSONB,
  
  new_status VARCHAR(30),
  new_surfaces VARCHAR(10),
  new_data JSONB,
  
  change_reason TEXT,
  treatment_id UUID REFERENCES treatments(id),
  
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES staff(id)
);
```

### 3.4 treatments

```sql
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  patient_id UUID REFERENCES patients(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  doctor_id UUID REFERENCES staff(id) NOT NULL,
  
  treatment_type_id UUID REFERENCES treatment_types(id) NOT NULL,
  tooth_numbers VARCHAR(50)[],
  
  diagnosis TEXT,
  procedure_notes TEXT,
  materials_used JSONB,
  
  oeno_code VARCHAR(10),
  bno_code VARCHAR(10),
  
  list_price DECIMAL(12, 2),
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  final_price DECIMAL(12, 2),
  
  status VARCHAR(20) DEFAULT 'completed',
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_treatments_patient ON treatments(patient_id);
CREATE INDEX idx_treatments_doctor ON treatments(doctor_id);
CREATE INDEX idx_treatments_date ON treatments(created_at DESC);
```

## 4. Billing & Payments

### 4.1 invoices

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  invoice_type VARCHAR(20) NOT NULL DEFAULT 'normal',
  
  patient_id UUID REFERENCES patients(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  original_invoice_id UUID REFERENCES invoices(id),
  
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date DATE NOT NULL,
  fulfillment_date DATE NOT NULL,
  
  net_amount DECIMAL(12, 2) NOT NULL,
  vat_amount DECIMAL(12, 2) NOT NULL,
  gross_amount DECIMAL(12, 2) NOT NULL,
  
  currency VARCHAR(3) DEFAULT 'HUF',
  exchange_rate DECIMAL(10, 4) DEFAULT 1.0,
  
  vat_breakdown JSONB,
  
  payment_method VARCHAR(30),
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  
  health_fund_type VARCHAR(50),
  health_fund_amount DECIMAL(12, 2),
  
  nav_status VARCHAR(30) DEFAULT 'pending',
  nav_transaction_id VARCHAR(100),
  nav_invoice_data_hash VARCHAR(64),
  nav_submitted_at TIMESTAMPTZ,
  nav_response JSONB,
  
  location_id UUID REFERENCES locations(id),
  issued_by UUID REFERENCES staff(id),
  
  discount_type VARCHAR(20),
  discount_value DECIMAL(10, 2),
  discount_reason TEXT,
  
  internal_notes TEXT,
  customer_notes TEXT,
  
  status VARCHAR(20) DEFAULT 'draft',
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_amounts CHECK (gross_amount = net_amount + vat_amount)
);

CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(issued_at DESC);
CREATE INDEX idx_invoices_nav_status ON invoices(nav_status) WHERE nav_status != 'accepted';
```

### 4.2 invoice_items

```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  treatment_type_id UUID REFERENCES treatment_types(id),
  description VARCHAR(500) NOT NULL,
  
  oeno_code VARCHAR(10),
  
  quantity DECIMAL(8, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'db',
  
  unit_price DECIMAL(12, 2) NOT NULL,
  net_amount DECIMAL(12, 2) NOT NULL,
  
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 27.00,
  vat_amount DECIMAL(12, 2) NOT NULL,
  gross_amount DECIMAL(12, 2) NOT NULL,
  
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  
  treatment_id UUID REFERENCES treatments(id),
  tooth_numbers TEXT[],
  
  line_number INT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'HUF',
  
  payment_method VARCHAR(30) NOT NULL,
  
  card_last_four VARCHAR(4),
  card_type VARCHAR(20),
  terminal_id VARCHAR(50),
  transaction_id VARCHAR(100),
  
  bank_reference VARCHAR(100),
  
  health_fund_name VARCHAR(100),
  health_fund_reference VARCHAR(100),
  
  cash_register_session_id UUID REFERENCES cash_register_sessions(id),
  
  status VARCHAR(20) DEFAULT 'completed',
  
  notes TEXT,
  
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(received_at DESC);
```

### 4.4 cash_register_sessions

```sql
CREATE TABLE cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  location_id UUID REFERENCES locations(id) NOT NULL,
  
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  opening_cash_balance DECIMAL(12, 2) NOT NULL,
  closing_cash_balance DECIMAL(12, 2),
  expected_cash_balance DECIMAL(12, 2),
  
  total_cash_in DECIMAL(12, 2) DEFAULT 0,
  total_cash_out DECIMAL(12, 2) DEFAULT 0,
  total_card DECIMAL(12, 2) DEFAULT 0,
  total_transfer DECIMAL(12, 2) DEFAULT 0,
  
  cash_difference DECIMAL(12, 2),
  difference_notes TEXT,
  
  opened_by UUID REFERENCES staff(id) NOT NULL,
  closed_by UUID REFERENCES staff(id),
  
  status VARCHAR(20) DEFAULT 'open',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 price_list

```sql
CREATE TABLE price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  treatment_type_id UUID REFERENCES treatment_types(id) NOT NULL,
  location_id UUID REFERENCES locations(id),
  
  base_price DECIMAL(12, 2) NOT NULL,
  
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  
  price_eur DECIMAL(12, 2),
  price_gbp DECIMAL(12, 2),
  
  health_fund_price DECIMAL(12, 2),
  health_fund_eligible BOOLEAN DEFAULT FALSE,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(treatment_type_id, location_id, valid_from)
);
```

### 4.6 nav_config

```sql
CREATE TABLE nav_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  location_id UUID REFERENCES locations(id) NOT NULL UNIQUE,
  
  technical_user VARCHAR(100) NOT NULL,
  technical_user_password_encrypted TEXT NOT NULL,
  signature_key_encrypted TEXT NOT NULL,
  exchange_key_encrypted TEXT NOT NULL,
  
  tax_number VARCHAR(13) NOT NULL,
  
  is_production BOOLEAN DEFAULT FALSE,
  auto_submit BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5. CRM & Leads

### 5.1 leads

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  source VARCHAR(50) NOT NULL,
  source_detail VARCHAR(200),
  source_url TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  
  location_id UUID REFERENCES locations(id),
  assigned_to UUID REFERENCES staff(id),
  assigned_at TIMESTAMPTZ,
  
  pipeline_stage VARCHAR(30) DEFAULT 'new',
  pipeline_stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  interested_in TEXT[],
  budget_range VARCHAR(30),
  urgency VARCHAR(20),
  
  lead_score INT DEFAULT 0,
  score_category VARCHAR(10),
  
  converted_at TIMESTAMPTZ,
  converted_to_patient_id UUID REFERENCES patients(id),
  estimated_value DECIMAL(12, 2),
  actual_value DECIMAL(12, 2),
  
  lost_at TIMESTAMPTZ,
  lost_reason VARCHAR(50),
  lost_reason_detail TEXT,
  
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  contact_attempts INT DEFAULT 0,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_leads_stage ON leads(pipeline_stage);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_follow_up ON leads(next_follow_up_at) 
  WHERE next_follow_up_at IS NOT NULL AND pipeline_stage NOT IN ('won', 'lost');
```

### 5.2 lead_activities

```sql
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID REFERENCES leads(id) NOT NULL,
  
  activity_type VARCHAR(30) NOT NULL,
  
  subject VARCHAR(200),
  content TEXT,
  
  channel VARCHAR(20),
  direction VARCHAR(10),
  
  from_stage VARCHAR(30),
  to_stage VARCHAR(30),
  
  score_change INT,
  score_reason VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);
```

### 5.3 lead_tasks

```sql
CREATE TABLE lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID REFERENCES leads(id) NOT NULL,
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  task_type VARCHAR(30) DEFAULT 'follow_up',
  
  due_date TIMESTAMPTZ NOT NULL,
  
  assigned_to UUID REFERENCES staff(id),
  
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES staff(id),
  
  priority VARCHAR(10) DEFAULT 'normal',
  
  reminder_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_lead_tasks_due ON lead_tasks(due_date) WHERE status = 'pending';
```

### 5.4 lead_scoring_rules

```sql
CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  trigger_type VARCHAR(30) NOT NULL,
  trigger_condition JSONB NOT NULL,
  
  score_change INT NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  apply_once BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 message_templates

```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  template_type VARCHAR(30) NOT NULL,
  
  subject VARCHAR(200),
  body TEXT NOT NULL,
  
  language VARCHAR(2) DEFAULT 'hu',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6. Dental Tourism

### 6.1 international_patient_details

```sql
CREATE TABLE international_patient_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL UNIQUE,
  
  country_code VARCHAR(2) NOT NULL,
  preferred_language VARCHAR(2) DEFAULT 'en',
  timezone VARCHAR(50),
  
  whatsapp_number VARCHAR(20),
  preferred_contact_channel VARCHAR(20) DEFAULT 'email',
  
  passport_number VARCHAR(50),
  passport_expiry DATE,
  
  preferred_currency VARCHAR(3) DEFAULT 'EUR',
  
  referral_source VARCHAR(50),
  referral_agency_id UUID REFERENCES travel_partners(id),
  
  total_visits INT DEFAULT 0,
  total_spend_eur DECIMAL(12, 2) DEFAULT 0,
  first_visit_date DATE,
  last_visit_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 travel_partners

```sql
CREATE TABLE travel_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  partner_type VARCHAR(20) NOT NULL,
  
  name VARCHAR(200) NOT NULL,
  
  contact_person VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  
  commission_type VARCHAR(20),
  commission_value DECIMAL(8, 2),
  
  booking_url TEXT,
  booking_email VARCHAR(255),
  
  is_preferred BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 patient_travel_details

```sql
CREATE TABLE patient_travel_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  
  trip_reference VARCHAR(20) NOT NULL UNIQUE,
  
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  
  arrival_flight_number VARCHAR(20),
  arrival_time TIME,
  arrival_airport VARCHAR(10) DEFAULT 'BUD',
  departure_flight_number VARCHAR(20),
  departure_time TIME,
  
  hotel_id UUID REFERENCES travel_partners(id),
  hotel_booking_reference VARCHAR(50),
  hotel_check_in DATE,
  hotel_check_out DATE,
  room_type VARCHAR(50),
  
  arrival_transfer_booked BOOLEAN DEFAULT FALSE,
  arrival_transfer_partner_id UUID REFERENCES travel_partners(id),
  departure_transfer_booked BOOLEAN DEFAULT FALSE,
  departure_transfer_partner_id UUID REFERENCES travel_partners(id),
  
  number_of_companions INT DEFAULT 0,
  companion_details JSONB,
  
  interpreter_required BOOLEAN DEFAULT FALSE,
  interpreter_language VARCHAR(2),
  
  status VARCHAR(20) DEFAULT 'planned',
  
  special_requirements TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 treatment_packages

```sql
CREATE TABLE treatment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(20) NOT NULL UNIQUE,
  
  name_en VARCHAR(200) NOT NULL,
  name_de VARCHAR(200),
  name_hu VARCHAR(200),
  
  description_en TEXT,
  description_de TEXT,
  description_hu TEXT,
  
  price_eur DECIMAL(12, 2) NOT NULL,
  price_gbp DECIMAL(12, 2),
  price_chf DECIMAL(12, 2),
  
  uk_comparison_price DECIMAL(12, 2),
  savings_percentage DECIMAL(5, 2),
  
  includes JSONB NOT NULL,
  
  typical_visits INT DEFAULT 2,
  typical_days INT DEFAULT 5,
  
  guarantee_months INT,
  guarantee_terms TEXT,
  
  available_addons JSONB,
  
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.5 online_consultations

```sql
CREATE TABLE online_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  request_reference VARCHAR(20) NOT NULL UNIQUE,
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  country_code VARCHAR(2) NOT NULL,
  
  primary_concern TEXT NOT NULL,
  additional_notes TEXT,
  
  uploaded_documents JSONB DEFAULT '[]',
  
  has_xray BOOLEAN DEFAULT FALSE,
  has_photos BOOLEAN DEFAULT FALSE,
  
  status VARCHAR(20) DEFAULT 'new',
  
  assigned_to UUID REFERENCES staff(id),
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMPTZ,
  
  quote_id UUID REFERENCES international_quotes(id),
  quote_sent_at TIMESTAMPTZ,
  quote_viewed_at TIMESTAMPTZ,
  quote_accepted_at TIMESTAMPTZ,
  
  converted_to_patient_id UUID REFERENCES patients(id),
  converted_to_lead_id UUID REFERENCES leads(id),
  
  last_contact_at TIMESTAMPTZ,
  
  source VARCHAR(50),
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  landing_page TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.6 international_quotes

```sql
CREATE TABLE international_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  quote_reference VARCHAR(20) NOT NULL UNIQUE,
  
  consultation_id UUID REFERENCES online_consultations(id),
  patient_id UUID REFERENCES patients(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until DATE NOT NULL,
  
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  exchange_rate DECIMAL(10, 4),
  exchange_rate_locked_until DATE,
  
  treatment_total DECIMAL(12, 2) NOT NULL,
  travel_total DECIMAL(12, 2) DEFAULT 0,
  grand_total DECIMAL(12, 2) NOT NULL,
  
  uk_equivalent_price DECIMAL(12, 2),
  savings_amount DECIMAL(12, 2),
  savings_percentage DECIMAL(5, 2),
  
  status VARCHAR(20) DEFAULT 'draft',
  
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  internal_notes TEXT,
  patient_message TEXT,
  
  created_by UUID REFERENCES staff(id)
);
```

## 7. Analytics

### 7.1 kpi_definitions

```sql
CREATE TABLE kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  category VARCHAR(50) NOT NULL,
  
  calculation_type VARCHAR(20) NOT NULL,
  calculation_formula TEXT,
  
  display_format VARCHAR(20) DEFAULT 'number',
  decimal_places INT DEFAULT 0,
  currency VARCHAR(3),
  
  comparison_type VARCHAR(20),
  good_direction VARCHAR(10),
  
  warning_threshold DECIMAL(15, 2),
  critical_threshold DECIMAL(15, 2),
  
  visible_to_roles TEXT[],
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 kpi_values

```sql
CREATE TABLE kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  kpi_id UUID REFERENCES kpi_definitions(id) NOT NULL,
  
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  location_id UUID REFERENCES locations(id),
  doctor_id UUID REFERENCES staff(id),
  
  value DECIMAL(15, 2) NOT NULL,
  previous_value DECIMAL(15, 2),
  target_value DECIMAL(15, 2),
  
  change_absolute DECIMAL(15, 2),
  change_percentage DECIMAL(8, 2),
  
  status VARCHAR(20),
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(kpi_id, period_type, period_start, location_id, doctor_id)
);
```

### 7.3 saved_reports

```sql
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  report_type VARCHAR(30) NOT NULL,
  data_sources TEXT[] NOT NULL,
  columns JSONB NOT NULL,
  filters JSONB,
  grouping JSONB,
  sorting JSONB,
  aggregations JSONB,
  
  chart_type VARCHAR(30),
  chart_config JSONB,
  
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron VARCHAR(100),
  schedule_recipients TEXT[],
  schedule_format VARCHAR(20),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  is_public BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 8. System Tables

### 8.1 audit_log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_date ON audit_log(changed_at DESC);
```

### 8.2 system_settings

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  
  category VARCHAR(50),
  is_sensitive BOOLEAN DEFAULT FALSE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
```

## 9. Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on multi-tenant needs)
CREATE POLICY "Authenticated users can read patients"
ON patients FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert patients"
ON patients FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update patients"
ON patients FOR UPDATE
USING (auth.role() = 'authenticated');
```

## 10. Migration Order

Execute migrations in this order to respect foreign key dependencies:

1. `locations`
2. `staff`
3. `patients`
4. `patient_medical_history`
5. `chairs`
6. `appointment_types_config`
7. `treatment_types`
8. `appointments`
9. `dental_chart`
10. `dental_chart_history`
11. `treatments`
12. `invoices`
13. `invoice_items`
14. `payments`
15. `cash_register_sessions`
16. `price_list`
17. `nav_config`
18. `leads`
19. `lead_activities`
20. `lead_tasks`
21. `lead_scoring_rules`
22. `message_templates`
23. `travel_partners`
24. `international_patient_details`
25. `patient_travel_details`
26. `treatment_packages`
27. `online_consultations`
28. `international_quotes`
29. `kpi_definitions`
30. `kpi_values`
31. `saved_reports`
32. `audit_log`
33. `system_settings`

---

**Next**: Proceed to [09-API_ENDPOINTS.md](./09-API_ENDPOINTS.md) for REST API reference.
