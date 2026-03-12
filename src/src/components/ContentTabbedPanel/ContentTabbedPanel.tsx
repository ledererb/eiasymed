'use client';
import { useState, ReactNode } from 'react';
import { Plus, PaperPlaneRight, CaretRight } from '@phosphor-icons/react';
import { Avatar } from '../Avatar';
import styles from './ContentTabbedPanel.module.css';

type Tab = 'rontgen' | 'anamnezis' | 'ajanlatok' | 'megjegyzesek';

const TABS: { key: Tab; label: string }[] = [
  { key: 'rontgen', label: 'Röntgen' },
  { key: 'anamnezis', label: 'Anamnézis' },
  { key: 'ajanlatok', label: 'Ajánlatok' },
  { key: 'megjegyzesek', label: 'Megjegyzések' },
];

function RontgenTab() {
  return (
    <>
      <div className={styles.xrayHeader}>
        <div>
          <span className={styles.xrayLabel}>Legutóbbi röntgenfelvétel</span><br />
          <span className={styles.xrayDate}>2026. 01. 16. (Hé) 14:56</span>
        </div>
        <button className={styles.xrayAddBtn}><Plus size={16} /></button>
      </div>
      <div className={styles.xrayImage}>
        <span className={styles.xrayPlaceholder}>🦷 Panoráma röntgen</span>
      </div>
    </>
  );
}

function AnamnezisTab() {
  const items = [
    { label: 'Temporibus quibusdam', color: 'anamnesisRed' as const },
    { label: 'Et harum quidem', color: 'anamnesisOrange' as const },
    { label: 'Temporibus autem', color: 'anamnesisOrange' as const },
    { label: 'Et harum quidem rerum', color: 'anamnesisOrange' as const },
    { label: 'Temporibus autem quibusdam', color: 'anamnesisRed' as const },
  ];
  return (
    <>
      <div className={styles.anamnesisGrid}>
        {items.map((it, i) => (
          <div key={i} className={styles.anamnesisItem}>
            <div className={`${styles.anamnesisSquare} ${styles[it.color]}`} />
            {it.label}
          </div>
        ))}
      </div>
      <div className={styles.fullAnamnesisLink}>Teljes anamnézis <CaretRight size={12} /></div>
      <div className={styles.aiSummary}>
        <div className={styles.aiTitle}>Eaisy összegzés</div>
        <p className={styles.aiText}>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
          totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta
          sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>
      </div>
    </>
  );
}

function AjanlatokTab() {
  const offers = [
    { status: 'elfogadva', num: '#13883239299', subject: 'All-on-4, full kontúr cirkon híd', date: '2026. 01. 15. 11:24', by: 'Dr. Harmathy Béla', cls: 'offerAccepted' as const },
    { status: 'elutasítva', num: '#13883239298', subject: 'Stéges fogsor', date: '2026. 01. 15. 11:24', by: 'Dr. Harmathy Béla', cls: 'offerRejected' as const },
    { status: 'elutasítva', num: '#13883239297', subject: 'Implantátum, fémkerámia', date: '2026. 01. 15. 11:24', by: 'Dr. Harmathy Béla', cls: 'offerRejected' as const },
    { status: 'elvégzett', num: '#13883239296', subject: 'Konzultáció', date: '2026. 01. 12. 15:29', by: 'Dr. Harmathy Béla', cls: 'offerDone' as const },
  ];
  return (
    <table className={styles.offerTable}>
      <thead>
        <tr>
          <th>Ajánlati státusz</th>
          <th>Ajánlat száma</th>
          <th>Tárgy</th>
          <th>Létrehozva</th>
          <th>Létrehozta</th>
        </tr>
      </thead>
      <tbody>
        {offers.map((o, i) => (
          <tr key={i}>
            <td><span className={`${styles.offerBadge} ${styles[o.cls]}`}>{o.status}</span></td>
            <td><span className={styles.offerNum}>{o.num}</span></td>
            <td>{o.subject}</td>
            <td>{o.date}</td>
            <td>{o.by}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MegjegyzesekTab() {
  return (
    <>
      <div className={styles.chatInput}>
        <Avatar size="sm" name="" />
        <input className={styles.chatInputField} placeholder="Megjegyzés" />
        <button className={styles.chatSendBtn}><PaperPlaneRight size={16} /></button>
      </div>
      <div className={styles.chatThread}>
        {[1, 2].map((_, i) => (
          <div key={i} className={styles.chatBubble}>
            <div className={styles.chatBubbleHeader}>
              <span className={styles.chatAuthor}>Dr. Kiss Orsolya</span>
              <span className={styles.chatDate}>Jan. 15. (Hé), 2026<br />14:23</span>
            </div>
            <p className={styles.chatBody}>
              {i === 0
                ? 'In mauris porttitor tincidunt mauris massa sit lorem sed scelerisque. Fringilla pharetra vel massa enim sollicitudin cras. At pulvinar eget sociis adipiscing eget donec ultricies nibh tristique.'
                : 'At pulvinar eget sociis adipiscing eget donec ultricies nibh tristique.'}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

export function ContentTabbedPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('rontgen');
  const content: Record<Tab, ReactNode> = {
    rontgen: <RontgenTab />,
    anamnezis: <AnamnezisTab />,
    ajanlatok: <AjanlatokTab />,
    megjegyzesek: <MegjegyzesekTab />,
  };
  return (
    <div className={styles.panel}>
      <div className={styles.tabRow}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>{content[activeTab]}</div>
    </div>
  );
}
