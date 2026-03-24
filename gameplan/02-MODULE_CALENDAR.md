# eaisy — Calendar Module

> **⚠️ TECH STACK TRANSLATION REQUIRED**
>
> The UI code examples in this file use **shadcn/ui, Tailwind CSS, Lucide icons, React Query, React Router, and Zustand** — these are NOT used in the actual project.
>
> When implementing, translate all UI code to use:
> - **CSS Modules** (not Tailwind `className` strings)
> - **eaisy-components** (`CalendarEntry`, `CalendarPopup`, `Drawer`, `Button`, `InputField`, `Dropdown`, etc.)
> - **Phosphor Icons** (`@phosphor-icons/react`) instead of Lucide
> - **Next.js App Router** routing (`src/app/naptar/page.tsx`) instead of React Router
> - **Direct Supabase client** calls instead of React Query
> - **React state/context** instead of Zustand
>
> See skills: `eaisy-components`, `eaisy-build-workflow`, `eaisy-supabase-patterns`
>
> **Status**: ✅ Weekly view, overlapping layout, date picker, and appointment drawer are already implemented in `/naptar`.

## Module Overview

The Calendar module is the central hub for appointment scheduling, providing a real-time view of all dental chairs, doctors, and patient appointments across the clinic.

## Features

### Core Features (MVP)
- Weekly/Daily calendar view
- Appointment CRUD operations
- Drag & drop rescheduling
- Doctor/chair filtering
- Color-coded appointment types
- Real-time updates

### Advanced Features (Post-MVP)
- Multi-location support
- Online booking widget
- SMS/Email reminders
- Waitlist management
- Recurring appointments
- Resource optimization suggestions

## Database Schema

### appointments

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Patient & Doctor
  patient_id UUID REFERENCES patients(id) NOT NULL,
  doctor_id UUID REFERENCES staff(id) NOT NULL,
  
  -- Location
  location_id UUID REFERENCES locations(id) NOT NULL,
  chair_id UUID REFERENCES chairs(id),
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Type & Status
  appointment_type VARCHAR(50) NOT NULL,
  -- Types: consultation, treatment, followup, emergency, hygiene, surgery
  
  status VARCHAR(20) DEFAULT 'scheduled',
  -- Status: scheduled, confirmed, arrived, in_progress, completed, no_show, cancelled
  
  -- Treatment info
  treatment_type_id UUID REFERENCES treatment_types(id),
  treatment_notes TEXT,
  
  -- Booking info
  booked_by UUID REFERENCES staff(id),
  booking_source VARCHAR(30) DEFAULT 'reception',
  -- Sources: reception, online, phone, referral
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  confirmation_received BOOLEAN DEFAULT FALSE,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES staff(id),
  cancellation_reason TEXT,
  
  -- Notes
  internal_notes TEXT,
  patient_notes TEXT, -- Notes visible to patient
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id)
);

