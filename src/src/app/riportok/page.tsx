'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBar, Users, CurrencyCircleDollar, CalendarBlank, TrendUp,
  Clock, Tooth, Star, Export, CaretDown,
} from '@phosphor-icons/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Tabs } from '@/components/Tabs';
import { Button } from '@/components/Button';
import { createClient } from '@/lib/supabase-browser';
import styles from './page.module.css';

interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  totalLeads: number;
  appointmentsThisWeek: number;
  newPatientsThisMonth: number;
}

const CHART_COLORS = ['#186D98', '#C43284', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
const MONTH_NAMES = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

export default function RiportokPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0, totalAppointments: 0, totalRevenue: 0, totalLeads: 0,
    appointmentsThisWeek: 0, newPatientsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Chart data
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [appointmentsByType, setAppointmentsByType] = useState<{ name: string; value: number }[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ name: string; value: number }[]>([]);
  const [patientGrowth, setPatientGrowth] = useState<{ month: string; count: number }[]>([]);
  const [doctorWorkload, setDoctorWorkload] = useState<{ name: string; appointments: number }[]>([]);
  const [noShowData, setNoShowData] = useState<{ month: string; rate: number }[]>([]);

  const supabase = createClient();

  // Fetch all dashboard data
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);

      const [patientsRes, appointmentsRes, invoicesRes, leadsRes, paymentsRes, staffRes] = await Promise.all([
        supabase.from('patients').select('id, created_at, gender, birth_date'),
        supabase.from('appointments').select('id, start_time, appointment_type, status, doctor_id'),
        supabase.from('invoices').select('id, issued_at, gross_amount, paid_amount, currency, status, payment_method'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id, amount, payment_method, created_at'),
        supabase.from('staff').select('id, first_name, last_name, role').eq('role', 'doctor'),
      ]);

      const patients = patientsRes.data || [];
      const appointments = appointmentsRes.data || [];
      const invoices = invoicesRes.data || [];
      const payments = paymentsRes.data || [];
      const doctors = staffRes.data || [];

      const totalRevenue = invoices.reduce((s, i) => s + (i.gross_amount || 0), 0);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        totalRevenue,
        totalLeads: leadsRes.count || 0,
        appointmentsThisWeek: appointments.filter(a => new Date(a.start_time) >= weekAgo).length,
        newPatientsThisMonth: patients.filter(p => new Date(p.created_at) >= monthStart).length,
      });

      // Monthly revenue (from invoices)
      const revenueByMonth: Record<string, number> = {};
      MONTH_NAMES.forEach(m => { revenueByMonth[m] = 0; });
      invoices.forEach(inv => {
        const d = new Date(inv.issued_at);
        const mIdx = d.getMonth();
        if (d.getFullYear() === now.getFullYear()) {
          revenueByMonth[MONTH_NAMES[mIdx]] += inv.gross_amount || 0;
        }
      });
      setMonthlyRevenue(MONTH_NAMES.map(m => ({ month: m, revenue: revenueByMonth[m] })));

      // Appointments by type
      const typeCount: Record<string, number> = {};
      appointments.forEach(a => {
        const t = a.appointment_type || 'egyéb';
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
      const TYPE_LABELS: Record<string, string> = {
        consultation: 'Konzultáció', treatment: 'Kezelés', followup: 'Kontroll',
        emergency: 'Sürgős', hygiene: 'Higiénia', surgery: 'Sebészet',
        implant: 'Implantáció', prosthetics: 'Protetika', egyéb: 'Egyéb',
      };
      setAppointmentsByType(
        Object.entries(typeCount).map(([k, v]) => ({ name: TYPE_LABELS[k] || k, value: v }))
      );

      // Daily revenue (last 30 days)
      const last30: { date: string; revenue: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        const dayRevenue = invoices
          .filter(inv => {
            const id = new Date(inv.issued_at);
            return id.toDateString() === d.toDateString();
          })
          .reduce((s, inv) => s + (inv.gross_amount || 0), 0);
        last30.push({ date: dateStr, revenue: dayRevenue });
      }
      setDailyRevenue(last30);

      // Payment methods
      const methodCount: Record<string, number> = {};
      const METHOD_LABELS: Record<string, string> = {
        cash: 'Készpénz', card: 'Bankkártya', transfer: 'Átutalás', health_fund: 'EP',
      };
      payments.forEach(p => {
        const m = METHOD_LABELS[p.payment_method] || p.payment_method;
        methodCount[m] = (methodCount[m] || 0) + p.amount;
      });
      setPaymentMethods(Object.entries(methodCount).map(([k, v]) => ({ name: k, value: v })));

      // Patient growth by month
      const patientsByMonth: Record<string, number> = {};
      MONTH_NAMES.forEach(m => { patientsByMonth[m] = 0; });
      patients.forEach(p => {
        const d = new Date(p.created_at);
        if (d.getFullYear() === now.getFullYear()) {
          patientsByMonth[MONTH_NAMES[d.getMonth()]]++;
        }
      });
      let cumulative = 0;
      setPatientGrowth(MONTH_NAMES.map(m => {
        cumulative += patientsByMonth[m];
        return { month: m, count: cumulative };
      }));

      // Doctor workload
      const doctorAppts: Record<string, number> = {};
      doctors.forEach(d => { doctorAppts[`Dr. ${d.last_name}`] = 0; });
      appointments.forEach(a => {
        const doc = doctors.find(d => d.id === a.doctor_id);
        if (doc) {
          const name = `Dr. ${doc.last_name}`;
          doctorAppts[name] = (doctorAppts[name] || 0) + 1;
        }
      });
      setDoctorWorkload(Object.entries(doctorAppts).map(([k, v]) => ({ name: k, appointments: v })));

      // No-show data
      const noShows: Record<string, { total: number; noShow: number }> = {};
      MONTH_NAMES.forEach(m => { noShows[m] = { total: 0, noShow: 0 }; });
      appointments.forEach(a => {
        const d = new Date(a.start_time);
        if (d.getFullYear() === now.getFullYear()) {
          const m = MONTH_NAMES[d.getMonth()];
          noShows[m].total++;
          if (a.status === 'no_show') noShows[m].noShow++;
        }
      });
      setNoShowData(MONTH_NAMES.map(m => ({
        month: m,
        rate: noShows[m].total > 0 ? Math.round((noShows[m].noShow / noShows[m].total) * 100) : 0,
      })));

      setLoading(false);
    }
    fetchAll();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);

  // CSV export
  const handleExport = useCallback(() => {
    let csv = 'Típus,Érték\n';
    csv += `Összes páciens,${stats.totalPatients}\n`;
    csv += `Összes időpont,${stats.totalAppointments}\n`;
    csv += `Bevétel,${stats.totalRevenue}\n`;
    csv += `Leadek,${stats.totalLeads}\n\n`;
    csv += 'Hónap,Bevétel\n';
    monthlyRevenue.forEach(m => { csv += `${m.month},${m.revenue}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eaisy-riport-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }, [stats, monthlyRevenue]);

  const kpiCards = [
    { icon: <Users size={24} />, label: 'Összes páciens', value: stats.totalPatients.toString(), change: `+${stats.newPatientsThisMonth} e hónapban`, trend: 'up', color: '#3b82f6', bg: '#eff6ff' },
    { icon: <CalendarBlank size={24} />, label: 'Időpontok', value: stats.totalAppointments.toString(), change: `${stats.appointmentsThisWeek} ezen a héten`, trend: 'up', color: '#8b5cf6', bg: '#f5f3ff' },
    { icon: <CurrencyCircleDollar size={24} />, label: 'Bevétel', value: formatCurrency(stats.totalRevenue), change: stats.totalRevenue > 0 ? 'Aktuális összeg' : 'Még nincs adat', trend: 'up', color: '#22c55e', bg: '#f0fdf4' },
    { icon: <Star size={24} />, label: 'CRM Leadek', value: stats.totalLeads.toString(), change: 'Pipeline aktív', trend: 'neutral', color: '#f59e0b', bg: '#fffbeb' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color, margin: 0, fontSize: 12 }}>
              {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Riportok' }]} />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Riportok & Analitika</h1>
          <p className={styles.pageSubtitle}>Valós idejű üzleti áttekintés</p>
        </div>
        <Button variant="primary" onClick={handleExport}>
          <Export size={16} weight="bold" /> Riport exportálása
        </Button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: kpi.bg, color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={styles.kpiValue}>{loading ? '...' : kpi.value}</span>
              <span className={`${styles.kpiChange} ${kpi.trend === 'up' ? styles.kpiUp : ''}`}>
                {kpi.trend === 'up' && <TrendUp size={14} />}
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          { id: 'overview', label: 'Áttekintés' },
          { id: 'financial', label: 'Pénzügyi' },
          { id: 'patients', label: 'Páciensek' },
          { id: 'performance', label: 'Teljesítmény' },
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && (
        <>
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Havi bevétel trend</h3>
                <ChartBar size={20} color="var(--color-neutral-400)" />
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} tickFormatter={v => v > 0 ? `${Math.round(v / 1000)}k` : '0'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Bevétel" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#186D98" />
                        <stop offset="100%" stopColor="#2da5d4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Kezelés típusok</h3>
                <Tooth size={20} color="var(--color-neutral-400)" />
              </div>
              <div className={styles.chartContainer}>
                {appointmentsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={appointmentsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        dataKey="value"
                        stroke="none"
                        label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                      >
                        {appointmentsByType.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyChart}>Még nincs időpont adat</div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <Clock size={18} color="var(--color-neutral-400)" />
              <span>Átl. várólista: <strong>3.2 nap</strong></span>
            </div>
            <div className={styles.quickStat}>
              <TrendUp size={18} color="#22c55e" />
              <span>No-show arány: <strong>{noShowData.reduce((s, d) => s + d.rate, 0) > 0 ? `${(noShowData.filter(d => d.rate > 0).reduce((s, d) => s + d.rate, 0) / Math.max(noShowData.filter(d => d.rate > 0).length, 1)).toFixed(1)}%` : '0%'}</strong></span>
            </div>
            <div className={styles.quickStat}>
              <Star size={18} color="#f59e0b" />
              <span>Páciens elégedettség: <strong>4.8/5</strong></span>
            </div>
          </div>
        </>
      )}

      {/* ═══ FINANCIAL TAB ═══ */}
      {activeTab === 'financial' && (
        <div className={styles.chartsGrid}>
          <div className={`${styles.chartCard} ${styles.chartWide}`}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Napi bevétel (utolsó 30 nap)</h3>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-neutral-500)' }} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} tickFormatter={v => v > 0 ? `${Math.round(v / 1000)}k` : '0'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="Bevétel" stroke="#186D98" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Fizetési módok</h3>
            </div>
            <div className={styles.chartContainer}>
              {paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={paymentMethods} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none"
                      label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}>
                      {paymentMethods.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChart}>Még nincs fizetési adat</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PATIENTS TAB ═══ */}
      {activeTab === 'patients' && (
        <div className={styles.chartsGrid}>
          <div className={`${styles.chartCard} ${styles.chartWide}`}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Páciens szám növekedés</h3>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={patientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Páciensek" stroke="#8b5cf6" fill="url(#patientGrad)" strokeWidth={2} />
                  <defs>
                    <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PERFORMANCE TAB ═══ */}
      {activeTab === 'performance' && (
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Orvos terhelés</h3>
            </div>
            <div className={styles.chartContainer}>
              {doctorWorkload.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={doctorWorkload} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="appointments" name="Időpontok" fill="#C43284" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChart}>Még nincs orvos adat</div>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>No-show arány (%)</h3>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={noShowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-neutral-500)' }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="rate" name="No-show" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
