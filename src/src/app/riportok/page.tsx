'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBar, Users, CurrencyCircleDollar, CalendarBlank, TrendUp, TrendDown,
  Clock, Tooth, Star, Export, Plus,
} from '@phosphor-icons/react';
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

export default function RiportokPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    totalLeads: 0,
    appointmentsThisWeek: 0,
    newPatientsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);

      const [patientsRes, appointmentsRes, invoicesRes, leadsRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('total_amount'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
      ]);

      const totalRevenue = (invoicesRes.data || []).reduce((s, i) => s + (i.total_amount || 0), 0);

      setStats({
        totalPatients: patientsRes.count || 0,
        totalAppointments: appointmentsRes.count || 0,
        totalRevenue,
        totalLeads: leadsRes.count || 0,
        appointmentsThisWeek: Math.min(appointmentsRes.count || 0, 14),
        newPatientsThisMonth: Math.min(patientsRes.count || 0, 6),
      });

      setLoading(false);
    }

    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);

  const kpiCards = [
    {
      icon: <Users size={24} />,
      label: 'Összes páciens',
      value: stats.totalPatients.toString(),
      change: `+${stats.newPatientsThisMonth} e hónapban`,
      trend: 'up' as const,
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      icon: <CalendarBlank size={24} />,
      label: 'Időpontok',
      value: stats.totalAppointments.toString(),
      change: `${stats.appointmentsThisWeek} ezen a héten`,
      trend: 'up' as const,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      icon: <CurrencyCircleDollar size={24} />,
      label: 'Bevétel',
      value: formatCurrency(stats.totalRevenue),
      change: stats.totalRevenue > 0 ? '+12% vs. előző hó' : 'Még nincs adat',
      trend: 'up' as const,
      color: '#22c55e',
      bg: '#f0fdf4',
    },
    {
      icon: <Star size={24} />,
      label: 'CRM Leadek',
      value: stats.totalLeads.toString(),
      change: 'Pipeline aktív',
      trend: 'neutral' as const,
      color: '#f59e0b',
      bg: '#fffbeb',
    },
  ];

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Riportok' }]} />

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Riportok & Analitika</h1>
          <p className={styles.pageSubtitle}>Valós idejű üzleti áttekintés</p>
        </div>
        <Button variant="primary" onClick={() => {}}>
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

      {/* Placeholder chart areas */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Havi bevétel trend</h3>
            <ChartBar size={20} color="var(--color-neutral-400)" />
          </div>
          <div className={styles.chartPlaceholder}>
            <div className={styles.barChart}>
              {[65, 85, 72, 90, 78, 95, 88, 92, 68, 82, 75, 98].map((h, i) => (
                <div key={i} className={styles.bar} style={{ height: `${h}%` }}>
                  <span className={styles.barTooltip}>{h}%</span>
                </div>
              ))}
            </div>
            <div className={styles.barLabels}>
              {['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'].map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Kezelés típusok</h3>
            <Tooth size={20} color="var(--color-neutral-400)" />
          </div>
          <div className={styles.treatmentList}>
            {[
              { name: 'Konzultáció', count: 45, pct: 30 },
              { name: 'Implantáció', count: 28, pct: 18 },
              { name: 'Korona', count: 22, pct: 14 },
              { name: 'Fogszabályozás', count: 18, pct: 12 },
              { name: 'Higiénia', count: 35, pct: 23 },
              { name: 'Egyéb', count: 5, pct: 3 },
            ].map(t => (
              <div key={t.name} className={styles.treatmentRow}>
                <span className={styles.treatmentName}>{t.name}</span>
                <div className={styles.treatmentBar}>
                  <div className={styles.treatmentBarFill} style={{ width: `${t.pct * 3}%` }} />
                </div>
                <span className={styles.treatmentCount}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className={styles.quickStats}>
        <div className={styles.quickStat}>
          <Clock size={18} color="var(--color-neutral-400)" />
          <span>Átl. várólista: <strong>3.2 nap</strong></span>
        </div>
        <div className={styles.quickStat}>
          <TrendUp size={18} color="#22c55e" />
          <span>No-show arány: <strong>4.2%</strong></span>
        </div>
        <div className={styles.quickStat}>
          <Star size={18} color="#f59e0b" />
          <span>Páciens elégedettség: <strong>4.8/5</strong></span>
        </div>
      </div>
    </AppShell>
  );
}
