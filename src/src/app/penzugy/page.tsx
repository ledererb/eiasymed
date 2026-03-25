'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlass, Plus, Receipt, CurrencyCircleDollar, ArrowUp, ArrowDown,
  FileText, CalendarBlank, Printer, CreditCard, Trash, Pencil, Check, X, CloudArrowUp,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Drawer } from '@/components/Drawer';
import { InvoiceForm } from '@/components/InvoiceForm';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { createClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

interface PriceListItem {
  id: string;
  item_name: string;
  base_price: number;
  category: string;
  is_active: boolean;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
  invoice: { invoice_number: string; patient: { last_name: string; first_name: string } | null } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issued_at: string;
  due_date: string;
  gross_amount: number;
  paid_amount: number;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  patient: { id: string; first_name: string; last_name: string } | null;
  nav_status: string | null;
}

interface SummaryStats {
  totalRevenue: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
}

const STATUS_TO_BADGE: Record<string, { label: string; variant: 'success' | 'alert' | 'waiting' | 'new' }> = {
  paid: { label: 'Fizetve', variant: 'success' },
  unpaid: { label: 'Fizetésre vár', variant: 'waiting' },
  overdue: { label: 'Késedelmes', variant: 'alert' },
  draft: { label: 'Piszkozat', variant: 'new' },
};

export default function PenzugyPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('invoices');
  const [stats, setStats] = useState<SummaryStats>({ totalRevenue: 0, paidCount: 0, unpaidCount: 0, overdueCount: 0 });
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  // Payment state
  const [payDrawerOpen, setPayDrawerOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payments, setPayments] = useState<Payment[]>([]);

  // Price list state
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [newItem, setNewItem] = useState({ item_name: '', base_price: '', category: 'general' });

  const supabase = createClient();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('invoices')
      .select(`
        id, invoice_number, issued_at, due_date, gross_amount, paid_amount, currency, payment_status, payment_method, nav_status,
        patient:patients!invoices_patient_id_fkey(id, first_name, last_name)
      `)
      .order('issued_at', { ascending: false })
      .limit(50);

    if (searchQuery.trim()) {
      query = query.or(`invoice_number.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      setLoading(false);
      return;
    }

    setInvoices((data as unknown as Invoice[]) || []);
    setLoading(false);
  }, [searchQuery]);

  // Fetch summary stats
  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from('invoices')
        .select('gross_amount, payment_status');

      if (data) {
        setStats({
          totalRevenue: data.reduce((s, i) => s + (i.gross_amount || 0), 0),
          paidCount: data.filter(i => i.payment_status === 'paid').length,
          unpaidCount: data.filter(i => i.payment_status === 'unpaid').length,
          overdueCount: data.filter(i => i.payment_status === 'overdue').length,
        });
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const formatCurrency = (amount: number, currency = 'HUF') => {
    return new Intl.NumberFormat('hu-HU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    const { data } = await supabase
      .from('payments')
      .select(`id, amount, payment_method, created_at, invoice:invoices!payments_invoice_id_fkey(invoice_number, patient:patients!invoices_patient_id_fkey(last_name, first_name))`)
      .order('created_at', { ascending: false })
      .limit(50);
    setPayments((data as unknown as Payment[]) || []);
  }, []);

  // Fetch price list
  const fetchPriceList = useCallback(async () => {
    const { data } = await supabase
      .from('price_list')
      .select('id, item_name, base_price, category, is_active')
      .order('item_name');
    setPriceList(data || []);
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'pricelist') fetchPriceList();
  }, [activeTab]);

  // Record payment
  const handleRecordPayment = async () => {
    if (!payingInvoice || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    await supabase.from('payments').insert({
      invoice_id: payingInvoice.id,
      amount,
      payment_method: payMethod,
      currency: payingInvoice.currency,
    });

    const newPaidAmount = (payingInvoice.paid_amount || 0) + amount;
    const newStatus = newPaidAmount >= payingInvoice.gross_amount ? 'paid' : 'unpaid';
    await supabase.from('invoices').update({ paid_amount: newPaidAmount, payment_status: newStatus }).eq('id', payingInvoice.id);

    setPayDrawerOpen(false);
    setPayingInvoice(null);
    setPayAmount('');
    fetchInvoices();
  };

  // Price list CRUD
  const handleAddPriceItem = async () => {
    if (!newItem.item_name || !newItem.base_price) return;
    await supabase.from('price_list').insert({
      item_name: newItem.item_name,
      base_price: parseInt(newItem.base_price),
      category: newItem.category,
      is_active: true,
    });
    setNewItem({ item_name: '', base_price: '', category: 'general' });
    fetchPriceList();
  };

  const handleUpdatePrice = async (id: string) => {
    if (!editPriceValue) return;
    await supabase.from('price_list').update({ base_price: parseInt(editPriceValue) }).eq('id', id);
    setEditingPrice(null);
    fetchPriceList();
  };

  const handleDeletePriceItem = async (id: string) => {
    await supabase.from('price_list').delete().eq('id', id);
    fetchPriceList();
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Pénzügy' }]} />

      {/* Summary cards */}
      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: '#e0f2fe' }}>
            <CurrencyCircleDollar size={24} color="#0284c7" />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Összesen</span>
            <span className={styles.cardValue}>{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: '#dcfce7' }}>
            <ArrowUp size={24} color="#16a34a" />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Fizetve</span>
            <span className={styles.cardValue}>{stats.paidCount} db</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: '#fef3c7' }}>
            <Receipt size={24} color="#d97706" />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Fizetésre vár</span>
            <span className={styles.cardValue}>{stats.unpaidCount} db</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: '#fee2e2' }}>
            <ArrowDown size={24} color="#dc2626" />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Késedelmes</span>
            <span className={styles.cardValue}>{stats.overdueCount} db</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          { id: 'invoices', label: 'Számlák' },
          { id: 'payments', label: 'Befizetések' },
          { id: 'cashregister', label: 'Pénztárgép' },
          { id: 'pricelist', label: 'Árlista' },
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* Toolbar */}
      {activeTab === 'invoices' && (
        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <MagnifyingGlass size={18} color="var(--color-neutral-400)" />
            <input
              className={styles.searchInput}
              placeholder="Keresés számlaszám alapján..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={() => setCreateDrawerOpen(true)}>
            <Plus size={16} weight="bold" /> Új számla
          </Button>
        </div>
      )}

      {/* Invoice table */}
      {activeTab === 'invoices' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Számla szám</th>
                <th>Páciens</th>
                <th>Dátum</th>
                <th>Lejárat</th>
                <th>Összeg</th>
                <th>Státusz</th>
                <th>NAV</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className={styles.emptyCell}>Betöltés...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className={styles.emptyCell}>Még nincsenek számlák.</td></tr>
              ) : (
                invoices.map((inv) => {
                  const badge = STATUS_TO_BADGE[inv.payment_status] || STATUS_TO_BADGE.draft;
                  return (
                    <tr key={inv.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.invoiceNumber}>
                          <FileText size={16} color="var(--color-primary-500)" />
                          {inv.invoice_number}
                        </div>
                      </td>
                      <td className={styles.patientName}>
                        {inv.patient ? `${inv.patient.last_name} ${inv.patient.first_name}` : '—'}
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          <CalendarBlank size={14} color="var(--color-neutral-400)" />
                          {format(new Date(inv.issued_at), 'yyyy. MM. dd.', { locale: hu })}
                        </div>
                      </td>
                      <td className={styles.dateCell}>
                        {format(new Date(inv.due_date), 'yyyy. MM. dd.', { locale: hu })}
                      </td>
                      <td className={styles.amountCell}>
                        {formatCurrency(inv.gross_amount, inv.currency)}
                      </td>
                      <td>
                        <StatusBadge status={badge.variant} label={badge.label} />
                      </td>
                      <td>
                        {inv.nav_status === 'accepted' ? (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontWeight: 600 }}>✓ NAV</span>
                        ) : inv.nav_status === 'submitted' ? (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }}>⏳ NAV</span>
                        ) : inv.nav_status === 'rejected' ? (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>✗ NAV</span>
                        ) : (
                          <button
                            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: '#f5f5f5', color: '#5f7d95', border: '1px solid #e5e5e5', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}
                            onClick={async () => {
                              const s = createClient();
                              const session = await s.auth.getSession();
                              const token = session.data.session?.access_token;
                              const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nav-invoice`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ invoice_id: inv.id }),
                              });
                              const result = await resp.json();
                              const btn = document.getElementById(`nav-btn-${inv.id}`);
                              if (btn) { btn.textContent = result.message ? '✅' : '⚠️'; setTimeout(() => { btn.textContent = 'NAV'; }, 2500); }
                              fetchInvoices();
                            }}
                          >
                            <CloudArrowUp size={12} /> <span id={`nav-btn-${inv.id}`}>NAV</span>
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {inv.payment_status !== 'paid' && (
                            <button
                              className={styles.payBtn}
                              title="Fizetés rögzítése"
                              onClick={() => { setPayingInvoice(inv); setPayAmount(String(inv.gross_amount - (inv.paid_amount || 0))); setPayDrawerOpen(true); }}
                            >
                              <CreditCard size={14} /> Fizet
                            </button>
                          )}
                          <button className={styles.actionBtn} title="Nyomtatás" onClick={() => {
                            const printWindow = window.open('', '_blank', 'width=800,height=600');
                            if (printWindow) {
                              printWindow.document.write(`<html><head><title>Számla ${inv.invoice_number}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#082432}h1{font-size:20px;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px 12px;border:1px solid #e0e0e0;text-align:left}th{background:#f5f7fa}.total{font-size:18px;font-weight:700;text-align:right;margin-top:20px}</style></head><body>`);
                              printWindow.document.write(`<h1>Számla: ${inv.invoice_number}</h1>`);
                              printWindow.document.write(`<p>Páciens: ${inv.patient ? `${inv.patient.last_name} ${inv.patient.first_name}` : '—'}</p>`);
                              printWindow.document.write(`<p>Dátum: ${format(new Date(inv.issued_at), 'yyyy. MM. dd.', { locale: hu })}</p>`);
                              printWindow.document.write(`<p>Lejárat: ${format(new Date(inv.due_date), 'yyyy. MM. dd.', { locale: hu })}</p>`);
                              printWindow.document.write(`<p class="total">Összeg: ${formatCurrency(inv.gross_amount, inv.currency)}</p>`);
                              printWindow.document.write(`<p>Státusz: ${STATUS_TO_BADGE[inv.payment_status]?.label || inv.payment_status}</p>`);
                              printWindow.document.write('</body></html>');
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}>
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments tab */}
      {activeTab === 'payments' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Számla</th>
                <th>Páciens</th>
                <th>Összeg</th>
                <th>Mód</th>
                <th>Dátum</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyCell}>Még nincsenek befizetések.</td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className={styles.tableRow}>
                    <td className={styles.invoiceNumber}>
                      <FileText size={14} color="var(--color-primary-500)" />
                      {(p.invoice as any)?.invoice_number || '—'}
                    </td>
                    <td className={styles.patientName}>
                      {(p.invoice as any)?.patient ? `${(p.invoice as any).patient.last_name} ${(p.invoice as any).patient.first_name}` : '—'}
                    </td>
                    <td className={styles.amountCell}>{formatCurrency(p.amount)}</td>
                    <td style={{ fontSize: 12 }}>
                      {{ cash: 'Készpénz', card: 'Bankkártya', transfer: 'Átutalás', health_fund: 'EP', szep_card: 'Szép kártya' }[p.payment_method] || p.payment_method}
                    </td>
                    <td className={styles.dateCell}>{format(new Date(p.created_at), 'yyyy. MM. dd. HH:mm', { locale: hu })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pénztárgép placeholder */}
      {activeTab === 'cashregister' && (
        <div className={styles.emptyState}>
          <Receipt size={48} color="var(--color-neutral-300)" />
          <p>Pénztárgép integráció hamarosan elérhető.</p>
        </div>
      )}

      {/* Price list tab */}
      {activeTab === 'pricelist' && (
        <>
          {/* Add new item form */}
          <div className={styles.addItemRow}>
            <InputField label="Megnevezés" value={newItem.item_name} onChange={e => setNewItem(p => ({ ...p, item_name: e.target.value }))} placeholder="Kezelés neve..." />
            <InputField label="Ár (Ft)" type="number" value={newItem.base_price} onChange={e => setNewItem(p => ({ ...p, base_price: e.target.value }))} placeholder="0" />
            <div style={{ flex: 0.6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: 6 }}>Kategória</label>
              <Dropdown items={[{ id: 'general', label: 'Általános' }, { id: 'implant', label: 'Implantátum' }, { id: 'cosmetic', label: 'Esztétikai' }, { id: 'surgical', label: 'Sebészeti' }, { id: 'diagnostic', label: 'Diagnosztikai' }]} value={newItem.category} onChange={v => setNewItem(p => ({ ...p, category: v as string }))} />
            </div>
            <Button variant="primary" onClick={handleAddPriceItem} disabled={!newItem.item_name || !newItem.base_price}>
              <Plus size={14} /> Hozzáadás
            </Button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Megnevezés</th>
                  <th>Kategória</th>
                  <th>Ár</th>
                  <th>Státusz</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {priceList.length === 0 ? (
                  <tr><td colSpan={5} className={styles.emptyCell}>Még nincs tétel az árlistában.</td></tr>
                ) : (
                  priceList.map(item => (
                    <tr key={item.id} className={styles.tableRow}>
                      <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{item.category}</td>
                      <td>
                        {editingPrice === item.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="number"
                              value={editPriceValue}
                              onChange={e => setEditPriceValue(e.target.value)}
                              style={{ width: 80, padding: '4px 8px', border: '1px solid var(--color-primary-500)', borderRadius: 4, fontSize: 13 }}
                              autoFocus
                            />
                            <button className={styles.actionBtn} onClick={() => handleUpdatePrice(item.id)}><Check size={14} color="#16a34a" /></button>
                            <button className={styles.actionBtn} onClick={() => setEditingPrice(null)}><X size={14} /></button>
                          </div>
                        ) : (
                          <span className={styles.amountCell}>{formatCurrency(item.base_price)}</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={item.is_active ? 'success' : 'inactive'} label={item.is_active ? 'Aktív' : 'Inaktív'} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className={styles.actionBtn} onClick={() => { setEditingPrice(item.id); setEditPriceValue(String(item.base_price)); }}>
                            <Pencil size={14} />
                          </button>
                          <button className={styles.actionBtn} onClick={() => handleDeletePriceItem(item.id)}>
                            <Trash size={14} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create invoice drawer */}
      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Új számla létrehozása"
        width="wide"
      >
        <InvoiceForm
          onSave={() => { setCreateDrawerOpen(false); fetchInvoices(); }}
          onCancel={() => setCreateDrawerOpen(false)}
        />
      </Drawer>

      {/* Payment recording drawer */}
      <Drawer
        open={payDrawerOpen}
        onClose={() => { setPayDrawerOpen(false); setPayingInvoice(null); }}
        title="Fizetés rögzítése"
      >
        {payingInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--color-neutral-50)', borderRadius: 8, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-neutral-500)' }}>Számla</p>
              <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700 }}>{payingInvoice.invoice_number}</p>
              <p style={{ margin: '4px 0 0', fontSize: 14 }}>
                Fizetendő: <strong>{formatCurrency(payingInvoice.gross_amount - (payingInvoice.paid_amount || 0))}</strong>
              </p>
            </div>
            <InputField label="Összeg (Ft)" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: 6 }}>Fizetési mód</label>
              <Dropdown
                items={[{ id: 'cash', label: 'Készpénz' }, { id: 'card', label: 'Bankkártya' }, { id: 'transfer', label: 'Átutalás' }, { id: 'health_fund', label: 'Egészségpénztár' }, { id: 'szep_card', label: 'Szép kártya' }]}
                value={payMethod}
                onChange={v => setPayMethod(v as string)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-neutral-100)' }}>
              <Button variant="outline" onClick={() => { setPayDrawerOpen(false); setPayingInvoice(null); }}>Mégse</Button>
              <Button variant="primary" onClick={handleRecordPayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>
                <CreditCard size={14} /> Fizetés rögzítése
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}
