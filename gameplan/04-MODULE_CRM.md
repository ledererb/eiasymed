# eaisy — CRM & Lead Management Module

> **⚠️ TECH STACK TRANSLATION REQUIRED**
>
> The UI code examples in this file use **shadcn/ui, Tailwind CSS, Lucide icons, React Query, and React Router** — these are NOT used in the actual project.
>
> When implementing, translate all UI code to use:
> - **CSS Modules** (not Tailwind `className` strings)
> - **eaisy-components** (`Table`, `Badge`, `StatusBadge`, `Avatar`, `Drawer`, `InputField`, `Dropdown`, `Tabs`, `Button`, `Comment`, etc.)
> - **Phosphor Icons** (`@phosphor-icons/react`) instead of Lucide
> - **Next.js App Router** routing instead of React Router
> - **Direct Supabase client** calls instead of React Query
> - Pipeline Kanban board → compose from custom CSS grid + eaisy cards (no `@hello-pangea/dnd` — use HTML drag-and-drop API or a lightweight alternative)
>
> See skills: `eaisy-components`, `eaisy-build-workflow`, `eaisy-supabase-patterns`

## Module Overview

The CRM module manages the entire patient acquisition funnel, from initial lead capture through conversion to active patient, including marketing automation and retention campaigns.

## Features

### Core Features (MVP)
- Manual lead entry
- Lead pipeline (Kanban)
- Lead scoring (basic)
- Task management
- Email/SMS templates
- Basic attribution

### Advanced Features (Post-MVP)
- Facebook Lead Ads integration
- Marketing automation workflows
- AI-powered lead scoring
- Referral program
- WhatsApp integration
- Advanced analytics

## Database Schema

### leads

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Source Tracking
  source VARCHAR(50) NOT NULL,
  -- Sources: website, facebook, google_ads, instagram, referral, walk_in, phone, email
  source_detail VARCHAR(200), -- Campaign name, referrer, etc.
  source_url TEXT, -- Landing page URL
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  
  -- Assignment
  location_id UUID REFERENCES locations(id),
  assigned_to UUID REFERENCES staff(id),
  assigned_at TIMESTAMPTZ,
  
  -- Pipeline
  pipeline_stage VARCHAR(30) DEFAULT 'new',
  -- Stages: new, contacted, qualified, consultation_scheduled, consultation_done, won, lost
  
  pipeline_stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Qualification
  interested_in TEXT[], -- ['implant', 'whitening', 'braces']
  budget_range VARCHAR(30),
  urgency VARCHAR(20), -- low, medium, high, urgent
  
  -- Scoring
  lead_score INT DEFAULT 0, -- 0-100
  score_category VARCHAR(10), -- cold, warm, hot
  
  -- Conversion
  converted_at TIMESTAMPTZ,
  converted_to_patient_id UUID REFERENCES patients(id),
  estimated_value DECIMAL(10, 2),
  actual_value DECIMAL(10, 2),
  
  -- Loss
  lost_at TIMESTAMPTZ,
  lost_reason VARCHAR(50),
  lost_reason_detail TEXT,
  
  -- Communication
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  contact_attempts INT DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

-- Indexes
CREATE INDEX idx_leads_stage ON leads(pipeline_stage);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_follow_up ON leads(next_follow_up_at) 
  WHERE next_follow_up_at IS NOT NULL AND pipeline_stage NOT IN ('won', 'lost');
```

### lead_activities

```sql
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID REFERENCES leads(id) NOT NULL,
  
  activity_type VARCHAR(30) NOT NULL,
  -- Types: note, email_sent, email_opened, email_clicked, sms_sent, 
  -- call_made, call_received, meeting, stage_change, score_change, 
  -- document_sent, document_viewed, form_submitted
  
  -- Activity details
  subject VARCHAR(200),
  content TEXT,
  
  -- For communications
  channel VARCHAR(20), -- email, sms, phone, whatsapp, in_person
  direction VARCHAR(10), -- inbound, outbound
  
  -- For stage changes
  from_stage VARCHAR(30),
  to_stage VARCHAR(30),
  
  -- For score changes
  score_change INT,
  score_reason VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);
