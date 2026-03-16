'use client';

import React from 'react';
import { DentalChart } from '@/components/dental-chart';
import styles from './page.module.css';

export default function DentalChartShowcase() {
  return (
    <div className={styles.page}>
      {/* Hero section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Interaktív fogdiagram</div>
          <h1 className={styles.heroTitle}>
            Zsigmondy
            <span className={styles.heroAccent}>-kereszt</span>
          </h1>
          <p className={styles.heroDescription}>
            32 fog · 5 felszín per fog · FDI notáció · Státuszrögzítés és kezelési terv mód
          </p>
        </div>
        <div className={styles.heroGraphic}>
          <span className={styles.heroTooth}>🦷</span>
        </div>
      </header>

      {/* Chart section */}
      <section className={styles.chartSection}>
        <DentalChart />
      </section>

      {/* Info section */}
      <section className={styles.info}>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>🎯</div>
          <h3 className={styles.infoTitle}>Felszín-szintű interakció</h3>
          <p className={styles.infoText}>
            Minden fog 5 önállóan kezelhető felszínnel rendelkezik:
            Mesiális (M), Occlusális (O), Distális (D), Buccális (B), Linguális (L).
          </p>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>🔬</div>
          <h3 className={styles.infoTitle}>Státuszrögzítés</h3>
          <p className={styles.infoText}>
            Rögzítse a fogak aktuális állapotát: ép, szuvas, tömött (kompozit/amalgám),
            törött, kopott, vagy egyéb elváltozás felszínenként.
          </p>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>📋</div>
          <h3 className={styles.infoTitle}>Kezelési terv</h3>
          <p className={styles.infoText}>
            Tervezze meg a beavatkozásokat: tömés, korona, gyökérkezelés, extrakció,
            implantátum — színkódolt overlay-ekkel.
          </p>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>🏥</div>
          <h3 className={styles.infoTitle}>Anatómiai SVG</h3>
          <p className={styles.infoText}>
            Laterális (oldalnézet) és occlusális (felülnézet) megjelenítés
            fogtípusonként, gyökerekkel és korona overlay-ekkel.
          </p>
        </div>
      </section>

      {/* Usage instructions */}
      <section className={styles.usage}>
        <h2 className={styles.usageTitle}>Használati útmutató</h2>
        <div className={styles.usageSteps}>
          <div className={styles.usageStep}>
            <span className={styles.usageNum}>1</span>
            <div>
              <strong>Válasszon módot</strong> — Státuszrögzítés vagy Kezelési terv
            </div>
          </div>
          <div className={styles.usageStep}>
            <span className={styles.usageNum}>2</span>
            <div>
              <strong>Válasszon állapotot</strong> — a palettáról kattintson egy chipre
            </div>
          </div>
          <div className={styles.usageStep}>
            <span className={styles.usageNum}>3</span>
            <div>
              <strong>Kattintson egy felszínre</strong> — a fog felülnézeti (ötszög) ábráján
            </div>
          </div>
          <div className={styles.usageStep}>
            <span className={styles.usageNum}>4</span>
            <div>
              <strong>Tekintse meg a részleteket</strong> — a jobb oldali panelen
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