-- Indexes
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_time ON appointments(start_time, end_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(DATE(start_time));
```

### chairs

```sql
CREATE TABLE chairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  location_id UUID REFERENCES locations(id) NOT NULL,
  
  name VARCHAR(50) NOT NULL, -- "Szék 1", "Chair 1"
  code VARCHAR(10) NOT NULL, -- "S1", "C1"
  
  -- Configuration
  chair_type VARCHAR(30) DEFAULT 'standard',
  -- Types: standard, surgery, hygiene, pediatric
  
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for calendar
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Order
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### appointment_types_config

```sql
CREATE TABLE appointment_types_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  
  -- Display
  color VARCHAR(7) NOT NULL, -- Hex color
  icon VARCHAR(30), -- Lucide icon name
  
  -- Duration
  default_duration_minutes INT NOT NULL DEFAULT 30,
  min_duration_minutes INT DEFAULT 15,
  max_duration_minutes INT DEFAULT 180,
  
  -- Settings
  requires_confirmation BOOLEAN DEFAULT TRUE,
  allow_online_booking BOOLEAN DEFAULT FALSE,
  buffer_before_minutes INT DEFAULT 0,
  buffer_after_minutes INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default appointment types
INSERT INTO appointment_types_config (code, name, color, default_duration_minutes) VALUES
  ('consultation', 'Konzultáció', '#3B82F6', 30),
  ('treatment', 'Kezelés', '#22C55E', 45),
  ('followup', 'Kontroll', '#8B5CF6', 20),
  ('emergency', 'Sürgős', '#EF4444', 30),
  ('hygiene', 'Fogkő/Higiénia', '#F59E0B', 30),
  ('surgery', 'Sebészet', '#EC4899', 90),
  ('implant', 'Implantátum', '#06B6D4', 120),
  ('prosthetics', 'Protetika', '#84CC16', 60);
```

### working_hours

```sql
CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Can be for doctor, chair, or location
  doctor_id UUID REFERENCES staff(id),
  chair_id UUID REFERENCES chairs(id),
  location_id UUID REFERENCES locations(id),
  
  day_of_week INT NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Break time
  break_start TIME,
  break_end TIME,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Override for specific date
  override_date DATE,
  is_holiday BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6)
);
```

## API Endpoints

### Appointments

```typescript
// GET /rest/v1/appointments
// Query appointments with filters
interface GetAppointmentsParams {
  start_date: string;      // ISO date
  end_date: string;        // ISO date
  doctor_id?: string;      // Filter by doctor
  chair_id?: string;       // Filter by chair
  location_id?: string;    // Filter by location
  status?: string[];       // Filter by status
}

// POST /rest/v1/appointments
// Create new appointment
interface CreateAppointmentBody {
  patient_id: string;
  doctor_id: string;
  location_id: string;
  chair_id?: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  treatment_type_id?: string;
  internal_notes?: string;
}

// PATCH /rest/v1/appointments?id=eq.{id}
// Update appointment
interface UpdateAppointmentBody {
  start_time?: string;
  end_time?: string;
  doctor_id?: string;
  chair_id?: string;
  status?: string;
  internal_notes?: string;
}

// DELETE /rest/v1/appointments?id=eq.{id}
// Soft delete (set status to cancelled)
```

### Edge Functions

```typescript
// POST /functions/v1/appointment-reminder
// Send appointment reminders
interface SendReminderBody {
  appointment_id: string;
  channel: 'sms' | 'email' | 'both';
}

// POST /functions/v1/check-availability
// Check doctor/chair availability
interface CheckAvailabilityBody {
  doctor_id: string;
  chair_id?: string;
  date: string;
  duration_minutes: number;
}

// Response
interface AvailableSlot {
  start_time: string;
  end_time: string;
  chair_id?: string;
}
```

## UI Components

### CalendarPage

```typescript
// pages/calendar/index.tsx
import { useState } from 'react';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { AppointmentModal } from '@/components/calendar/AppointmentModal';
import { useAppointments } from '@/hooks/useAppointments';

export function CalendarPage() {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { appointments, isLoading } = useAppointments({
    startDate: getWeekStart(selectedDate),
    endDate: getWeekEnd(selectedDate),
  });

  return (
    <div className="h-screen flex flex-col">
      <CalendarHeader
        view={view}
        onViewChange={setView}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onNewAppointment={() => setIsModalOpen(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        {view === 'week' ? (
          <WeekView
            appointments={appointments}
            selectedDate={selectedDate}
            onAppointmentClick={setSelectedAppointment}
            onSlotClick={(time) => {
              setSelectedDate(time);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <DayView
            appointments={appointments}
            selectedDate={selectedDate}
            onAppointmentClick={setSelectedAppointment}
            onSlotClick={(time) => {
              setSelectedDate(time);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>
      
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        defaultDate={selectedDate}
      />
    </div>
  );
}
```

### WeekView Component

```typescript
// components/calendar/WeekView.tsx
interface WeekViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  doctors: Doctor[];
  chairs: Chair[];
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick: (time: Date, doctorId?: string) => void;
  onAppointmentDrop: (appointmentId: string, newStart: Date) => void;
}

export function WeekView({
  appointments,
  selectedDate,
  doctors,
  chairs,
  onAppointmentClick,
  onSlotClick,
  onAppointmentDrop,
}: WeekViewProps) {
  const weekDays = getWeekDays(selectedDate);
  const timeSlots = generateTimeSlots(8, 20, 30); // 8:00-20:00, 30min slots
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with days */}
      <div className="flex border-b">
        <div className="w-16 flex-shrink-0" /> {/* Time column */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="flex-1 text-center py-2 border-l"
          >
            <div className="text-sm text-gray-500">
              {format(day, 'EEE', { locale: hu })}
            </div>
            <div className={cn(
              'text-lg font-semibold',
              isToday(day) && 'text-blue-600'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      
      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="relative">
          {timeSlots.map((time) => (
            <div key={time} className="flex h-12 border-b">
              <div className="w-16 flex-shrink-0 text-xs text-gray-500 text-right pr-2 pt-1">
                {time}
              </div>
              {weekDays.map((day) => (
                <div
                  key={`${day.toISOString()}-${time}`}
                  className="flex-1 border-l cursor-pointer hover:bg-blue-50"
                  onClick={() => onSlotClick(combineDateTime(day, time))}
                />
              ))}
            </div>
          ))}
          
          {/* Appointment cards overlay */}
          {appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onClick={() => onAppointmentClick(apt)}
              onDrop={onAppointmentDrop}
              style={calculatePosition(apt, weekDays, timeSlots)}
            />
          ))}
          
          {/* Current time indicator */}
          <CurrentTimeIndicator />
        </div>
      </div>
    </div>
  );
}
```

### AppointmentCard Component

```typescript
// components/calendar/AppointmentCard.tsx
interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
  style: React.CSSProperties;
}

export function AppointmentCard({ appointment, onClick, style }: AppointmentCardProps) {
  const typeConfig = useAppointmentTypeConfig(appointment.appointment_type);
  
  return (
    <div
      className={cn(
        'absolute rounded-md p-1 cursor-pointer overflow-hidden',
        'border-l-4 shadow-sm hover:shadow-md transition-shadow',
        getStatusClasses(appointment.status)
      )}
      style={{
        ...style,
        borderLeftColor: typeConfig.color,
        backgroundColor: `${typeConfig.color}20`,
      }}
      onClick={onClick}
    >
      <div className="text-xs font-medium truncate">
        {appointment.patient.last_name} {appointment.patient.first_name}
      </div>
      <div className="text-xs text-gray-600 truncate">
        {format(new Date(appointment.start_time), 'HH:mm')} - 
        {format(new Date(appointment.end_time), 'HH:mm')}
      </div>
      <div className="text-xs text-gray-500 truncate">
        {typeConfig.name}
      </div>
      
      {/* Status indicator */}
      <div className="absolute top-1 right-1">
        {appointment.status === 'confirmed' && (
          <CheckCircle className="w-3 h-3 text-green-500" />
        )}
        {appointment.status === 'arrived' && (
          <User className="w-3 h-3 text-blue-500" />
        )}
      </div>
    </div>
  );
}
```

### AppointmentModal Component

```typescript
// components/calendar/AppointmentModal.tsx
interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  defaultDate?: Date;
}

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  defaultDate,
}: AppointmentModalProps) {
  const isEditing = !!appointment;
  
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment ? mapAppointmentToForm(appointment) : {
      start_time: defaultDate,
      duration_minutes: 30,
      appointment_type: 'treatment',
    },
  });
  
  const { mutate: saveAppointment, isLoading } = useMutation({
    mutationFn: isEditing ? updateAppointment : createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      onClose();
      toast.success(isEditing ? 'Időpont módosítva' : 'Időpont létrehozva');
    },
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Időpont szerkesztése' : 'Új időpont'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(saveAppointment)}>
          {/* Patient selector */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Páciens *</FormLabel>
                  <PatientCombobox
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Keresés..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Doctor selector */}
            <FormField
              control={form.control}
              name="doctor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orvos *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon orvost" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dátum *</FormLabel>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Időpont *</FormLabel>
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      minuteStep={15}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Duration */}
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Időtartam</FormLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 perc</SelectItem>
                      <SelectItem value="30">30 perc</SelectItem>
                      <SelectItem value="45">45 perc</SelectItem>
                      <SelectItem value="60">1 óra</SelectItem>
                      <SelectItem value="90">1,5 óra</SelectItem>
                      <SelectItem value="120">2 óra</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Appointment type */}
            <FormField
              control={form.control}
              name="appointment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Típus</FormLabel>
                  <AppointmentTypeSelect
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="internal_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Megjegyzés</FormLabel>
                  <Textarea {...field} rows={3} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Mégse
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Mentés...' : 'Mentés'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Hooks

### useAppointments

```typescript
// hooks/useAppointments.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UseAppointmentsOptions {
  startDate: Date;
  endDate: Date;
  doctorId?: string;
  locationId?: string;
}

