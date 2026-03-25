'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Funnel, MagnifyingGlass, CaretCircleLeft, CaretCircleRight, PlusCircle,
  Users, House, Flag, CaretLeft, CaretRight, Clock, X,
  Phone, EnvelopeSimple, CalendarBlank, PencilSimple, ArrowSquareOut, Tooth,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { CalendarEntry, CalendarColor } from '@/components/CalendarEntry';
import { Drawer } from '@/components/Drawer';
import { AppointmentForm, AppointmentFormData } from '@/components/AppointmentForm';
import { createClient } from '@/lib/supabase-browser';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

/* ─── Types ─── */
interface CalendarEvent {
  id: string;
  day: number; // 0=Mon … 5=Sat
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  patient: string;
  doctor: string;
  category?: string;
  color: CalendarColor;
  patientId?: string;
  phone?: string;
  email?: string;
  room?: string;
  notes?: string;
  tags?: string[];
  appointmentId?: string;
  status?: string;
}

/* ─── Color map for appointment types ─── */
const TYPE_COLORS: Record<string, CalendarColor> = {
  consultation: 'blue',
  treatment: 'green',
  followup: 'lilac',
  emergency: 'red',
  hygiene: 'magenta',
  surgery: 'orange',
  implant: 'green',
  prosthetics: 'orange',
};

/* ─── Helper: time → pixel offset ─── */
const BASE_HOUR = 8;
const PX_PER_HOUR = 75;
function timeToOffset(hour: number, min: number): number {
  return ((hour - BASE_HOUR) + min / 60) * PX_PER_HOUR;
}
function durationToPx(sh: number, sm: number, eh: number, em: number): number {
  return ((eh - sh) + (em - sm) / 60) * PX_PER_HOUR;
}
function timeToMinutes(h: number, m: number) { return h * 60 + m; }

/* ─── Overlap layout algorithm ─── */
function layoutEvents(events: CalendarEvent[]): (CalendarEvent & { col: number; totalCols: number })[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => timeToMinutes(a.startHour, a.startMin) - timeToMinutes(b.startHour, b.startMin));
  const result: (CalendarEvent & { col: number; totalCols: number })[] = [];
  const groups: CalendarEvent[][] = [];

  let currentGroup: CalendarEvent[] = [sorted[0]];
  let groupEnd = timeToMinutes(sorted[0].endHour, sorted[0].endMin);

  for (let i = 1; i < sorted.length; i++) {
    const ev = sorted[i];
    const evStart = timeToMinutes(ev.startHour, ev.startMin);
    if (evStart < groupEnd) {
      currentGroup.push(ev);
      groupEnd = Math.max(groupEnd, timeToMinutes(ev.endHour, ev.endMin));
    } else {
      groups.push(currentGroup);
      currentGroup = [ev];
      groupEnd = timeToMinutes(ev.endHour, ev.endMin);
    }
  }
  groups.push(currentGroup);

  for (const group of groups) {
    const columns: CalendarEvent[][] = [];
    for (const ev of group) {
      const evStart = timeToMinutes(ev.startHour, ev.startMin);
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1];
        if (evStart >= timeToMinutes(lastInCol.endHour, lastInCol.endMin)) {
          columns[c].push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([ev]);
    }
    const totalCols = columns.length;
    for (let c = 0; c < columns.length; c++) {
      for (const ev of columns[c]) {
        result.push({ ...ev, col: c, totalCols });
      }
    }
  }
  return result;
}

const TIME_SLOTS: { label: string; isHour: boolean }[] = [];
for (let h = 8; h <= 18; h++) {
  TIME_SLOTS.push({ label: `${h}:00`, isHour: true });
  if (h < 18) TIME_SLOTS.push({ label: `${h}:30`, isHour: false });
}

/* ─── Date picker helpers ─── */
const WEEKDAY_LABELS = ['H', 'K', 'SZ', 'CS', 'P', 'Szo', 'V'];
const MONTH_NAMES = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
const DAY_NAMES = ['HÉTFŐ', 'KEDD', 'SZERDA', 'CSÜTÖRTÖK', 'PÉNTEK', 'SZOMBAT'];

function getCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const rows: (number | null)[][] = [];
  let day = 1;
  let nextDay = 1;

  for (let r = 0; r < 6; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (idx < startDay) {
        row.push(-(daysInPrev - startDay + idx + 1));
      } else if (day <= daysInMonth) {
        row.push(day++);
      } else {
        row.push(-(100 + nextDay++));
      }
    }
    rows.push(row);
  }
  return rows;
}

export default function NaptarPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  // Data from Supabase
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Search + filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

  const router = useRouter();

  // Drag-and-drop state
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);

  const supabase = createClient();

  // Generate day headers for current week
  const days = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = addDays(currentWeekStart, i);
      return {
        date: format(date, 'MMMM d.', { locale: hu }),
        name: DAY_NAMES[i],
        fullDate: date,
        isToday: isToday(date),
      };
    });
  }, [currentWeekStart]);

  // Date nav label
  const weekLabel = useMemo(() => {
    const end = addDays(currentWeekStart, 5);
    const startMonth = format(currentWeekStart, 'MMM.', { locale: hu });
    const endDay = format(end, 'd', { locale: hu });
    const startDay = format(currentWeekStart, 'd', { locale: hu });
    const year = format(currentWeekStart, 'yyyy');
    return `${startMonth} ${startDay}-${endDay}., ${year}`;
  }, [currentWeekStart]);

  const calGrid = useMemo(() => getCalendarGrid(pickerYear, pickerMonth), [pickerYear, pickerMonth]);

  // Fetch appointments for current week
  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      const weekEnd = addDays(currentWeekStart, 6);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          appointment_type,
          status,
          treatment_notes,
          patient:patients!appointments_patient_id_fkey(id, first_name, last_name, phone, email),
          doctor:staff!appointments_doctor_id_fkey(id, first_name, last_name),
          chair:chairs!appointments_chair_id_fkey(name)
        `)
        .gte('start_time', currentWeekStart.toISOString())
        .lt('start_time', weekEnd.toISOString())
        .order('start_time');

      if (error) {
        console.error('Error fetching appointments:', error);
        setLoading(false);
        return;
      }

      // Transform to CalendarEvent format
      const calEvents: CalendarEvent[] = (appointments || []).map((apt: Record<string, unknown>) => {
        const start = new Date(apt.start_time as string);
        const end = new Date(apt.end_time as string);
        const dayOfWeek = start.getDay();
        const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0 ... Sun=6

        const patient = apt.patient as Record<string, string> | null;
        const doctor = apt.doctor as Record<string, string> | null;
        const chair = apt.chair as Record<string, string> | null;

        return {
          id: apt.id as string,
          day: dayIdx,
          startHour: start.getHours(),
          startMin: start.getMinutes(),
          endHour: end.getHours(),
          endMin: end.getMinutes(),
          patient: patient ? `${patient.last_name} ${patient.first_name}` : 'Ismeretlen',
          doctor: doctor ? `Dr. ${doctor.last_name} ${doctor.first_name}` : '',
          category: apt.appointment_type as string,
          color: TYPE_COLORS[(apt.appointment_type as string) || 'consultation'] || 'blue',
          patientId: patient?.id,
          phone: patient?.phone,
          email: patient?.email,
          room: chair?.name,
          notes: apt.treatment_notes as string | undefined,
          tags: [(apt.appointment_type as string || '').toUpperCase()],
          appointmentId: apt.id as string,
          status: apt.status as string,
        };
      });

      setEvents(calEvents);
      setLoading(false);
    }

    fetchAppointments();

    // Realtime subscription
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          fetchAppointments(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWeekStart]);

  // Fetch doctors for filter
  useEffect(() => {
    async function fetchDoctors() {
      const { data } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .eq('role', 'doctor')
        .eq('is_active', true)
        .order('last_name');

      if (data) {
        setDoctors(data.map(d => ({
          id: d.id,
          name: `Dr. ${d.last_name} ${d.first_name}`,
        })));
      }
    }
    fetchDoctors();
  }, []);

  const handleEventDoubleClick = useCallback((event: CalendarEvent) => {
    setDatePickerOpen(false);
    setSelectedEvent(event);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const goToPrevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));

  // ─── Drag-and-drop handlers ───
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    setDraggingEventId(event.id);
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
    // Create a subtle drag image
    const el = e.currentTarget as HTMLElement;
    if (el) {
      e.dataTransfer.setDragImage(el, el.offsetWidth / 2, 15);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (!eventId) return;

    const columnEl = e.currentTarget as HTMLElement;
    const rect = columnEl.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Convert Y position to time (snap to 15-min intervals)
    const rawHours = y / PX_PER_HOUR + BASE_HOUR;
    const totalMinutes = Math.round(rawHours * 60 / 15) * 15; // snap to 15-min
    const newStartHour = Math.floor(totalMinutes / 60);
    const newStartMin = totalMinutes % 60;

    // Find original event to keep duration
    const originalEvent = events.find(ev => ev.id === eventId);
    if (!originalEvent) return;

    const originalDuration = (originalEvent.endHour * 60 + originalEvent.endMin) - (originalEvent.startHour * 60 + originalEvent.startMin);
    const newEndTotalMin = newStartHour * 60 + newStartMin + originalDuration;
    const newEndHour = Math.floor(newEndTotalMin / 60);
    const newEndMin = newEndTotalMin % 60;

    // Build new dates
    const targetDate = addDays(currentWeekStart, dayIdx);
    const newStart = new Date(targetDate);
    newStart.setHours(newStartHour, newStartMin, 0, 0);
    const newEnd = new Date(targetDate);
    newEnd.setHours(newEndHour, newEndMin, 0, 0);

    // Optimistic update
    setEvents(prev => prev.map(ev => ev.id === eventId ? {
      ...ev,
      day: dayIdx,
      startHour: newStartHour,
      startMin: newStartMin,
      endHour: newEndHour,
      endMin: newEndMin,
    } : ev));
    setDraggingEventId(null);

    // Update Supabase
    await supabase
      .from('appointments')
      .update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      })
      .eq('id', originalEvent.appointmentId || eventId);

    // Realtime subscription will auto-refresh, but we already did optimistic update
  }, [events, currentWeekStart, supabase]);

  const handleDragEnd = useCallback(() => {
    setDraggingEventId(null);
  }, []);

  // Save appointment (create or edit)
  const handleSaveAppointment = useCallback(async (data: AppointmentFormData, id?: string) => {
    setSaving(true);
    const startDT = new Date(`${data.date}T${data.start_time}:00`);
    const endDT = new Date(`${data.date}T${data.end_time}:00`);

    // Get location_id (use first location)
    const { data: locations } = await supabase.from('locations').select('id').limit(1);
    const locationId = locations?.[0]?.id;

    const payload = {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      chair_id: data.chair_id || null,
      location_id: locationId,
      start_time: startDT.toISOString(),
      end_time: endDT.toISOString(),
      appointment_type: data.appointment_type,
      treatment_notes: data.treatment_notes || null,
      status: 'scheduled',
    };

    if (id) {
      await supabase.from('appointments').update(payload).eq('id', id);
    } else {
      await supabase.from('appointments').insert(payload);
    }

    setSaving(false);
    setCreateDrawerOpen(false);
    setSelectedEvent(null);
    // Realtime subscription will auto-refresh
  }, [supabase]);

  // Update appointment status
  const handleStatusUpdate = useCallback(async (appointmentId: string, newStatus: string) => {
    await supabase.from('appointments').update({ status: newStatus }).eq('id', appointmentId);
    // Update local state immediately
    setSelectedEvent(prev => prev ? { ...prev, status: newStatus } : null);
  }, [supabase]);

  return (
    <AppShell>
      <div className={styles.adminBase}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <button
            className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(o => !o)}
          >
            <Funnel size={18} weight={filterOpen ? 'fill' : 'regular'} />
            Szűrő
          </button>

          <div className={styles.searchBox}>
            <MagnifyingGlass size={18} color="var(--color-neutral-600)" />
            <input
              placeholder="Keresés a naptárban"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.dateNav}>
            <button className={styles.dateNavBtn} onClick={goToPrevWeek}><CaretCircleLeft size={32} /></button>
            <span
              className={styles.dateNavLabel}
              onClick={() => { setDatePickerOpen(o => !o); setSelectedEvent(null); }}
              style={{ cursor: 'pointer' }}
            >
              {weekLabel}
            </span>
            <button className={styles.dateNavBtn} onClick={goToNextWeek}><CaretCircleRight size={32} /></button>

            {/* Date picker popup */}
            {datePickerOpen && (
              <div className={styles.datePicker}>
                <div className={styles.datePickerHeader}>
                  <button
                    className={styles.datePickerNav}
                    onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(y => y - 1); } else setPickerMonth(m => m - 1); }}
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  <span className={styles.datePickerTitle}>{MONTH_NAMES[pickerMonth]} {pickerYear}</span>
                  <button
                    className={styles.datePickerNav}
                    onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(y => y + 1); } else setPickerMonth(m => m + 1); }}
                  >
                    <CaretRight size={16} weight="bold" />
                  </button>
                </div>
                <div className={styles.datePickerWeekdays}>
                  {WEEKDAY_LABELS.map(d => <span key={d} className={styles.datePickerWeekday}>{d}</span>)}
                </div>
                <div className={styles.datePickerGrid}>
                  {calGrid.map((row, ri) => (
                    <div key={ri} className={styles.datePickerRow}>
                      {row.map((day, ci) => {
                        const isCurrentMonth = day !== null && day > 0;
                        const displayDay = day === null ? '' : day < -100 ? Math.abs(day) - 100 : day < 0 ? Math.abs(day) : day;
                        const todayDate = new Date();
                        const isTodayDay = isCurrentMonth && day === todayDate.getDate() && pickerMonth === todayDate.getMonth() && pickerYear === todayDate.getFullYear();
                        return (
                          <button
                            key={ci}
                            className={`${styles.datePickerDay} ${!isCurrentMonth ? styles.datePickerDayOther : ''} ${isTodayDay ? styles.datePickerDayToday : ''}`}
                            onClick={() => {
                              if (isCurrentMonth && day) {
                                const selectedDate = new Date(pickerYear, pickerMonth, day);
                                setCurrentWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
                              }
                              setDatePickerOpen(false);
                            }}
                          >
                            {displayDay}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className={styles.addBtn} onClick={() => { setCreateDrawerOpen(true); setSelectedEvent(null); setDatePickerOpen(false); }}>
            <PlusCircle size={54} weight="thin" />
          </button>
        </div>

        {/* Calendar area */}
        <div className={styles.calendarArea}>
          {/* Filter sidebar */}
          <div className={`${styles.filterSidebar} ${!filterOpen ? styles.filterSidebarHidden : ''}`}>
            <CheckGroup icon={<Users size={14} />} label="ORVOSOK" items={doctors.map(d => d.name)} onToggle={(name, checked) => {
              setDoctorFilter(prev => { const next = new Set(prev); if (checked) next.delete(name); else next.add(name); return next; });
            }} />
            <CheckGroup icon={<House size={14} />} label="RENDELŐK" items={['1-es szék', '2-es szék', '3-as szék']} />
            <CheckGroup icon={<Flag size={14} />} label="TÍPUS" items={['consultation', 'treatment', 'followup', 'emergency', 'hygiene', 'surgery']} onToggle={(name, checked) => {
              setTypeFilter(prev => { const next = new Set(prev); if (checked) next.delete(name); else next.add(name); return next; });
            }} />
          </div>

          {/* Calendar grid */}
          <div className={styles.calendarGrid}>
            {/* Time column */}
            <div className={styles.timeColumn}>
              {TIME_SLOTS.map((slot, i) => (
                <div key={i} className={styles.timeSlot}>
                  <span className={`${styles.timeLabel} ${slot.isHour ? styles.timeLabelHour : styles.timeLabelHalf}`}>
                    {slot.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className={styles.dayColumnsWrapper}>
              {/* Day headers */}
              <div className={styles.dayHeaders}>
                {days.map((day, i) => (
                  <div key={i} className={`${styles.dayHeader} ${day.isToday ? styles.dayHeaderToday : ''}`}>
                    <span className={styles.dayHeaderDate}>{day.date}</span>
                    <span className={styles.dayHeaderName}>{day.name}</span>
                  </div>
                ))}
              </div>

              {/* Day columns body with events */}
              <div className={styles.dayColumnsBody}>
                {loading && (
                  <div className={styles.loadingOverlay}>Betöltés...</div>
                )}
                {days.map((_, dayIdx) => {
                  let dayEvents = events.filter(e => e.day === dayIdx);
                  // Apply search filter
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    dayEvents = dayEvents.filter(e => e.patient.toLowerCase().includes(q) || e.doctor.toLowerCase().includes(q));
                  }
                  // Apply doctor filter
                  if (doctorFilter.size > 0) {
                    dayEvents = dayEvents.filter(e => doctorFilter.has(e.doctor));
                  }
                  // Apply type filter
                  if (typeFilter.size > 0) {
                    dayEvents = dayEvents.filter(e => e.category && typeFilter.has(e.category));
                  }
                  const layouted = layoutEvents(dayEvents);
                  return (
                    <div
                    key={dayIdx}
                    className={styles.dayColumn}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dayIdx)}
                  >
                      {/* Hour guide lines */}
                      {Array.from({ length: 21 }, (_, i) => (
                        <div key={i} className={styles.hourGuide} style={{ top: i * 37.5 }} />
                      ))}

                      {/* Events with overlap handling */}
                      {layouted.map(event => {
                        const top = timeToOffset(event.startHour, event.startMin);
                        const height = durationToPx(event.startHour, event.startMin, event.endHour, event.endMin);
                        const timeStr = `${event.startHour}:${String(event.startMin).padStart(2, '0')}-${event.endHour}:${String(event.endMin).padStart(2, '0')}`;
                        const widthPct = 100 / event.totalCols;
                        const leftPct = (event.col / event.totalCols) * 100;
                        return (
                          <div
                            key={event.id}
                            className={`${styles.calEntry} ${draggingEventId === event.id ? styles.calEntryDragging : ''}`}
                            style={{
                              top,
                              height,
                              left: `calc(${leftPct}% + 2px)`,
                              right: `calc(${100 - leftPct - widthPct}% + 2px)`,
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onDragEnd={handleDragEnd}
                            onDoubleClick={() => handleEventDoubleClick(event)}
                          >
                            <CalendarEntry
                              color={event.color}
                              timeRange={timeStr}
                              patientName={event.patient}
                              doctorName={event.doctor}
                              category={event.category}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Appointment detail drawer */}
          {selectedEvent && (
            <div className={styles.drawer}>
              <div className={styles.drawerHeader}>
                <span className={styles.drawerTitle}>Vizit gyorsnézet</span>
                <button className={styles.drawerClose} onClick={closeDrawer}><X size={20} /></button>
              </div>

              <div className={styles.drawerPatient}>
                <h2 className={styles.drawerPatientName}>
                  <span style={{ cursor: 'pointer' }} onClick={() => selectedEvent?.patientId && router.push(`/paciensek/${selectedEvent.patientId}`)}>
                    {selectedEvent.patient}
                    <ArrowSquareOut size={18} className={styles.drawerLink} />
                  </span>
                </h2>
                <p className={styles.drawerPatientId}>ID: {selectedEvent.patientId?.slice(0, 8)}</p>
                {selectedEvent.phone && (
                  <div className={styles.drawerContact}>
                    <span><Phone size={14} weight="fill" color="var(--color-primary-500)" /> {selectedEvent.phone}</span>
                    {selectedEvent.email && <span><EnvelopeSimple size={14} weight="fill" color="var(--color-primary-500)" /> {selectedEvent.email}</span>}
                  </div>
                )}
              </div>

              {/* PÁCIENS ADATOK section */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <Users size={16} /> PÁCIENS ADATOK
                </div>
                <div className={styles.drawerSectionBody}>
                  <p className={styles.drawerLabel}>Címkék, jelölők</p>
                  <div className={styles.drawerTags}>
                    {(selectedEvent.tags || []).map(tag => (
                      <span key={tag} className={styles.drawerTag}>{tag}</span>
                    ))}
                  </div>
                  <p className={styles.drawerLabel}>Státusz</p>
                  <p className={styles.drawerText}>{selectedEvent.status || 'scheduled'}</p>
                </div>
              </div>

              {/* AKTUÁLIS VIZIT section */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <Tooth size={16} /> AKTUÁLIS VIZIT
                </div>
                <div className={styles.drawerSectionBody}>
                  <div className={styles.drawerStatusRow}>
                    {[
                      { label: 'Megérkezett', value: 'arrived' },
                      { label: 'Elkezdve', value: 'in_progress' },
                      { label: 'Lezárva', value: 'completed' },
                      { label: 'Lemondva', value: 'cancelled' },
                      { label: 'No-show', value: 'no_show' },
                    ].map(s => (
                      <button
                        key={s.value}
                        className={`${styles.drawerStatusBtn} ${selectedEvent?.status === s.value ? styles.drawerStatusBtnActive : ''}`}
                        onClick={() => selectedEvent?.appointmentId && handleStatusUpdate(selectedEvent.appointmentId, s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className={styles.drawerLabel}>Vizit információk</p>
                  <div className={styles.drawerVisitCard}>
                    <div className={styles.drawerVisitCardHeader}>
                      <CalendarBlank size={16} />
                      <span>
                        {days[selectedEvent.day]?.date} ({days[selectedEvent.day]?.name?.charAt(0)}),{' '}
                        {selectedEvent.startHour}:{String(selectedEvent.startMin).padStart(2, '0')}
                      </span>
                      <PencilSimple size={14} className={styles.drawerLink} style={{ cursor: 'pointer' }} onClick={() => {
                        setEditDrawerOpen(true);
                      }} />
                    </div>
                    <p className={styles.drawerVisitType}>{selectedEvent.category || 'Konzultáció'}</p>
                    <p className={styles.drawerVisitDoctor}>{selectedEvent.doctor}</p>
                    <div className={styles.drawerVisitMeta}>
                      <span><Clock size={14} /> {durationToText(selectedEvent)}</span>
                      <span><House size={14} /> {selectedEvent.room || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className={styles.drawerNotes}>
                  <p className={styles.drawerText} style={{ color: 'var(--color-neutral-600)' }}>{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create appointment drawer */}
        <Drawer
          open={createDrawerOpen}
          onClose={() => setCreateDrawerOpen(false)}
          title="Új időpont létrehozása"
          width="wide"
        >
          <AppointmentForm
            defaultDate={format(currentWeekStart, 'yyyy-MM-dd')}
            onSave={handleSaveAppointment}
            onCancel={() => setCreateDrawerOpen(false)}
            saving={saving}
          />
        </Drawer>

        {/* Edit appointment drawer */}
        <Drawer
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          title="Időpont szerkesztése"
          width="wide"
        >
          {selectedEvent && (
            <AppointmentForm
              initialData={{
                id: selectedEvent.appointmentId,
                date: format(addDays(currentWeekStart, selectedEvent.day), 'yyyy-MM-dd'),
                start_time: `${String(selectedEvent.startHour).padStart(2, '0')}:${String(selectedEvent.startMin).padStart(2, '0')}`,
                end_time: `${String(selectedEvent.endHour).padStart(2, '0')}:${String(selectedEvent.endMin).padStart(2, '0')}`,
                appointment_type: selectedEvent.category || 'consultation',
                treatment_notes: selectedEvent.notes || '',
              }}
              onSave={async (data, id) => {
                await handleSaveAppointment(data, id);
                setEditDrawerOpen(false);
              }}
              onCancel={() => setEditDrawerOpen(false)}
              saving={saving}
            />
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}

function durationToText(e: CalendarEvent): string {
  const mins = (e.endHour * 60 + e.endMin) - (e.startHour * 60 + e.startMin);
  return `${mins} perc`;
}

/* ─── CheckGroup helper ─── */
function CheckGroup({ icon, label, items, onToggle }: { icon: React.ReactNode; label: string; items: string[]; onToggle?: (name: string, checked: boolean) => void }) {
  return (
    <div className={styles.filterGroup}>
      <div className={styles.filterGroupLabel}>
        {icon} {label}
      </div>
      {items.map(name => (
        <label key={name} className={styles.filterItem}>
          <input type="checkbox" defaultChecked onChange={e => onToggle?.(name, e.target.checked)} />
          {name}
        </label>
      ))}
    </div>
  );
}
