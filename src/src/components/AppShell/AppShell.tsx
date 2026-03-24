'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { SideNav } from '@/components/SideNav';
import { createClient } from '@/lib/supabase-browser';
import {
  CalendarBlank,
  Users,
  Tooth,
  CurrencyCircleDollar,
  ChartBar,
  Megaphone,
  Airplane,
  GearSix,
  SignOut,
} from '@phosphor-icons/react';
import styles from './AppShell.module.css';

const TOP_NAV_ITEMS = [
  { id: 'nyilvantartas', label: 'Nyilvántartás' },
  { id: 'naptar', label: 'Naptár' },
  { id: 'dokumentumok', label: 'Dokumentumok' },
  { id: 'crm', label: 'CRM' },
  { id: 'penzugy', label: 'Pénzügy' },
  { id: 'riportok', label: 'Riportok' },
];

const SIDE_NAV_ITEMS = [
  { id: 'naptar', icon: <CalendarBlank size={22} />, label: 'Naptár' },
  { id: 'paciensek', icon: <Users size={22} />, label: 'Páciensek' },
  { id: 'kezeles', icon: <Tooth size={22} />, label: 'Kezelés' },
  { id: 'penzugy', icon: <CurrencyCircleDollar size={22} />, label: 'Pénzügy' },
  { id: 'crm', icon: <Megaphone size={22} />, label: 'CRM' },
  { id: 'dental-tourism', icon: <Airplane size={22} />, label: 'Dental Tourism' },
  { id: 'riportok', icon: <ChartBar size={22} />, label: 'Riportok' },
];

// Map nav IDs to routes and vice versa
const NAV_TO_ROUTE: Record<string, string> = {
  naptar: '/naptar',
  paciensek: '/paciensek',
  kezeles: '/kezeles',
  penzugy: '/penzugy',
  crm: '/crm',
  'dental-tourism': '/dental-tourism',
  riportok: '/riportok',
  'dental-chart': '/dental-chart',
  settings: '/beallitasok',
};

const TOP_NAV_TO_ROUTE: Record<string, string> = {
  nyilvantartas: '/paciensek',
  naptar: '/naptar',
  dokumentumok: '/paciensek',
  crm: '/crm',
  penzugy: '/penzugy',
  riportok: '/riportok',
};

function getActiveFromPath(pathname: string): string {
  const segment = pathname.split('/')[1] || 'naptar';
  return segment;
}

function getActiveTopNavFromPath(pathname: string): string {
  const segment = pathname.split('/')[1] || 'naptar';
  // Map route to top nav item
  if (['paciensek', 'kezeles', 'dental-chart'].includes(segment)) return 'nyilvantartas';
  if (segment === 'naptar') return 'naptar';
  if (segment === 'crm') return 'crm';
  if (segment === 'penzugy') return 'penzugy';
  if (segment === 'riportok') return 'riportok';
  if (segment === 'beallitasok') return 'beallitasok';
  return 'naptar';
}

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSide, setActiveSide] = useState(getActiveFromPath(pathname));
  const [activeTop, setActiveTop] = useState(getActiveTopNavFromPath(pathname));

  // Sync nav state with route
  useEffect(() => {
    setActiveSide(getActiveFromPath(pathname));
    setActiveTop(getActiveTopNavFromPath(pathname));
  }, [pathname]);

  const handleSideSelect = (id: string) => {
    setActiveSide(id);
    const route = NAV_TO_ROUTE[id];
    if (route) router.push(route);
  };

  const handleTopSelect = (id: string) => {
    setActiveTop(id);
    const route = TOP_NAV_TO_ROUTE[id];
    if (route) router.push(route);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const sideItems = [
    ...SIDE_NAV_ITEMS,
    { id: 'settings', icon: <GearSix size={22} />, label: 'Beállítások' },
    { id: 'logout', icon: <SignOut size={22} />, label: 'Kijelentkezés' },
  ];

  const handleSideSelectWithLogout = (id: string) => {
    if (id === 'logout') {
      handleLogout();
      return;
    }
    handleSideSelect(id);
  };

  return (
    <div className={styles.shell}>
      <TopNav 
        items={TOP_NAV_ITEMS} 
        activeId={activeTop} 
        onSelect={handleTopSelect} 
      />
      <div className={styles.body}>
        <SideNav
          items={sideItems}
          activeId={activeSide}
          onSelect={handleSideSelectWithLogout}
        />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
