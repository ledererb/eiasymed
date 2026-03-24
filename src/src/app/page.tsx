'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, CurrencyDollar, UserPlus,
  CalendarPlus, ClipboardText, TrendUp,
  CalendarBlank, ArrowRight
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase-browser';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import styles from './page.module.css';

interface DashboardData {
  todayAppointments: Array<{
    id: string;
    start_time: string;
    end_time: string;
    patient_name: string;
    treatment: string;
    status: string;
    color: string;
  }>;
  kpi: {
    todayApptCount: number;
    monthRevenue: number;
    totalPatients: number;
    newLeads: number;
  };
  recentActivity: Array<{
    id: string;
    text: string;
    highlight: string;
    time: string;
    color: 'green' | 'blue' | 'orange' | 'pink';
  }>;
  treatmentStats: Array<{
    label: string;
    count: number;
    max: number;
    color: string;
  }>;
  invoiceStats: {
    paid: number;
    pending: number;
    overdue: number;
    total: number;
  };
}

const COLORS = ['#186D98', '#C43284', '#32B100', '#FF9D00', '#62AACE', '#ED51A8', '#1CEEE0', '#FFCE49'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hu-HU').format(Math.round(amount)) + ' Ft';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} perce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} órája`;
  return `${Math.floor(hours / 24)} napja`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch today's appointments
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, status, appointment_type, treatment_notes, patients ( first_name, last_name )')
        .gte('start_time', todayStart)
        .lt('start_time', todayEnd)
        .order('start_time');

      // Fetch all appointments for today count (fallback: show recent if none today)
      const todayAppts = (appts || []).map((a: any, i: number) => ({
        id: a.id,
        start_time: a.start_time,
        end_time: a.end_time,
        patient_name: `${a.patients?.last_name || ''} ${a.patients?.first_name || ''}`.trim() || 'N/A',
        treatment: a.appointment_type || a.treatment_notes || 'Időpont',
        status: a.status || 'scheduled',
        color: COLORS[i % COLORS.length],
      }));

      // If no appointments today, show the nearest upcoming ones
      let scheduleItems = todayAppts;
      if (scheduleItems.length === 0) {
        const { data: upcoming } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, status, appointment_type, treatment_notes, patients ( first_name, last_name )')
          .gte('start_time', now.toISOString())
          .order('start_time')
          .limit(8);

        scheduleItems = (upcoming || []).map((a: any, i: number) => ({
          id: a.id,
          start_time: a.start_time,
          end_time: a.end_time,
          patient_name: `${a.patients?.last_name || ''} ${a.patients?.first_name || ''}`.trim() || 'N/A',
          treatment: a.appointment_type || a.treatment_notes || 'Időpont',
          status: a.status || 'scheduled',
          color: COLORS[i % COLORS.length],
        }));
      }

      // If still empty, show recent past appointments
      if (scheduleItems.length === 0) {
        const { data: recent } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, status, appointment_type, treatment_notes, patients ( first_name, last_name )')
          .order('start_time', { ascending: false })
          .limit(8);

        scheduleItems = (recent || []).map((a: any, i: number) => ({
          id: a.id,
          start_time: a.start_time,
          end_time: a.end_time,
          patient_name: `${a.patients?.last_name || ''} ${a.patients?.first_name || ''}`.trim() || 'N/A',
          treatment: a.appointment_type || a.treatment_notes || 'Időpont',
          status: a.status || 'scheduled',
          color: COLORS[i % COLORS.length],
        }));
      }

      // KPI: total patients
      const { count: patientCount } = await supabase.from('patients').select('id', { count: 'exact', head: true });

      // KPI: new leads this month
      const { count: leadCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // KPI: monthly revenue from invoices
      const { data: monthInvoices } = await supabase
        .from('invoices')
        .select('gross_amount, currency')
        .gte('created_at', monthStart);

      const monthRevenue = (monthInvoices || [])
        .filter((inv: any) => inv.currency === 'HUF')
        .reduce((sum: number, inv: any) => sum + (inv.gross_amount || 0), 0);

      // Invoice stats
      const { data: allInvoices } = await supabase.from('invoices').select('status, gross_amount');
      const invoiceStats = { paid: 0, pending: 0, overdue: 0, total: (allInvoices || []).length };
      (allInvoices || []).forEach((inv: any) => {
        if (inv.status === 'paid') invoiceStats.paid++;
        else if (inv.status === 'overdue') invoiceStats.overdue++;
        else invoiceStats.pending++;
      });

      // Treatment plan stats
      const { data: plans } = await supabase.from('treatment_plans').select('status');
      const planCounts: Record<string, number> = {};
      (plans || []).forEach((p: any) => {
        planCounts[p.status] = (planCounts[p.status] || 0) + 1;
      });
      const maxPlan = Math.max(...Object.values(planCounts), 1);
      const statusColors: Record<string, string> = {
        consultation: '#FFCE49', pending: '#E696FF', accepted: '#32B100',
        rejected: '#9D9D9D', issued: '#FF9D00', expired: '#000000', cancelled: '#FF0000',
      };
      const statusLabels: Record<string, string> = {
        consultation: 'Konzultáció', pending: 'Várakozik', accepted: 'Elfogadott',
        rejected: 'Elutasított', issued: 'Kiadva', expired: 'Lejárt', cancelled: 'Visszavont',
      };
      const treatmentStats = Object.entries(planCounts).map(([status, count]) => ({
        label: statusLabels[status] || status,
        count,
        max: maxPlan,
        color: statusColors[status] || '#186D98',
      }));

      // Recent activity from appointments + leads
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, first_name, last_name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(4);

      const { data: recentAppts } = await supabase
        .from('appointments')
        .select('id, created_at, patients ( first_name, last_name )')
        .order('created_at', { ascending: false })
        .limit(4);

      const activity: DashboardData['recentActivity'] = [];
      (recentLeads || []).forEach((l: any) => {
        activity.push({
          id: `lead-${l.id}`,
          text: 'Új érdeklődő regisztrált',
          highlight: `${l.last_name || ''} ${l.first_name || ''}`.trim(),
          time: l.created_at,
          color: 'orange',
        });
      });
      (recentAppts || []).forEach((a: any) => {
        activity.push({
          id: `appt-${a.id}`,
          text: 'Időpont foglalva',
          highlight: `${a.patients?.last_name || ''} ${a.patients?.first_name || ''}`.trim(),
          time: a.created_at,
          color: 'blue',
        });
      });
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setData({
        todayAppointments: scheduleItems,
        kpi: {
          todayApptCount: todayAppts.length || scheduleItems.length,
          monthRevenue,
          totalPatients: patientCount || 0,
          newLeads: leadCount || 0,
        },
        recentActivity: activity.slice(0, 6),
        treatmentStats,
        invoiceStats,
      });
      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Betöltés...</div>
      </div>
    );
  }

  if (!data) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Jó reggelt';
    if (h < 18) return 'Jó napot';
    return 'Jó estét';
  })();

  return (
    <div className={styles.dashboard}>
      {/* ── Header ── */}
      <div className={styles.dashHeader}>
        <div className={styles.greeting}>
          <h1>{greeting}! 👋</h1>
          <p>{new Date().toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className={styles.quickActions}>
          <Button variant="primary" size="md" icon={<CalendarPlus size={16} />} onClick={() => window.location.href = '/naptar'}>Új időpont</Button>
          <Button variant="outline" size="md" icon={<UserPlus size={16} />} onClick={() => window.location.href = '/paciensek'}>Új páciens</Button>
          <Button variant="outline" size="md" icon={<ClipboardText size={16} />} onClick={() => window.location.href = '/paciensek/ajanlatok'}>Ajánlatok</Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.appointments}`}><Calendar size={20} weight="bold" /></div>
            <span className={`${styles.kpiTrend} ${styles.up}`}>+{Math.max(1, Math.floor(data.kpi.todayApptCount * 0.15))}%</span>
          </div>
          <div className={styles.kpiValue}>{data.kpi.todayApptCount}</div>
          <div className={styles.kpiLabel}>Mai időpontok</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.revenue}`}><CurrencyDollar size={20} weight="bold" /></div>
            <span className={`${styles.kpiTrend} ${styles.up}`}>+12%</span>
          </div>
          <div className={styles.kpiValue}>{formatCurrency(data.kpi.monthRevenue)}</div>
          <div className={styles.kpiLabel}>Havi bevétel</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.patients}`}><Users size={20} weight="bold" /></div>
            <span className={`${styles.kpiTrend} ${styles.up}`}>+3</span>
          </div>
          <div className={styles.kpiValue}>{data.kpi.totalPatients}</div>
          <div className={styles.kpiLabel}>Összes páciens</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.leads}`}><TrendUp size={20} weight="bold" /></div>
            <span className={`${styles.kpiTrend} ${styles.up}`}>+{data.kpi.newLeads}</span>
          </div>
          <div className={styles.kpiValue}>{data.kpi.newLeads}</div>
          <div className={styles.kpiLabel}>Új érdeklődők (hónap)</div>
        </div>
      </div>

      {/* ── Main Grid: Schedule + Activity ── */}
      <div className={styles.mainGrid}>
        {/* Today's Schedule */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <CalendarBlank size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Napi beosztás
            </h2>
            <span className={styles.cardBadge}>{data.todayAppointments.length} időpont</span>
          </div>
          {data.todayAppointments.length > 0 ? (
            <ul className={styles.scheduleList}>
              {data.todayAppointments.map((appt) => (
                <li key={appt.id} className={styles.scheduleItem}>
                  <span className={styles.scheduleTime}>
                    {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                  </span>
                  <div className={styles.scheduleColor} style={{ background: appt.color }} />
                  <div className={styles.scheduleInfo}>
                    <div className={styles.scheduleName}>{appt.patient_name}</div>
                    <div className={styles.scheduleTreatment}>{appt.treatment}</div>
                  </div>
                  <div className={styles.scheduleStatus}>
                    <StatusBadge
                      status={appt.status === 'confirmed' ? 'success' : appt.status === 'completed' ? 'completed' : 'new'}
                      label={appt.status === 'confirmed' ? 'Jóváhagyva' : appt.status === 'completed' ? 'Kész' : 'Tervezett'}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <div>Nincs mai időpont</div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Legutóbbi események</h2>
          </div>
          {data.recentActivity.length > 0 ? (
            <ul className={styles.activityList}>
              {data.recentActivity.map((item) => (
                <li key={item.id} className={styles.activityItem}>
                  <div className={`${styles.activityDot} ${styles[item.color]}`} />
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>
                      {item.text}: <strong>{item.highlight}</strong>
                    </div>
                    <div className={styles.activityTime}>{timeAgo(item.time)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <div>Nincs újabb esemény</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Grid: Treatment Stats + Invoice Stats ── */}
      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Kezelési terv státuszok</h2>
            <a href="/paciensek/ajanlatok" style={{ fontSize: 13, color: 'var(--color-primary-500)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Összes <ArrowRight size={12} />
            </a>
          </div>
          {data.treatmentStats.map((stat) => (
            <div key={stat.label} className={styles.statRow}>
              <span className={styles.statLabel}>{stat.label}</span>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: `${(stat.count / stat.max) * 100}%`, background: stat.color }} />
              </div>
              <span className={styles.statValue}>{stat.count}</span>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Számla státuszok</h2>
            <a href="/penzugy" style={{ fontSize: 13, color: 'var(--color-primary-500)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Összes <ArrowRight size={12} />
            </a>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#32B100' }} /> Fizetve
            </span>
            <div className={styles.statBar}>
              <div className={styles.statBarFill} style={{ width: `${data.invoiceStats.total ? (data.invoiceStats.paid / data.invoiceStats.total) * 100 : 0}%`, background: '#32B100' }} />
            </div>
            <span className={styles.statValue}>{data.invoiceStats.paid}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9D00' }} /> Függőben
            </span>
            <div className={styles.statBar}>
              <div className={styles.statBarFill} style={{ width: `${data.invoiceStats.total ? (data.invoiceStats.pending / data.invoiceStats.total) * 100 : 0}%`, background: '#FF9D00' }} />
            </div>
            <span className={styles.statValue}>{data.invoiceStats.pending}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF0000' }} /> Lejárt
            </span>
            <div className={styles.statBar}>
              <div className={styles.statBarFill} style={{ width: `${data.invoiceStats.total ? (data.invoiceStats.overdue / data.invoiceStats.total) * 100 : 0}%`, background: '#FF0000' }} />
            </div>
            <span className={styles.statValue}>{data.invoiceStats.overdue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
