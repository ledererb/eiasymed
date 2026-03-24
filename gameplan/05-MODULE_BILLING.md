# eaisy — Billing & Invoicing Module

> **⚠️ TECH STACK TRANSLATION REQUIRED**
>
> The UI code examples in this file use **shadcn/ui, Tailwind CSS, Lucide icons, and React Hook Form + Zod** — these are NOT used in the actual project.
>
> When implementing, translate all UI code to use:
> - **CSS Modules** (not Tailwind `className` strings)
> - **eaisy-components** (`Table`, `TreatmentPlanRow`, `NotificationModal`, `InputField`, `Dropdown`, `Button`, `StatusBadge`, etc.)
> - **Phosphor Icons** (`@phosphor-icons/react`) instead of Lucide
> - **Next.js App Router** routing
> - **Direct Supabase client** calls
>
> **Note**: The NAV API service code and Invoice XML builder are backend/Edge Function code and can be used as-is in Deno runtime.
>
> See skills: `eaisy-components`, `eaisy-build-workflow`, `eaisy-supabase-patterns`

## Module Overview

The Billing module handles all financial operations including invoice creation, NAV Online Számla integration, payment processing, health fund (Egészségpénztár) billing, and the AI-powered Visibill auto-invoicing system.

## Features

### Core Features (MVP)
- Manual invoice creation
- NAV Online Számla v3.0 integration
- Payment recording
- Cash register management
- Price list management
- Basic reporting

### Advanced Features (Post-MVP)
- Visibill AI auto-invoicing
- Health fund (EP) billing
- Multi-currency (Dental Tourism)
- Installment plans
- Doctor commission tracking
- POS terminal integration

## Database Schema

### invoices

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invoice number (formatted: MOL-2026-00001)
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  
  -- Type
  invoice_type VARCHAR(20) NOT NULL DEFAULT 'normal',
  -- Types: normal, proforma, correction, cancellation
  
  -- References
  patient_id UUID REFERENCES patients(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  original_invoice_id UUID REFERENCES invoices(id), -- For corrections/cancellations
  
  -- Dates
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date DATE NOT NULL,
  fulfillment_date DATE NOT NULL, -- Teljesítés dátuma
  
  -- Amounts
  net_amount DECIMAL(12, 2) NOT NULL,
  vat_amount DECIMAL(12, 2) NOT NULL,
  gross_amount DECIMAL(12, 2) NOT NULL,
  
  -- Currency
  currency VARCHAR(3) DEFAULT 'HUF',
  exchange_rate DECIMAL(10, 4) DEFAULT 1.0,
  
  -- VAT breakdown (JSONB for multiple rates)
  vat_breakdown JSONB,
  -- [{"rate": 27, "net": 10000, "vat": 2700, "gross": 12700}]
  
  -- Payment
  payment_method VARCHAR(30),
  -- Methods: cash, card, transfer, health_fund, online
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  -- Status: unpaid, partial, paid, overpaid
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  
  -- Health Fund specific
  health_fund_type VARCHAR(50),
  health_fund_amount DECIMAL(12, 2),
  
  -- NAV
  nav_status VARCHAR(30) DEFAULT 'pending',
  -- Status: pending, submitted, accepted, rejected, technical_annul
  nav_transaction_id VARCHAR(100),
  nav_invoice_data_hash VARCHAR(64),
  nav_submitted_at TIMESTAMPTZ,
  nav_response JSONB,
  
  -- Location
  location_id UUID REFERENCES locations(id),
  issued_by UUID REFERENCES staff(id),
  
  -- Discount
  discount_type VARCHAR(20), -- percentage, fixed
  discount_value DECIMAL(10, 2),
  discount_reason TEXT,
  
  -- Notes
  internal_notes TEXT,
  customer_notes TEXT, -- Printed on invoice
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',
  -- Status: draft, issued, cancelled
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (gross_amount = net_amount + vat_amount)
);

