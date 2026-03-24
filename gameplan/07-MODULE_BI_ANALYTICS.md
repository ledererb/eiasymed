# eaisy — BI & Analytics Module

> **⚠️ TECH STACK TRANSLATION REQUIRED**
>
> The UI code examples in this file use **shadcn/ui, Tailwind CSS, and Lucide icons** — these are NOT used in the actual project.
>
> When implementing, translate all UI code to use:
> - **CSS Modules** (not Tailwind `className` strings)
> - **eaisy-components** (`Table`, `Badge`, `Button`, `Dropdown`, `Tabs`, etc.)
> - **Phosphor Icons** (`@phosphor-icons/react`) instead of Lucide
> - **Recharts** is acceptable for chart visualizations (line, bar, donut, etc.)
> - A new `KPICard` component will need to be built using the eaisy design system
>
> See skills: `eaisy-components`, `eaisy-build-workflow`, `eaisy-supabase-patterns`

## Module Overview

The BI/Analytics module provides comprehensive business intelligence dashboards, KPI tracking, custom reporting, and data-driven insights for clinic management.

## KPI Categories

### Financial KPIs

| KPI | Formula | Target |
|-----|---------|--------|
| Revenue MTD | SUM(invoices.gross_amount) | - |
| Revenue YoY Growth | (Current - Previous) / Previous × 100 | >10% |
| Avg Transaction Value | Revenue / Invoice Count | - |
| Outstanding AR | SUM(unpaid invoices) | <5% |
| Collection Rate | Collected / Invoiced × 100 | >95% |

### Marketing KPIs

| KPI | Formula | Target |
|-----|---------|--------|
| Lead Count | COUNT(leads) | - |
| Conversion Rate | Converted / Total × 100 | >50% |
| CAC | Marketing Spend / New Patients | - |
| ROAS | Revenue / Ad Spend | >500% |
| LTV | Total Revenue per Patient | - |
| LTV:CAC | LTV / CAC | >10:1 |

### Clinical KPIs

| KPI | Formula | Target |
|-----|---------|--------|
| No-Show Rate | No-shows / Total × 100 | <5% |
| Chair Utilization | Booked / Available × 100 | >80% |
| Treatment Plan Completion | Completed / Total × 100 | >75% |
| Patient Satisfaction | AVG(rating) | >4.5/5 |

### Dental Tourism KPIs

| KPI | Formula | Target |
|-----|---------|--------|
| DT Revenue | SUM(DT invoices) | - |
| DT Conversion | Converted / Consultations × 100 | >65% |
| Repeat Rate | Repeat Visits / Total × 100 | >25% |
| Quote Acceptance | Accepted / Sent × 100 | >60% |

## Database Schema

### kpi_definitions

```sql
CREATE TABLE kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  category VARCHAR(50) NOT NULL,
  -- Categories: financial, marketing, clinical, operational, dt
  
  -- Calculation
  calculation_type VARCHAR(20) NOT NULL, -- sql, derived, manual
  calculation_formula TEXT,
  
  -- Display
  display_format VARCHAR(20) DEFAULT 'number',
  -- Formats: number, currency, percentage, decimal
  decimal_places INT DEFAULT 0,
  currency VARCHAR(3),
  
  -- Comparison
  comparison_type VARCHAR(20), -- mom, yoy, target
  good_direction VARCHAR(10), -- up, down
  
  -- Thresholds
  warning_threshold DECIMAL(15, 2),
  critical_threshold DECIMAL(15, 2),
  
  -- Access
  visible_to_roles TEXT[],
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### kpi_values

```sql
CREATE TABLE kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  kpi_id UUID REFERENCES kpi_definitions(id) NOT NULL,
  
  -- Period
  period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Filters
  location_id UUID REFERENCES locations(id),
  doctor_id UUID REFERENCES staff(id),
  
  -- Values
  value DECIMAL(15, 2) NOT NULL,
  previous_value DECIMAL(15, 2),
  target_value DECIMAL(15, 2),
  
  -- Change
  change_absolute DECIMAL(15, 2),
  change_percentage DECIMAL(8, 2),
  
  -- Status
  status VARCHAR(20), -- normal, warning, critical
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(kpi_id, period_type, period_start, location_id, doctor_id)
);
```

### saved_reports

```sql
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Definition
  report_type VARCHAR(30) NOT NULL, -- table, chart, pdf
  data_sources TEXT[] NOT NULL,
  columns JSONB NOT NULL,
  filters JSONB,
  grouping JSONB,
  sorting JSONB,
  aggregations JSONB,
  
  -- Chart config
  chart_type VARCHAR(30),
  chart_config JSONB,
  
  -- Scheduling
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

## Materialized Views

