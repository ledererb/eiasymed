# eaisy — Patient Records & Dental Chart Module

> **⚠️ TECH STACK TRANSLATION REQUIRED**
>
> The UI code examples in this file use **shadcn/ui, Tailwind CSS, Lucide icons, React Router, and React Hook Form + Zod** — these are NOT used in the actual project.
>
> When implementing, translate all UI code to use:
> - **CSS Modules** (not Tailwind `className` strings)
> - **eaisy-components** (`Table`, `TabbedPanel`, `Drawer`, `Breadcrumbs`, `StatusBadge`, `Tabs`, `Button`, `InputField`, `Dropdown`, `StatusTabbedPanel`, etc.)
> - **Phosphor Icons** (`@phosphor-icons/react`) instead of Lucide
> - **Next.js App Router** (`useParams from 'next/navigation'`) instead of React Router
> - **Direct Supabase client** calls instead of React Query
>
> See skills: `eaisy-components`, `eaisy-build-workflow`, `eaisy-supabase-patterns`
>
> **Status**: ✅ Kezelés (consultation) page and dental chart showcase are already built.

## Module Overview

The Patient Records module manages all patient information, medical history, and the interactive dental chart (Fogstátusz). It integrates with the Voxis AI system for voice-based documentation.

## Features

### Core Features (MVP)
- Patient CRUD operations
- Patient search & filtering
- Medical history & anamnesis
- Interactive FDI dental chart
- Treatment history
- Document management

### Advanced Features (Post-MVP)
- Voxis AI voice transcription
- TreatNote AI treatment planning
- EESZT integration
- Patient portal
- Family linking

## Database Schema

### patients

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
  tax_id VARCHAR(10),    -- Tax ID (optional)
  
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
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id),
  
  -- Constraints
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

### patient_medical_history

```sql
CREATE TABLE patient_medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  
  -- Medical Conditions
  conditions JSONB DEFAULT '[]',
  -- [{"code": "diabetes", "name": "Cukorbetegség", "since": "2020", "notes": "..."}]
  
  -- Allergies
  allergies JSONB DEFAULT '[]',
  -- [{"type": "medication", "name": "Penicillin", "severity": "severe", "reaction": "..."}]
  
  -- Medications
  current_medications JSONB DEFAULT '[]',
  -- [{"name": "Metformin", "dosage": "500mg", "frequency": "2x daily"}]
  
  -- Risk Factors
  is_smoker BOOLEAN DEFAULT FALSE,
  smoking_details VARCHAR(100),
  alcohol_consumption VARCHAR(50),
  
  -- Dental Specific
  has_dental_anxiety BOOLEAN DEFAULT FALSE,
  anxiety_level INT, -- 1-10
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
  recent_heart_surgery BOOLEAN DEFAULT FALSE,
  
  -- Other
  pregnant BOOLEAN DEFAULT FALSE,
  pregnancy_week INT,
  breastfeeding BOOLEAN DEFAULT FALSE,
  
  -- Infectious Diseases
  hepatitis BOOLEAN DEFAULT FALSE,
  hepatitis_type VARCHAR(5),
  hiv_positive BOOLEAN DEFAULT FALSE,
  
  -- Documents
  medical_documents JSONB DEFAULT '[]',
  
  -- Review
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES staff(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(patient_id)
);
```

### dental_chart (Fogstátusz)

```sql
CREATE TABLE dental_chart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  
  -- FDI notation: 11-18, 21-28, 31-38, 41-48 (adults)
  -- FDI notation: 51-55, 61-65, 71-75, 81-85 (children)
  tooth_number VARCHAR(2) NOT NULL,
  
  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'healthy',
  -- healthy, caries, filled, crown, bridge_abutment, bridge_pontic,
  -- implant, missing, extracted, root_canal, veneer, inlay, onlay
  
  -- Surfaces affected (for caries/fillings)
  surfaces VARCHAR(10), -- MODBL (Mesial, Occlusal, Distal, Buccal, Lingual)
  
  -- Additional flags
  mobility INT, -- 0-3
  percussion_sensitive BOOLEAN DEFAULT FALSE,
  periapical_lesion BOOLEAN DEFAULT FALSE,
  gum_recession_mm INT,
  pocket_depth_mm INT,
  
  -- Prosthetics
  prosthetic_type VARCHAR(30),
  prosthetic_material VARCHAR(50),
  prosthetic_shade VARCHAR(20),
  
  -- Implant specific
  implant_system VARCHAR(100),
  implant_diameter DECIMAL(3,1),
  implant_length DECIMAL(3,1),
  implant_date DATE,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES staff(id),
  
  UNIQUE(patient_id, tooth_number)
);

-- Index for fast patient lookup
CREATE INDEX idx_dental_chart_patient ON dental_chart(patient_id);
```