-- Indexes
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(issued_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_nav_status ON invoices(nav_status) WHERE nav_status != 'accepted';
CREATE INDEX idx_invoices_payment ON invoices(payment_status) WHERE payment_status != 'paid';
```

### invoice_items

```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Item details
  treatment_type_id UUID REFERENCES treatment_types(id),
  description VARCHAR(500) NOT NULL,
  
  -- Codes
  oeno_code VARCHAR(10),
  
  -- Quantity & Price
  quantity DECIMAL(8, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'db', -- db, óra, etc.
  
  unit_price DECIMAL(12, 2) NOT NULL,
  net_amount DECIMAL(12, 2) NOT NULL,
  
  -- VAT
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 27.00,
  vat_amount DECIMAL(12, 2) NOT NULL,
  gross_amount DECIMAL(12, 2) NOT NULL,
  
  -- Discount (item level)
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  
  -- Reference
  treatment_id UUID REFERENCES treatments(id),
  tooth_numbers TEXT[], -- Affected teeth
  
  -- Order
  line_number INT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  
  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'HUF',
  
  -- Method
  payment_method VARCHAR(30) NOT NULL,
  -- Methods: cash, card, transfer, health_fund, online_stripe, online_barion
  
  -- For card payments
  card_last_four VARCHAR(4),
  card_type VARCHAR(20), -- visa, mastercard
  terminal_id VARCHAR(50),
  transaction_id VARCHAR(100),
  
  -- For transfers
  bank_reference VARCHAR(100),
  
  -- For health funds
  health_fund_name VARCHAR(100),
  health_fund_reference VARCHAR(100),
  
  -- Cash register
  cash_register_session_id UUID REFERENCES cash_register_sessions(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed',
  -- Status: pending, completed, failed, refunded
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(received_at DESC);
```

### cash_register_sessions

```sql
CREATE TABLE cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  location_id UUID REFERENCES locations(id) NOT NULL,
  
  -- Session times
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- Opening balance
  opening_cash_balance DECIMAL(12, 2) NOT NULL,
  
  -- Closing balance (calculated)
  closing_cash_balance DECIMAL(12, 2),
  expected_cash_balance DECIMAL(12, 2),
  
  -- Totals
  total_cash_in DECIMAL(12, 2) DEFAULT 0,
  total_cash_out DECIMAL(12, 2) DEFAULT 0,
  total_card DECIMAL(12, 2) DEFAULT 0,
  total_transfer DECIMAL(12, 2) DEFAULT 0,
  
  -- Discrepancy
  cash_difference DECIMAL(12, 2),
  difference_notes TEXT,
  
  -- Staff
  opened_by UUID REFERENCES staff(id) NOT NULL,
  closed_by UUID REFERENCES staff(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'open',
  -- Status: open, closed, reconciled
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### price_list

```sql
CREATE TABLE price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  treatment_type_id UUID REFERENCES treatment_types(id) NOT NULL,
  location_id UUID REFERENCES locations(id), -- NULL = all locations
  
  -- Pricing
  base_price DECIMAL(12, 2) NOT NULL,
  
  -- Validity
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  
  -- Currency support (for DT)
  price_eur DECIMAL(12, 2),
  price_gbp DECIMAL(12, 2),
  
  -- Health fund
  health_fund_price DECIMAL(12, 2),
  health_fund_eligible BOOLEAN DEFAULT FALSE,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(treatment_type_id, location_id, valid_from)
);
```

### nav_config

```sql
CREATE TABLE nav_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  location_id UUID REFERENCES locations(id) NOT NULL,
  
  -- NAV credentials
  technical_user VARCHAR(100) NOT NULL,
  technical_user_password_encrypted TEXT NOT NULL,
  signature_key_encrypted TEXT NOT NULL,
  exchange_key_encrypted TEXT NOT NULL,
  
  -- Tax info
  tax_number VARCHAR(11) NOT NULL, -- Format: 12345678-2-42
  
  -- Settings
  is_production BOOLEAN DEFAULT FALSE,
  auto_submit BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_id)
);
```

## NAV Online Számla Integration

### NAV API Service

```typescript
// lib/nav/api.ts
import crypto from 'crypto';

const NAV_API_BASE = {
  test: 'https://api-test.onlineszamla.nav.gov.hu/invoiceService/v3',
  prod: 'https://api.onlineszamla.nav.gov.hu/invoiceService/v3',
};

interface NAVConfig {
  technicalUser: string;
  technicalUserPassword: string;
  signatureKey: string;
  exchangeKey: string;
  taxNumber: string;
  isProduction: boolean;
}

export class NAVService {
  private config: NAVConfig;
  private baseUrl: string;

  constructor(config: NAVConfig) {
    this.config = config;
    this.baseUrl = config.isProduction ? NAV_API_BASE.prod : NAV_API_BASE.test;
  }

  // Create request signature
  private createRequestSignature(
    requestId: string,
    timestamp: string,
    invoiceHash?: string
  ): string {
    const signatureBase = `${requestId}${timestamp}${this.config.signatureKey}`;
    const hash = invoiceHash 
      ? crypto.createHash('sha3-512').update(signatureBase + invoiceHash).digest('hex')
      : crypto.createHash('sha3-512').update(signatureBase).digest('hex');
    return hash.toUpperCase();
  }

  // Encrypt password with exchange key
  private encryptPassword(): string {
    const hash = crypto
      .createHash('sha512')
      .update(this.config.technicalUserPassword)
      .digest('hex')
      .toUpperCase();
    
    // AES-128-ECB encryption with exchange key
    const key = Buffer.from(this.config.exchangeKey, 'hex');
    const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(hash, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
  }

  // Build common header
  private buildHeader(requestId: string): object {
    const timestamp = new Date().toISOString();
    
    return {
      requestId,
      timestamp,
      requestVersion: '3.0',
      headerVersion: '1.0',
    };
  }

  // Build user header
  private buildUserHeader(requestId: string, timestamp: string, invoiceHash?: string): object {
    return {
      login: this.config.technicalUser,
      passwordHash: {
        cryptoType: 'SHA-512',
        value: this.encryptPassword(),
      },
      taxNumber: this.config.taxNumber.replace(/-/g, '').substring(0, 8),
      requestSignature: {
        cryptoType: 'SHA3-512',
        value: this.createRequestSignature(requestId, timestamp, invoiceHash),
      },
    };
  }

  // Submit invoice
  async submitInvoice(invoice: Invoice, invoiceXml: string): Promise<NAVResponse> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();
    
    // Calculate invoice hash
    const invoiceHash = crypto
      .createHash('sha3-512')
      .update(invoiceXml)
      .digest('hex')
      .toUpperCase();

    const request = {
      ManageInvoiceRequest: {
        header: this.buildHeader(requestId),
        user: this.buildUserHeader(requestId, timestamp, invoiceHash),
        software: this.getSoftwareInfo(),
        exchangeToken: await this.getExchangeToken(),
        invoiceOperations: {
          compressedContent: false,
          invoiceOperation: [{
            index: 1,
            invoiceOperation: 'CREATE',
            invoiceData: Buffer.from(invoiceXml).toString('base64'),
          }],
        },
      },
    };

    const response = await fetch(`${this.baseUrl}/manageInvoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: this.buildXml(request),
    });

    return this.parseResponse(response);
  }

  // Query transaction status
  async queryTransactionStatus(transactionId: string): Promise<NAVTransactionStatus> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    const request = {
      QueryTransactionStatusRequest: {
        header: this.buildHeader(requestId),
        user: this.buildUserHeader(requestId, timestamp),
        software: this.getSoftwareInfo(),
        transactionId,
        returnOriginalRequest: false,
      },
    };

    const response = await fetch(`${this.baseUrl}/queryTransactionStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: this.buildXml(request),
    });

    return this.parseResponse(response);
  }

  // Get exchange token
  private async getExchangeToken(): Promise<string> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    const request = {
      TokenExchangeRequest: {
        header: this.buildHeader(requestId),
        user: this.buildUserHeader(requestId, timestamp),
        software: this.getSoftwareInfo(),
      },
    };

    const response = await fetch(`${this.baseUrl}/tokenExchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: this.buildXml(request),
    });

    const result = await this.parseResponse(response);
    return result.encodedExchangeToken;
  }

  private generateRequestId(): string {
    return `MOL${Date.now()}${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  }

  private getSoftwareInfo(): object {
    return {
      softwareId: 'MOLAIRE-HU-01',
      softwareName: 'MOLaiRE Dental',
      softwareOperation: 'LOCAL_SOFTWARE',
      softwareMainVersion: '1.0',
      softwareDevName: 'Think AI Kft.',
      softwareDevContact: 'info@thinkai.hu',
      softwareDevCountryCode: 'HU',
      softwareDevTaxNumber: '12345678',
    };
  }
}
```

### Invoice XML Builder

```typescript
// lib/nav/invoice-xml.ts
export function buildInvoiceXml(invoice: Invoice, items: InvoiceItem[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<InvoiceData xmlns="http://schemas.nav.gov.hu/OSA/3.0/data">
  <invoiceNumber>${invoice.invoice_number}</invoiceNumber>
  <invoiceIssueDate>${formatDate(invoice.issued_at)}</invoiceIssueDate>
  <completenessIndicator>false</completenessIndicator>
  
  <invoiceMain>
    <invoice>
      <invoiceHead>
        <supplierInfo>
          <supplierTaxNumber>
            <taxpayerId>${config.taxNumber.substring(0, 8)}</taxpayerId>
            <vatCode>${config.taxNumber.substring(9, 10)}</vatCode>
            <countyCode>${config.taxNumber.substring(11, 13)}</countyCode>
          </supplierTaxNumber>
          <supplierName>${escapeXml(config.companyName)}</supplierName>
          <supplierAddress>
            <simpleAddress>
              <countryCode>HU</countryCode>
              <postalCode>${config.postalCode}</postalCode>
              <city>${escapeXml(config.city)}</city>
              <additionalAddressDetail>${escapeXml(config.address)}</additionalAddressDetail>
            </simpleAddress>
          </supplierAddress>
        </supplierInfo>
        
        <customerInfo>
          <customerVatStatus>PRIVATE_PERSON</customerVatStatus>
          <customerName>${escapeXml(invoice.patient.name)}</customerName>
          <customerAddress>
            <simpleAddress>
              <countryCode>${invoice.patient.country || 'HU'}</countryCode>
              <postalCode>${invoice.patient.postal_code || ''}</postalCode>
              <city>${escapeXml(invoice.patient.city || '')}</city>
              <additionalAddressDetail>${escapeXml(invoice.patient.address || '')}</additionalAddressDetail>
            </simpleAddress>
          </customerAddress>
        </customerInfo>
        
        <invoiceDetail>
          <invoiceCategory>NORMAL</invoiceCategory>
          <invoiceDeliveryDate>${formatDate(invoice.fulfillment_date)}</invoiceDeliveryDate>
          <currencyCode>${invoice.currency}</currencyCode>
          <exchangeRate>${invoice.exchange_rate}</exchangeRate>
          <paymentMethod>${mapPaymentMethod(invoice.payment_method)}</paymentMethod>
          <paymentDate>${formatDate(invoice.due_date)}</paymentDate>
          <invoiceAppearance>ELECTRONIC</invoiceAppearance>
        </invoiceDetail>
      </invoiceHead>
      
      <invoiceLines>
        ${items.map((item, index) => `
        <line>
          <lineNumber>${index + 1}</lineNumber>
          <lineDescription>${escapeXml(item.description)}</lineDescription>
          <quantity>${item.quantity}</quantity>
          <unitOfMeasure>PIECE</unitOfMeasure>
          <unitPrice>${item.unit_price}</unitPrice>
          <lineAmountsNormal>
            <lineNetAmountData>
              <lineNetAmount>${item.net_amount}</lineNetAmount>
              <lineNetAmountHUF>${item.net_amount}</lineNetAmountHUF>
            </lineNetAmountData>
            <lineVatRate>
              <vatPercentage>${item.vat_rate}</vatPercentage>
            </lineVatRate>
            <lineVatData>
              <lineVatAmount>${item.vat_amount}</lineVatAmount>
              <lineVatAmountHUF>${item.vat_amount}</lineVatAmountHUF>
            </lineVatData>
            <lineGrossAmountData>
              <lineGrossAmountNormal>${item.gross_amount}</lineGrossAmountNormal>
              <lineGrossAmountNormalHUF>${item.gross_amount}</lineGrossAmountNormalHUF>
            </lineGrossAmountData>
          </lineAmountsNormal>
        </line>
        `).join('')}
      </invoiceLines>
      
      <invoiceSummary>
        <summaryNormal>
          ${invoice.vat_breakdown.map(vat => `
          <summaryByVatRate>
            <vatRate>
              <vatPercentage>${vat.rate}</vatPercentage>
            </vatRate>
            <vatRateNetData>
              <vatRateNetAmount>${vat.net}</vatRateNetAmount>
              <vatRateNetAmountHUF>${vat.net}</vatRateNetAmountHUF>
            </vatRateNetData>
            <vatRateVatData>
              <vatRateVatAmount>${vat.vat}</vatRateVatAmount>
              <vatRateVatAmountHUF>${vat.vat}</vatRateVatAmountHUF>
            </vatRateVatData>
            <vatRateGrossData>
              <vatRateGrossAmount>${vat.gross}</vatRateGrossAmount>
              <vatRateGrossAmountHUF>${vat.gross}</vatRateGrossAmountHUF>
            </vatRateGrossData>
          </summaryByVatRate>
          `).join('')}
        </summaryNormal>
        <invoiceNetAmount>${invoice.net_amount}</invoiceNetAmount>
        <invoiceNetAmountHUF>${invoice.net_amount}</invoiceNetAmountHUF>
        <invoiceVatAmount>${invoice.vat_amount}</invoiceVatAmount>
        <invoiceVatAmountHUF>${invoice.vat_amount}</invoiceVatAmountHUF>
        <invoiceGrossAmount>${invoice.gross_amount}</invoiceGrossAmount>
        <invoiceGrossAmountHUF>${invoice.gross_amount}</invoiceGrossAmountHUF>
      </invoiceSummary>
    </invoice>
  </invoiceMain>
</InvoiceData>`;

  return xml;
}
```

## Visibill AI Auto-Invoicing

### Visibill Flow

```typescript
// lib/visibill/auto-invoice.ts
interface VisibillContext {
  treatment: Treatment;
  appointment: Appointment;
  patient: Patient;
  priceList: PriceListItem[];
  doctorNotes: string;
}

