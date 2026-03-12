'use client';
import { Phone, EnvelopeSimple, AddressBook, Tooth, CurrencyCircleDollar, CalendarBlank, Clock, House, PencilSimple, CaretCircleRight, Plus, ArrowSquareOut } from '@phosphor-icons/react';
import { Drawer } from './Drawer';
import { Avatar } from '../Avatar';
import styles from './Drawer.module.css';

export interface PatientMasterDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function PatientMasterDrawer({ open, onClose }: PatientMasterDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Vizit gyorsnézet" footer={
      <div style={{ padding: '0 26px 30px' }}>
        <button className={styles.ctaBtn}>Ugrás fizetésre</button>
      </div>
    }>
      {/* Patient Name + Contact */}
      <div className={styles.patientHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={styles.patientName}>Rozsos Alexandra</span>
            <ArrowSquareOut size={20} color="var(--color-brand-500)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className={styles.patientContact}><Phone size={20} /> +36 70 123 4567</span>
            <span className={styles.patientContact}><EnvelopeSimple size={20} /> rozsosalexandra@gmail.com</span>
          </div>
        </div>
        <span className={styles.patientMeta}>ID: 223456787</span>
      </div>

      {/* Patient Data Card */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <AddressBook size={30} color="var(--color-neutral-600)" />
          <span className={styles.cardIconLabel}>PÁCIENS ADATOK</span>
        </div>
        <div className={styles.sectionTitle}>Címkék, jelölők</div>
        <div className={styles.tagRow}>
          <span className={styles.tagPrimary}>KONZULTÁCIÓ</span>
          <span className={styles.tagOutline}>Esztétika kampány_26 tavasz</span>
        </div>
        <div className={styles.sectionTitle}>Korábbi időpontok</div>
        <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-14)', fontStyle: 'italic', fontWeight: 300, color: 'var(--color-primary-900)' }}>Új páciens</span>
      </div>

      {/* Current Visit Card */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <Tooth size={30} color="var(--color-neutral-600)" />
          <span className={styles.cardIconLabel}>AKTUÁLIS VIZIT</span>
        </div>
        <div className={styles.statusRow}>
          {['Megérkezett', 'Elkezdve', 'Lezárva', 'Lemondva', 'No-show'].map(s => (
            <button key={s} className={styles.statusBtn}>{s}</button>
          ))}
        </div>
        <div className={styles.sectionTitle}>Vizit információk</div>
        <div className={styles.gradientCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarBlank size={22} color="var(--color-primary-900)" />
              <span className={styles.visitDate}>2026. május 5. (P), 10:00</span>
            </div>
            <PencilSimple size={21} color="var(--color-primary-900)" />
          </div>
          <span className={styles.visitType}>Konzultáció</span>
          <span className={styles.visitId}>#13883239299 <ArrowSquareOut size={15} /></span>
          <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-14)', fontStyle: 'italic', fontWeight: 300, color: 'var(--color-primary-900)' }}>Dr. Kiss Orsolya</span>
          <div className={styles.visitMeta}>
            <span className={styles.visitMetaItem}><Clock size={20} /> 60 perc</span>
            <span className={styles.visitMetaItem}><House size={20} /> 3-as rendelő</span>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className={styles.addLink}>
        <Plus size={20} /> Megjegyzés hozzáadása
      </div>
      <div>
        <div style={{ display: 'flex', gap: 15 }}>
          <Avatar size="sm" name="" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className={styles.commentAuthor}>Faragó Brigitta</span>
              <span className={styles.commentDate}>2026. 01. 15. (Hé) 14:53</span>
            </div>
            <p className={styles.commentBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed luctus venenatis malesuada.</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <span className={styles.textLink}>Több megjegyzés <CaretCircleRight size={15} /></span>
        </div>
      </div>

      {/* Payment Card */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <CurrencyCircleDollar size={30} color="var(--color-neutral-600)" />
          <span className={styles.cardIconLabel}>AKTUÁLIS FIZETENDŐ</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0' }}>
          <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-14)', color: 'var(--color-primary-900)' }}>2026. 03.03-án esedékes</span>
          <span style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-14)', fontWeight: 600, color: 'var(--color-primary-900)', textAlign: 'right' }}>0 Ft</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className={styles.textLink}>Részletek <CaretCircleRight size={15} /></span>
        </div>
      </div>
    </Drawer>
  );
}