### dental_chart_history

```sql
CREATE TABLE dental_chart_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  dental_chart_id UUID REFERENCES dental_chart(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  tooth_number VARCHAR(2) NOT NULL,
  
  -- Previous state
  previous_status VARCHAR(30),
  previous_surfaces VARCHAR(10),
  previous_data JSONB,
  
  -- New state
  new_status VARCHAR(30),
  new_surfaces VARCHAR(10),
  new_data JSONB,
  
  -- Change info
  change_reason TEXT,
  treatment_id UUID REFERENCES treatments(id),
  
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES staff(id)
);
```

### treatments

```sql
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  patient_id UUID REFERENCES patients(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  doctor_id UUID REFERENCES staff(id) NOT NULL,
  
  -- Treatment details
  treatment_type_id UUID REFERENCES treatment_types(id) NOT NULL,
  tooth_numbers VARCHAR(50)[], -- Array of affected teeth
  
  -- Clinical
  diagnosis TEXT,
  procedure_notes TEXT,
  materials_used JSONB,
  
  -- OENO/BNO codes
  oeno_code VARCHAR(10),
  bno_code VARCHAR(10),
  
  -- Pricing
  list_price DECIMAL(10, 2),
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  final_price DECIMAL(10, 2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed',
  -- planned, in_progress, completed, cancelled
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);
```

### treatment_types

```sql
CREATE TABLE treatment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  
  -- Category
  category VARCHAR(50) NOT NULL,
  -- categories: diagnostic, preventive, restorative, endodontic, 
  -- periodontic, prosthodontic, orthodontic, surgical, implant, cosmetic
  
  -- Codes
  oeno_code VARCHAR(10),
  
  -- Pricing
  base_price DECIMAL(10, 2),
  
  -- Duration
  estimated_duration_minutes INT DEFAULT 30,
  
  -- Settings
  requires_xray BOOLEAN DEFAULT FALSE,
  requires_anesthesia BOOLEAN DEFAULT FALSE,
  tooth_specific BOOLEAN DEFAULT TRUE,
  
  -- Health fund eligibility
  health_fund_eligible BOOLEAN DEFAULT FALSE,
  health_fund_code VARCHAR(20),
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default treatment types
INSERT INTO treatment_types (code, name, category, base_price, estimated_duration_minutes) VALUES
  ('EXAM', 'Vizsgálat', 'diagnostic', 8000, 30),
  ('XRAY_PERI', 'Periapikális röntgen', 'diagnostic', 3000, 10),
  ('XRAY_PAN', 'Panoráma röntgen', 'diagnostic', 8000, 15),
  ('CLEANING', 'Fogkőeltávolítás', 'preventive', 15000, 30),
  ('FILLING_COMP', 'Kompozit tömés', 'restorative', 25000, 45),
  ('ROOT_CANAL', 'Gyökérkezelés', 'endodontic', 45000, 60),
  ('EXTRACTION', 'Foghúzás', 'surgical', 20000, 30),
  ('CROWN', 'Korona', 'prosthodontic', 120000, 60),
  ('IMPLANT', 'Implantátum beültetés', 'implant', 280000, 90),
  ('VENEER', 'Héj', 'cosmetic', 150000, 60);
```

## UI Components

### PatientListPage

```typescript
// pages/patients/index.tsx
import { useState } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { NewPatientModal } from '@/components/patients/NewPatientModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

export function PatientListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  
  const { patients, isLoading, totalCount } = usePatients({
    search,
    ...filters,
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Páciensek</h1>
        <Button onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Új páciens
        </Button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Keresés név, telefon vagy email alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <PatientFilters filters={filters} onChange={setFilters} />
      </div>
      
      <PatientTable
        patients={patients}
        isLoading={isLoading}
        totalCount={totalCount}
      />
      
      <NewPatientModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </div>
  );
}
```

### PatientDetailPage

