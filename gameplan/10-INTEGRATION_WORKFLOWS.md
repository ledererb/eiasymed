# MOLaiRE - Integration Workflows

## Overview

All automation workflows run on n8n (self-hosted at n8n.thinkaikontir.hu). This document provides complete workflow definitions for all integrations.

## Workflow Naming Convention

```
{Module}_{Action}_{Trigger}
```

Examples:
- `Calendar_Reminder_Daily`
- `CRM_LeadAssignment_Webhook`
- `Billing_NAVSubmit_OnIssue`

---

## 1. Calendar Workflows

### 1.1 Appointment Reminder (24h)

```yaml
name: Calendar_Reminder_24h
description: Send SMS/Email reminders 24 hours before appointment

trigger:
  type: schedule
  cron: "0 8 * * *"  # Every day at 8:00

nodes:
  - name: Get Tomorrow's Appointments
    type: supabase
    credentials: supabase_molaire
    operation: select
    table: appointments
    query: |
      SELECT 
        a.id,
        a.start_time,
        a.appointment_type,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        p.preferred_language,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        l.name as location_name,
        l.address_street as location_address
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN staff d ON a.doctor_id = d.id
      JOIN locations l ON a.location_id = l.id
      WHERE DATE(a.start_time) = CURRENT_DATE + INTERVAL '1 day'
        AND a.status IN ('scheduled', 'confirmed')
        AND a.reminder_sent = false

  - name: Loop Through Appointments
    type: splitInBatches
    batchSize: 1
    items: "{{ $node['Get Tomorrow\\'s Appointments'].json }}"

  - name: Format Message
    type: function
    code: |
      const apt = $input.item.json;
      const time = new Date(apt.start_time).toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const date = new Date(apt.start_time).toLocaleDateString('hu-HU');
      
      return {
        sms_message: `Tisztelt ${apt.patient_last_name} ${apt.patient_first_name}! Emlékeztetjük holnapi időpontjára: ${date} ${time}, ${apt.doctor_last_name} dr. MOLaiRE Dental. Lemondás: +36 1 234 5678`,
        email_subject: `Időpont emlékeztető - ${date}`,
        phone: apt.patient_phone,
        email: apt.patient_email
      };

  - name: Send SMS
    type: twilio
    credentials: twilio_molaire
    operation: sendSMS
    to: "{{ $node['Format Message'].json.phone }}"
    from: "+36301234567"
    body: "{{ $node['Format Message'].json.sms_message }}"

  - name: Send Email
    type: mailgun
    credentials: mailgun_molaire
    operation: send
    to: "{{ $node['Format Message'].json.email }}"
    subject: "{{ $node['Format Message'].json.email_subject }}"
    template: appointment_reminder_24h
    variables:
      patient_name: "{{ $input.item.json.patient_last_name }} {{ $input.item.json.patient_first_name }}"
      date: "{{ $input.item.json.start_time }}"
      doctor: "{{ $input.item.json.doctor_last_name }} {{ $input.item.json.doctor_first_name }}"
      location: "{{ $input.item.json.location_name }}"
      address: "{{ $input.item.json.location_address }}"

  - name: Mark Reminder Sent
    type: supabase
    operation: update
    table: appointments
    filters:
      id: "{{ $input.item.json.id }}"
    data:
      reminder_sent: true
      reminder_sent_at: "{{ $now.toISOString() }}"

  - name: Log Success
    type: supabase
    operation: insert
    table: system_logs
    data:
      type: "reminder_sent"
      entity_type: "appointment"
      entity_id: "{{ $input.item.json.id }}"
      details: "24h reminder sent via SMS and Email"
```

### 1.2 No-Show Detection

```yaml
name: Calendar_NoShowDetection_Hourly
description: Mark appointments as no-show if patient didn't arrive

trigger:
  type: schedule
  cron: "0 * * * *"  # Every hour

nodes:
  - name: Get Overdue Appointments
    type: supabase
    operation: select
    query: |
      SELECT id, patient_id, doctor_id, start_time
      FROM appointments
      WHERE status = 'scheduled'
        AND start_time < NOW() - INTERVAL '30 minutes'
        AND start_time > NOW() - INTERVAL '24 hours'

  - name: Loop Through Overdue
    type: splitInBatches
    batchSize: 1

  - name: Mark as No-Show
    type: supabase
    operation: update
    table: appointments
    filters:
      id: "{{ $input.item.json.id }}"
    data:
      status: "no_show"

  - name: Update Lead Score (if from CRM)
    type: supabase
    operation: select
    query: |
      SELECT l.id FROM leads l
      JOIN patients p ON l.converted_to_patient_id = p.id
      WHERE p.id = '{{ $input.item.json.patient_id }}'

  - name: Decrease Score
    type: httpRequest
    url: "{{ $env.SUPABASE_URL }}/functions/v1/calculate-lead-score"
    method: POST
    body:
      lead_id: "{{ $node['Update Lead Score'].json.id }}"
      event: "no_show"
    condition: "{{ $node['Update Lead Score'].json.length > 0 }}"
```

