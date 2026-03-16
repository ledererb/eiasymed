'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Funnel, MagnifyingGlass, CaretCircleLeft, CaretCircleRight, PlusCircle,
  Users, House, Flag, CaretLeft, CaretRight, Clock, X,
  Phone, EnvelopeSimple, CalendarBlank, PencilSimple, ArrowSquareOut, Tooth,
} from '@phosphor-icons/react';
import { TopNav } from '@/components/TopNav';
import { CalendarEntry, CalendarColor } from '@/components/CalendarEntry';
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
}

/* ─── Sample data matching Figma ─── */
const DAYS = [
  { date: 'március 2.', name: 'HÉTFŐ' },
  { date: 'március 3.', name: 'KEDD' },
  { date: 'március 4.', name: 'SZERDA' },
  { date: 'március 5.', name: 'CSÜTÖRTÖK' },
  { date: 'március 6.', name: 'PÉNTEK' },
  { date: 'március 7.', name: 'SZOMBAT' },
];

const EVENTS: CalendarEvent[] = [
  // Monday
  { id: 'e1', day: 0, startHour: 8, startMin: 0, endHour: 9, endMin: 30, patient: 'Nagy Tamás', doctor: 'Dr. Harmathy Béla', category: 'implantáció', color: 'green', patientId: '223456781', phone: '+36 70 111 2222', email: 'nagy.tamas@mail.com', room: '1-es rendelő', tags: ['IMPLANTÁCIÓ'] },
  { id: 'e2', day: 0, startHour: 9, startMin: 0, endHour: 11, endMin: 0, patient: 'Bíró János Attila', doctor: 'Dr. Kiss Orsolya', category: 'full kontúr cirkon híd', color: 'magenta', patientId: '223456782', phone: '+36 70 222 3333', email: 'biro.janos@mail.com', room: '2-es rendelő', tags: ['KONZULTÁCIÓ'] },
  { id: 'e3', day: 0, startHour: 10, startMin: 15, endHour: 12, endMin: 0, patient: 'Majoros Ádám', doctor: 'Dr. Harmathy Béla', category: 'implantáció', color: 'green', patientId: '223456783', phone: '+36 70 333 4444', email: 'majoros.adam@mail.com', room: '1-es rendelő', tags: ['IMPLANTÁCIÓ'] },
  { id: 'e4', day: 0, startHour: 11, startMin: 30, endHour: 13, endMin: 0, patient: 'Zilahy Máté', doctor: 'Dr. Kiss Orsolya', category: 'fémkerámia korona', color: 'magenta', patientId: '223456784', phone: '+36 70 444 5555', email: 'zilahy.mate@mail.com', room: '2-es rendelő', tags: ['KORONA'] },
  { id: 'e5', day: 0, startHour: 13, startMin: 0, endHour: 14, endMin: 0, patient: 'Mérey Bernadett', doctor: 'Dr. Kardos Árpád', color: 'blue', patientId: '223456785', phone: '+36 70 555 6666', email: 'merey.b@mail.com', room: '3-as rendelő' },
  { id: 'e6', day: 0, startHour: 14, startMin: 0, endHour: 15, endMin: 30, patient: 'Halmi Benjámin', doctor: 'Dr. Moór Izabella', category: 'fogszabályozás', color: 'lilac', patientId: '223456786', phone: '+36 70 666 7777', email: 'halmi.b@mail.com', room: '4-es rendelő', tags: ['FOGSZABÁLYOZÁS'] },
  { id: 'e7', day: 0, startHour: 14, startMin: 30, endHour: 15, endMin: 45, patient: 'Kelemen Bálint', doctor: 'Dr. Kardos Árpád', category: 'bölcsességfog', color: 'blue', patientId: '223456787', phone: '+36 70 777 8888', email: 'kelemen.b@mail.com', room: '3-as rendelő' },
  { id: 'e8', day: 0, startHour: 15, startMin: 30, endHour: 16, endMin: 30, patient: 'Laki Márton', doctor: 'Dr. Moór Izabella', category: 'konzultáció', color: 'lilac', patientId: '223456788', phone: '+36 70 888 9999', email: 'laki.m@mail.com', room: '4-es rendelő' },
  // Tuesday
  { id: 'e9', day: 1, startHour: 8, startMin: 0, endHour: 9, endMin: 0, patient: 'Kovács Levente', doctor: 'Dr. Harmathy Béla', color: 'green', patientId: '223456789', phone: '+36 70 123 4567', email: 'kovacs.l@mail.com', room: '1-es rendelő', notes: 'All-on-4 érdekli', tags: ['KONZULTÁCIÓ'] },
  // Wednesday
  { id: 'e10', day: 2, startHour: 9, startMin: 30, endHour: 11, endMin: 0, patient: 'Galambos Eszter', doctor: 'Dr. Kardos Árpád', category: 'fogszabályozás', color: 'blue', patientId: '223456790', phone: '+36 70 234 5678', email: 'galambos.e@mail.com', room: '3-as rendelő' },
  { id: 'e11', day: 2, startHour: 11, startMin: 0, endHour: 12, endMin: 0, patient: 'Soós Marcell', doctor: 'Dr. Kardos Árpád', color: 'blue', patientId: '223456791', phone: '+36 70 345 6789', email: 'soos.m@mail.com', room: '3-as rendelő' },
  { id: 'e12', day: 2, startHour: 13, startMin: 0, endHour: 14, endMin: 30, patient: 'Harmath Tamás', doctor: 'Dr. Kardos Árpád', category: 'melásgör', color: 'blue', patientId: '223456792', phone: '+36 70 456 7890', email: 'harmath.t@mail.com', room: '3-as rendelő' },
  { id: 'e13', day: 2, startHour: 14, startMin: 30, endHour: 16, endMin: 0, patient: 'Dr. Berényi Nikolett', doctor: 'Dr. Harmathy Béla', category: 'fogszabályozás', color: 'green', patientId: '223456793', phone: '+36 70 567 8901', email: 'berenyi.n@mail.com', room: '1-es rendelő' },
  // Thursday
  { id: 'e14', day: 3, startHour: 8, startMin: 30, endHour: 11, endMin: 0, patient: 'Eschbach, Anna', doctor: 'Dr. Varga Péter', category: 'All-on-4', color: 'orange', patientId: '223456794', phone: '+36 70 678 9012', email: 'eschbach.a@mail.com', room: '5-ös rendelő' },
  { id: 'e15', day: 3, startHour: 11, startMin: 0, endHour: 12, endMin: 0, patient: 'Becker, Wolfgang', doctor: 'Dr. Varga Péter', color: 'orange', patientId: '223456795', phone: '+36 70 789 0123', email: 'becker.w@mail.com', room: '5-ös rendelő' },
  { id: 'e16', day: 3, startHour: 12, startMin: 0, endHour: 13, endMin: 30, patient: 'Ashe, Hannah', doctor: 'Dr. Varga Péter', category: 'kontroll', color: 'orange', patientId: '223456796', phone: '+36 70 890 1234', email: 'ashe.h@mail.com', room: '5-ös rendelő' },
  { id: 'e17', day: 3, startHour: 14, startMin: 0, endHour: 17, endMin: 0, patient: 'Sommer, Elke', doctor: 'Dr. Varga Péter', category: 'All-on-4', color: 'orange', patientId: '223456797', phone: '+36 70 901 2345', email: 'sommer.e@mail.com', room: '5-ös rendelő' },
  // Saturday
  { id: 'e18', day: 5, startHour: 8, startMin: 0, endHour: 8, endMin: 30, patient: '', doctor: '', category: 'Zárva vagyunk (műszaki ok)', color: 'red' },
];