```typescript
// pages/patients/[id]/index.tsx
import { useParams } from 'react-router-dom';
import { usePatient } from '@/hooks/usePatient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientHeader } from '@/components/patients/PatientHeader';
import { PatientOverview } from '@/components/patients/PatientOverview';
import { DentalChart } from '@/components/patients/DentalChart';
import { MedicalHistory } from '@/components/patients/MedicalHistory';
import { TreatmentHistory } from '@/components/patients/TreatmentHistory';
import { PatientDocuments } from '@/components/patients/PatientDocuments';
import { PatientBilling } from '@/components/patients/PatientBilling';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { patient, isLoading } = usePatient(id);

  if (isLoading) return <LoadingSpinner />;
  if (!patient) return <NotFound />;

  return (
    <div className="h-screen flex flex-col">
      <PatientHeader patient={patient} />
      
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="px-6 border-b">
          <TabsTrigger value="overview">Áttekintés</TabsTrigger>
          <TabsTrigger value="dental-chart">Fogstátusz</TabsTrigger>
          <TabsTrigger value="medical">Anamnézis</TabsTrigger>
          <TabsTrigger value="treatments">Kezelések</TabsTrigger>
          <TabsTrigger value="documents">Dokumentumok</TabsTrigger>
          <TabsTrigger value="billing">Pénzügy</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-auto p-6">
          <TabsContent value="overview">
            <PatientOverview patient={patient} />
          </TabsContent>
          
          <TabsContent value="dental-chart">
            <DentalChart patientId={patient.id} />
          </TabsContent>
          
          <TabsContent value="medical">
            <MedicalHistory patientId={patient.id} />
          </TabsContent>
          
          <TabsContent value="treatments">
            <TreatmentHistory patientId={patient.id} />
          </TabsContent>
          
          <TabsContent value="documents">
            <PatientDocuments patientId={patient.id} />
          </TabsContent>
          
          <TabsContent value="billing">
            <PatientBilling patientId={patient.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
```

### DentalChart Component (Interactive Tooth Map)

```typescript
// components/patients/DentalChart.tsx
import { useState } from 'react';
import { useDentalChart } from '@/hooks/useDentalChart';
import { ToothSVG } from './ToothSVG';
import { ToothDetailPanel } from './ToothDetailPanel';
import { DentalChartLegend } from './DentalChartLegend';

interface DentalChartProps {
  patientId: string;
  readonly?: boolean;
}

// FDI tooth numbering
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28'];
const LOWER_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38'];
const LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];

export function DentalChart({ patientId, readonly = false }: DentalChartProps) {
  const { teeth, updateTooth, isLoading } = useDentalChart(patientId);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [isPediatric, setIsPediatric] = useState(false);

  const getToothData = (number: string) => {
    return teeth.find(t => t.tooth_number === number) || {
      tooth_number: number,
      status: 'healthy',
    };
  };

  return (
    <div className="flex gap-6">
      {/* Main Chart */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Fogstátusz</h2>
          <div className="flex items-center gap-2">
            <Switch
              checked={isPediatric}
              onCheckedChange={setIsPediatric}
            />
            <label>Tejfogak</label>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          {/* Upper jaw */}
          <div className="flex justify-center gap-1 mb-2">
            <div className="flex gap-1">
              {UPPER_RIGHT.map((num) => (
                <ToothSVG
                  key={num}
                  toothNumber={num}
                  data={getToothData(num)}
                  isSelected={selectedTooth === num}
                  onClick={() => setSelectedTooth(num)}
                  position="upper"
                />
              ))}
            </div>
            <div className="w-4" /> {/* Midline */}
            <div className="flex gap-1">
              {UPPER_LEFT.map((num) => (
                <ToothSVG
                  key={num}
                  toothNumber={num}
                  data={getToothData(num)}
                  isSelected={selectedTooth === num}
                  onClick={() => setSelectedTooth(num)}
                  position="upper"
                />
              ))}
            </div>
          </div>
          
          {/* Quadrant labels */}
          <div className="flex justify-center text-xs text-gray-500 mb-4">
            <span className="w-1/4 text-center">Q1 (Felső jobb)</span>
            <span className="w-1/4 text-center">Q2 (Felső bal)</span>
          </div>
          
          {/* Divider */}
          <div className="border-t border-dashed my-4" />
          
          {/* Quadrant labels */}
          <div className="flex justify-center text-xs text-gray-500 mb-2">
            <span className="w-1/4 text-center">Q4 (Alsó jobb)</span>
            <span className="w-1/4 text-center">Q3 (Alsó bal)</span>
          </div>
          
          {/* Lower jaw */}
          <div className="flex justify-center gap-1">
            <div className="flex gap-1">
              {LOWER_RIGHT.map((num) => (
                <ToothSVG
                  key={num}
                  toothNumber={num}
                  data={getToothData(num)}
                  isSelected={selectedTooth === num}
                  onClick={() => setSelectedTooth(num)}
                  position="lower"
                />
              ))}
            </div>
            <div className="w-4" /> {/* Midline */}
            <div className="flex gap-1">
              {LOWER_LEFT.map((num) => (
                <ToothSVG
                  key={num}
                  toothNumber={num}
                  data={getToothData(num)}
                  isSelected={selectedTooth === num}
                  onClick={() => setSelectedTooth(num)}
                  position="lower"
                />
              ))}
            </div>
          </div>
        </div>
        
        <DentalChartLegend />
      </div>
      
      {/* Detail Panel */}
      {selectedTooth && (
        <ToothDetailPanel
          toothNumber={selectedTooth}
          data={getToothData(selectedTooth)}
          onUpdate={(data) => updateTooth(selectedTooth, data)}
          onClose={() => setSelectedTooth(null)}
          readonly={readonly}
        />
      )}
    </div>
  );
}
```

