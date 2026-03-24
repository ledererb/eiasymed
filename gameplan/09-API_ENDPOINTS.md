# MOLaiRE - API Endpoints Reference

## Overview

MOLaiRE uses Supabase which provides auto-generated REST APIs via PostgREST. Custom business logic is implemented via Supabase Edge Functions.

## Base URLs

```
REST API: https://<project>.supabase.co/rest/v1
Edge Functions: https://<project>.supabase.co/functions/v1
Realtime: wss://<project>.supabase.co/realtime/v1
```

## Authentication

All requests require JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

## REST API Conventions

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `select` | Columns to return | `select=id,name,email` |
| `order` | Sort order | `order=created_at.desc` |
| `limit` | Max rows | `limit=10` |
| `offset` | Skip rows | `offset=20` |
| `eq` | Equal | `status=eq.active` |
| `neq` | Not equal | `status=neq.cancelled` |
| `gt/gte` | Greater than | `amount=gt.1000` |
| `lt/lte` | Less than | `created_at=lt.2026-01-01` |
| `like` | Pattern match | `name=like.*Smith*` |
| `ilike` | Case-insensitive | `email=ilike.*@gmail.com` |
| `in` | In list | `status=in.(active,pending)` |
| `is` | IS NULL | `deleted_at=is.null` |

### Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No content (successful delete) |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |

---

## 1. Patients API

### List Patients

```http
GET /rest/v1/patients?select=*&order=last_name.asc&limit=50
```

**Query Examples:**
```http
# Search by name
GET /rest/v1/patients?or=(first_name.ilike.*john*,last_name.ilike.*john*)

# Filter by status
GET /rest/v1/patients?status=eq.active

# With related data
GET /rest/v1/patients?select=*,preferred_doctor:staff(id,first_name,last_name)
```

### Get Patient

```http
GET /rest/v1/patients?id=eq.<uuid>&select=*,
  medical_history:patient_medical_history(*),
  dental_chart:dental_chart(*),
  appointments(id,start_time,status)
```

### Create Patient

```http
POST /rest/v1/patients
Content-Type: application/json
Prefer: return=representation

{
  "first_name": "János",
  "last_name": "Kovács",
  "birth_date": "1985-03-15",
  "phone": "+36301234567",
  "email": "janos.kovacs@email.hu",
  "taj_number": "123456789"
}
```

### Update Patient

```http
PATCH /rest/v1/patients?id=eq.<uuid>
Content-Type: application/json
Prefer: return=representation

{
  "phone": "+36309876543",
  "address_city": "Budapest"
}
```

### Delete Patient (Soft)

```http
PATCH /rest/v1/patients?id=eq.<uuid>
Content-Type: application/json

{
  "status": "inactive"
}
```

---

## 2. Appointments API

### List Appointments

```http
GET /rest/v1/appointments?select=*,
  patient:patients(id,first_name,last_name,phone),
  doctor:staff!doctor_id(id,first_name,last_name),
  chair:chairs(id,name,color)
&start_time=gte.<start_date>
&start_time=lte.<end_date>
&status=neq.cancelled
&order=start_time.asc
```

### Get Appointment

```http
GET /rest/v1/appointments?id=eq.<uuid>&select=*,
  patient:patients(*),
  doctor:staff!doctor_id(*),
  chair:chairs(*),
  treatments(*)
```

### Create Appointment

```http
POST /rest/v1/appointments
Content-Type: application/json
Prefer: return=representation

{
  "patient_id": "<uuid>",
  "doctor_id": "<uuid>",
  "location_id": "<uuid>",
  "chair_id": "<uuid>",
  "start_time": "2026-03-25T10:00:00+01:00",
  "end_time": "2026-03-25T10:30:00+01:00",
  "appointment_type": "treatment",
  "internal_notes": "Visszatérő páciens, érzékeny fogíny"
}
```

### Update Appointment

```http
PATCH /rest/v1/appointments?id=eq.<uuid>
Content-Type: application/json

{
  "status": "confirmed",
  "confirmation_received": true
}
```

### Reschedule Appointment

```http
PATCH /rest/v1/appointments?id=eq.<uuid>
Content-Type: application/json

{
  "start_time": "2026-03-26T14:00:00+01:00",
  "end_time": "2026-03-26T14:30:00+01:00"
}
```

### Cancel Appointment

```http
PATCH /rest/v1/appointments?id=eq.<uuid>
Content-Type: application/json

{
  "status": "cancelled",
  "cancelled_at": "2026-03-24T12:00:00Z",
  "cancellation_reason": "Páciens lemondta"
}
```

---

## 3. Dental Chart API

### Get Patient Dental Chart

```http
GET /rest/v1/dental_chart?patient_id=eq.<uuid>&select=*
```

### Update Tooth

```http
PATCH /rest/v1/dental_chart?patient_id=eq.<uuid>&tooth_number=eq.17
Content-Type: application/json

{
  "status": "filled",
  "surfaces": "MOD",
  "notes": "Kompozit tömés",
  "updated_by": "<staff_uuid>"
}
```

