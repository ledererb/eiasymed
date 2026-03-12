'use client';
import { AddressBook, ArrowSquareOut, Prescription, FileText, Clipboard, IdentificationCard, Tooth, CaretCircleRight } from '@phosphor-icons/react';
import { Drawer } from './Drawer';
import { Avatar } from '../Avatar';
import styles from './Drawer.module.css';

export interface TreatmentDetailDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function TreatmentDetailDrawer({ open, onClose }: TreatmentDetailDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Kezelés gyorsnézet">
      {/* Patient Name */}
      <div className={styles.patientHeader}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className={styles.patientName}>Bíró János Attila</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-12)', color: 'var(--color-primary-900)' }}>1968. 08. 14. (54 é)</div>
            <div style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size-12)', color: 'var(--color-primary-900)' }}>TAJ: 168 634 123</div>
          </div>
        </div>
        <span className={styles.patientMeta}>ID: 2934564687</span>
      </div>

      {/* Patient Data Card */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <AddressBook size={30} color="var(--color-neutral-600)" />
          <span className={styles.cardIconLabel}>PÁCIENS ADATOK</span>
        </div>
        <div className={styles.sectionTitle}>Címkék, jelölők</div>
        <div className={styles.tagRow}>
          <span className={styles.tagPrimary} style={{ background: 'var(--color-status-success)' }}>FOLYAMATBAN</span>
        </div>
        <div className={styles.sectionTitle}>Korábbi időpontok</div>
        <div className={styles.appointmentPills}>
          <span className={styles.appointmentPill}>2026. Jan. 11. (Sze) 11:00</span>
          <span className={styles.appointmentPill}>2025. Dec. 15. (Hé) 09:30</span>
          <span className={styles.appointmentPillMuted}>Korábbiak megtekintése</span>
        </div>
        <div className={styles.sectionTitle}>Dokumentumok</div>
        <div className={styles.docBtnRow}>
          {['Aláírt fájlok', 'Receptek', 'Ambuláns…', 'Beutalók', 'e-profil'].map(d => (
            <button key={d} className={styles.docBtn}>{d}</button>
          ))}
        </div>
      </div>

      {/* Treatment History */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <Tooth size={30} color="var(--color-neutral-600)" />
          <span className={styles.cardIconLabel}>KEZELÉSI ELŐZMÉNYEK</span>
        </div>
        <div className={styles.timeline}>
          {/* Visit 1 */}
          <div style={{ position: 'relative' }}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineDate}>
              <span className={styles.timelineDateBold}>JAN. 27.</span><br />(Ke) 14:00
            </div>
            <div className={styles.treatmentCard}>
              <div className={styles.treatmentCardHeader}>
                <div>
                  <div className={styles.treatmentTitle}>All-on-4 műtét</div>
                  <div className={styles.treatmentId}>#13883239299 (2/1 vizit)</div>
                </div>
                <div>
                  <div className={styles.treatmentDoctor}>Dr. Harmathy Béla</div>
                  <div className={styles.treatmentAssistant}>Asszisztens: Németh Lilla</div>
                </div>
              </div>
              <div className={styles.treatmentDesc}>
                CT 8x15 / Érzéstelenítés / Nobel Replace CC implantátum / Nobel BioCare Multiunit felépítmény / Ideiglenes híd All-on-4-ra / Harapásemelő
              </div>
              <div className={styles.treatmentComment}>
                <div className={styles.commentHeader}>
                  <Avatar size="sm" name="" />
                  <span className={styles.commentAuthor}>Dr. Harmathy Béla</span>
                  <span className={styles.commentDate}>2026. 01. 15. (Hé) 14:53</span>
                </div>
                <p className={styles.commentBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed luctus venenatis malesuada. Vivamus sed dolor mperdiet, cursus erat et, interdum felis.</p>
              </div>
              <span className={styles.docLink}><Prescription size={15} /> Recept (Augmentin DUO 625 mg)</span>
              <span className={styles.docLink}><FileText size={15} /> Gyógyszercsomag (1db)</span>
              <span className={styles.docLink}><Clipboard size={15} /> Ambulánslap</span>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Vizit díja összesen:</span>
                <span className={styles.priceBadge}>750 000 Ft</span>
              </div>
              <span className={styles.summarySubLabel} style={{ textAlign: 'right' }}>Kezelés összesen: &nbsp;&nbsp;3 670 000 Ft</span>
            </div>
          </div>

          {/* Visit 2 */}
          <div style={{ position: 'relative' }}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineDate}>
              <span className={styles.timelineDateBold}>JAN. 15.</span><br />(Ke) 14:00
            </div>
            <div className={`${styles.treatmentCard} ${styles.treatmentCardAlt}`}>
              <div className={styles.treatmentCardHeader}>
                <div>
                  <div className={styles.treatmentTitleAlt}>Konzultáció</div>
                  <div className={styles.treatmentIdAlt}>#13883239298</div>
                </div>
                <div>
                  <div className={styles.treatmentDoctor}>Dr. Harmathy Béla</div>
                  <div className={styles.treatmentAssistant}>Asszisztens: Németh Lilla</div>
                </div>
              </div>
              <div className={styles.treatmentDesc}>Panoráma röntgen / Szájvizsgálat, állapotfelmérés</div>
              <div className={styles.treatmentComment}>
                <div className={styles.commentHeader}>
                  <Avatar size="sm" name="" />
                  <span className={styles.commentAuthor}>Dr. Harmathy Béla</span>
                  <span className={styles.commentDate}>2026. 01. 15. (Hé) 14:53</span>
                </div>
                <p className={styles.commentBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed luctus venenatis malesuada.</p>
              </div>
              <span className={styles.docLink}><Clipboard size={15} /> Ambulánslap</span>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Vizit díja összesen:</span>
                <span className={styles.priceBadge}>33 000 Ft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
