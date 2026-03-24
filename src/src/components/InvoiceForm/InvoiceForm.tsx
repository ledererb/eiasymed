'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { createClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import styles from './InvoiceForm.module.css';

interface LineItem {
  id: string;
  treatment_type_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

interface InvoiceFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel }) => {
  const supabase = createClient();

  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<{ id: string; label: string }[]>([]);
  const [priceList, setPriceList] = useState<{ id: string; label: string; price: number }[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch price list
  useEffect(() => {
    async function fetchPriceList() {
      const { data } = await supabase
        .from('price_list')
        .select('id, item_name, base_price')
        .eq('is_active', true)
        .order('item_name');

      if (data) {
        setPriceList(data.map(p => ({ id: p.id, label: p.item_name, price: p.base_price })));
      }
    }
    fetchPriceList();
  }, []);

  // Patient search
  useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2) { setPatients([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .or(`last_name.ilike.%${patientSearch}%,first_name.ilike.%${patientSearch}%`)
        .limit(8);
      if (data) setPatients(data.map(p => ({ id: p.id, label: `${p.last_name} ${p.first_name}` })));
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      id: crypto.randomUUID(),
      treatment_type_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: 27,
    }]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      // Auto-fill price from price list
      if (field === 'treatment_type_id') {
        const found = priceList.find(p => p.id === value);
        if (found) {
          updated.description = found.label;
          updated.unit_price = found.price;
        }
      }
      return updated;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vatTotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price * (i.vat_rate / 100), 0);
  const grandTotal = subtotal + vatTotal;

  const formatCurrency = (n: number) => new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n);

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return `MOL-${year}-${seq}`;
  };

  const handleSubmit = async () => {
    if (!patientId || lineItems.length === 0) return;
    setSaving(true);

    const invoiceNumber = generateInvoiceNumber();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Get location
    const { data: locations } = await supabase.from('locations').select('id').limit(1);
    const locationId = locations?.[0]?.id;

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        invoice_type: 'normal',
        patient_id: patientId,
        location_id: locationId,
        invoice_date: today,
        due_date: today,
        subtotal_amount: subtotal,
        vat_amount: vatTotal,
        total_amount: grandTotal,
        currency: 'HUF',
        status: 'unpaid',
        payment_method: paymentMethod,
        notes,
      })
      .select('id')
      .single();

    if (error || !invoice) {
      console.error('Invoice creation error:', error);
      setSaving(false);
      return;
    }

    // Create line items
    const items = lineItems.map((li, idx) => ({
      invoice_id: invoice.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
      vat_rate: li.vat_rate,
      vat_amount: li.quantity * li.unit_price * (li.vat_rate / 100),
      total_price: li.quantity * li.unit_price * (1 + li.vat_rate / 100),
      line_order: idx + 1,
    }));

    await supabase.from('invoice_items').insert(items);

    setSaving(false);
    onSave();
  };

  return (
    <div className={styles.form}>
      {/* Patient selector */}
      <div className={styles.field}>
        <label className={styles.label}>Páciens *</label>
        <div className={styles.searchBox}>
          <MagnifyingGlass size={16} color="var(--color-neutral-400)" />
          <input
            className={styles.searchInput}
            placeholder="Keresés név alapján..."
            value={patientSearch}
            onChange={(e) => { setPatientSearch(e.target.value); if (!e.target.value) setPatientId(''); }}
          />
        </div>
        {patients.length > 0 && patientSearch && (
          <div className={styles.dropdown}>
            {patients.map(p => (
              <button key={p.id} type="button" className={styles.dropdownItem}
                onClick={() => { setPatientId(p.id); setPatientSearch(p.label); setPatients([]); }}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Line items */}
      <div className={styles.lineItems}>
        <div className={styles.lineItemsHeader}>
          <h3 className={styles.lineItemsTitle}>Tételek</h3>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus size={14} /> Tétel hozzáadása
          </Button>
        </div>

        {lineItems.length === 0 && (
          <p className={styles.emptyItems}>Adjon hozzá tételeket az árlista alapján.</p>
        )}

        {lineItems.map((item) => (
          <div key={item.id} className={styles.lineItemRow}>
            <Dropdown
              items={priceList}
              value={item.treatment_type_id}
              placeholder="Kezelés kiválasztása..."
              onChange={(v) => updateLineItem(item.id, 'treatment_type_id', v as string)}
            />
            <InputField
              label="Megnevezés"
              value={item.description}
              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
            />
            <InputField
              label="Menny."
              type="number"
              value={String(item.quantity)}
              onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
            />
            <InputField
              label="Egységár"
              type="number"
              value={String(item.unit_price)}
              onChange={(e) => updateLineItem(item.id, 'unit_price', parseInt(e.target.value) || 0)}
            />
            <span className={styles.lineTotal}>{formatCurrency(item.quantity * item.unit_price)}</span>
            <button className={styles.removeBtn} onClick={() => removeLineItem(item.id)}>
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Nettó:</span><span>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>ÁFA (27%):</span><span>{formatCurrency(vatTotal)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Összesen:</span><span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      )}

      {/* Payment method + notes */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Fizetési mód</label>
          <Dropdown
            items={[
              { id: 'cash', label: 'Készpénz' },
              { id: 'card', label: 'Bankkártya' },
              { id: 'transfer', label: 'Átutalás' },
              { id: 'health_fund', label: 'Egészségpénztár' },
            ]}
            value={paymentMethod}
            onChange={(v) => setPaymentMethod(v as string)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Megjegyzés</label>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Egyéb megjegyzés..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="outline" onClick={onCancel}>Mégse</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving || !patientId || lineItems.length === 0}>
          {saving ? 'Mentés...' : 'Számla létrehozása'}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceForm;