### ToothSVG Component

```typescript
// components/patients/ToothSVG.tsx
import { cn } from '@/lib/utils';

interface ToothSVGProps {
  toothNumber: string;
  data: ToothData;
  isSelected: boolean;
  onClick: () => void;
  position: 'upper' | 'lower';
}

const STATUS_COLORS: Record<string, string> = {
  healthy: '#E5E7EB',      // Gray
  caries: '#FCA5A5',       // Red
  filled: '#93C5FD',       // Blue
  crown: '#FCD34D',        // Yellow
  implant: '#C4B5FD',      // Purple
  missing: '#FFFFFF',      // White (outline only)
  extracted: '#FFFFFF',    // White with X
  root_canal: '#FDBA74',   // Orange
  bridge_abutment: '#86EFAC', // Green
  bridge_pontic: '#86EFAC',   // Green (lighter)
};

export function ToothSVG({ toothNumber, data, isSelected, onClick, position }: ToothSVGProps) {
  const isMolar = ['6', '7', '8'].includes(toothNumber.slice(-1));
  const isPremolar = ['4', '5'].includes(toothNumber.slice(-1));
  const isIncisor = ['1', '2', '3'].includes(toothNumber.slice(-1));
  
  const fillColor = STATUS_COLORS[data.status] || STATUS_COLORS.healthy;
  
  return (
    <div
      className={cn(
        'relative cursor-pointer transition-transform hover:scale-110',
        isSelected && 'ring-2 ring-blue-500 rounded'
      )}
      onClick={onClick}
    >
      <svg
        width={isMolar ? 40 : isPremolar ? 35 : 30}
        height={50}
        viewBox="0 0 40 50"
      >
        {/* Tooth shape based on type */}
        {isMolar ? (
          <MolarShape fill={fillColor} position={position} />
        ) : isPremolar ? (
          <PremolarShape fill={fillColor} position={position} />
        ) : (
          <IncisorShape fill={fillColor} position={position} />
        )}
        
        {/* Surface indicators for fillings/caries */}
        {data.surfaces && (
          <SurfaceIndicators surfaces={data.surfaces} />
        )}
        
        {/* Missing/Extracted indicator */}
        {(data.status === 'missing' || data.status === 'extracted') && (
          <g stroke="#EF4444" strokeWidth="2">
            <line x1="5" y1="5" x2="35" y2="45" />
            <line x1="35" y1="5" x2="5" y2="45" />
          </g>
        )}
        
        {/* Implant indicator */}
        {data.status === 'implant' && (
          <circle cx="20" cy="35" r="6" fill="#7C3AED" />
        )}
      </svg>
      
      {/* Tooth number */}
      <div className="text-xs text-center text-gray-600 mt-1">
        {toothNumber}
      </div>
      
      {/* Indicators */}
      <div className="absolute -top-1 -right-1 flex gap-0.5">
        {data.mobility && data.mobility > 0 && (
          <span className="w-3 h-3 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">
            M
          </span>
        )}
        {data.periapical_lesion && (
          <span className="w-3 h-3 bg-orange-500 text-white text-[8px] rounded-full flex items-center justify-center">
            P
          </span>
        )}
      </div>
    </div>
  );
}
```

