'use client';
import { X, ShareNetwork, Printer, CheckCircle, CaretDown, DotsSixVertical, Eye } from '@phosphor-icons/react';
import { Drawer } from './Drawer';
import styles from './Drawer.module.css';

export interface TreatmentPlanMasterDrawerProps {
  open: boolean;
  onClose: () => void;
}

function TpRowItem({ name, area, price, qty, total, done }: {name: string; area: string; price: string; qty: string; total: string; done?: boolean}) {
  return (
    <div className={styles.tpRow}>
      <div className={styles.tpRowDrag}><DotsSixVertical size={14} /></div>
      <div className={styles.tpRowName}>{name}</div>
      <div className={styles.tpRowArea}>{area}</div>
      <div className={styles.tpRowPrice}>{price}</div>
      <div className={styles.tpRowQty}>{qty}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <span className={styles.tpRowTotal}>{total}</span>
        {done && <CheckCircle size={20} color="var(--color-status-success)" weight="fill" />}
      </div>
    </div>
  );
}

export function TreatmentPlanMasterDrawer({ open, onClose }: TreatmentPlanMasterDrawerProps) {
  const rows = Array(5).fill(null);
  return (
    <Drawer open={open} onClose={onClose} title="Kezelési terv előnézet" width="wide">
      {/* Patient Name */}
      <div className={styles.patientHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className={styles.patientName}>Bíró János Attila</span>
            <div className={styles.patientMeta}>ID: 2934564687; 1968. 07. 15. (54 é)</div>
          </div>
          <span className={styles.textLink}>Ugrás a kezelésre &nbsp;→</span>
        </div>
      </div>

      {/* TP Header bar */}
      <div className={styles.tpHeader}>
        <span className={styles.tpHeaderText}>#1301234567899 &nbsp;&nbsp; All-on-4 felső, full kontúr cirkon híd</span>
        <div className={styles.tpHeaderIcons}>
          <Eye size={16} className={styles.tpHeaderIcon} />
          <ShareNetwork size={16} className={styles.tpHeaderIcon} />
          <Printer size={16} className={styles.tpHeaderIcon} />
        </div>
      </div>

      {/* Status + Meta */}
      <div className={styles.tpStatusRow}>
        <button className={styles.tpStatusBadge}>
          ELFOGADVA <CaretDown size={12} />
        </button>
        <div className={styles.tpMeta}>
          <div>Létrehozva:</div>
          <div>2026. 01. 26. &nbsp;14:34, Dr. Harmathy Béla</div>
        </div>
      </div>

      {/* Visit 1 */}
      <div className={styles.tpVisitDivider}>1. VIZIT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map((_, i) => (
          <TpRowItem key={`v1-${i}`} name="Kezelés" area="Teljes szájüreg" price="28 500 Ft" qty="x 2" total="1 750 000 Ft" done />
        ))}
      </div>
      <div className={styles.tpDurationRow}>
        <span>Vizit időtartam: 0 nap</span>
        <span>Gyógyulási idő: 3 hónap</span>
      </div>
      <div className={styles.tpSumRow}>
        <span className={styles.tpSumLabel}>1. vizit összesen</span>
        <span className={styles.tpSumBadge}>1 000 000 Ft</span>
      </div>

      {/* Visit 2 */}
      <div className={styles.tpVisitDivider}>2. VIZIT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map((_, i) => (
          <TpRowItem key={`v2-${i}`} name="Kezelés" area="Teljes szájüreg" price="28 500 Ft" qty="x 2" total="1 750 000 Ft" />
        ))}
      </div>
      <div className={styles.tpDurationRow}>
        <span>Vizit időtartam: 0 nap</span>
        <span>Gyógyulási idő: 3 hónap</span>
      </div>
      <div className={styles.tpSumRow}>
        <span className={styles.tpSumLabel}>2. vizit összesen</span>
        <span className={styles.tpSumBadge}>1 000 000 Ft</span>
      </div>

      {/* Grand Total */}
      <div className={styles.tpGrandTotal}>
        <span className={styles.tpSumLabel} style={{ textTransform: 'uppercase' }}>KEZELÉS ÖSSZESEN</span>
        <span className={styles.tpGrandTotalBadge}>2 000 000 Ft</span>
      </div>
    </Drawer>
  );
}