### Upsert Tooth (Create or Update)

```http
POST /rest/v1/dental_chart
Content-Type: application/json
Prefer: resolution=merge-duplicates

{
  "patient_id": "<uuid>",
  "tooth_number": "17",
  "status": "caries",
  "surfaces": "MO"
}
```

### Get Tooth History

```http
GET /rest/v1/dental_chart_history?patient_id=eq.<uuid>&tooth_number=eq.17
&select=*,changed_by:staff(first_name,last_name)
&order=changed_at.desc
```

---

## 4. Treatments API

### List Patient Treatments

```http
GET /rest/v1/treatments?patient_id=eq.<uuid>&select=*,
  treatment_type:treatment_types(name,category),
  doctor:staff!doctor_id(first_name,last_name)
&order=created_at.desc
```

### Create Treatment

```http
POST /rest/v1/treatments
Content-Type: application/json
Prefer: return=representation

{
  "patient_id": "<uuid>",
  "doctor_id": "<uuid>",
  "appointment_id": "<uuid>",
  "treatment_type_id": "<uuid>",
  "tooth_numbers": ["17", "18"],
  "diagnosis": "Szuvasodás, MOD",
  "procedure_notes": "Kompozit tömés készült",
  "final_price": 25000,
  "status": "completed",
  "completed_at": "2026-03-24T11:30:00Z"
}
```

---

## 5. Invoices API

### List Invoices

```http
GET /rest/v1/invoices?select=*,
  patient:patients(first_name,last_name),
  items:invoice_items(*)
&order=issued_at.desc
&limit=50
```

### Get Invoice

```http
GET /rest/v1/invoices?id=eq.<uuid>&select=*,
  patient:patients(*),
  items:invoice_items(*),
  payments(*)
```

### Create Invoice

```http
POST /rest/v1/invoices
Content-Type: application/json
Prefer: return=representation

{
  "patient_id": "<uuid>",
  "location_id": "<uuid>",
  "invoice_type": "normal",
  "due_date": "2026-04-01",
  "fulfillment_date": "2026-03-24",
  "net_amount": 19685,
  "vat_amount": 5315,
  "gross_amount": 25000,
  "vat_breakdown": [{"rate": 27, "net": 19685, "vat": 5315, "gross": 25000}],
  "payment_method": "cash",
  "status": "draft"
}
```

### Issue Invoice (Change to Issued)

```http
PATCH /rest/v1/invoices?id=eq.<uuid>
Content-Type: application/json

{
  "status": "issued",
  "invoice_number": "MOL-2026-00001",
  "issued_at": "2026-03-24T12:00:00Z",
  "issued_by": "<staff_uuid>"
}
```

### Create Invoice Items

```http
POST /rest/v1/invoice_items
Content-Type: application/json

[
  {
    "invoice_id": "<uuid>",
    "description": "Kompozit tömés - 17",
    "quantity": 1,
    "unit_price": 25000,
    "net_amount": 19685,
    "vat_rate": 27,
    "vat_amount": 5315,
    "gross_amount": 25000,
    "line_number": 1
  }
]
```

---

## 6. Payments API

### Record Payment

```http
POST /rest/v1/payments
Content-Type: application/json
Prefer: return=representation

{
  "invoice_id": "<uuid>",
  "amount": 25000,
  "payment_method": "cash",
  "received_at": "2026-03-24T12:05:00Z",
  "processed_by": "<staff_uuid>"
}
```

### After Recording Payment - Update Invoice

```http
PATCH /rest/v1/invoices?id=eq.<uuid>
Content-Type: application/json

{
  "paid_amount": 25000,
  "payment_status": "paid"
}
```

---

## 7. Leads API

### List Leads

```http
GET /rest/v1/leads?select=*,
  assigned_user:staff!assigned_to(first_name,last_name)
&pipeline_stage=neq.lost
&order=lead_score.desc
```

### Get Leads by Stage

```http
GET /rest/v1/leads?pipeline_stage=eq.new
&order=created_at.desc
```

### Create Lead

```http
POST /rest/v1/leads
Content-Type: application/json
Prefer: return=representation

{
  "first_name": "Anna",
  "last_name": "Nagy",
  "email": "anna.nagy@email.hu",
  "phone": "+36201234567",
  "source": "facebook",
  "utm_campaign": "implant_march_2026",
  "interested_in": ["implant"],
  "location_id": "<uuid>"
}
```

### Update Lead Stage

```http
PATCH /rest/v1/leads?id=eq.<uuid>
Content-Type: application/json

{
  "pipeline_stage": "contacted",
  "pipeline_stage_changed_at": "2026-03-24T12:00:00Z",
  "last_contact_at": "2026-03-24T12:00:00Z"
}
```

### Log Lead Activity

```http
POST /rest/v1/lead_activities
Content-Type: application/json

{
  "lead_id": "<uuid>",
  "activity_type": "call_made",
  "channel": "phone",
  "direction": "outbound",
  "content": "Sikeres hívás, konzultáció időpont egyeztetés",
  "created_by": "<staff_uuid>"
}
```