---

## 2. CRM Workflows

### 2.1 Lead Assignment

```yaml
name: CRM_LeadAssignment_OnCreate
description: Auto-assign new leads to available staff

trigger:
  type: webhook
  path: /webhook/molaire-lead-created
  method: POST

nodes:
  - name: Get Lead Data
    type: supabase
    operation: select
    table: leads
    filters:
      id: "{{ $json.lead_id }}"

  - name: Get Assignment Rules
    type: supabase
    operation: select
    query: |
      SELECT s.id, s.first_name, s.last_name, COUNT(l.id) as active_leads
      FROM staff s
      LEFT JOIN leads l ON l.assigned_to = s.id 
        AND l.pipeline_stage NOT IN ('won', 'lost')
      WHERE s.role IN ('receptionist', 'dt_coordinator')
        AND s.is_active = true
        AND (s.primary_location_id = '{{ $node["Get Lead Data"].json.location_id }}' 
             OR s.primary_location_id IS NULL)
      GROUP BY s.id
      ORDER BY active_leads ASC
      LIMIT 1

  - name: Assign Lead
    type: supabase
    operation: update
    table: leads
    filters:
      id: "{{ $json.lead_id }}"
    data:
      assigned_to: "{{ $node['Get Assignment Rules'].json[0].id }}"
      assigned_at: "{{ $now.toISOString() }}"

  - name: Log Activity
    type: supabase
    operation: insert
    table: lead_activities
    data:
      lead_id: "{{ $json.lead_id }}"
      activity_type: "assigned"
      content: "Lead hozzárendelve: {{ $node['Get Assignment Rules'].json[0].first_name }} {{ $node['Get Assignment Rules'].json[0].last_name }}"

  - name: Send Slack Notification
    type: slack
    credentials: slack_molaire
    channel: "#crm-leads"
    message: |
      🆕 *Új lead érkezett!*
      
      👤 {{ $node['Get Lead Data'].json.last_name }} {{ $node['Get Lead Data'].json.first_name }}
      📱 {{ $node['Get Lead Data'].json.phone }}
      📧 {{ $node['Get Lead Data'].json.email }}
      📍 Forrás: {{ $node['Get Lead Data'].json.source }}
      
      ➡️ Felelős: {{ $node['Get Assignment Rules'].json[0].first_name }} {{ $node['Get Assignment Rules'].json[0].last_name }}
      
      <{{ $env.APP_URL }}/crm/leads/{{ $json.lead_id }}|Megnyitás>

  - name: Send Welcome Email
    type: mailgun
    operation: send
    to: "{{ $node['Get Lead Data'].json.email }}"
    subject: "Köszönjük érdeklődését - MOLaiRE Dental"
    template: lead_welcome
    variables:
      first_name: "{{ $node['Get Lead Data'].json.first_name }}"
    condition: "{{ $node['Get Lead Data'].json.email }}"
```

### 2.2 Follow-up Reminder

```yaml
name: CRM_FollowUp_Daily
description: Remind staff about due follow-ups

trigger:
  type: schedule
  cron: "0 9 * * 1-5"  # Weekdays at 9:00

nodes:
  - name: Get Due Follow-ups
    type: supabase
    operation: select
    query: |
      SELECT 
        l.*,
        s.email as staff_email,
        s.first_name as staff_first_name
      FROM leads l
      JOIN staff s ON l.assigned_to = s.id
      WHERE l.next_follow_up_at::date <= CURRENT_DATE
        AND l.pipeline_stage NOT IN ('won', 'lost')
      ORDER BY l.next_follow_up_at ASC

  - name: Group by Staff
    type: function
    code: |
      const leads = $input.all();
      const grouped = {};
      
      leads.forEach(lead => {
        const email = lead.json.staff_email;
        if (!grouped[email]) {
          grouped[email] = {
            email,
            name: lead.json.staff_first_name,
            leads: []
          };
        }
        grouped[email].leads.push(lead.json);
      });
      
      return Object.values(grouped);

  - name: Loop Staff
    type: splitInBatches
    batchSize: 1

  - name: Send Reminder Email
    type: mailgun
    operation: send
    to: "{{ $input.item.json.email }}"
    subject: "⏰ Follow-up emlékeztető ({{ $input.item.json.leads.length }} lead)"
    template: follow_up_reminder
    variables:
      staff_name: "{{ $input.item.json.name }}"
      leads: "{{ JSON.stringify($input.item.json.leads) }}"
      app_url: "{{ $env.APP_URL }}"
```

