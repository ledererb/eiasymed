---
name: eaisy-supabase-schema-mapping
description: Maps front-end column references to correct Supabase/Postgres column names in the eaisy dental ERP. Use this when writing or debugging Supabase queries to avoid column-not-found errors.
---

# Eaisy Supabase Schema Mapping

## Common Column Mismatches

When writing Supabase queries, use these **correct** column names:

### `invoices` table
| ❌ Wrong | ✅ Correct | Notes |
|----------|-----------|-------|
| `invoice_date` | `issued_at` | timestamptz |
| `total_amount` | `gross_amount` | numeric |
| `subtotal_amount` | `net_amount` | numeric |
| `notes` | `internal_notes` | text |
| `status` (for payment) | `payment_status` | 'paid'/'unpaid'/'partial'/'overdue' |

> **Key distinction**: `invoices.status` = invoice lifecycle ('issued', 'cancelled'). `invoices.payment_status` = payment state ('paid', 'unpaid', 'partial').

### `invoice_items` table
| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `total_price` | `gross_amount` |
| `line_order` | `line_number` |

### `patients` table
| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `date_of_birth` | `birth_date` |
| `nationality` | `address_country` |

> TAJ number is `varchar(9)` — store WITHOUT dashes (e.g. `123456789`).

### `price_list` table
| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `name` / `item_name` | N/A — join through `treatment_type_id` |
| `price` | `base_price` |
| `category` | N/A — use treatment_type for categorization |

To get price list item names:
```typescript
const { data } = await supabase
  .from('price_list')
  .select('id, base_price, treatment_types!inner(name)')
  .eq('is_active', true);
```

### `international_quotes` table
| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `total_amount` | `treatment_total` / `grand_total` |

### `online_consultations` table
- Has NO `patient_id` column — uses `first_name`, `last_name`, `email` directly
- Uses `country_code` not `country_of_origin`
- Uses `primary_concern` not `concern`
- Uses `request_reference` as unique reference

### `patient_travel_details` table
- Uses `arrival_flight_number` / `departure_flight_number` (not `flight_number`)
- Uses `number_of_companions` (not `companion_count`)
- Uses `trip_reference` as identifier

### `patient_aftercare` table
- `aftercare_schedule` is **NOT NULL** (jsonb) — always provide it
- Uses `current_phase` / `next_checkin_due` (not `treatment_date` / `follow_up_date`)

## Best Practice

**Always check column names with:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'your_table' 
ORDER BY ordinal_position;
```

Before writing any Supabase `.select()`, `.insert()`, or `.update()` query.