### Convert Lead to Patient

```http
PATCH /rest/v1/leads?id=eq.<uuid>
Content-Type: application/json

{
  "pipeline_stage": "won",
  "converted_at": "2026-03-24T12:00:00Z",
  "converted_to_patient_id": "<new_patient_uuid>"
}
```

---

## 8. Edge Functions

### 8.1 NAV Invoice Submit

```http
POST /functions/v1/nav-invoice-submit
Content-Type: application/json
Authorization: Bearer <token>

{
  "invoice_id": "<uuid>"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "NAV123456789",
  "status": "RECEIVED"
}
```

### 8.2 NAV Query Status

```http
POST /functions/v1/nav-query-status
Content-Type: application/json
Authorization: Bearer <token>

{
  "transaction_id": "NAV123456789"
}
```

### 8.3 Send Appointment Reminder

```http
POST /functions/v1/send-reminder
Content-Type: application/json
Authorization: Bearer <token>

{
  "appointment_id": "<uuid>",
  "channel": "sms"
}
```

### 8.4 Voxis Transcription

```http
POST /functions/v1/voxis-transcribe
Content-Type: multipart/form-data
Authorization: Bearer <token>

audio: <binary>
patient_id: <uuid>
```

**Response:**
```json
{
  "raw_text": "A tizenhetes fogon MOD szuvasodás...",
  "structured_data": [
    {
      "tooth_number": "17",
      "status": "caries",
      "surfaces": "MOD"
    }
  ],
  "confidence": 0.95
}
```

### 8.5 Visibill Auto-Invoice

```http
POST /functions/v1/visibill-generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "treatment_id": "<uuid>"
}
```

**Response:**
```json
{
  "draft_invoice_id": "<uuid>",
  "items": [...],
  "total": 45000,
  "confidence": 0.88,
  "needs_review": true
}
```

### 8.6 Check Availability

```http
POST /functions/v1/check-availability
Content-Type: application/json
Authorization: Bearer <token>

{
  "doctor_id": "<uuid>",
  "date": "2026-03-25",
  "duration_minutes": 30
}
```

**Response:**
```json
{
  "available_slots": [
    {"start": "2026-03-25T09:00:00", "end": "2026-03-25T09:30:00"},
    {"start": "2026-03-25T10:30:00", "end": "2026-03-25T11:00:00"},
    {"start": "2026-03-25T14:00:00", "end": "2026-03-25T14:30:00"}
  ]
}
```

### 8.7 Generate Quote PDF

```http
POST /functions/v1/generate-quote-pdf
Content-Type: application/json
Authorization: Bearer <token>

{
  "quote_id": "<uuid>",
  "language": "en"
}
```

**Response:**
```json
{
  "pdf_url": "https://storage.../quotes/Q-2026-00001.pdf",
  "expires_at": "2026-03-25T12:00:00Z"
}
```

### 8.8 Calculate Lead Score

```http
POST /functions/v1/calculate-lead-score
Content-Type: application/json
Authorization: Bearer <token>

{
  "lead_id": "<uuid>"
}
```

**Response:**
```json
{
  "previous_score": 45,
  "new_score": 65,
  "category": "warm",
  "changes": [
    {"rule": "Email megnyitva", "change": 10},
    {"rule": "Ajánlás forrás", "change": 10}
  ]
}
```

---

## 9. Realtime Subscriptions

### Subscribe to Appointments

```typescript
const channel = supabase
  .channel('appointments-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `start_time=gte.${todayStart}&start_time=lte.${todayEnd}`
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### Subscribe to Lead Updates

```typescript
const channel = supabase
  .channel('leads-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'leads',
      filter: `assigned_to=eq.${currentUserId}`
    },
    handleLeadUpdate
  )
  .subscribe()
```

---

## 10. Webhook Endpoints

### n8n Webhook for Lead Creation

```
POST https://n8n.thinkaikontir.hu/webhook/molaire-lead-created
Content-Type: application/json

{
  "lead_id": "<uuid>",
  "source": "facebook",
  "name": "János Kovács",
  "phone": "+36201234567"
}
```

### n8n Webhook for Appointment Reminder

```
POST https://n8n.thinkaikontir.hu/webhook/molaire-send-reminder
Content-Type: application/json

{
  "appointment_id": "<uuid>",
  "patient_phone": "+36201234567",
  "appointment_time": "2026-03-25T10:00:00"
}
```

---

## 11. Error Responses

### Standard Error Format

```json
{
  "code": "PGRST116",
  "message": "Record not found",
  "details": null,
  "hint": null
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| PGRST116 | Record not found |
| 23505 | Unique violation (duplicate) |
| 23503 | Foreign key violation |
| 42501 | Insufficient privileges (RLS) |

---

**Next**: Proceed to [10-INTEGRATION_WORKFLOWS.md](./10-INTEGRATION_WORKFLOWS.md) for n8n automation workflows.