### 2.3 Lead Scoring Update

```yaml
name: CRM_LeadScoring_OnActivity
description: Recalculate lead score after activities

trigger:
  type: supabase
  table: lead_activities
  event: INSERT

nodes:
  - name: Get Lead
    type: supabase
    operation: select
    table: leads
    filters:
      id: "{{ $json.lead_id }}"

  - name: Get Scoring Rules
    type: supabase
    operation: select
    table: lead_scoring_rules
    filters:
      is_active: true
      trigger_type: "action"

  - name: Calculate Score
    type: function
    code: |
      const lead = $node['Get Lead'].json[0];
      const rules = $node['Get Scoring Rules'].json;
      const activity = $input.first().json;
      
      let scoreChange = 0;
      const appliedRules = [];
      
      rules.forEach(rule => {
        const condition = rule.trigger_condition;
        if (condition.action === activity.activity_type) {
          scoreChange += rule.score_change;
          appliedRules.push({
            name: rule.name,
            change: rule.score_change
          });
        }
      });
      
      const newScore = Math.max(0, Math.min(100, lead.lead_score + scoreChange));
      const category = newScore >= 80 ? 'hot' : newScore >= 50 ? 'warm' : 'cold';
      
      return {
        new_score: newScore,
        category,
        score_change: scoreChange,
        applied_rules: appliedRules
      };

  - name: Update Lead Score
    type: supabase
    operation: update
    table: leads
    filters:
      id: "{{ $json.lead_id }}"
    data:
      lead_score: "{{ $node['Calculate Score'].json.new_score }}"
      score_category: "{{ $node['Calculate Score'].json.category }}"

  - name: Log Score Change
    type: supabase
    operation: insert
    table: lead_activities
    data:
      lead_id: "{{ $json.lead_id }}"
      activity_type: "score_change"
      score_change: "{{ $node['Calculate Score'].json.score_change }}"
      score_reason: "{{ JSON.stringify($node['Calculate Score'].json.applied_rules) }}"
    condition: "{{ $node['Calculate Score'].json.score_change !== 0 }}"
```

---

## 3. Billing Workflows

### 3.1 NAV Invoice Submission

```yaml
name: Billing_NAVSubmit_OnIssue
description: Submit invoice to NAV when issued

trigger:
  type: supabase
  table: invoices
  event: UPDATE
  filter: "status=eq.issued AND nav_status=eq.pending"

nodes:
  - name: Get Invoice with Items
    type: supabase
    operation: select
    query: |
      SELECT 
        i.*,
        p.first_name, p.last_name, p.address_street, p.address_city, p.address_postal_code,
        nc.*
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      JOIN nav_config nc ON i.location_id = nc.location_id
      WHERE i.id = '{{ $json.id }}'

  - name: Get Invoice Items
    type: supabase
    operation: select
    table: invoice_items
    filters:
      invoice_id: "{{ $json.id }}"

  - name: Build NAV XML
    type: function
    code: |
      // NAV XML builder implementation
      const invoice = $node['Get Invoice with Items'].json[0];
      const items = $node['Get Invoice Items'].json;
      
      // Build XML according to NAV 3.0 schema
      const xml = buildNAVInvoiceXML(invoice, items);
      
      return { xml };

  - name: Submit to NAV
    type: httpRequest
    url: "{{ $env.SUPABASE_URL }}/functions/v1/nav-invoice-submit"
    method: POST
    headers:
      Authorization: "Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
    body:
      invoice_id: "{{ $json.id }}"
      invoice_xml: "{{ $node['Build NAV XML'].json.xml }}"

  - name: Update Invoice Status
    type: supabase
    operation: update
    table: invoices
    filters:
      id: "{{ $json.id }}"
    data:
      nav_status: "{{ $node['Submit to NAV'].json.success ? 'submitted' : 'failed' }}"
      nav_transaction_id: "{{ $node['Submit to NAV'].json.transaction_id }}"
      nav_submitted_at: "{{ $now.toISOString() }}"
      nav_response: "{{ JSON.stringify($node['Submit to NAV'].json) }}"

  - name: Alert on Failure
    type: slack
    channel: "#billing-alerts"
    message: |
      ❌ *NAV beküldés sikertelen!*
      
      📄 Számla: {{ $json.invoice_number }}
      ❗ Hiba: {{ $node['Submit to NAV'].json.error }}
      
      <{{ $env.APP_URL }}/billing/invoices/{{ $json.id }}|Megnyitás>
    condition: "{{ !$node['Submit to NAV'].json.success }}"
```

