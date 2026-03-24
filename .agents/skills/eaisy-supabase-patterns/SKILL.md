---
name: eaisy-supabase-patterns
description: Supabase integration patterns for the eaisy dental ERP built on Next.js 16 App Router — client setup, Edge Functions, RLS policies, migrations, and realtime subscriptions.
---

# eaisy Supabase Patterns

## Overview

The eaisy dental ERP uses **Supabase** as its backend platform. This skill documents the correct patterns for integrating Supabase with the project's **Next.js 16 App Router** frontend.

---

## 1. Client Setup

### Browser Client (for Client Components)

Create `src/src/lib/supabase-browser.ts`:

```tsx
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (for Server Components & Route Handlers)

Create `src/src/lib/supabase-server.ts`:

```tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Components
          }
        },
      },
    }
  );
}
```

### Environment Variables

In `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tietuujlesnyfeiyfixt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **IMPORTANT**: Use `NEXT_PUBLIC_` prefix for client-side variables. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

---

## 2. Data Fetching Patterns

### Simple Query (Client Component)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function PatientList() {
  const [patients, setPatients] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('patients')
      .select('id, first_name, last_name, phone, email, status')
      .order('last_name')
      .then(({ data, error }) => {
        if (!error && data) setPatients(data);
      });
  }, []);

  return (/* render patients */);
}
```

### Filtered Query with Search

```tsx
const fetchPatients = async (search: string) => {
  let query = supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};
```

### Insert with Error Handling

```tsx
const createPatient = async (patient: NewPatient) => {
  const { data, error } = await supabase
    .from('patients')
    .insert(patient)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Páciens már létezik');
    }
    throw error;
  }
  return data;
};
```

---

## 3. Edge Functions

### Modern Template (Deno.serve)

Edge Functions use **Deno runtime**. Use the modern `Deno.serve` pattern:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user JWT
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process request
    const body = await req.json();

    // ... business logic ...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Deploying Edge Functions

Use the Supabase MCP tool:

```
mcp_supabase_deploy_edge_function(
  name: "function-name",
  entrypoint_path: "index.ts",
  verify_jwt: true,
  files: [{ name: "index.ts", content: "..." }]
)
```

Or via CLI:
```bash
npx supabase functions deploy function-name --project-ref tietuujlesnyfeiyfixt
```

---

## 4. Database Migrations

### Creating Migrations

Use the Supabase MCP tool:

```
mcp_supabase_apply_migration(
  name: "create_patients_table",
  query: "CREATE TABLE patients (...)"
)
```

Or via CLI:
```bash
npx supabase migration new create_patients_table
# Edit supabase/migrations/<timestamp>_create_patients_table.sql
npx supabase db push
```

### RLS Policy Pattern

```sql
-- Enable RLS on every table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (single-tenant MVP)
CREATE POLICY "authenticated_read" ON table_name
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_insert" ON table_name
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update" ON table_name
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Future multi-tenant pattern:
-- FOR SELECT USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);
```

---

## 5. Realtime Subscriptions

```tsx
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

---

## 6. Storage

### Upload File

```tsx
const uploadDocument = async (patientId: string, file: File) => {
  const supabase = createClient();
  const path = `${patientId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from('patient-documents')
    .upload(path, file);

  if (error) throw error;
  return path;
};
```

### Get Signed URL

```tsx
const getDocumentUrl = async (path: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('patient-documents')
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
};
```

---

## 7. Authentication Middleware

Create `src/src/middleware.ts`:

```tsx
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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
};
```

---

## 8. Project Reference

- **Project Ref**: `tietuujlesnyfeiyfixt`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/tietuujlesnyfeiyfixt`
- **MCP Server**: configured in `~/.gemini/antigravity/mcp_config.json`
- **Local CLI**: initialized in `/eiasymed/supabase/`