```sql
-- Daily Revenue Summary
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT 
  DATE(i.issued_at) as date,
  i.location_id,
  COUNT(DISTINCT i.id) as invoice_count,
  SUM(i.gross_amount) as total_revenue,
  AVG(i.gross_amount) as avg_invoice
FROM invoices i
WHERE i.status = 'issued'
GROUP BY DATE(i.issued_at), i.location_id;

CREATE UNIQUE INDEX idx_mv_daily_revenue 
ON mv_daily_revenue(date, location_id);

-- Lead Conversion Summary
CREATE MATERIALIZED VIEW mv_lead_conversion AS
SELECT 
  DATE_TRUNC('month', l.created_at) as month,
  l.source,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN l.pipeline_stage = 'won' THEN 1 END) as converted,
  AVG(CASE WHEN l.converted_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (l.converted_at - l.created_at))/86400 
      END) as avg_days_to_convert
FROM leads l
GROUP BY DATE_TRUNC('month', l.created_at), l.source;

-- Doctor Performance
CREATE MATERIALIZED VIEW mv_doctor_performance AS
SELECT 
  DATE_TRUNC('month', a.start_time) as month,
  a.doctor_id,
  COUNT(DISTINCT a.id) as appointment_count,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_shows,
  SUM(i.gross_amount) as revenue
FROM appointments a
LEFT JOIN invoices i ON a.id = i.appointment_id
GROUP BY DATE_TRUNC('month', a.start_time), a.doctor_id;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lead_conversion;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_performance;
END;
$$ LANGUAGE plpgsql;
```

## UI Components

### ExecutiveDashboard