### 3.2 NAV Status Check

```yaml
name: Billing_NAVStatusCheck_Periodic
description: Check NAV submission status for pending invoices

trigger:
  type: schedule
  cron: "*/15 * * * *"  # Every 15 minutes

nodes:
  - name: Get Pending Submissions
    type: supabase
    operation: select
    query: |
      SELECT id, nav_transaction_id
      FROM invoices
      WHERE nav_status = 'submitted'
        AND nav_submitted_at > NOW() - INTERVAL '24 hours'

  - name: Loop Invoices
    type: splitInBatches
    batchSize: 1

  - name: Query NAV Status
    type: httpRequest
    url: "{{ $env.SUPABASE_URL }}/functions/v1/nav-query-status"
    method: POST
    headers:
      Authorization: "Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
    body:
      transaction_id: "{{ $input.item.json.nav_transaction_id }}"

  - name: Update Status
    type: supabase
    operation: update
    table: invoices
    filters:
      id: "{{ $input.item.json.id }}"
    data:
      nav_status: "{{ $node['Query NAV Status'].json.status }}"
      nav_response: "{{ JSON.stringify($node['Query NAV Status'].json) }}"
```

### 3.3 Visibill Auto-Invoice

```yaml
name: Billing_Visibill_OnTreatmentComplete
description: Generate draft invoice when treatment is completed

trigger:
  type: supabase
  table: treatments
  event: INSERT
  filter: "status=eq.completed"

nodes:
  - name: Get Treatment Details
    type: supabase
    operation: select
    query: |
      SELECT 
        t.*,
        tt.name as treatment_name,
        tt.base_price,
        p.id as patient_id,
        p.first_name,
        p.last_name
      FROM treatments t
      JOIN treatment_types tt ON t.treatment_type_id = tt.id
      JOIN patients p ON t.patient_id = p.id
      WHERE t.id = '{{ $json.id }}'

  - name: Get Price List
    type: supabase
    operation: select
    query: |
      SELECT pl.*, tt.name
      FROM price_list pl
      JOIN treatment_types tt ON pl.treatment_type_id = tt.id
      WHERE pl.is_active = true
        AND (pl.valid_until IS NULL OR pl.valid_until >= CURRENT_DATE)

  - name: Generate Invoice Items with AI
    type: httpRequest
    url: "{{ $env.SUPABASE_URL }}/functions/v1/visibill-generate"
    method: POST
    headers:
      Authorization: "Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
    body:
      treatment: "{{ $node['Get Treatment Details'].json[0] }}"
      price_list: "{{ $node['Get Price List'].json }}"

  - name: Create Draft Invoice
    type: supabase
    operation: insert
    table: invoices
    data:
      patient_id: "{{ $node['Get Treatment Details'].json[0].patient_id }}"
      appointment_id: "{{ $node['Get Treatment Details'].json[0].appointment_id }}"
      status: "draft"
      net_amount: "{{ $node['Generate Invoice Items with AI'].json.net_total }}"
      vat_amount: "{{ $node['Generate Invoice Items with AI'].json.vat_total }}"
      gross_amount: "{{ $node['Generate Invoice Items with AI'].json.gross_total }}"
      internal_notes: "Visibill AI által generált (konfidencia: {{ $node['Generate Invoice Items with AI'].json.confidence }})"

  - name: Create Invoice Items
    type: supabase
    operation: insert
    table: invoice_items
    data: "{{ $node['Generate Invoice Items with AI'].json.items }}"

  - name: Notify for Review
    type: slack
    channel: "#billing"
    message: |
      📝 *Új Visibill számlatervezet*
      
      👤 {{ $node['Get Treatment Details'].json[0].last_name }} {{ $node['Get Treatment Details'].json[0].first_name }}
      💊 {{ $node['Get Treatment Details'].json[0].treatment_name }}
      💰 {{ $node['Generate Invoice Items with AI'].json.gross_total }} Ft
      🎯 AI konfidencia: {{ Math.round($node['Generate Invoice Items with AI'].json.confidence * 100) }}%
      
      <{{ $env.APP_URL }}/billing/invoices/{{ $node['Create Draft Invoice'].json.id }}|Áttekintés>
```