### ToothDetailPanel Component

```typescript
// components/patients/ToothDetailPanel.tsx
interface ToothDetailPanelProps {
  toothNumber: string;
  data: ToothData;
  onUpdate: (data: Partial<ToothData>) => void;
  onClose: () => void;
  readonly?: boolean;
}

export function ToothDetailPanel({
  toothNumber,
  data,
  onUpdate,
  onClose,
  readonly,
}: ToothDetailPanelProps) {
  const toothName = getToothName(toothNumber);

  return (
    <div className="w-80 bg-white border rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <h3 className="font-semibold">Fog #{toothNumber}</h3>
          <p className="text-sm text-gray-500">{toothName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Status */}
        <div>
          <label className="text-sm font-medium">Státusz</label>
          <Select
            value={data.status}
            onValueChange={(value) => onUpdate({ status: value })}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="healthy">Ép</SelectItem>
              <SelectItem value="caries">Szuvas</SelectItem>
              <SelectItem value="filled">Tömött</SelectItem>
              <SelectItem value="crown">Korona</SelectItem>
              <SelectItem value="implant">Implantátum</SelectItem>
              <SelectItem value="missing">Hiányzik</SelectItem>
              <SelectItem value="extracted">Eltávolított</SelectItem>
              <SelectItem value="root_canal">Gyökérkezelt</SelectItem>
              <SelectItem value="bridge_abutment">Híd pillér</SelectItem>
              <SelectItem value="bridge_pontic">Híd pótfog</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Surfaces (for caries/fillings) */}
        {['caries', 'filled'].includes(data.status) && (
          <div>
            <label className="text-sm font-medium">Érintett felszínek</label>
            <div className="flex gap-2 mt-1">
              {['M', 'O', 'D', 'B', 'L'].map((surface) => (
                <Button
                  key={surface}
                  variant={data.surfaces?.includes(surface) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const current = data.surfaces || '';
                    const newSurfaces = current.includes(surface)
                      ? current.replace(surface, '')
                      : current + surface;
                    onUpdate({ surfaces: newSurfaces });
                  }}
                  disabled={readonly}
                >
                  {surface}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              M=Mesial, O=Occlusal, D=Distal, B=Buccal, L=Lingual
            </p>
          </div>
        )}
        
        {/* Mobility */}
        <div>
          <label className="text-sm font-medium">Mozgathatóság</label>
          <Select
            value={String(data.mobility || 0)}
            onValueChange={(value) => onUpdate({ mobility: parseInt(value) })}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 - Nincs</SelectItem>
              <SelectItem value="1">1 - Enyhe (&lt;1mm)</SelectItem>
              <SelectItem value="2">2 - Mérsékelt (1-2mm)</SelectItem>
              <SelectItem value="3">3 - Súlyos (&gt;2mm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Clinical findings */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Klinikai leletek</label>
          <div className="space-y-1">
            <Checkbox
              checked={data.percussion_sensitive}
              onCheckedChange={(checked) => onUpdate({ percussion_sensitive: !!checked })}
              disabled={readonly}
            >
              Kopogtatásra érzékeny
            </Checkbox>
            <Checkbox
              checked={data.periapical_lesion}
              onCheckedChange={(checked) => onUpdate({ periapical_lesion: !!checked })}
              disabled={readonly}
            >
              Periapikális elváltozás
            </Checkbox>
          </div>
        </div>
        
        {/* Pocket depth */}
        <div>
          <label className="text-sm font-medium">Tasakmélység (mm)</label>
          <Input
            type="number"
            min={0}
            max={15}
            value={data.pocket_depth_mm || ''}
            onChange={(e) => onUpdate({ pocket_depth_mm: parseInt(e.target.value) || null })}
            disabled={readonly}
          />
        </div>
        
        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Megjegyzés</label>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            rows={3}
            disabled={readonly}
          />
        </div>
        
        {/* History link */}
        <Button variant="outline" className="w-full">
          <History className="w-4 h-4 mr-2" />
          Előzmények megtekintése
        </Button>
      </div>
    </div>
  );
}
```

## Voxis AI Integration

### Voice Transcription Flow

