# eaisy — Dental Tourism Module

> **⚠️ TECH STACK TRANSLATION REQUIRED**
>
> The UI code examples in this file use **shadcn/ui, Tailwind CSS, Lucide icons, React Router, and React Query** — these are NOT used in the actual project.
>
> When implementing, translate all UI code to use:
> - **CSS Modules** (not Tailwind `className` strings)
> - **eaisy-components** (`Table`, `Badge`, `StatusBadge`, `Avatar`, `Drawer`, `InputField`, `Dropdown`, `Button`, `Tabs`, etc.)
> - **Phosphor Icons** (`@phosphor-icons/react`) instead of Lucide
> - **Next.js App Router** routing
> - **Direct Supabase client** calls
>
> See skills: `eaisy-components`, `eaisy-build-workflow`, `eaisy-supabase-patterns`

## Module Overview

The Dental Tourism module manages international patients, from initial online consultation through treatment coordination, travel arrangements, multi-currency billing, and post-treatment aftercare.

## Target Markets

| Country | Share | Currency | Language |
|---------|-------|----------|----------|
| 🇬🇧 UK | 45% | GBP | EN |
| 🇩🇪 Germany | 28% | EUR | DE |
| 🇦🇹 Austria | 12% | EUR | DE |
| 🇮🇪 Ireland | 8% | EUR | EN |
| 🇨🇭 Switzerland | 4% | CHF | DE |
| 🇳🇱 Netherlands | 3% | EUR | EN |

## Database Schema

### international_patient_details