---

## 4. Dental Tourism Workflows

### 4.1 Consultation Processing

```yaml
name: DT_ConsultationProcess_OnSubmit
description: Process new online consultation request

trigger:
  type: webhook
  path: /webhook/dt-consultation
  method: POST

nodes:
  - name: Create Consultation Record
    type: supabase
    operation: insert
    table: online_consultations
    data:
      request_reference: "OC-{{ $now.format('YYYY') }}-{{ String(Math.floor(Math.random() * 100000)).padStart(5, '0') }}"
      first_name: "{{ $json.first_name }}"
      last_name: "{{ $json.last_name }}"
      email: "{{ $json.email }}"
      phone: "{{ $json.phone }}"
      country_code: "{{ $json.country_code }}"
      primary_concern: "{{ $json.primary_concern }}"
      source: "{{ $json.utm_source || 'website' }}"
      utm_campaign: "{{ $json.utm_campaign }}"

  - name: Create Lead
    type: supabase
    operation: insert
    table: leads
    data:
      first_name: "{{ $json.first_name }}"
      last_name: "{{ $json.last_name }}"
      email: "{{ $json.email }}"
      phone: "{{ $json.phone }}"
      source: "dental_tourism"
      source_detail: "{{ $json.country_code }}"
      interested_in: ["dental_tourism"]
      utm_source: "{{ $json.utm_source }}"
      utm_campaign: "{{ $json.utm_campaign }}"

  - name: Send Confirmation Email
    type: mailgun
    operation: send
    to: "{{ $json.email }}"
    subject: "Thank you for your enquiry - MOLaiRE Dental Budapest"
    template: "dt_consultation_received_{{ $json.preferred_language || 'en' }}"
    variables:
      first_name: "{{ $json.first_name }}"
      reference: "{{ $node['Create Consultation Record'].json.request_reference }}"

  - name: Notify Coordinator
    type: slack
    channel: "#dental-tourism"
    message: |
      🌍 *New consultation request!*
      
      👤 {{ $json.first_name }} {{ $json.last_name }}
      🏳️ {{ $json.country_code }}
      📧 {{ $json.email }}
      📱 {{ $json.phone }}
      
      💬 Concern: {{ $json.primary_concern | truncate(100) }}
      📷 X-ray: {{ $json.has_xray ? '✅' : '❌' }}
      
      <{{ $env.APP_URL }}/dt/consultations/{{ $node['Create Consultation Record'].json.id }}|View details>
```

### 4.2 Travel Reminder

```yaml
name: DT_TravelReminder_Daily
description: Send travel reminders to international patients

trigger:
  type: schedule
  cron: "0 9 * * *"

nodes:
  - name: Get 48h Arrivals
    type: supabase
    operation: select
    query: |
      SELECT 
        t.*,
        p.first_name, p.last_name, p.email,
        ipd.whatsapp_number, ipd.preferred_language
      FROM patient_travel_details t
      JOIN patients p ON t.patient_id = p.id
      JOIN international_patient_details ipd ON p.id = ipd.patient_id
      WHERE t.arrival_date = CURRENT_DATE + INTERVAL '2 days'
        AND t.status = 'confirmed'

  - name: Loop 48h
    type: splitInBatches
    batchSize: 1

  - name: Send 48h Email
    type: mailgun
    template: "dt_arrival_48h_{{ $input.item.json.preferred_language || 'en' }}"
    to: "{{ $input.item.json.email }}"
    variables:
      first_name: "{{ $input.item.json.first_name }}"
      arrival_date: "{{ $input.item.json.arrival_date }}"
      flight_number: "{{ $input.item.json.arrival_flight_number }}"
      hotel: "{{ $input.item.json.hotel_name }}"

  - name: Send WhatsApp
    type: twilio
    operation: sendWhatsApp
    to: "{{ $input.item.json.whatsapp_number }}"
    template: arrival_reminder_48h
    condition: "{{ $input.item.json.whatsapp_number }}"

  - name: Get 24h Arrivals
    type: supabase
    operation: select
    query: |
      SELECT * FROM patient_travel_details t
      JOIN patients p ON t.patient_id = p.id
      JOIN international_patient_details ipd ON p.id = ipd.patient_id
      WHERE t.arrival_date = CURRENT_DATE + INTERVAL '1 day'
        AND t.status = 'confirmed'

  - name: Send Final Checklist
    type: mailgun
    template: dt_arrival_checklist
    # ... similar to 48h
```