/* ─── Filter data ─── */
const DOCTORS = ['Dr. Fóti Ágota', 'Dr. Harmathy Béla', 'Dr. Kardos Árpád', 'Dr. Kiss Orsolya', 'Dr. László Péter', 'Dr. Moór Izabella', 'Dr. Varga Péter'];
const HYGIENISTS = ['Antal Ivett', 'Németh Lilla'];
const ROOMS = ['1-es rendelő', '2-es rendelő', '3-as rendelő', '4-es rendelő', '5-ös rendelő', 'Tárgyaló'];
const NATIONALITIES = ['magyar', 'német', 'angol', 'francia', 'izlandi'];

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

  // Group overlapping events
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
    // Assign columns within each group
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

function getCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1; // Mon=0
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
        row.push(-(daysInPrev - startDay + idx + 1)); // negative = prev month
      } else if (day <= daysInMonth) {
        row.push(day++);
      } else {
        row.push(-(100 + nextDay++)); // negative > 100 = next month
      }
    }
    rows.push(row);
  }
  return rows;
}

export default function NaptarPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('naptar');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(2); // March = 2
  const [pickerYear, setPickerYear] = useState(2026);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const calGrid = useMemo(() => getCalendarGrid(pickerYear, pickerMonth), [pickerYear, pickerMonth]);

  const handleEventDoubleClick = useCallback((event: CalendarEvent) => {
    setDatePickerOpen(false);
    setSelectedEvent(event);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  return (
    <div className={styles.page}>
      <TopNav
        items={[
          { id: 'nyilv', label: 'Nyilvántartás' },
          { id: 'naptar', label: 'Naptár' },
          { id: 'dok', label: 'Dokumentumok' },
          { id: 'crm', label: 'CRM' },
          { id: 'penzugy', label: 'Pénzügy' },
          { id: 'riportok', label: 'Riportok' },
        ]}
        activeId={activeNav}
        onSelect={setActiveNav}
      />

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
            <input placeholder="Keresés a naptárban" />
          </div>

          <div className={styles.dateNav}>
            <button className={styles.dateNavBtn}><CaretCircleLeft size={32} /></button>
            <span
              className={styles.dateNavLabel}
              onClick={() => { setDatePickerOpen(o => !o); setSelectedEvent(null); }}
              style={{ cursor: 'pointer' }}
            >
              Márc. 2-8., 2026
            </span>
            <button className={styles.dateNavBtn}><CaretCircleRight size={32} /></button>

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
                  <span className={styles.datePickerTitle}>{MONTH_NAMES[pickerMonth]}</span>
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
                        const isToday = isCurrentMonth && day === 3 && pickerMonth === 2;
                        return (
                          <button
                            key={ci}
                            className={`${styles.datePickerDay} ${!isCurrentMonth ? styles.datePickerDayOther : ''} ${isToday ? styles.datePickerDayToday : ''}`}
                            onClick={() => setDatePickerOpen(false)}
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

          <button className={styles.addBtn}>
            <PlusCircle size={54} weight="thin" />
          </button>
        </div>

        {/* Calendar area */}
        <div className={styles.calendarArea}>
          {/* Filter sidebar */}
          <div className={`${styles.filterSidebar} ${!filterOpen ? styles.filterSidebarHidden : ''}`}>
            <CheckGroup icon={<Users size={14} />} label="ORVOSOK" items={DOCTORS} />
            <CheckGroup icon={<Users size={14} />} label="DENTÁLHIGIÉNIKUSOK" items={HYGIENISTS} />
            <CheckGroup icon={<House size={14} />} label="RENDELŐK" items={ROOMS} />
            <CheckGroup icon={<Flag size={14} />} label="NEMZETISÉG" items={NATIONALITIES} />
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
                {DAYS.map((day, i) => (
                  <div key={i} className={styles.dayHeader}>
                    <span className={styles.dayHeaderDate}>{day.date}</span>
                    <span className={styles.dayHeaderName}>{day.name}</span>
                  </div>
                ))}
              </div>

              {/* Day columns body with events */}
              <div className={styles.dayColumnsBody}>
                {DAYS.map((_, dayIdx) => {
                  const dayEvents = EVENTS.filter(e => e.day === dayIdx);
                  const layouted = layoutEvents(dayEvents);
                  return (
                    <div key={dayIdx} className={styles.dayColumn}>
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
                            className={styles.calEntry}
                            style={{
                              top,
                              height,
                              left: `calc(${leftPct}% + 2px)`,
                              right: `calc(${100 - leftPct - widthPct}% + 2px)`,
                            }}
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
                  {selectedEvent.patient}
                  <ArrowSquareOut size={18} className={styles.drawerLink} />
                </h2>
                <p className={styles.drawerPatientId}>ID: {selectedEvent.patientId}</p>
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
                  <p className={styles.drawerLabel}>Korábbi időpontok</p>
                  <p className={styles.drawerText}>Új páciens</p>
                </div>
              </div>

              {/* AKTUÁLIS VIZIT section */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <Tooth size={16} /> AKTUÁLIS VIZIT
                </div>
                <div className={styles.drawerSectionBody}>
                  <div className={styles.drawerStatusRow}>
                    {['Megérkezett', 'Elkezdve', 'Lezárva', 'Lemondva', 'No-show'].map(s => (
                      <button key={s} className={styles.drawerStatusBtn}>{s}</button>
                    ))}
                  </div>
                  <p className={styles.drawerLabel}>Vizit információk</p>
                  <div className={styles.drawerVisitCard}>
                    <div className={styles.drawerVisitCardHeader}>
                      <CalendarBlank size={16} />
                      <span>2026. márc. {2 + (selectedEvent.day || 0)}. ({DAYS[selectedEvent.day]?.name?.charAt(0) || 'H'}), {selectedEvent.startHour}:{String(selectedEvent.startMin).padStart(2, '0')}</span>
                      <PencilSimple size={14} className={styles.drawerLink} />
                    </div>
                    <p className={styles.drawerVisitType}>{selectedEvent.category || 'Konzultáció'}</p>
                    <p className={styles.drawerVisitId}>#{selectedEvent.patientId} <ArrowSquareOut size={12} className={styles.drawerLink} /></p>
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
      </div>
    </div>
  );
}

function durationToText(e: CalendarEvent): string {
  const mins = (e.endHour * 60 + e.endMin) - (e.startHour * 60 + e.startMin);
  return `${mins} perc`;
}

/* ─── CheckGroup helper ─── */
function CheckGroup({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
  return (
    <div className={styles.filterGroup}>
      <div className={styles.filterGroupLabel}>
        {icon} {label}
      </div>
      {items.map(name => (
        <label key={name} className={styles.filterItem}>
          <input type="checkbox" defaultChecked />
          {name}
        </label>
      ))}
    </div>
  );
}