```sql
CREATE TABLE international_patient_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL UNIQUE,
  
  -- Country & Language
  country_code VARCHAR(2) NOT NULL,
  preferred_language VARCHAR(2) DEFAULT 'en',
  timezone VARCHAR(50),
  
  -- Contact preferences
  whatsapp_number VARCHAR(20),
  preferred_contact_channel VARCHAR(20) DEFAULT 'email',
  -- Channels: email, whatsapp, phone
  
  -- Documents
  passport_number VARCHAR(50),
  passport_expiry DATE,
  
  -- Pricing
  preferred_currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Referral
  referral_source VARCHAR(50),
  referral_agency_id UUID REFERENCES partner_agencies(id),
  
  -- Stats
  total_visits INT DEFAULT 0,
  total_spend_eur DECIMAL(12, 2) DEFAULT 0,
  first_visit_date DATE,
  last_visit_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### patient_travel_details

```sql
CREATE TABLE patient_travel_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  
  -- Trip info
  trip_reference VARCHAR(20) NOT NULL UNIQUE,
  -- Format: DT-2026-00001
  
  -- Travel dates
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  
  -- Flight info
  arrival_flight_number VARCHAR(20),
  arrival_time TIME,
  arrival_airport VARCHAR(10) DEFAULT 'BUD',
  departure_flight_number VARCHAR(20),
  departure_time TIME,
  
  -- Accommodation
  hotel_id UUID REFERENCES travel_partners(id),
  hotel_booking_reference VARCHAR(50),
  hotel_check_in DATE,
  hotel_check_out DATE,
  room_type VARCHAR(50),
  
  -- Transfer
  arrival_transfer_booked BOOLEAN DEFAULT FALSE,
  arrival_transfer_partner_id UUID REFERENCES travel_partners(id),
  departure_transfer_booked BOOLEAN DEFAULT FALSE,
  departure_transfer_partner_id UUID REFERENCES travel_partners(id),
  
  -- Companions
  number_of_companions INT DEFAULT 0,
  companion_details JSONB,
  
  -- Interpreter
  interpreter_required BOOLEAN DEFAULT FALSE,
  interpreter_language VARCHAR(2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'planned',
  -- Status: planned, confirmed, in_progress, completed, cancelled
  
  -- Notes
  special_requirements TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### travel_partners

```sql
CREATE TABLE travel_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  partner_type VARCHAR(20) NOT NULL,
  -- Types: hotel, transfer, interpreter, tour_guide, agency
  
  name VARCHAR(200) NOT NULL,
  
  -- Contact
  contact_person VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address
  address TEXT,
  
  -- Commission
  commission_type VARCHAR(20), -- percentage, fixed
  commission_value DECIMAL(8, 2),
  
  -- Booking
  booking_url TEXT,
  booking_email VARCHAR(255),
  
  -- Status
  is_preferred BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### treatment_packages

```sql
CREATE TABLE treatment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(20) NOT NULL UNIQUE,
  
  -- Multilingual
  name_en VARCHAR(200) NOT NULL,
  name_de VARCHAR(200),
  name_hu VARCHAR(200),
  
  description_en TEXT,
  description_de TEXT,
  description_hu TEXT,
  
  -- Pricing
  price_eur DECIMAL(12, 2) NOT NULL,
  price_gbp DECIMAL(12, 2),
  price_chf DECIMAL(12, 2),
  
  -- Comparison
  uk_comparison_price DECIMAL(12, 2),
  savings_percentage DECIMAL(5, 2),
  
  -- Package contents
  includes JSONB NOT NULL,
  -- [{"treatment_type_id": "uuid", "quantity": 1, "description": "..."}]
  
  -- Duration
  typical_visits INT DEFAULT 2,
  typical_days INT DEFAULT 5,
  
  -- Guarantee
  guarantee_months INT,
  guarantee_terms TEXT,
  
  -- Optional add-ons
  available_addons JSONB,
  -- [{"id": "hotel_upgrade", "name": "4* Hotel Upgrade", "price_eur": 150}]
  
  -- Display
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### online_consultations

```sql
CREATE TABLE online_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request info
  request_reference VARCHAR(20) NOT NULL UNIQUE,
  -- Format: OC-2026-00001
  
  -- Contact
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  country_code VARCHAR(2) NOT NULL,
  
  -- Inquiry
  primary_concern TEXT NOT NULL,
  additional_notes TEXT,
  
  -- Documents
  uploaded_documents JSONB DEFAULT '[]',
  -- [{"type": "xray", "filename": "...", "storage_path": "..."}]
  
  has_xray BOOLEAN DEFAULT FALSE,
  has_photos BOOLEAN DEFAULT FALSE,
  
  -- Processing
  status VARCHAR(20) DEFAULT 'new',
  -- Status: new, reviewing, quoted, scheduled, converted, declined
  
  assigned_to UUID REFERENCES staff(id),
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Quote
  quote_id UUID REFERENCES international_quotes(id),
  quote_sent_at TIMESTAMPTZ,
  quote_viewed_at TIMESTAMPTZ,
  quote_accepted_at TIMESTAMPTZ,
  
  -- Conversion
  converted_to_patient_id UUID REFERENCES patients(id),
  converted_to_lead_id UUID REFERENCES leads(id),
  
  -- Communication
  last_contact_at TIMESTAMPTZ,
  
  -- Tracking
  source VARCHAR(50),
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  landing_page TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### international_quotes

```sql
CREATE TABLE international_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  quote_reference VARCHAR(20) NOT NULL UNIQUE,
  -- Format: Q-2026-00001
  
  -- Patient/Consultation
  consultation_id UUID REFERENCES online_consultations(id),
  patient_id UUID REFERENCES patients(id),
  
  -- Validity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until DATE NOT NULL,
  
  -- Currency
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  exchange_rate DECIMAL(10, 4),
  exchange_rate_locked_until DATE,
  
  -- Totals
  treatment_total DECIMAL(12, 2) NOT NULL,
  travel_total DECIMAL(12, 2) DEFAULT 0,
  grand_total DECIMAL(12, 2) NOT NULL,
  
  -- UK comparison
  uk_equivalent_price DECIMAL(12, 2),
  savings_amount DECIMAL(12, 2),
  savings_percentage DECIMAL(5, 2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',
  -- Status: draft, sent, viewed, accepted, rejected, expired
  
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  patient_message TEXT,
  
  -- Created by
  created_by UUID REFERENCES staff(id)
);

CREATE TABLE international_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  quote_id UUID REFERENCES international_quotes(id) ON DELETE CASCADE NOT NULL,
  
  item_type VARCHAR(20) NOT NULL, -- treatment, travel, addon
  
  -- For treatments
  treatment_type_id UUID REFERENCES treatment_types(id),
  package_id UUID REFERENCES treatment_packages(id),
  
  -- For travel
  travel_item_type VARCHAR(30), -- hotel, transfer, interpreter
  
  -- Details
  description VARCHAR(500) NOT NULL,
  quantity INT DEFAULT 1,
  
  -- Pricing
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  
  -- Comparison
  uk_price DECIMAL(12, 2),
  
  line_order INT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### patient_aftercare

```sql
CREATE TABLE patient_aftercare (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  patient_id UUID REFERENCES patients(id) NOT NULL,
  travel_id UUID REFERENCES patient_travel_details(id),
  
  -- Treatment reference
  treatment_ids UUID[],
  
  -- Schedule
  aftercare_schedule JSONB NOT NULL,
  -- [{"day": 3, "type": "photo", "description": "..."}, {"day": 7, "type": "video_call"}]
  
  -- Current status
  current_phase VARCHAR(30) DEFAULT 'initial',
  -- Phases: initial, healing, followup, complete
  
  -- Check-ins
  last_checkin_at TIMESTAMPTZ,
  next_checkin_due DATE,
  
  -- Concerns
  has_concerns BOOLEAN DEFAULT FALSE,
  concern_details TEXT,
  concern_severity VARCHAR(20), -- low, medium, high, urgent
  
  -- Documents
  aftercare_instructions_sent BOOLEAN DEFAULT FALSE,
  guarantee_document_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE aftercare_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  aftercare_id UUID REFERENCES patient_aftercare(id) NOT NULL,
  
  -- Check-in details
  checkin_type VARCHAR(20) NOT NULL,
  -- Types: photo, video_call, message, form
  
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Content
  patient_message TEXT,
  patient_photos JSONB, -- Array of storage paths
  
  -- Review
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Outcome
  outcome VARCHAR(20),
  -- Outcomes: normal, minor_issue, needs_attention, emergency
  
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## UI Components

### DentalTourismDashboard

```typescript
// pages/dental-tourism/index.tsx
export function DentalTourismDashboard() {
  const { stats, isLoading } = useDTStats();
  const { upcomingArrivals } = useUpcomingArrivals();
  const { newConsultations } = useNewConsultations();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dental Tourism</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dt/consultations')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Konzultációk
          </Button>
          <Button onClick={() => navigate('/dt/patients/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Új páciens
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Bevétel (hónap)"
          value={`€${formatNumber(stats.monthlyRevenue)}`}
          change={stats.revenueChange}
          icon={Euro}
        />
        <KPICard
          title="Új konzultáció"
          value={stats.newConsultations}
          icon={MessageSquare}
          variant={stats.newConsultations > 0 ? 'warning' : 'default'}
        />
        <KPICard
          title="Érkező páciensek"
          value={stats.upcomingArrivals}
          subtitle="Következő 7 nap"
          icon={Plane}
        />
        <KPICard
          title="Konverziós ráta"
          value={`${stats.conversionRate}%`}
          change={stats.conversionChange}
          icon={TrendingUp}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Upcoming Arrivals */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Érkező páciensek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingArrivals.map((arrival) => (
                <div
                  key={arrival.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getCountryFlag(arrival.country_code)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {arrival.patient.last_name} {arrival.patient.first_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(arrival.arrival_date, 'yyyy.MM.dd')} - 
                        {format(arrival.departure_date, 'yyyy.MM.dd')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {arrival.arrival_transfer_booked ? (
                      <Badge variant="success">Transzfer OK</Badge>
                    ) : (
                      <Badge variant="warning">Transzfer hiányzik</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dt/trips/${arrival.id}`)}
                    >
                      Részletek
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* New Consultations */}
        <Card>
          <CardHeader>
            <CardTitle>Új konzultációk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/dt/consultations/${consultation.id}`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {consultation.first_name} {consultation.last_name}
                    </span>
                    <span className="text-xl">
                      {getCountryFlag(consultation.country_code)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {consultation.primary_concern}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {consultation.has_xray && (
                      <Badge variant="outline" className="text-xs">
                        <FileImage className="w-3 h-3 mr-1" />
                        Röntgen
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatRelative(consultation.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Country Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ország szerinti bontás (hónap)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {stats.byCountry.map((country) => (
              <div
                key={country.code}
                className="text-center p-4 border rounded-lg"
              >
                <div className="text-3xl mb-2">
                  {getCountryFlag(country.code)}
                </div>
                <p className="font-medium">{country.patients} páciens</p>
                <p className="text-sm text-gray-500">
                  €{formatNumber(country.revenue)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### OnlineConsultationReview

```typescript
// pages/dental-tourism/consultations/[id].tsx
export function OnlineConsultationReview() {
  const { id } = useParams();
  const { consultation, isLoading } = useConsultation(id);
  const { generateQuote } = useGenerateQuote();

  if (isLoading) return <LoadingSpinner />;
  if (!consultation) return <NotFound />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {consultation.first_name} {consultation.last_name}
          </h1>
          <p className="text-gray-500">
            {consultation.request_reference} • 
            {getCountryName(consultation.country_code)}
          </p>
        </div>
        <Badge variant={getStatusVariant(consultation.status)}>
          {getStatusLabel(consultation.status)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Patient Inquiry */}
          <Card>
            <CardHeader>
              <CardTitle>Érdeklődés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Fő probléma</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {consultation.primary_concern}
                  </p>
                </div>
                {consultation.additional_notes && (
                  <div>
                    <Label>További megjegyzések</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {consultation.additional_notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Uploaded Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Feltöltött dokumentumok</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {consultation.uploaded_documents.map((doc, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md"
                    onClick={() => openDocument(doc)}
                  >
                    {doc.type === 'xray' ? (
                      <img
                        src={getSignedUrl(doc.storage_path)}
                        alt="X-ray"
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-sm truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-500">{doc.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Treatment Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle>Kezelési javaslat</CardTitle>
            </CardHeader>
            <CardContent>
              <TreatmentRecommendationForm
                consultationId={consultation.id}
                onGenerate={generateQuote}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Kapcsolat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${consultation.email}`} className="text-blue-600">
                    {consultation.email}
                  </a>
                </div>
                {consultation.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{consultation.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span>{getCountryName(consultation.country_code)}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t space-y-2">
                <Button className="w-full" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Email küldése
                </Button>
                {consultation.phone && (
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Forrás</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {consultation.source && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Forrás:</span>
                    <span>{consultation.source}</span>
                  </div>
                )}
                {consultation.utm_campaign && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kampány:</span>
                    <span>{consultation.utm_campaign}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Beérkezett:</span>
                  <span>{format(consultation.created_at, 'yyyy.MM.dd HH:mm')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowQuoteModal(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Ajánlat készítése
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => convertToPatient()}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Pácienssé konvertálás
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => markAsDeclined()}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Elutasítás
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### QuoteBuilder

```typescript
// components/dental-tourism/QuoteBuilder.tsx
export function QuoteBuilder({ consultationId, patient }: QuoteBuilderProps) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [validDays, setValidDays] = useState(30);
  
  const { packages } = useTreatmentPackages();
  const { exchangeRates } = useExchangeRates();
  const { createQuote } = useCreateQuote();

  const totals = useMemo(() => {
    const treatment = items
      .filter(i => i.type === 'treatment')
      .reduce((sum, i) => sum + i.total_price, 0);
    const travel = items
      .filter(i => i.type === 'travel')
      .reduce((sum, i) => sum + i.total_price, 0);
    
    return {
      treatment,
      travel,
      grand: treatment + travel,
    };
  }, [items]);

  // Calculate UK comparison
  const ukTotal = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.uk_price || 0), 0);
  }, [items]);

  const savings = ukTotal - totals.grand;
  const savingsPercent = ukTotal > 0 ? (savings / ukTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <div className="flex items-center gap-4">
        <Label>Pénznem</Label>
        <div className="flex gap-2">
          {(['EUR', 'GBP', 'CHF'] as Currency[]).map((curr) => (
            <Button
              key={curr}
              variant={currency === curr ? 'default' : 'outline'}
              onClick={() => setCurrency(curr)}
            >
              {getCurrencySymbol(curr)} {curr}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Treatment Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Kezelési csomagok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  'p-4 border rounded-lg cursor-pointer hover:shadow-md',
                  items.some(i => i.package_id === pkg.id) && 'border-blue-500 bg-blue-50'
                )}
                onClick={() => togglePackage(pkg)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{pkg.name_en}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {pkg.typical_visits} visits • {pkg.typical_days} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(pkg[`price_${currency.toLowerCase()}`] || pkg.price_eur, currency)}
                    </p>
                    {pkg.uk_comparison_price && (
                      <p className="text-sm text-green-600">
                        Save {pkg.savings_percentage}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tételek</CardTitle>
            <Button variant="outline" size="sm" onClick={addCustomItem}>
              <Plus className="w-4 h-4 mr-1" />
              Tétel hozzáadása
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leírás</TableHead>
                <TableHead className="w-24">Mennyiség</TableHead>
                <TableHead className="w-32">Egységár</TableHead>
                <TableHead className="w-32">UK ár</TableHead>
                <TableHead className="w-32">Összesen</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.uk_price || ''}
                      onChange={(e) => updateItem(index, { uk_price: Number(e.target.value) })}
                      placeholder="UK price"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.total_price, currency)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Travel Items */}
      <Card>
        <CardHeader>
          <CardTitle>Utazási szolgáltatások</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TravelItemSelector
              type="hotel"
              label="Szállás"
              value={travelItems.hotel}
              onChange={(v) => setTravelItems(t => ({ ...t, hotel: v }))}
            />
            <TravelItemSelector
              type="transfer"
              label="Reptéri transzfer"
              value={travelItems.transfer}
              onChange={(v) => setTravelItems(t => ({ ...t, transfer: v }))}
            />
            <TravelItemSelector
              type="interpreter"
              label="Tolmács"
              value={travelItems.interpreter}
              onChange={(v) => setTravelItems(t => ({ ...t, interpreter: v }))}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Summary */}
      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">Összesítés</h3>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between gap-8">
                  <span>Kezelések:</span>
                  <span>{formatCurrency(totals.treatment, currency)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span>Utazás:</span>
                  <span>{formatCurrency(totals.travel, currency)}</span>
                </div>
                <div className="flex justify-between gap-8 font-bold text-lg pt-2 border-t">
                  <span>Végösszeg:</span>
                  <span>{formatCurrency(totals.grand, currency)}</span>
                </div>
              </div>
            </div>
            
            {ukTotal > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-500">UK-ban fizetne</div>
                <div className="text-lg line-through text-gray-400">
                  {formatCurrency(ukTotal, 'GBP')}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  -{savingsPercent.toFixed(0)}%
                </div>
                <div className="text-sm text-green-600">
                  Megtakarítás: {formatCurrency(savings, currency)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">
          Piszkozat mentése
        </Button>
        <Button onClick={() => previewQuote()}>
          <Eye className="w-4 h-4 mr-2" />
          Előnézet
        </Button>
        <Button onClick={() => sendQuote()}>
          <Send className="w-4 h-4 mr-2" />
          Küldés páciensnek
        </Button>
      </div>
    </div>
  );
}
```

## n8n Workflows

### Consultation Processing

```yaml
name: DT_Consultation_Processing
trigger:
  - type: webhook
    path: /webhook/dt-consultation

nodes:
  - name: Create Lead
    type: supabase
    operation: insert
    table: leads
    data:
      first_name: "{{ consultation.first_name }}"
      last_name: "{{ consultation.last_name }}"
      email: "{{ consultation.email }}"
      phone: "{{ consultation.phone }}"
      source: "dental_tourism"
      source_detail: "{{ consultation.source }}"
      interested_in: ["dental_tourism"]

  - name: Send Confirmation Email
    type: mailgun
    to: "{{ consultation.email }}"
    subject: "Thank you for your enquiry - MOLaiRE Dental"
    template: dt_consultation_received
    variables:
      first_name: "{{ consultation.first_name }}"
      reference: "{{ consultation.request_reference }}"

  - name: Notify Coordinator
    type: slack
    channel: "#dental-tourism"
    message: |
      🌍 New consultation request!
      
      👤 {{ consultation.first_name }} {{ consultation.last_name }}
      🏳️ {{ consultation.country_code }}
      📧 {{ consultation.email }}
      📷 X-ray: {{ consultation.has_xray ? 'Yes' : 'No' }}
      
      <{{ app_url }}/dt/consultations/{{ consultation.id }}|View details>
```

### Travel Reminder

```yaml
name: DT_Travel_Reminder
trigger:
  - type: schedule
    cron: "0 9 * * *"

nodes:
  - name: Get Upcoming Trips
    type: supabase
    query: |
      SELECT t.*, p.*, ipd.*
      FROM patient_travel_details t
      JOIN patients p ON t.patient_id = p.id
      JOIN international_patient_details ipd ON p.id = ipd.patient_id
      WHERE t.arrival_date BETWEEN CURRENT_DATE + INTERVAL '1 day' 
                               AND CURRENT_DATE + INTERVAL '2 days'
        AND t.status = 'confirmed'

  - name: Send 48h Reminder
    type: condition
    condition: trip.arrival_date == tomorrow + 1
    true:
      - name: Send Email
        type: mailgun
        template: dt_arrival_reminder_48h
        
      - name: Send WhatsApp
        type: twilio_whatsapp
        template: arrival_reminder

  - name: Send 24h Reminder
    type: condition
    condition: trip.arrival_date == tomorrow
    true:
      - name: Send Final Checklist
        type: mailgun
        template: dt_arrival_checklist
```

## Acceptance Criteria

### AC-01: Consultation Management
- [ ] Online form submission creates consultation
- [ ] Document upload (X-rays, photos)
- [ ] Consultation list with filters
- [ ] Status workflow
- [ ] Assignment to coordinator

### AC-02: Quote Generation
- [ ] Package selection
- [ ] Custom item entry
- [ ] Multi-currency support
- [ ] UK price comparison
- [ ] Savings calculation
- [ ] Quote PDF generation
- [ ] Email sending

### AC-03: Travel Coordination
- [ ] Trip creation
- [ ] Flight details capture
- [ ] Hotel booking tracking
- [ ] Transfer booking
- [ ] Itinerary generation

### AC-04: Aftercare Portal
- [ ] Patient login (magic link)
- [ ] Treatment progress view
- [ ] Photo upload
- [ ] Message sending
- [ ] Document download
- [ ] Next visit scheduling

---

**Next**: Proceed to [07-MODULE_BI_ANALYTICS.md](./07-MODULE_BI_ANALYTICS.md) for BI/Analytics module.