```

### lead_tasks

```sql
CREATE TABLE lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID REFERENCES leads(id) NOT NULL,
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  task_type VARCHAR(30) DEFAULT 'follow_up',
  -- Types: follow_up, call, email, meeting, send_quote, other
  
  due_date TIMESTAMPTZ NOT NULL,
  
  -- Assignment
  assigned_to UUID REFERENCES staff(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- pending, completed, cancelled
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES staff(id),
  
  -- Priority
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Reminder
  reminder_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_lead_tasks_due ON lead_tasks(due_date) 
  WHERE status = 'pending';
CREATE INDEX idx_lead_tasks_assigned ON lead_tasks(assigned_to, status);
```

### lead_scoring_rules

```sql
CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_type VARCHAR(30) NOT NULL,
  -- Types: source, action, attribute, time_based
  trigger_condition JSONB NOT NULL,
  -- Examples:
  -- {"source": "referral"}
  -- {"action": "email_opened"}
  -- {"attribute": "interested_in", "contains": "implant"}
  -- {"days_since_last_contact": {"gt": 7}}
  
  -- Score adjustment
  score_change INT NOT NULL, -- Can be negative
  
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  apply_once BOOLEAN DEFAULT FALSE, -- Only apply once per lead
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default scoring rules
INSERT INTO lead_scoring_rules (name, trigger_type, trigger_condition, score_change) VALUES
  ('Röntgen feltöltve', 'action', '{"action": "xray_uploaded"}', 30),
  ('Visszahívásra válaszolt', 'action', '{"action": "call_answered"}', 20),
  ('Email megnyitva', 'action', '{"action": "email_opened"}', 10),
  ('Ajánlat megnyitva', 'action', '{"action": "quote_viewed"}', 15),
  ('Inaktív 7+ nap', 'time_based', '{"days_since_last_contact": {"gt": 7}}', -15),
  ('Inaktív 14+ nap', 'time_based', '{"days_since_last_contact": {"gt": 14}}', -25),
  ('Ajánlás forrás', 'source', '{"source": "referral"}', 25),
  ('Implant érdeklődés', 'attribute', '{"interested_in": {"contains": "implant"}}', 20),
  ('Sürgős', 'attribute', '{"urgency": "urgent"}', 30);
```

### message_templates

```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  
  channel VARCHAR(20) NOT NULL, -- email, sms, whatsapp
  
  -- Template type
  template_type VARCHAR(30) NOT NULL,
  -- Types: lead_welcome, follow_up, quote, reminder, recall, marketing
  
  -- Content
  subject VARCHAR(200), -- For emails
  body TEXT NOT NULL,
  
  -- Variables available: {{first_name}}, {{last_name}}, {{phone}}, 
  -- {{clinic_name}}, {{doctor_name}}, {{appointment_date}}, etc.
  
  -- Multi-language
  language VARCHAR(2) DEFAULT 'hu',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### automation_campaigns

```sql
CREATE TABLE automation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  campaign_type VARCHAR(30) NOT NULL,
  -- Types: lead_nurture, recall, onboarding, reactivation, marketing
  
  -- Trigger
  trigger_type VARCHAR(30) NOT NULL,
  -- Types: lead_created, stage_change, date_based, manual
  trigger_conditions JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, archived
  
  -- Stats
  total_enrolled INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  total_converted INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);
```

### automation_steps

```sql
CREATE TABLE automation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  campaign_id UUID REFERENCES automation_campaigns(id) NOT NULL,
  
  step_order INT NOT NULL,
  
  step_type VARCHAR(30) NOT NULL,
  -- Types: wait, send_email, send_sms, create_task, update_score, 
  -- change_stage, webhook, condition
  
  -- Configuration based on type
  config JSONB NOT NULL,
  -- Examples:
  -- wait: {"duration": 2, "unit": "days"}
  -- send_email: {"template_id": "uuid"}
  -- condition: {"field": "lead_score", "operator": "gt", "value": 50}
  
  -- For conditions, next step if false
  next_step_if_false UUID REFERENCES automation_steps(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## UI Components

### CRM Dashboard

```typescript
// pages/crm/index.tsx
export function CRMDashboard() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CRM Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/crm/leads/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Új lead
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Összes lead (hónap)"
          value={stats.totalLeads}
          change={stats.leadsChange}
          icon={Users}
        />
        <KPICard
          title="Konverzió"
          value={`${stats.conversionRate}%`}
          change={stats.conversionChange}
          icon={TrendingUp}
        />
        <KPICard
          title="Hot leadek"
          value={stats.hotLeads}
          icon={Flame}
          variant="warning"
        />
        <KPICard
          title="Mai feladatok"
          value={stats.todayTasks}
          icon={CheckSquare}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Pipeline Summary */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Pipeline áttekintés</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineFunnel data={pipelineStats} />
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Legutóbbi aktivitás</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={recentActivities} />
          </CardContent>
        </Card>
      </div>
      
      {/* Tasks Due Today */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mai feladatok</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList tasks={todayTasks} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Lead Pipeline (Kanban)

```typescript
// pages/crm/pipeline.tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const PIPELINE_STAGES = [
  { id: 'new', label: 'Új', color: 'bg-gray-100' },
  { id: 'contacted', label: 'Kontaktált', color: 'bg-blue-100' },
  { id: 'qualified', label: 'Kvalifikált', color: 'bg-yellow-100' },
  { id: 'consultation_scheduled', label: 'Konzultáció ütemezve', color: 'bg-purple-100' },
  { id: 'consultation_done', label: 'Konzultáció megtörtént', color: 'bg-indigo-100' },
  { id: 'won', label: 'Lezárt - Nyert', color: 'bg-green-100' },
];

export function LeadPipeline() {
  const { leads, updateLeadStage } = useLeads();
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    
    updateLeadStage(leadId, newStage);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lead Pipeline</h1>
        <div className="flex gap-2">
          <LeadFilters />
          <Button onClick={() => setShowNewLeadModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Új lead
          </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex-shrink-0 w-72 rounded-lg p-3',
                    stage.color,
                    snapshot.isDraggingOver && 'ring-2 ring-blue-400'
                  )}
                >
                  {/* Stage Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">{stage.label}</h3>
                    <Badge variant="secondary">
                      {leads.filter(l => l.pipeline_stage === stage.id).length}
                    </Badge>
                  </div>
                  
                  {/* Lead Cards */}
                  <div className="space-y-2">
                    {leads
                      .filter(l => l.pipeline_stage === stage.id)
                      .map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <LeadCard
                                lead={lead}
                                isDragging={snapshot.isDragging}
                                onClick={() => setSelectedLead(lead)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
```

### LeadCard Component

```typescript
// components/crm/LeadCard.tsx
interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  onClick: () => void;
}

export function LeadCard({ lead, isDragging, onClick }: LeadCardProps) {
  const scoreColor = lead.lead_score >= 80 ? 'text-red-500' : 
                     lead.lead_score >= 50 ? 'text-yellow-500' : 
                     'text-blue-500';

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'shadow-lg rotate-2'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-medium">
              {lead.last_name} {lead.first_name}
            </p>
            <p className="text-sm text-gray-500">{lead.phone}</p>
          </div>
          <div className={cn('text-lg font-bold', scoreColor)}>
            {lead.lead_score}
          </div>
        </div>
        
        {/* Source */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <SourceIcon source={lead.source} className="w-3 h-3" />
          <span>{getSourceLabel(lead.source)}</span>
        </div>
        
        {/* Interests */}
        {lead.interested_in && lead.interested_in.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {lead.interested_in.slice(0, 2).map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
            {lead.interested_in.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{lead.interested_in.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{formatRelative(lead.created_at)}</span>
          {lead.next_follow_up_at && (
            <span className={cn(
              isPast(lead.next_follow_up_at) && 'text-red-500'
            )}>
              <Clock className="w-3 h-3 inline mr-1" />
              {formatRelative(lead.next_follow_up_at)}
            </span>
          )}
        </div>
        
        {/* Assigned */}
        {lead.assigned_to && (
          <div className="mt-2 pt-2 border-t">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-xs">
                {getInitials(lead.assigned_user?.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### LeadDetailModal

```typescript
// components/crm/LeadDetailModal.tsx
export function LeadDetailModal({ lead, isOpen, onClose }: LeadDetailModalProps) {
  const { updateLead, convertLead, markAsLost } = useLeadMutations();
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>
            {lead.last_name} {lead.first_name}
          </SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="details" className="mt-6">
          <TabsList>
            <TabsTrigger value="details">Részletek</TabsTrigger>
            <TabsTrigger value="activity">Aktivitás</TabsTrigger>
            <TabsTrigger value="tasks">Feladatok</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {/* Contact Info */}
            <div>
              <h4 className="font-medium mb-2">Kapcsolat</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${lead.phone}`} className="text-blue-600">
                    {lead.phone}
                  </a>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${lead.email}`} className="text-blue-600">
                      {lead.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Lead Score */}
            <div>
              <h4 className="font-medium mb-2">Lead Score</h4>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">
                  {lead.lead_score}
                </div>
                <div className="flex-1">
                  <Progress value={lead.lead_score} />
                </div>
                <Badge variant={getScoreBadgeVariant(lead.lead_score)}>
                  {lead.score_category}
                </Badge>
              </div>
            </div>
            
            {/* Interests */}
            <div>
              <h4 className="font-medium mb-2">Érdeklődés</h4>
              <InterestSelector
                value={lead.interested_in || []}
                onChange={(interests) => updateLead({ interested_in: interests })}
              />
            </div>
            
            {/* Pipeline Stage */}
            <div>
              <h4 className="font-medium mb-2">Pipeline státusz</h4>
              <Select
                value={lead.pipeline_stage}
                onValueChange={(stage) => updateLead({ pipeline_stage: stage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Assignment */}
            <div>
              <h4 className="font-medium mb-2">Felelős</h4>
              <StaffSelector
                value={lead.assigned_to}
                onChange={(staffId) => updateLead({ assigned_to: staffId })}
              />
            </div>
            
            {/* Notes */}
            <div>
              <h4 className="font-medium mb-2">Megjegyzések</h4>
              <Textarea
                value={lead.notes || ''}
                onChange={(e) => updateLead({ notes: e.target.value })}
                rows={4}
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setShowConvertModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Konvertálás pácienssé
              </Button>
              <Button variant="outline" onClick={() => setShowLostModal(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Elveszett
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <LeadActivityTimeline leadId={lead.id} />
          </TabsContent>
          
          <TabsContent value="tasks">
            <LeadTaskList leadId={lead.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

## Lead Scoring Logic

```typescript
// lib/crm/scoring.ts
export async function calculateLeadScore(leadId: string): Promise<number> {
  const lead = await getLead(leadId);
  const rules = await getActiveScroingRules();
  const history = await getScoreHistory(leadId);
  
  let score = 0;
  
  for (const rule of rules) {
    // Skip if already applied and apply_once is true
    if (rule.apply_once && history.some(h => h.rule_id === rule.id)) {
      continue;
    }
    
    if (evaluateRule(rule, lead)) {
      score += rule.score_change;
      
      // Log score change
      await logScoreChange(leadId, rule.id, rule.score_change, rule.name);
    }
  }
  
  // Clamp to 0-100
  const finalScore = Math.max(0, Math.min(100, score));
  
  // Determine category
  const category = finalScore >= 80 ? 'hot' : finalScore >= 50 ? 'warm' : 'cold';
  
  // Update lead
  await updateLead(leadId, { 
    lead_score: finalScore,
    score_category: category,
  });
  
  return finalScore;
}

function evaluateRule(rule: ScoringRule, lead: Lead): boolean {
  const { trigger_type, trigger_condition } = rule;
  
  switch (trigger_type) {
    case 'source':
      return lead.source === trigger_condition.source;
      
    case 'attribute':
      const field = trigger_condition.attribute;
      const value = lead[field];
      
      if (trigger_condition.contains) {
        return Array.isArray(value) && value.includes(trigger_condition.contains);
      }
      if (trigger_condition.equals) {
        return value === trigger_condition.equals;
      }
      return false;
      
    case 'time_based':
      if (trigger_condition.days_since_last_contact) {
        const daysSince = differenceInDays(new Date(), lead.last_contact_at);
        return evaluateComparison(daysSince, trigger_condition.days_since_last_contact);
      }
      return false;
      
    case 'action':
      // This is handled by activity triggers, not periodic calculation
      return false;
      
    default:
      return false;
  }
}
```

## n8n Workflows

### Lead Assignment

```yaml
name: CRM_Lead_Assignment
trigger:
  - type: webhook
    path: /webhook/lead-created
  - type: supabase_trigger
    table: leads
    event: INSERT

nodes:
  - name: Get Location Settings
    type: supabase
    operation: select
    table: locations
    filter: id = {{ lead.location_id }}

  - name: Get Available Staff
    type: supabase
    operation: select
    query: |
      SELECT s.*, COUNT(l.id) as active_leads
      FROM staff s
      LEFT JOIN leads l ON l.assigned_to = s.id 
        AND l.pipeline_stage NOT IN ('won', 'lost')
      WHERE s.role = 'receptionist'
        AND s.location_id = '{{ lead.location_id }}'
        AND s.is_active = true
      GROUP BY s.id
      ORDER BY active_leads ASC

  - name: Assign Lead (Round Robin)
    type: function
    code: |
      const staff = input.available_staff;
      if (staff.length === 0) return null;
      return staff[0]; // Least loaded staff member

  - name: Update Lead Assignment
    type: supabase
    operation: update
    table: leads
    filter: id = {{ lead.id }}
    data:
      assigned_to: "{{ assigned_staff.id }}"
      assigned_at: NOW()

  - name: Notify Assigned Staff
    type: slack
    channel: "#crm-leads"
    message: |
      🆕 Új lead hozzárendelve!
      
      👤 {{ lead.last_name }} {{ lead.first_name }}
      📱 {{ lead.phone }}
      📍 Forrás: {{ lead.source }}
      
      Felelős: {{ assigned_staff.first_name }} {{ assigned_staff.last_name }}
```

### Lead Follow-up Reminders

```yaml
name: CRM_Follow_Up_Reminder
trigger:
  - type: schedule
    cron: "0 9 * * *"  # Every day at 9:00

nodes:
  - name: Get Overdue Follow-ups
    type: supabase
    operation: select
    query: |
      SELECT l.*, s.email as staff_email, s.first_name as staff_name
      FROM leads l
      JOIN staff s ON l.assigned_to = s.id
      WHERE l.next_follow_up_at < NOW()
        AND l.pipeline_stage NOT IN ('won', 'lost')

  - name: Group by Staff
    type: function
    code: |
      const grouped = {};
      for (const lead of input.leads) {
        if (!grouped[lead.staff_email]) {
          grouped[lead.staff_email] = {
            email: lead.staff_email,
            name: lead.staff_name,
            leads: []
          };
        }
        grouped[lead.staff_email].leads.push(lead);
      }
      return Object.values(grouped);

  - name: Send Reminder Email
    type: mailgun
    to: "{{ item.email }}"
    subject: "⏰ Lejárt follow-up feladatok ({{ item.leads.length }})"
    template: follow_up_reminder
    variables:
      staff_name: "{{ item.name }}"
      leads: "{{ item.leads }}"
```

## Acceptance Criteria

### AC-01: Lead List
- [ ] Display all leads with pagination
- [ ] Search by name, phone, email
- [ ] Filter by stage, source, assigned
- [ ] Sort by score, created date, follow-up date
- [ ] Bulk actions (assign, delete)

### AC-02: Lead Pipeline
- [ ] Kanban view with all stages
- [ ] Drag & drop between stages
- [ ] Lead count per stage
- [ ] Color coding by score
- [ ] Quick view on card hover

### AC-03: Lead Creation
- [ ] Manual entry form
- [ ] Webhook endpoint for integrations
- [ ] Duplicate detection
- [ ] Auto-assignment (optional)
- [ ] Source tracking

### AC-04: Lead Scoring
- [ ] Score calculated automatically
- [ ] Score displayed prominently
- [ ] Score history viewable
- [ ] Category badges (Hot/Warm/Cold)
- [ ] Custom rules editable

### AC-05: Lead Conversion
- [ ] Convert to patient with one click
- [ ] Pre-fill patient data from lead
- [ ] Optional first appointment creation
- [ ] Conversion tracking

### AC-06: Tasks
- [ ] Create tasks from lead detail
- [ ] Due date with reminders
- [ ] Task list on dashboard
- [ ] Completion tracking

---

**Next**: Proceed to [05-MODULE_BILLING.md](./05-MODULE_BILLING.md) for Billing & Invoicing module.