export async function generateAutoInvoice(
  treatmentId: string
): Promise<DraftInvoice> {
  // Step 1: Gather context
  const context = await gatherVisibillContext(treatmentId);
  
  // Step 2: AI processing
  const aiResult = await processWithAI(context);
  
  // Step 3: Validate against price list
  const validatedItems = await validateItems(aiResult.items, context.priceList);
  
  // Step 4: Create draft invoice
  const draft = await createDraftInvoice({
    patientId: context.patient.id,
    appointmentId: context.appointment.id,
    items: validatedItems,
    suggestedTotal: aiResult.total,
    aiConfidence: aiResult.confidence,
    aiExplanation: aiResult.explanation,
  });
  
  // Step 5: Notify receptionist for review
  await notifyForReview(draft);
  
  return draft;
}

async function processWithAI(context: VisibillContext): Promise<AIInvoiceResult> {
  const prompt = `You are a dental billing assistant. Based on the treatment information, generate invoice line items.

Treatment: ${context.treatment.description}
Procedure Notes: ${context.doctorNotes}
Affected Teeth: ${context.treatment.tooth_numbers.join(', ')}
OENO Code: ${context.treatment.oeno_code}

Price List:
${context.priceList.map(p => `- ${p.name}: ${p.base_price} Ft`).join('\n')}

Generate a JSON response with:
1. items: Array of invoice items with description, quantity, unit_price
2. total: Total amount
3. confidence: Your confidence level (0-1)
4. explanation: Brief explanation of your choices`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: JSON.stringify(context) },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

