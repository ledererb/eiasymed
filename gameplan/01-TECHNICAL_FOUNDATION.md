# eaisy — Technical Foundation

## 1. Technology Stack Details

### 1.1 Frontend Architecture

```
Next.js 16 (App Router) with TypeScript
├── App Router (file-based routing)
├── CSS Modules (per-component styling)
├── tokens.css (design system tokens)
├── eaisy-components (26 custom components)
├── Phosphor Icons (@phosphor-icons/react)
├── Inter font (next/font/google)
├── Recharts (charts, for BI module)
└── date-fns (date handling)
```

### 1.2 Backend Architecture

```
Supabase Platform (project: tietuujlesnyfeiyfixt)
├── PostgreSQL 15 (database)
├── PostgREST (auto-generated REST API)
├── GoTrue (authentication)
├── Realtime (WebSocket subscriptions)
├── Storage (file storage)
├── Edge Functions (Deno runtime)
└── pg_cron (scheduled jobs)
```

### 1.3 External Services

```
Integrations
├── n8n (workflow automation)
├── Mailgun (transactional email)
├── Twilio (SMS + WhatsApp)
├── Stripe (international payments)
├── OpenAI GPT-4 (AI processing)
├── ElevenLabs (speech-to-text)
├── NAV Online Számla API (tax reporting)
└── EESZT (Hungarian eHealth - future)
```

## 2. Database Setup

### 2.1 Supabase Project Configuration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Text search
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- Hungarian character handling
CREATE EXTENSION IF NOT EXISTS "pg_cron";      -- Scheduled jobs

-- Configure timezone
ALTER DATABASE postgres SET timezone TO 'Europe/Budapest';
```

### 2.2 Row Level Security (RLS) Pattern

All tables follow this RLS pattern:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (single-tenant for MVP)
CREATE POLICY "Users can view their clinic data"
ON table_name
FOR SELECT
USING (auth.role() = 'authenticated');

-- For future multi-tenant:
-- USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);
```

### 2.3 Audit Trail

```sql
-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. Authentication & Authorization

### 3.1 User Roles

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',     // System administrator
  CLINIC_ADMIN = 'clinic_admin',   // Clinic owner/manager
  DOCTOR = 'doctor',               // Treating physician
  RECEPTIONIST = 'receptionist',   // Front desk
  HYGIENIST = 'hygienist',         // Dental hygienist
  ASSISTANT = 'assistant',         // Dental assistant
  ACCOUNTANT = 'accountant',       // Financial access only
  MARKETING = 'marketing',         // CRM/Marketing access
  DT_COORDINATOR = 'dt_coordinator' // Dental Tourism coordinator
}
```

### 3.2 Permission Matrix

| Feature | Super Admin | Clinic Admin | Doctor | Receptionist | Accountant | Marketing |
|---------|-------------|--------------|--------|--------------|------------|-----------|
| View patients | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit patients | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View dental chart | ✅ | ✅ | ✅ | 👁️ | ❌ | ❌ |
| Edit dental chart | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create invoices | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| View financials | ✅ | ✅ | 👁️ | 👁️ | ✅ | ❌ |
| Manage CRM | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| View analytics | ✅ | ✅ | 👁️ | ❌ | ✅ | ✅ |
| System settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

👁️ = Read-only / Limited view

### 3.3 Auth Implementation

See `eaisy-supabase-patterns` skill for complete patterns. Summary:

```typescript
// src/lib/supabase-browser.ts — Client Components
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/supabase-server.ts — Server Components
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Ignored in Server Components */ }
        },
      },
    }
  );
}
```

### 3.4 Protected Routes (Next.js Middleware)

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
};
```

## 4. API Architecture

### 4.1 API Patterns

```typescript
// Supabase auto-generated REST API pattern
// GET /rest/v1/patients?select=*
// POST /rest/v1/patients
// PATCH /rest/v1/patients?id=eq.uuid
// DELETE /rest/v1/patients?id=eq.uuid

// Custom API via Edge Functions
// POST /functions/v1/nav-invoice-submit
// POST /functions/v1/voxis-transcribe
// POST /functions/v1/visibill-generate
```

### 4.2 Edge Function Template

See `eaisy-supabase-patterns` skill for the complete Edge Function template using the modern `Deno.serve` pattern.

## 5. Real-time Subscriptions

### 5.1 Subscription Pattern

```typescript
// hooks/useRealtimeTable.ts
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export function useRealtimeTable(table: string, onUpdate: () => void) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate]);
}
```

### 5.2 Calendar Real-time Example

```typescript
// In the calendar page component:
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

function CalendarPage() {
  const [appointments, setAppointments] = useState([]);
  const supabase = createClient();

  const fetchAppointments = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .gte('start_time', weekStart)
      .lte('start_time', weekEnd);
    setAppointments(data ?? []);
  }, [weekStart, weekEnd]);

  useRealtimeTable('appointments', fetchAppointments);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
}
```

## 6. File Storage

### 6.1 Storage Buckets

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('patient-documents', 'patient-documents', false),
  ('xrays', 'xrays', false),
  ('profile-photos', 'profile-photos', true),
  ('invoices', 'invoices', false),
  ('email-attachments', 'email-attachments', false);
```

### 6.2 File Upload Helper

See `eaisy-supabase-patterns` skill for upload and signed URL patterns.

## 7. Error Handling

### 7.1 Error Boundary

```tsx
// components/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className={styles.errorPage}>
          <h1 className={styles.errorTitle}>Hiba történt</h1>
          <p className={styles.errorMessage}>{this.state.error?.message}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Oldal újratöltése
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 7.2 API Error Handling

```typescript
// lib/api-error.ts
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleSupabaseError(error: any): never {
  if (error.code === 'PGRST116') {
    throw new APIError('Record not found', 404, error.code);
  }
  if (error.code === '23505') {
    throw new APIError('Duplicate record', 409, error.code);
  }
  if (error.code === '23503') {
    throw new APIError('Foreign key violation', 400, error.code);
  }
  throw new APIError(
    error.message || 'Ismeretlen hiba',
    error.status || 500,
    error.code
  );
}
```

## 8. Deployment

### 8.1 Environment Configuration

```bash
# Development
.env.local

# Production
.env.production
```

### 8.2 Build & Deploy

The project is deployed via **Vercel** (native Next.js hosting):

```bash
# Local development
npm run dev

# Production build
npm run build

# Supabase migrations
npx supabase db push
```

Edge Functions are deployed via the Supabase MCP or CLI:
```bash
npx supabase functions deploy <function-name> --project-ref tietuujlesnyfeiyfixt
```

---

**Next**: Proceed to [02-MODULE_CALENDAR.md](./02-MODULE_CALENDAR.md) for Calendar module implementation.