---

## 5. Analytics Workflows

### 5.1 KPI Refresh

```yaml
name: Analytics_KPIRefresh_Hourly
description: Refresh KPI materialized views and calculate values

trigger:
  type: schedule
  cron: "0 * * * *"  # Every hour

nodes:
  - name: Refresh Materialized Views
    type: supabase
    operation: rpc
    function: refresh_analytics_views

  - name: Calculate Daily KPIs
    type: supabase
    operation: rpc
    function: calculate_daily_kpis

  - name: Check Thresholds
    type: supabase
    operation: select
    query: |
      SELECT 
        kv.*, kd.name, kd.warning_threshold, kd.critical_threshold
      FROM kpi_values kv
      JOIN kpi_definitions kd ON kv.kpi_id = kd.id
      WHERE kv.calculated_at > NOW() - INTERVAL '1 hour'
        AND (
          (kd.good_direction = 'up' AND kv.value < kd.critical_threshold) OR
          (kd.good_direction = 'down' AND kv.value > kd.critical_threshold)
        )

  - name: Send Alerts
    type: slack
    channel: "#analytics-alerts"
    message: |
      ⚠️ *KPI Alert*
      
      {{ #each $node['Check Thresholds'].json }}
      • {{ name }}: {{ value }} (kritikus: {{ critical_threshold }})
      {{ /each }}
    condition: "{{ $node['Check Thresholds'].json.length > 0 }}"
```

### 5.2 Scheduled Reports

```yaml
name: Analytics_ScheduledReports_Daily
description: Generate and send scheduled reports

trigger:
  type: schedule
  cron: "0 7 * * *"  # Every day at 7:00

nodes:
  - name: Get Due Reports
    type: supabase
    operation: select
    query: |
      SELECT * FROM saved_reports
      WHERE is_scheduled = true
        AND next_run_at <= NOW()

  - name: Loop Reports
    type: splitInBatches
    batchSize: 1

  - name: Execute Report
    type: httpRequest
    url: "{{ $env.SUPABASE_URL }}/functions/v1/execute-report"
    method: POST
    body:
      report_id: "{{ $input.item.json.id }}"

  - name: Generate PDF
    type: httpRequest
    url: "{{ $env.SUPABASE_URL }}/functions/v1/generate-report-pdf"
    method: POST
    body:
      report_data: "{{ $node['Execute Report'].json }}"
      report_config: "{{ $input.item.json }}"

  - name: Send Email
    type: mailgun
    to: "{{ $input.item.json.schedule_recipients.join(',') }}"
    subject: "{{ $input.item.json.name }} - {{ $now.format('YYYY.MM.DD') }}"
    template: scheduled_report
    attachments:
      - filename: "{{ $input.item.json.name }}.pdf"
        content: "{{ $node['Generate PDF'].json.pdf_base64 }}"

  - name: Update Next Run
    type: supabase
    operation: update
    table: saved_reports
    filters:
      id: "{{ $input.item.json.id }}"
    data:
      last_run_at: "{{ $now.toISOString() }}"
      next_run_at: "{{ calculateNextRun($input.item.json.schedule_cron) }}"
```

---

## 6. Webhook Security

All webhooks should validate:

```javascript
// Webhook validation middleware
const validateWebhook = (req) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  
  // Check timestamp (prevent replay attacks)
  const now = Date.now();
  const reqTime = parseInt(timestamp);
  if (Math.abs(now - reqTime) > 300000) { // 5 minutes
    throw new Error('Webhook timestamp expired');
  }
  
  // Validate signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(`${timestamp}.${JSON.stringify(req.body)}`)
    .digest('hex');
  
  if (signature !== expectedSig) {
    throw new Error('Invalid webhook signature');
  }
};
```

---

**Next**: Proceed to [11-IMPLEMENTATION_PHASES.md](./11-IMPLEMENTATION_PHASES.md) for detailed implementation roadmap.