```typescript
// pages/analytics/index.tsx
export function ExecutiveDashboard() {
  const [period, setPeriod] = useState<Period>('mtd');
  const [location, setLocation] = useState<string | null>(null);
  
  const { kpis, isLoading } = useKPIs({ period, locationId: location });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Executive Dashboard</h1>
        <div className="flex gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <LocationSelector value={location} onChange={setLocation} />
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Frissítés
          </Button>
        </div>
      </div>
      
      {/* Main KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Bevétel"
          value={formatCurrency(kpis.revenue)}
          change={kpis.revenueChange}
          trend={kpis.revenueTrend}
          icon={DollarSign}
        />
        <KPICard
          title="Új páciensek"
          value={kpis.newPatients}
          change={kpis.newPatientsChange}
          icon={Users}
        />
        <KPICard
          title="Konverzió"
          value={`${kpis.conversionRate}%`}
          change={kpis.conversionChange}
          icon={TrendingUp}
        />
        <KPICard
          title="Kihasználtság"
          value={`${kpis.utilization}%`}
          target={80}
          icon={Calendar}
        />
      </div>
      
      {/* Revenue Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bevétel trend</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={kpis.revenueTrend} period={period} />
        </CardContent>
      </Card>
      
      {/* Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Bevétel kezelés típusonként</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={kpis.revenueByType} />
          </CardContent>
        </Card>
        
        {/* Location Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Telephely összehasonlítás</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationComparisonTable data={kpis.byLocation} />
          </CardContent>
        </Card>
        
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Figyelmeztető jelzések</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsList alerts={kpis.alerts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### KPICard Component

```typescript
// components/analytics/KPICard.tsx
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  target?: number;
  trend?: number[];
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function KPICard({
  title,
  value,
  change,
  target,
  trend,
  icon: Icon,
  variant = 'default',
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <Card className={cn(
      'relative overflow-hidden',
      variant === 'warning' && 'border-yellow-200 bg-yellow-50',
      variant === 'danger' && 'border-red-200 bg-red-50',
    )}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            
            {change !== undefined && (
              <div className={cn(
                'flex items-center mt-1 text-sm',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span>{isPositive ? '+' : ''}{change}%</span>
                <span className="text-gray-400 ml-1">vs előző</span>
              </div>
            )}
            
            {target !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Target: {target}%</span>
                  <span>{Math.round((Number(value) / target) * 100)}%</span>
                </div>
                <Progress 
                  value={(Number(value) / target) * 100} 
                  className="h-1"
                />
              </div>
            )}
          </div>
          
          <div className={cn(
            'p-3 rounded-full',
            variant === 'default' && 'bg-blue-100 text-blue-600',
            variant === 'success' && 'bg-green-100 text-green-600',
            variant === 'warning' && 'bg-yellow-100 text-yellow-600',
            variant === 'danger' && 'bg-red-100 text-red-600',
          )}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        {/* Mini sparkline */}
        {trend && trend.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
            <Sparkline data={trend} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### ReportBuilder Component

```typescript
// components/analytics/ReportBuilder.tsx
export function ReportBuilder() {
  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    dataSources: [],
    columns: [],
    filters: [],
    grouping: null,
    sorting: null,
  });

  return (
    <div className="space-y-6">
      {/* Report Name */}
      <div>
        <Label>Riport neve</Label>
        <Input
          value={config.name}
          onChange={(e) => setConfig(c => ({ ...c, name: e.target.value }))}
          placeholder="pl. Havi bevétel elemzés"
        />
      </div>
      
      {/* Data Source */}
      <div>
        <Label>Adatforrás</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {DATA_SOURCES.map((source) => (
            <Button
              key={source.id}
              variant={config.dataSources.includes(source.id) ? 'default' : 'outline'}
              onClick={() => toggleDataSource(source.id)}
              className="justify-start"
            >
              <source.icon className="w-4 h-4 mr-2" />
              {source.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Columns */}
      <div>
        <Label>Oszlopok</Label>
        <ColumnSelector
          available={availableColumns}
          selected={config.columns}
          onChange={(columns) => setConfig(c => ({ ...c, columns }))}
        />
      </div>
      
      {/* Filters */}
      <div>
        <Label>Szűrők</Label>
        <FilterBuilder
          fields={availableFields}
          filters={config.filters}
          onChange={(filters) => setConfig(c => ({ ...c, filters }))}
        />
      </div>
      
      {/* Grouping */}
      <div>
        <Label>Csoportosítás</Label>
        <Select
          value={config.grouping}
          onValueChange={(v) => setConfig(c => ({ ...c, grouping: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nincs csoportosítás" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nincs</SelectItem>
            {availableGroupings.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Előnézet</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportPreview config={config} />
        </CardContent>
      </Card>
      
      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Ütemezés</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleConfig
            value={config.schedule}
            onChange={(schedule) => setConfig(c => ({ ...c, schedule }))}
          />
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Mégse</Button>
        <Button variant="secondary" onClick={runNow}>
          <Play className="w-4 h-4 mr-2" />
          Futtatás most
        </Button>
        <Button onClick={saveReport}>
          <Save className="w-4 h-4 mr-2" />
          Mentés
        </Button>
      </div>
    </div>
  );
}
```

## n8n Workflows

### KPI Refresh

```yaml
name: BI_KPI_Refresh
trigger:
  - type: schedule
    cron: "0 * * * *"  # Every hour

nodes:
  - name: Refresh Materialized Views
    type: supabase_rpc
    function: refresh_analytics_views

  - name: Calculate KPIs
    type: supabase_rpc
    function: calculate_all_kpis
    params:
      period_type: "daily"

  - name: Check Thresholds
    type: supabase
    query: |
      SELECT k.*, d.name, d.warning_threshold, d.critical_threshold
      FROM kpi_values k
      JOIN kpi_definitions d ON k.kpi_id = d.id
      WHERE k.calculated_at > NOW() - INTERVAL '1 hour'
        AND (k.value < d.critical_threshold OR k.value < d.warning_threshold)

  - name: Send Alerts
    type: condition
    condition: alerts.length > 0
    true:
      - name: Notify Slack
        type: slack
        channel: "#analytics-alerts"
        message: |
          ⚠️ KPI Alert!
          {{ #each alerts }}
          - {{ name }}: {{ value }} ({{ status }})
          {{ /each }}
```

### Scheduled Report

```yaml
name: BI_Scheduled_Reports
trigger:
  - type: schedule
    cron: "0 7 * * *"  # Every day at 7:00

nodes:
  - name: Get Due Reports
    type: supabase
    query: |
      SELECT * FROM saved_reports
      WHERE is_scheduled = true
        AND next_run_at <= NOW()

  - name: Execute Each Report
    type: loop
    items: reports
    nodes:
      - name: Run Report Query
        type: supabase_rpc
        function: execute_report
        params:
          report_id: "{{ report.id }}"

      - name: Generate PDF
        type: puppeteer_pdf
        template: report_template
        data: "{{ query_result }}"

      - name: Send Email
        type: mailgun
        to: "{{ report.schedule_recipients }}"
        subject: "{{ report.name }} - {{ formatDate(now, 'YYYY.MM.DD') }}"
        attachments:
          - pdf_file

      - name: Update Next Run
        type: supabase
        operation: update
        table: saved_reports
        filter: "id = '{{ report.id }}'"
        data:
          last_run_at: NOW()
          next_run_at: "{{ calculateNextRun(report.schedule_cron) }}"
```

## Acceptance Criteria

### AC-01: Executive Dashboard
- [ ] 8+ key KPIs displayed
- [ ] Period selection (day/week/month/quarter/year)
- [ ] Location filter
- [ ] Comparison to previous period
- [ ] Trend visualization
- [ ] Alert indicators

### AC-02: Financial Analytics
- [ ] Revenue breakdown by type
- [ ] Revenue trend chart
- [ ] Aging report for AR
- [ ] Forecast based on bookings
- [ ] Location comparison

### AC-03: Marketing Analytics
- [ ] Lead source performance
- [ ] Conversion funnel
- [ ] CAC and LTV calculation
- [ ] Campaign ROI
- [ ] Lead scoring effectiveness

### AC-04: Custom Reports
- [ ] Data source selection
- [ ] Column configuration
- [ ] Filter builder
- [ ] Grouping and sorting
- [ ] Preview
- [ ] Export (PDF, Excel)
- [ ] Scheduling

### AC-05: Alerts
- [ ] Threshold configuration
- [ ] Real-time monitoring
- [ ] Multi-channel notifications
- [ ] Alert history

---

**Next**: Proceed to [08-DATABASE_SCHEMA.md](./08-DATABASE_SCHEMA.md) for complete database schema.