export function useAppointments(options: UseAppointmentsOptions) {
  return useQuery({
    queryKey: ['appointments', options],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone, email),
          doctor:staff!doctor_id(id, first_name, last_name),
          chair:chairs(id, name, color),
          treatment_type:treatment_types(id, name)
        `)
        .gte('start_time', options.startDate.toISOString())
        .lte('start_time', options.endDate.toISOString())
        .neq('status', 'cancelled')
        .order('start_time');
      
      if (options.doctorId) {
        query = query.eq('doctor_id', options.doctorId);
      }
      
      if (options.locationId) {
        query = query.eq('location_id', options.locationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
}
```

### useCreateAppointment

```typescript
// hooks/useCreateAppointment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', data.doctor_id)
        .neq('status', 'cancelled')
        .overlaps('start_time', 'end_time', data.start_time, data.end_time);
      
      if (conflicts && conflicts.length > 0) {
        throw new Error('Az időpont ütközik egy másik foglalással');
      }
      
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Időpont sikeresen létrehozva');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
```

## Business Logic

### Appointment Validation

```typescript
// lib/calendar/validation.ts
import { z } from 'zod';

export const appointmentSchema = z.object({
  patient_id: z.string().uuid('Válasszon pácienst'),
  doctor_id: z.string().uuid('Válasszon orvost'),
  location_id: z.string().uuid(),
  chair_id: z.string().uuid().optional(),
  start_time: z.date(),
  duration_minutes: z.number().min(15).max(480),
  appointment_type: z.string(),
  treatment_type_id: z.string().uuid().optional(),
  internal_notes: z.string().optional(),
}).refine((data) => {
  // Ensure appointment is during working hours
  const hour = data.start_time.getHours();
  return hour >= 8 && hour < 20;
}, {
  message: 'Az időpontnak munkaidőben kell lennie (8:00-20:00)',
});
```

### Conflict Detection

```typescript
// lib/calendar/conflicts.ts
export async function checkAppointmentConflicts(
  doctorId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  let query = supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctorId)
    .neq('status', 'cancelled')
    .or(`and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`);
  
  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data && data.length > 0;
}
```

## n8n Workflows

### Appointment Reminder

```yaml
name: Calendar_Appointment_Reminder
trigger:
  - type: schedule
    cron: "0 8 * * *"  # Every day at 8:00
    
nodes:
  - name: Get Tomorrow's Appointments
    type: supabase
    operation: select
    query: |
      SELECT 
        a.*,
        p.first_name, p.last_name, p.phone, p.email,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN staff d ON a.doctor_id = d.id
      WHERE DATE(a.start_time) = CURRENT_DATE + INTERVAL '1 day'
        AND a.status IN ('scheduled', 'confirmed')
        AND a.reminder_sent = false
        
  - name: Loop Appointments
    type: loop
    items: appointments
    nodes:
      - name: Send SMS Reminder
        type: twilio_sms
        to: "{{ item.phone }}"
        body: |
          Tisztelt {{ item.last_name }} {{ item.first_name }}!
          
          Emlékeztetjük holnapi időpontjára:
          📅 {{ formatDate(item.start_time, 'YYYY.MM.DD HH:mm') }}
          👨‍⚕️ {{ item.doctor_last_name }} {{ item.doctor_first_name }}
          📍 MOLaiRE Dental Clinic
          
          Kérjük, érkezzen 10 perccel korábban!
          
          Lemondás: +36 1 234 5678
          
      - name: Update Reminder Sent
        type: supabase
        operation: update
        table: appointments
        filter: id = {{ item.id }}
        data:
          reminder_sent: true
          reminder_sent_at: NOW()
```

## Acceptance Criteria

### AC-01: Calendar View
- [ ] Week view displays all 7 days with time slots (8:00-20:00)
- [ ] Day view shows detailed time slots
- [ ] Appointments display patient name, time, and type
- [ ] Color coding matches appointment type configuration
- [ ] Current time indicator visible
- [ ] Real-time updates when appointments change

### AC-02: Appointment Creation
- [ ] Patient search with autocomplete
- [ ] Doctor selection from active doctors
- [ ] Date picker with disabled past dates
- [ ] Time picker with 15-minute intervals
- [ ] Duration selection
- [ ] Appointment type selection
- [ ] Conflict detection before save
- [ ] Success notification on save

### AC-03: Appointment Editing
- [ ] Click to open appointment details
- [ ] Edit all appointment fields
- [ ] Drag & drop to reschedule
- [ ] Status change (arrived, completed, no-show)
- [ ] Cancel with reason required

### AC-04: Filtering
- [ ] Filter by doctor
- [ ] Filter by chair
- [ ] Filter by appointment type
- [ ] Search by patient name

### AC-05: Reminders
- [ ] SMS reminder sent 24h before
- [ ] Email reminder sent 48h before
- [ ] Reminder status visible on appointment

---

**Next**: Proceed to [03-MODULE_PATIENT_RECORDS.md](./03-MODULE_PATIENT_RECORDS.md) for Patient Records module.