## UI Components

### InvoiceListPage

```typescript
// pages/billing/invoices/index.tsx
export function InvoiceListPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    dateRange: 'month',
  });
  
  const { invoices, isLoading, totalCount } = useInvoices(filters);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Számlák</h1>
        <Button onClick={() => navigate('/billing/invoices/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Új számla
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Státusz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes</SelectItem>
            <SelectItem value="draft">Piszkozat</SelectItem>
            <SelectItem value="issued">Kiállított</SelectItem>
            <SelectItem value="cancelled">Sztornózott</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.paymentStatus} onValueChange={(v) => setFilters(f => ({ ...f, paymentStatus: v }))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Fizetés" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes</SelectItem>
            <SelectItem value="unpaid">Kifizetlen</SelectItem>
            <SelectItem value="partial">Részben</SelectItem>
            <SelectItem value="paid">Kifizetve</SelectItem>
          </SelectContent>
        </Select>
        
        <DateRangePicker
          value={filters.dateRange}
          onChange={(v) => setFilters(f => ({ ...f, dateRange: v }))}
        />
      </div>
      
      {/* Invoice Table */}
      <DataTable
        columns={invoiceColumns}
        data={invoices}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### InvoiceCreationPage

```typescript
// pages/billing/invoices/new.tsx
export function InvoiceCreationPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      due_date: addDays(new Date(), 8),
      fulfillment_date: new Date(),
      payment_method: 'cash',
    },
  });

  const { mutate: createInvoice, isLoading } = useCreateInvoice();

  // Calculate totals
  const totals = useMemo(() => {
    const net = items.reduce((sum, item) => sum + item.net_amount, 0);
    const vat = items.reduce((sum, item) => sum + item.vat_amount, 0);
    return {
      net,
      vat,
      gross: net + vat,
    };
  }, [items]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Új számla</h1>
      
      <form onSubmit={form.handleSubmit(createInvoice)}>
        {/* Patient Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Páciens</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientCombobox
              value={patient}
              onChange={setPatient}
              placeholder="Keresés..."
            />
            {patient && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{patient.last_name} {patient.first_name}</p>
                <p className="text-sm text-gray-500">{patient.phone}</p>
                <p className="text-sm text-gray-500">{patient.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Invoice Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Számla adatok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fulfillment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teljesítés dátuma</FormLabel>
                    <DatePicker value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fizetési határidő</FormLabel>
                    <DatePicker value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fizetési mód</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Készpénz</SelectItem>
                        <SelectItem value="card">Bankkártya</SelectItem>
                        <SelectItem value="transfer">Átutalás</SelectItem>
                        <SelectItem value="health_fund">Egészségpénztár</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Invoice Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tételek</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceItemsEditor
              items={items}
              onChange={setItems}
              patientId={patient?.id}
            />
          </CardContent>
        </Card>
        
        {/* Totals */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nettó:</span>
                  <span>{formatCurrency(totals.net)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ÁFA (27%):</span>
                  <span>{formatCurrency(totals.vat)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Bruttó:</span>
                  <span>{formatCurrency(totals.gross)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Mégse
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>
            Mentés piszkozatként
          </Button>
          <Button type="submit" disabled={isLoading || !patient || items.length === 0}>
            {isLoading ? 'Kiállítás...' : 'Számla kiállítása'}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### PaymentModal

```typescript
// components/billing/PaymentModal.tsx
export function PaymentModal({ invoice, isOpen, onClose }: PaymentModalProps) {
  const [amount, setAmount] = useState(invoice.gross_amount - invoice.paid_amount);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  
  const { mutate: recordPayment, isLoading } = useRecordPayment();

  const remainingAmount = invoice.gross_amount - invoice.paid_amount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fizetés rögzítése</DialogTitle>
          <DialogDescription>
            Számla: {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span>Számla összeg:</span>
              <span className="font-medium">{formatCurrency(invoice.gross_amount)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Már fizetve:</span>
              <span>{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span>Hátralék:</span>
              <span>{formatCurrency(remainingAmount)}</span>
            </div>
          </div>
          
          {/* Amount */}
          <div>
            <Label>Összeg</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              max={remainingAmount}
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(remainingAmount)}
              >
                Teljes hátralék
              </Button>
            </div>
          </div>
          
          {/* Payment Method */}
          <div>
            <Label>Fizetési mód</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PAYMENT_METHODS.map((pm) => (
                <Button
                  key={pm.id}
                  type="button"
                  variant={method === pm.id ? 'default' : 'outline'}
                  onClick={() => setMethod(pm.id)}
                  className="justify-start"
                >
                  <pm.icon className="w-4 h-4 mr-2" />
                  {pm.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Mégse
          </Button>
          <Button
            onClick={() => recordPayment({ invoiceId: invoice.id, amount, method })}
            disabled={isLoading || amount <= 0 || amount > remainingAmount}
          >
            {isLoading ? 'Rögzítés...' : 'Fizetés rögzítése'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Business Rules

| ID | Rule |
|----|------|
| BR-INV01 | Invoice number format: MOL-{YEAR}-{SEQUENCE:5} |
| BR-INV02 | NAV submission required within 5 days of issue |
| BR-INV03 | Cancellation requires linking to original invoice |
| BR-INV04 | Health fund invoices require TAJ number |
| BR-INV05 | Discount > 30% requires manager approval |
| BR-INV06 | Cash register must be closed daily |
| BR-INV07 | Visibill drafts must be reviewed within 24h |
| BR-INV08 | VAT rate is 27% for dental services |
| BR-INV09 | Payment date cannot be before invoice date |
| BR-INV10 | Installment plan requires minimum 30% deposit |

## Acceptance Criteria

### AC-01: Invoice Creation
- [ ] Patient selection with search
- [ ] Add items from price list
- [ ] Manual item entry
- [ ] Automatic VAT calculation
- [ ] Discount application
- [ ] Draft save and edit

### AC-02: Invoice Issuance
- [ ] Generate invoice number
- [ ] NAV XML generation
- [ ] NAV submission
- [ ] Transaction status tracking
- [ ] PDF generation
- [ ] Email sending

### AC-03: Payment Recording
- [ ] Multiple payment methods
- [ ] Partial payments
- [ ] Overpayment handling
- [ ] Cash register integration
- [ ] Receipt generation

### AC-04: NAV Integration
- [ ] API connection test
- [ ] Invoice submission
- [ ] Status query
- [ ] Error handling
- [ ] Technical annulment

### AC-05: Visibill AI
- [ ] Auto-generate from treatment
- [ ] Price list matching
- [ ] Draft creation
- [ ] Review queue
- [ ] Approval workflow

---

**Next**: Proceed to [06-MODULE_DENTAL_TOURISM.md](./06-MODULE_DENTAL_TOURISM.md) for Dental Tourism module.