```typescript
// lib/voxis/transcription.ts
import { ElevenLabs } from 'elevenlabs';

interface VoxisTranscriptionResult {
  raw_text: string;
  structured_data: DentalFinding[];
  confidence: number;
}

interface DentalFinding {
  tooth_number: string;
  status: string;
  surfaces?: string;
  notes?: string;
}

export async function transcribeDentalDictation(
  audioBlob: Blob
): Promise<VoxisTranscriptionResult> {
  // Step 1: Transcribe audio with ElevenLabs
  const client = new ElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY });
  
  const transcription = await client.speechToText.convert({
    audio: audioBlob,
    model_id: 'scribe_v1',
    language_code: 'hu',
  });
  
  // Step 2: Parse with GPT-4 for structured extraction
  const structuredData = await parseWithGPT4(transcription.text);
  
  return {
    raw_text: transcription.text,
    structured_data: structuredData.findings,
    confidence: structuredData.confidence,
  };
}

async function parseWithGPT4(text: string): Promise<{
  findings: DentalFinding[];
  confidence: number;
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a dental documentation assistant. Parse Hungarian dental dictations and extract structured findings.

Use FDI tooth notation (11-48 for adult teeth).
Output JSON with tooth findings.

Example input: "A tizenhetes fogon MOD szuvasodás, a huszonnégyes gyökérkezelt, hiányzik a negyvenöt és negyvenhat."

Example output:
{
  "findings": [
    {"tooth_number": "17", "status": "caries", "surfaces": "MOD"},
    {"tooth_number": "24", "status": "root_canal"},
    {"tooth_number": "45", "status": "missing"},
    {"tooth_number": "46", "status": "missing"}
  ],
  "confidence": 0.95
}`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    response_format: { type: 'json_object' },
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### VoiceRecorder Component

```typescript
// components/patients/VoiceRecorder.tsx
import { useState, useRef } from 'react';
import { transcribeDentalDictation } from '@/lib/voxis/transcription';

interface VoiceRecorderProps {
  onTranscriptionComplete: (result: VoxisTranscriptionResult) => void;
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setIsProcessing(true);
      
      try {
        const result = await transcribeDentalDictation(audioBlob);
        onTranscriptionComplete(result);
      } catch (error) {
        console.error('Transcription error:', error);
        toast.error('Hiba történt a feldolgozás során');
      } finally {
        setIsProcessing(false);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-4">
      {isProcessing ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Feldolgozás...</span>
        </div>
      ) : isRecording ? (
        <>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>Felvétel...</span>
          </div>
          <Button onClick={stopRecording} variant="destructive">
            <Square className="w-4 h-4 mr-2" />
            Leállítás
          </Button>
        </>
      ) : (
        <Button onClick={startRecording}>
          <Mic className="w-4 h-4 mr-2" />
          Diktálás indítása
        </Button>
      )}
    </div>
  );
}
```

## Acceptance Criteria

### AC-01: Patient List
- [ ] Display all patients in paginated table
- [ ] Search by name, phone, email, TAJ
- [ ] Filter by status (active/inactive)
- [ ] Sort by name, last visit, created date
- [ ] Quick actions: view, edit, new appointment

### AC-02: Patient Creation
- [ ] Required fields: name, birth date, phone
- [ ] TAJ number validation (9 digits)
- [ ] Duplicate detection (name + birth date)
- [ ] Success notification with link to profile

### AC-03: Patient Profile
- [ ] Display all patient information
- [ ] Edit mode for all fields
- [ ] Photo upload
- [ ] Activity timeline

### AC-04: Dental Chart
- [ ] Display all 32 adult teeth (FDI notation)
- [ ] Toggle to pediatric teeth (20)
- [ ] Click to select tooth
- [ ] Color coding by status
- [ ] Update tooth status
- [ ] Surface selection for fillings
- [ ] History view per tooth

### AC-05: Medical History
- [ ] Conditions management
- [ ] Allergies with severity
- [ ] Current medications
- [ ] Risk factors
- [ ] Review date tracking

### AC-06: Treatment History
- [ ] List all past treatments
- [ ] Filter by date, type, doctor
- [ ] Link to related appointments
- [ ] Link to invoices

### AC-07: Voxis AI
- [ ] Voice recording in browser
- [ ] Real-time transcription display
- [ ] Structured data extraction
- [ ] Apply to dental chart with confirmation

---

**Next**: Proceed to [04-MODULE_CRM.md](./04-MODULE_CRM.md) for CRM & Lead Management module.
