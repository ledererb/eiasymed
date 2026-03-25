'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlass, Plus, FunnelSimple, Phone, EnvelopeSimple,
  ChatCircle, UserCircle, CalendarBlank, Star, DotsThreeVertical,
  ArrowRight, Clock, Notebook, PhoneCall, At, X,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Drawer } from '@/components/Drawer';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { createClient } from '@/lib/supabase-browser';
import { format, formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  pipeline_stage: string;
  score: number;
  estimated_value: number;
  assigned_to_name: string | null;
  created_at: string;
  last_contacted_at: string | null;
}

const PIPELINE_STAGES = [
  { id: 'new', label: 'Új', color: '#3b82f6' },
  { id: 'contacted', label: 'Kapcsolatfelvett', color: '#8b5cf6' },
  { id: 'qualified', label: 'Minősített', color: '#f59e0b' },
  { id: 'proposal', label: 'Ajánlat küldve', color: '#06b6d4' },
  { id: 'won', label: 'Megnyert', color: '#22c55e' },
  { id: 'lost', label: 'Elveszett', color: '#ef4444' },
];

const STAGE_TO_BADGE: Record<string, { label: string; variant: 'new' | 'consultation' | 'offer' | 'waiting' | 'success' | 'rejected' }> = {
  new: { label: 'Új', variant: 'new' },
  contacted: { label: 'Kapcsolatfelvett', variant: 'consultation' },
  qualified: { label: 'Minősített', variant: 'offer' },
  proposal: { label: 'Ajánlat küldve', variant: 'waiting' },
  won: { label: 'Megnyert', variant: 'success' },
  lost: { label: 'Elveszett', variant: 'rejected' },
};

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<{ id: string; activity_type: string; description: string; created_at: string }[]>([]);

  // Lead creation/edit drawer
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState({ first_name: '', last_name: '', email: '', phone: '', source: 'website', estimated_value: '', pipeline_stage: 'new' });
  const [leadSaving, setLeadSaving] = useState(false);

  // Kanban drag-and-drop
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Automation rules
  const [automationRules, setAutomationRules] = useState([
    { id: 'auto_patient', label: 'Páciens automatikus létrehozása lead megnyerésekor', description: 'Ha egy lead "Megnyert" fázisba kerül, automatikusan páciens rekord jön létre.', enabled: true },
    { id: 'auto_assign', label: 'Automatikus orvos hozzárendelés', description: 'Új leadek automatikusan a legkevesebb leadet kezelő orvoshoz kerülnek.', enabled: false },
    { id: 'follow_up_3d', label: '3 napos follow-up emlékeztető', description: 'Ha a leaddel 3 napja nem volt kapcsolat, emlékeztető értesítés megy.', enabled: true },
    { id: 'follow_up_7d', label: '7 napos inaktivitás figyelmeztetés', description: 'Ha 7 napig nem volt tevékenység, riportba kerül és email értesítés megy.', enabled: false },
    { id: 'auto_score', label: 'Automatikus pontszámítás', description: 'Lead score automatikusan frissül az interakciók és válaszidők alapján.', enabled: true },
  ]);

  const supabase = createClient();

  const fetchLeads = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (searchQuery.trim()) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    if (stageFilter) {
      query = query.eq('pipeline_stage', stageFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
      return;
    }

    setLeads(data || []);
    setLoading(false);
  }, [searchQuery, stageFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Fetch activities when lead is selected
  useEffect(() => {
    if (!selectedLead) return;
    async function fetchActivities() {
      const { data } = await supabase
        .from('lead_activities')
        .select('id, activity_type, description, created_at')
        .eq('lead_id', selectedLead!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setActivities(data || []);
    }
    fetchActivities();
  }, [selectedLead]);

  // Add activity
  const handleAddActivity = async (type: string) => {
    if (!selectedLead) return;
    const descriptions: Record<string, string> = {
      call: 'Telefonhívás történt',
      email: 'Email küldve',
      note: 'Jegyzet hozzáadva',
    };
    await supabase.from('lead_activities').insert({
      lead_id: selectedLead.id,
      activity_type: type,
      description: descriptions[type] || type,
    });
    // Update last_contacted_at
    await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', selectedLead.id);
    // Refresh activities
    const { data } = await supabase
      .from('lead_activities')
      .select('id, activity_type, description, created_at')
      .eq('lead_id', selectedLead.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setActivities(data || []);
  };

  // Move pipeline stage
  const handleStageMove = async (newStage: string) => {
    if (!selectedLead) return;
    await supabase.from('leads').update({ pipeline_stage: newStage }).eq('id', selectedLead.id);
    setSelectedLead({ ...selectedLead, pipeline_stage: newStage });
    fetchLeads();
  };

  // Pipeline counts
  const stageCounts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: leads.filter(l => l.pipeline_stage === stage.id).length,
    value: leads.filter(l => l.pipeline_stage === stage.id).reduce((s, l) => s + (l.estimated_value || 0), 0),
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);
  };

  // Open lead drawer for create/edit
  const openLeadDrawer = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setLeadForm({ first_name: lead.first_name, last_name: lead.last_name, email: lead.email || '', phone: lead.phone || '', source: lead.source, estimated_value: String(lead.estimated_value || ''), pipeline_stage: lead.pipeline_stage });
    } else {
      setEditingLead(null);
      setLeadForm({ first_name: '', last_name: '', email: '', phone: '', source: 'website', estimated_value: '', pipeline_stage: 'new' });
    }
    setLeadDrawerOpen(true);
  };

  // Save lead
  const saveLead = async () => {
    setLeadSaving(true);
    const payload = { first_name: leadForm.first_name, last_name: leadForm.last_name, email: leadForm.email || null, phone: leadForm.phone || null, source: leadForm.source, estimated_value: parseFloat(leadForm.estimated_value) || 0, pipeline_stage: leadForm.pipeline_stage, status: 'active', score: 0 };
    if (editingLead) {
      await supabase.from('leads').update(payload).eq('id', editingLead.id);
      if (selectedLead?.id === editingLead.id) setSelectedLead({ ...selectedLead, ...payload } as Lead);
    } else {
      await supabase.from('leads').insert(payload);
    }
    setLeadSaving(false);
    setLeadDrawerOpen(false);
    fetchLeads();
  };

  // Delete lead
  const deleteLead = async (id: string) => {
    await supabase.from('lead_activities').delete().eq('lead_id', id);
    await supabase.from('leads').delete().eq('id', id);
    setSelectedLead(null);
    fetchLeads();
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'CRM' }]} />

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>CRM — Lead Kezelés</h1>
          <p className={styles.pageSubtitle}>{leads.length} lead a rendszerben</p>
        </div>
        <Button variant="primary" onClick={() => openLeadDrawer()}>
          <Plus size={16} weight="bold" /> Új lead
        </Button>
      </div>

      {/* Pipeline overview cards */}
      <div className={styles.pipelineCards}>
        {stageCounts.map((stage) => (
          <button
            key={stage.id}
            className={`${styles.pipelineCard} ${stageFilter === stage.id ? styles.pipelineCardActive : ''}`}
            onClick={() => setStageFilter(stageFilter === stage.id ? null : stage.id)}
          >
            <div className={styles.pipelineIndicator} style={{ background: stage.color }} />
            <div className={styles.pipelineInfo}>
              <span className={styles.pipelineLabel}>{stage.label}</span>
              <span className={styles.pipelineCount}>{stage.count}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'board', label: 'Board' },
          { id: 'activities', label: 'Tevékenységek' },
          { id: 'automation', label: 'Automatizáció' },
          { id: 'templates', label: 'Sablonok' },
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* Kanban Board view — with drag and drop */}
      {activeTab === 'board' && (
        <div className={styles.kanbanBoard}>
          {PIPELINE_STAGES.filter(s => s.id !== 'lost').map(stage => {
            const stageLeads = leads.filter(l => l.pipeline_stage === stage.id);
            const stageValue = stageLeads.reduce((s, l) => s + (l.estimated_value || 0), 0);
            return (
              <div
                key={stage.id}
                className={`${styles.kanbanColumn} ${dragOverStage === stage.id ? styles.kanbanColumnDragOver : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  if (draggingLeadId) {
                    await supabase.from('leads').update({ pipeline_stage: stage.id }).eq('id', draggingLeadId);
                    setDraggingLeadId(null);
                    fetchLeads();
                  }
                }}
              >
                <div className={styles.kanbanColumnHeader}>
                  <div className={styles.kanbanColumnDot} style={{ background: stage.color }} />
                  <span className={styles.kanbanColumnTitle}>{stage.label}</span>
                  <span className={styles.kanbanColumnCount}>{stageLeads.length}</span>
                </div>
                <div className={styles.kanbanColumnValue}>
                  {new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(stageValue)}
                </div>
                <div className={styles.kanbanCards}>
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      className={`${styles.kanbanCard} ${draggingLeadId === lead.id ? styles.kanbanCardDragging : ''}`}
                      draggable
                      onDragStart={() => setDraggingLeadId(lead.id)}
                      onDragEnd={() => { setDraggingLeadId(null); setDragOverStage(null); }}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className={styles.kanbanCardName}>
                        <UserCircle size={22} color="var(--color-neutral-300)" weight="fill" />
                        {lead.last_name} {lead.first_name}
                      </div>
                      {lead.estimated_value > 0 && (
                        <div className={styles.kanbanCardValue}>
                          {new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(lead.estimated_value)} Ft
                        </div>
                      )}
                      <div className={styles.kanbanCardMeta}>
                        {lead.source && <span>{lead.source}</span>}
                        {lead.score > 0 && <span><Star size={11} weight="fill" /> {lead.score}</span>}
                        {lead.last_contacted_at && (
                          <span>{formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true, locale: hu })}</span>
                        )}
                      </div>
                      {/* Quick stage advance */}
                      {stage.id !== 'won' && (
                        <button
                          className={styles.kanbanAdvanceBtn}
                          title="Következő fázis"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const stages = PIPELINE_STAGES.map(s => s.id);
                            const nextIdx = stages.indexOf(stage.id) + 1;
                            if (nextIdx < stages.length) {
                              await supabase.from('leads').update({ pipeline_stage: stages[nextIdx] }).eq('id', lead.id);
                              fetchLeads();
                            }
                          }}
                        >
                          <ArrowRight size={12} weight="bold" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ AUTOMATIZÁCIÓ TAB ═══ */}
      {activeTab === 'automation' && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 700 }}>
          {automationRules.map(rule => (
            <div key={rule.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: 'var(--color-white)', border: '1px solid var(--color-neutral-100)',
              borderRadius: 'var(--radius-12)', transition: 'border-color 0.15s',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary-900)', marginBottom: 4 }}>{rule.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-neutral-500)', lineHeight: 1.4 }}>{rule.description}</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-flex', width: 44, height: 24, cursor: 'pointer' }}>
                <input type="checkbox" checked={rule.enabled} onChange={() => {
                  setAutomationRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
                }} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 24,
                  background: rule.enabled ? 'var(--color-primary-500)' : 'var(--color-neutral-200)',
                  transition: 'background 0.2s',
                }} />
                <span style={{
                  position: 'absolute', top: 2, left: rule.enabled ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }} />
              </label>
            </div>
          ))}
        </div>
      )}

      {/* ═══ SABLONOK TAB ═══ */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { id: 'welcome', title: 'Üdvözlő email', type: 'Email', preview: 'Kedves {név}! Köszönjük, hogy érdeklődik klinikánk szolgáltatásai iránt...' },
            { id: 'follow_up', title: 'Follow-up emlékeztető', type: 'Email', preview: 'Kedves {név}! Szeretnénk érdeklődni, hogy gondolkodott-e az ajánlatunkon...' },
            { id: 'appointment', title: 'Időpont visszaigazolás', type: 'SMS', preview: 'Kedves {név}! Időpontja megerősítve: {dátum} {idő}. Klinika neve, címe.' },
            { id: 'reminder_24h', title: '24 órás emlékeztető', type: 'SMS', preview: 'Kedves {név}! Holnap {idő}-kor időpontja van nálunk. Várjuk!' },
            { id: 'quote', title: 'Árajánlat küldés', type: 'Email', preview: 'Kedves {név}! Mellékeljük a személyre szabott kezelési ajánlatunkat...' },
            { id: 'post_treatment', title: 'Kezelés utáni utasítások', type: 'Email', preview: 'Kedves {név}! Az alábbiakban részletezzük a kezelés utáni teendőket...' },
          ].map(tpl => (
            <div key={tpl.id} style={{
              background: 'var(--color-white)', border: '1px solid var(--color-neutral-100)',
              borderRadius: 'var(--radius-12)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary-900)' }}>{tpl.title}</span>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 600,
                  background: tpl.type === 'Email' ? '#dbeafe' : '#dcfce7',
                  color: tpl.type === 'Email' ? '#1d4ed8' : '#166534' }}>
                  {tpl.type}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-neutral-500)', lineHeight: 1.5, margin: 0 }}>{tpl.preview}</p>
              <button style={{
                alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 8,
                border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-50)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
                color: 'var(--color-primary-900)',
              }} onClick={() => alert(`Sablon szerkesztése: ${tpl.title}`)}>✏️ Szerkesztés</button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {(activeTab === 'pipeline' || activeTab === 'activities') && (
      <div className={styles.searchBar}>
        <MagnifyingGlass size={18} color="var(--color-neutral-400)" />
        <input
          className={styles.searchInput}
          placeholder="Keresés név vagy email alapján..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      )}

      {activeTab === 'pipeline' && (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Név</th>
              <th>Forrás</th>
              <th>Pontszám</th>
              <th>Érték</th>
              <th>Fázis</th>
              <th>Elérhetőség</th>
              <th>Utolsó kontakt</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.emptyCell}>Betöltés...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyCell}>
                {searchQuery || stageFilter ? 'Nincs találat.' : 'Még nincsenek leadek.'}
              </td></tr>
            ) : (
              leads.map((lead) => {
                const badge = STAGE_TO_BADGE[lead.pipeline_stage] || STAGE_TO_BADGE.new;
                return (
                  <tr key={lead.id} className={styles.tableRow} onClick={() => setSelectedLead(lead)}>
                    <td>
                      <div className={styles.leadName}>
                        <UserCircle size={28} color="var(--color-neutral-300)" weight="fill" />
                        <div>
                          <span className={styles.nameText}>{lead.last_name} {lead.first_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.sourceCell}>{lead.source || '—'}</td>
                    <td>
                      <div className={styles.scoreCell}>
                        <Star size={14} weight="fill" color={lead.score >= 70 ? '#f59e0b' : '#d1d5db'} />
                        <span className={lead.score >= 70 ? styles.scoreHigh : ''}>{lead.score}</span>
                      </div>
                    </td>
                    <td className={styles.valueCell}>{formatCurrency(lead.estimated_value || 0)}</td>
                    <td>
                      <StatusBadge status={badge.variant} label={badge.label} />
                    </td>
                    <td>
                      <div className={styles.contactIcons}>
                        {lead.phone && <Phone size={16} color="var(--color-primary-500)" />}
                        {lead.email && <EnvelopeSimple size={16} color="var(--color-primary-500)" />}
                        <ChatCircle size={16} color="var(--color-neutral-300)" />
                      </div>
                    </td>
                    <td className={styles.dateCell}>
                      {lead.last_contacted_at
                        ? formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true, locale: hu })
                        : '—'
                      }
                    </td>
                    <td>
                      <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}><DotsThreeVertical size={16} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Lead detail drawer */}
      <Drawer
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Lead részletek"
        width="wide"
      >
        {selectedLead && (
          <div className={styles.drawerContent}>
            {/* Lead header */}
            <div className={styles.drawerHeader}>
              <UserCircle size={40} color="var(--color-primary-500)" weight="fill" />
              <div>
                <h2 className={styles.drawerName}>{selectedLead.last_name} {selectedLead.first_name}</h2>
                <div className={styles.drawerMeta}>
                  {selectedLead.phone && <span><Phone size={13} /> {selectedLead.phone}</span>}
                  {selectedLead.email && <span><EnvelopeSimple size={13} /> {selectedLead.email}</span>}
                </div>
              </div>
            </div>

            {/* Score + Value */}
            <div className={styles.drawerStats}>
              <div className={styles.drawerStat}>
                <span className={styles.drawerStatLabel}>Pontszám</span>
                <span className={styles.drawerStatValue}>
                  <Star size={14} weight="fill" color={selectedLead.score >= 70 ? '#f59e0b' : '#d1d5db'} />
                  {selectedLead.score}
                </span>
              </div>
              <div className={styles.drawerStat}>
                <span className={styles.drawerStatLabel}>Érték</span>
                <span className={styles.drawerStatValue}>{formatCurrency(selectedLead.estimated_value)}</span>
              </div>
              <div className={styles.drawerStat}>
                <span className={styles.drawerStatLabel}>Forrás</span>
                <span className={styles.drawerStatValue}>{selectedLead.source}</span>
              </div>
            </div>

            {/* Pipeline stage selector */}
            <div className={styles.drawerStages}>
              <span className={styles.drawerSectionTitle}>Fázis</span>
              <div className={styles.drawerStageRow}>
                {PIPELINE_STAGES.map(stage => (
                  <button
                    key={stage.id}
                    className={`${styles.drawerStageBtn} ${selectedLead.pipeline_stage === stage.id ? styles.drawerStageBtnActive : ''}`}
                    style={{ '--stage-color': stage.color } as React.CSSProperties}
                    onClick={() => handleStageMove(stage.id)}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className={styles.drawerActions}>
              <span className={styles.drawerSectionTitle}>Gyors művelet</span>
              <div className={styles.drawerActionRow}>
                <button className={styles.drawerActionBtn} onClick={() => handleAddActivity('call')}>
                  <PhoneCall size={16} /> Hívás
                </button>
                <button className={styles.drawerActionBtn} onClick={() => handleAddActivity('email')}>
                  <At size={16} /> Email
                </button>
                <button className={styles.drawerActionBtn} onClick={() => handleAddActivity('note')}>
                  <Notebook size={16} /> Jegyzet
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#f5f7fa', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-family)', color: '#082432' }}
                  onClick={() => { openLeadDrawer(selectedLead); setSelectedLead(null); }}
                >
                  ✏️ Szerkesztés
                </button>
                <button
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fee2e2', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-family)', color: '#991b1b' }}
                  onClick={() => { if (confirm('Biztosan törli ezt a leadet?')) deleteLead(selectedLead.id); }}
                >
                  🗑️ Törlés
                </button>
              </div>
            </div>

            {/* Activity timeline */}
            <div className={styles.drawerTimeline}>
              <span className={styles.drawerSectionTitle}>Tevékenységek</span>
              {activities.length === 0 ? (
                <p className={styles.drawerEmpty}>Még nincsenek tevékenységek.</p>
              ) : (
                <div className={styles.timeline}>
                  {activities.map(a => (
                    <div key={a.id} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineContent}>
                        <span className={styles.timelineType}>
                          {a.activity_type === 'call' ? <PhoneCall size={12} /> : a.activity_type === 'email' ? <At size={12} /> : <Notebook size={12} />}
                          {a.activity_type === 'call' ? 'Hívás' : a.activity_type === 'email' ? 'Email' : 'Jegyzet'}
                        </span>
                        <span className={styles.timelineDesc}>{a.description}</span>
                        <span className={styles.timelineDate}>
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: hu })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ═══ LEAD CREATE/EDIT DRAWER ═══ */}
      <Drawer open={leadDrawerOpen} onClose={() => setLeadDrawerOpen(false)} title={editingLead ? 'Lead szerkesztése' : 'Új lead'} width="wide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Vezetéknév" value={leadForm.last_name} onChange={e => setLeadForm(p => ({ ...p, last_name: e.target.value }))} />
            <InputField label="Keresztnév" value={leadForm.first_name} onChange={e => setLeadForm(p => ({ ...p, first_name: e.target.value }))} />
          </div>
          <InputField label="Email" type="email" value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))} />
          <InputField label="Telefon" value={leadForm.phone} onChange={e => setLeadForm(p => ({ ...p, phone: e.target.value }))} />
          <Dropdown value={leadForm.source} onChange={v => setLeadForm(p => ({ ...p, source: typeof v === 'string' ? v : v[0] }))}
            items={[
              { id: 'website', label: 'Weboldal' },
              { id: 'referral', label: 'Ajánlás' },
              { id: 'social', label: 'Közösségi média' },
              { id: 'ad', label: 'Hirdetés' },
              { id: 'walk_in', label: 'Beszélő' },
              { id: 'other', label: 'Egyéb' },
            ]} />
          <InputField label="Becsült érték (Ft)" type="number" value={leadForm.estimated_value} onChange={e => setLeadForm(p => ({ ...p, estimated_value: e.target.value }))} />
          <Dropdown value={leadForm.pipeline_stage} onChange={v => setLeadForm(p => ({ ...p, pipeline_stage: typeof v === 'string' ? v : v[0] }))}
            items={PIPELINE_STAGES.map(s => ({ id: s.id, label: s.label }))} />
          <Button variant="primary" onClick={saveLead}>
            {leadSaving ? 'Mentés...' : editingLead ? 'Mentés' : 'Lead létrehozása'}
          </Button>
        </div>
      </Drawer>
    </AppShell>
  );
}
