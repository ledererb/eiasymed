# Zsigmondy-kereszt (Dental Chart) — implementációs brief Claude Code-hoz

## Kontextus

Egy fogászati szoftverbe kell interaktív Zsigmondy-keresztet (odontogramot) építeni. A komponens két fő módban működik: **státuszrögzítés** (aktuális fogstátusz dokumentálása) és **kezelési terv** (tervezett beavatkozások vizualizálása). A fogfelszíneket (M/O/D/B/L) egyedileg kell kezelni.

---

## Tech stack

| | |
|---|---|
| Framework | **Next.js 14.2.35** (App Router) |
| Language | **TypeScript** |
| Rendering | **SVG inline React komponensek** (nincs canvas/WebGL) |
| State management | React `useState` / `useReducer` (később Zustand ha kell) |
| Adatbázis | **Supabase** (PostgreSQL + Row Level Security) |

---

## Referencia nyílt forráskódú projektek

Mielőtt saját implementációt írsz, vizsgáld meg ezeket a projekteket SVG path-ok, adatmodellek és interakciós minták átvételéhez:

### 1. `react-odontogram` (npm) — ELSŐDLEGES REFERENCIA

- **Repo:** https://github.com/biomathcode/react-odontogram
- **NPM:** `react-odontogram` (v0.5.5, 2026 feb.)
- **Licensz:** MIT
- **Demo:** https://biomathcode.github.io/react-odontogram
- **Amit ad:**
  - Teljes anatómiai SVG path-ok minden foghoz (outlinePath, shadowPath, lineHighlightPath)
  - FDI / Universal / Palmer notáció támogatás
  - `teethConditions` API — fogak színezése állapot alapján
  - React hooks alapú, TypeScript
  - Light/dark mode
  - Tooth selection callback (`onChange → ToothDetail[]`)
- **Limitációk (amit nekünk kell bővíteni):**
  - Csak fog-szintű selection van, NINCS surface-level (M/O/D/B/L) interakció
  - Nincs kezelési terv réteg
  - Nincs lateralis (oldalnézeti) megjelenítés
  - Nincs státusz vs. terv szétválasztás

### 2. `odontogram` (npm, Web Component) — SURFACE-LEVEL REFERENCIA

- **NPM:** `odontogram` (v0.2.0, ugyanaz a szerző)
- **Amit ad:**
  - Lit Web Component (`<og-odontogram>`)
  - **5 felszín per fog: vestibular, distal, palatine, mesial, occlusal**
  - JSON state export: `{ "16": { "vestibular": true, "mesial": true, "occlusal": true } }`
  - Adult / baby / geriatric módok
  - Keyboard accessible (Tab + Enter/Space)
- **Használat:** Az 5-felszínes adatmodellt és interakciós mintát innen vedd át.

### 3. `jacobwalkr/dental-chart` — SVG FÁJLOK REFERENCIA

- **Repo:** https://github.com/jacobwalkr/dental-chart
- **Amit ad:**
  - Önálló SVG fájlok fogtípusonként: `incisor.svg`, `premolar.svg`, `molar.svg`
  - Snap.svg alapú interakció
  - Felszín-kattintás kezelés
- **Használat:** SVG path inspiráció, ha a `react-odontogram` path-jai nem elég részletesek.

### 4. OpenDental — FUNKCIONÁLIS REFERENCIA (nem kód)

- **Docs:** https://opendental.com/manual/graphicaltoothchart.html
- **Paint types** (ezt kell implementálni vizuálisan):
  - `FillingDark` / `FillingLight` — tömés (fém vs. kompozit), felszínhez kötött
  - `Crown` — korona (egész fog)
  - `Implant` — implantátum csavar
  - `Extraction` — X jelölés (terv), fog eltűnése (kész)
  - `RCT` (root canal) — gyökérkezelés jelölés a gyökereken
  - `Veneer` — héj (anterior fogak elülső felszíne)
  - `Pontic` — híd köztes tagja
  - `Denture` — fogsor
  - `RetainedRoot` — bentmaradt gyökér
  - `SpaceMaintainer` — helytartó (vonal hiányzó fogak között)
- **Státusz színek OpenDental-ban:** kezelés állapot szerinti szín (tervezett = világos szín, kész = sötét szín, más orvos által = eltérő szín)
- **Felszínek:** B (buccalis), F (facialis), L (lingualis), M (mesialis), D (distalis), O (occlusalis), I (incisalis), V (Class V / gingivalis margin)

---

## Adatmodell (TypeScript típusok)

```typescript
// Fogfelszínek — FDI standard
type ToothSurface = 'M' | 'O' | 'D' | 'B' | 'L';
// Megjegyzés: 'O' = occlusalis (őrlőknél) VAGY incisalis (frontfogaknál)
// 'B' = buccalis VAGY facialis/labialis (anterior fogaknál)
// 'L' = lingualis VAGY palatinalis (felső fogaknál)

// Fog aktuális állapota
type ToothStatus = 'present' | 'missing' | 'implant' | 'deciduous' | 'retained_root' | 'unerupted';

// Felszín állapota
type SurfaceCondition =
  | 'intact'           // ép
  | 'caries'           // szuvas
  | 'filling_composite' // kompozit tömés
  | 'filling_amalgam'  // amalgám tömés
  | 'filling_temp'     // ideiglenes tömés
  | 'filling_defect'   // hibás tömés
  | 'inlay'            // inlay/onlay
  | 'fracture'         // törés
  | 'abrasion'         // kopás
  | 'erosion';         // erózió

// Fog-szintű állapotok (nem felszínhez kötött)
type ToothCondition =
  | 'crown_metal'      // fém korona
  | 'crown_ceramic'    // kerámia korona
  | 'crown_pfm'        // fémlemezes kerámia
  | 'root_canal'       // gyökérkezelt
  | 'post_core'        // csapos felépítmény
  | 'bridge_abutment'  // híd pillérfog
  | 'bridge_pontic'    // híd köztes tag
  | 'veneer'           // héj
  | 'mobility_1' | 'mobility_2' | 'mobility_3'  // mozgathatóság
  | 'periapical_lesion' // periapicalis elváltozás
  ;

// ---- Kezelési terv típusok ----

type TreatmentType =
  | 'composite_filling' // kompozit tömés
  | 'amalgam_filling'   // amalgám tömés
  | 'inlay_onlay'       // inlay/onlay
  | 'crown_ceramic'     // kerámia korona
  | 'crown_metal'       // fém korona
  | 'crown_pfm'         // PFM korona
  | 'root_canal'        // gyökérkezelés
  | 'extraction'        // extrakció
  | 'implant'           // implantátum
  | 'bridge'            // híd
  | 'veneer'            // héj
  | 'sealant'           // barázdazárás
  | 'scaling'           // depurálás (fog-szintű)
  ;

type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

// ---- Fő adatstruktúrák ----

interface SurfaceData {
  condition: SurfaceCondition;
  treatment?: {
    type: TreatmentType;
    status: TreatmentStatus;
    note?: string;
  };
}

interface ToothData {
  fdi: number;                         // FDI kód (11-48)
  status: ToothStatus;
  conditions: ToothCondition[];        // fog-szintű állapotok
  surfaces: Record<ToothSurface, SurfaceData>;
  treatments: {                        // fog-szintű kezelések
    type: TreatmentType;
    status: TreatmentStatus;
    note?: string;
    linkedTeeth?: number[];            // hídnál: kapcsolt FDI kódok
  }[];
  notes?: string;
}

// Teljes dentális státusz
interface DentalChart {
  patientId: string;
  createdAt: string;
  updatedAt: string;
  teeth: Record<number, ToothData>;    // key = FDI kód
}
```

---

## Komponens architektúra

```
src/
  components/
    dental-chart/
      DentalChart.tsx              ← fő wrapper komponens
      DentalChartToolbar.tsx       ← mód- és eszközválasztó
      DentalChartPalette.tsx       ← státusz/kezelés paletta chipek
      
      quadrant/
        QuadrantView.tsx           ← egy negyedet renderel (8 fog)
      
      tooth/
        ToothUnit.tsx              ← egy fog teljes megjelenítése
        ToothLateral.tsx           ← oldalnézet SVG (korona + gyökerek)
        ToothOcclusal.tsx          ← felülnézet SVG (5 felszín)
        toothPaths.ts              ← SVG path definíciók fogtípusonként
        toothConstants.ts          ← színek, méretek, fogtípus mapping
      
      detail/
        ToothDetailPanel.tsx       ← kiválasztott fog részletei
        SurfaceStatusList.tsx      ← felszínek állapot listája
        TreatmentList.tsx          ← kezelési terv elemei
      
      overlays/
        CrownOverlay.tsx           ← korona vizuális overlay
        BridgeConnector.tsx        ← híd összekötő vonal fogak között
        RootCanalMarker.tsx        ← gyökérkezelés jelölés
        ExtractionMarker.tsx       ← X jelölés
        ImplantGraphic.tsx         ← implantátum csavar SVG
        MissingToothMarker.tsx     ← hiányzó fog jelölés
      
      hooks/
        useDentalChart.ts          ← chart state management hook
        useToothInteraction.ts     ← click/hover kezelés
        useChartHistory.ts         ← undo/redo
      
      types/
        index.ts                   ← TypeScript típusok (fent definiálva)
      
      utils/
        toothHelpers.ts            ← FDI kód → fogtípus, quadráns kalkulációk
        colorMappings.ts           ← állapot → szín mapping
        bridgeLogic.ts             ← híd-validáció (szomszédos fogak)
```

---

## SVG megjelenítés specifikáció

### Elrendezés

A Zsigmondy-kereszt a hagyományos fogászati elrendezést követi:

```
┌─────────────────────┬─────────────────────┐
│    18 17 16 15 14   │   24 25 26 27 28    │  ← felső sor: lateralis nézet
│     13 12 11        │       21 22 23      │     (korona + gyökerek, gyökerek FELFELÉ)
├─────────────────────┤─────────────────────┤
│    18 17 16 15 14   │   24 25 26 27 28    │  ← felső sor: occlusalis nézet
│     13 12 11        │       21 22 23      │     (felülnézet, felszín-kattintható)
├─────────────────────┼─────────────────────┤  ← Zsigmondy-kereszt középvonala
│     FDI számok      │     FDI számok      │
├─────────────────────┼─────────────────────┤
│    48 47 46 45 44   │   34 35 36 37 38    │  ← alsó sor: occlusalis nézet
│     43 42 41        │       31 32 33      │
├─────────────────────┤─────────────────────┤
│    48 47 46 45 44   │   34 35 36 37 38    │  ← alsó sor: lateralis nézet
│     43 42 41        │       31 32 33      │     (gyökerek LEFELÉ)
└─────────────────────┴─────────────────────┘
```

### Fogformák (SVG Path-ok)

Minden fog típusnak **két nézete** van:

**1. Lateralis (oldalnézet):**
- Korona rész (anatómiai fogforma) — `crown-fill` class
- Gyökér rész (1-3 gyökér típustól függően) — `root-fill` class  
- Felső fogak: gyökerek felfelé, korona alul
- Alsó fogak: gyökerek lefelé, korona felül

**Fogtípusok és gyökérszám:**
| Fogtípus | Fog # | Felső gyökerek | Alsó gyökerek |
|----------|-------|----------------|---------------|
| Central incisor | 1 | 1 | 1 |
| Lateral incisor | 2 | 1 | 1 |
| Canine | 3 | 1 | 1 |
| First premolar | 4 | 2 (bukk+pal) | 1 |
| Second premolar | 5 | 1 | 1 |
| First molar | 6 | 3 (2 bukk+1 pal) | 2 |
| Second molar | 7 | 3 | 2 |
| Third molar | 8 | 2-3 (változó) | 2 |

**2. Occlusalis (felülnézet):**
- Anatómiai fogkontúr (nem téglalap, hanem valódi fogforma)
- 5 felszín hitbox (M/O/D/B/L) — a felszínek kattinthatók
- Fissura-mintázat (molárisoknál és premolárisoknál)
- A felszín-felosztás a klasszikus ötszög-elrendezést követi de az ANATÓMIAI kontúron belül:
  - **O** (occlusalis/incisalis): középső terület
  - **B** (buccalis): felső/külső
  - **L** (lingualis/palatinalis): alsó/belső
  - **M** (mesialis): bal (a középvonal felé)
  - **D** (distalis): jobb (a középvonaltól el)

### SVG Path-ok forrása

**A `react-odontogram` csomag path-jait használd kiindulásként** (MIT licensz). Klónozd a repót:
```bash
git clone https://github.com/biomathcode/react-odontogram.git
```

Nézd meg a `src/` mappában a tooth definíciókat (`outlinePath`, `shadowPath`, `lineHighlightPath`). Ezek felülnézeti (occlusalis) kontúrok. Az oldalnézeti path-okat külön kell definiálni — ehhez a `jacobwalkr/dental-chart` SVG fájljait (`svg/incisor.svg`, `svg/molar.svg`, `svg/premolar.svg`) és/vagy saját path-ok procedurális generálását használd.

**Ha a `react-odontogram` path-jai nem elég részletesek**, generáld procedurálisan a path-okat fogtípusonként (ahogy az előző prototípusban csináltuk), de a `react-odontogram` kontúrjait referenciának használva.

---

## Vizuális kódolás

### Státusz színek

```typescript
const STATUS_COLORS: Record<SurfaceCondition, string> = {
  intact:            '#f0ead6',  // természetes fogszín (bézs/elefántcsont)
  caries:            '#ef4444',  // piros
  filling_composite: '#5ba3f5',  // kék (világos = nem fém)
  filling_amalgam:   '#4a5568',  // sötétszürke (fém)
  filling_temp:      '#fbbf24',  // sárga
  filling_defect:    '#f97316',  // narancssárga
  inlay:             '#8b5cf6',  // lila
  fracture:          '#dc2626',  // sötétpiros
  abrasion:          '#a3a3a3',  // szürke
  erosion:           '#fb923c',  // világos narancs
};
```

### Kezelési terv vizualizáció

A kezelési terv overlay-ként jelenik meg az aktuális státusz felett:

| Kezelés | Vizuális megjelenítés |
|---------|---------------------|
| Tömés (composite/amalgam) | Szaggatott kontúr a felszínen, félátlátszó kitöltéssel |
| Korona | Keret az egész fog körül (lateralis nézetben is) |
| Gyökérkezelés | Magenta szín a gyökereken (lateralis) |
| Extrakció | Piros X a fog fölött |
| Implantátum | Csavar SVG a gyökér helyén |
| Híd | Összekötő vonal a pillérek és pontic között |
| Héj (veneer) | Overlay a buccalis felszínen |
| Barázdazárás | Fissura kiemelés |

**Színkódolás kezelési állapot szerint:**
```typescript
const TREATMENT_STATUS_COLORS = {
  planned:     { stroke: '#22c55e', fill: 'rgba(34,197,94,0.2)' },   // zöld
  in_progress: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.2)' },  // sárga
  completed:   { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.2)' },   // kék
  cancelled:   { stroke: '#9ca3af', fill: 'rgba(156,163,175,0.2)' },  // szürke
};
```

---

## Interakció specifikáció

### Módok

A toolbar-ból 2 mód választható:
1. **Státuszrögzítés** — aktuális állapot dokumentálása
2. **Kezelési terv** — beavatkozások tervezése

### Státuszrögzítés mód

1. Felhasználó kiválaszt egy állapotot a palettáról (szuvas, tömött, stb.)
2. Kattint egy fog occlusalis nézetén egy felszínre (M/O/D/B/L)
3. A felszín felveszi a kiválasztott állapot színét
4. Fog-szintű állapotokhoz (hiányzó, implantátum) a lateralis nézetre vagy FDI számra kattintva modal/popover nyílik

### Kezelési terv mód

1. Felhasználó kiválaszt egy kezelés típust a palettáról
2. **Felszín-szintű kezelések** (tömés, inlay): kattintás az occlusalis felszínre
3. **Fog-szintű kezelések** (korona, extrakció, implantátum, gyökérkezelés): kattintás a lateralis nézetre vagy FDI számra
4. **Híd**: több fog kijelölése, a rendszer összekötő vonalat rajzol

### Kiválasztás (selection)

- Egy fog kattintására megnyílik a **részletpanel** alul (vagy sidebaron)
- A részletpanel mutatja:
  - Fog FDI kódja, típusa, quadráns
  - Nagy occlusalis nézet (kattintható felszínekkel)
  - Felszínenként: aktuális állapot + tervezett kezelés
  - Fog-szintű állapotok és kezelések listája
- Multi-select támogatás hídtervezéshez (Ctrl+kattintás)

### Undo/Redo

- `useChartHistory` hook `useReducer`-rel
- Minden állapotváltozás egy action, a history stack-ben eltárolva
- Ctrl+Z / Ctrl+Y billentyűkombinációk

---

## Supabase séma

```sql
-- Fogászati státusz tábla
CREATE TABLE dental_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  chart_data JSONB NOT NULL DEFAULT '{}',  -- DentalChart típus JSON-ként
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Kezelési terv tábla (normalizált, a chart_data JSON-on kívül is)
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  chart_id UUID REFERENCES dental_charts(id),
  tooth_fdi INTEGER NOT NULL CHECK (tooth_fdi BETWEEN 11 AND 48),
  surfaces TEXT[],  -- pl: {'M', 'O', 'D'} vagy NULL ha fog-szintű
  treatment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  linked_teeth INTEGER[],  -- hídnál
  note TEXT,
  planned_date DATE,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE dental_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
```

---

## Implementációs sorrend (fázisok)

### 1. fázis — Alapvető SVG rendering
- [ ] `toothPaths.ts` — SVG path definíciók mind a 8 fogtípushoz (lateralis + occlusalis)
- [ ] `ToothLateral.tsx` — oldalnézet renderelés
- [ ] `ToothOcclusal.tsx` — felülnézet renderelés 5 kattintható felszínnel
- [ ] `ToothUnit.tsx` — egy fog mindkét nézettel
- [ ] `QuadrantView.tsx` — 8 fog elrendezése
- [ ] `DentalChart.tsx` — teljes 4 quadráns + Zsigmondy-kereszt vonalak

### 2. fázis — Státuszrögzítés
- [ ] `useDentalChart.ts` — state management (32 fog × 5 felszín)
- [ ] `DentalChartPalette.tsx` — állapotválasztó chipek
- [ ] Felszín-kattintás → állapotváltozás
- [ ] Fog-szintű státuszok (missing, implant)
- [ ] `ToothDetailPanel.tsx` — részletpanel

### 3. fázis — Kezelési terv
- [ ] Kezelés paletta
- [ ] Felszín-szintű kezelés overlay-ek
- [ ] Fog-szintű kezelés overlay-ek (korona, extrakció marker, implant graphic)
- [ ] `BridgeConnector.tsx` — híd vizualizáció
- [ ] `RootCanalMarker.tsx` — gyökérkezelés a lateralis nézeten

### 4. fázis — Persistence + polish
- [ ] Supabase integráció (chart_data mentés/betöltés)
- [ ] Undo/redo
- [ ] Keyboard navigation (Tab a fogak között)
- [ ] Print nézet
- [ ] Responsive layout (tablet-barát)

---

## Tesztelés

Használj Storybook-ot az izolált komponens teszteléshez:
```bash
npx storybook@latest init
```

Minimum story-k:
- `DentalChart.stories.tsx` — üres chart, előre kitöltött chart, read-only mód
- `ToothUnit.stories.tsx` — különböző fogtípusok, különböző állapotok
- `ToothOcclusal.stories.tsx` — felszín-kattintás interakció

---

## Fontos megjegyzések

1. **NE használd a `react-odontogram` csomagot közvetlenül npm-ből** — fork-old és bővítsd, vagy csak a path-okat vedd át. A csomag nem támogatja a felszín-szintű interakciót ami a fő követelmény.

2. **Az `odontogram` (Lit Web Component)** felszín-modellt tekintsd mintának az adatstruktúrához, de NE Web Component-ként integráld — natív React komponenst írj.

3. **Az OpenDental paint type rendszerét** funkcionális referenciának használd — a vizuális elemek (milyen overlay-t rajzolunk) és a státusz/kezelés szétválasztás logikáját onnan vedd.

4. **SVG path-ok:** Prioritási sorrend a path-ok forrásához:
   1. `react-odontogram` repo → occlusalis nézeti kontúrok
   2. `jacobwalkr/dental-chart` → lateralis nézeti path-ok
   3. Procedurális generálás → ha a fentiek nem elég részletesek

5. **FDI notáció kizárólagos** — ne implementálj Universal/Palmer támogatást, csak FDI (11-48).

6. **Magyar nyelvű UI** — minden label, tooltip, státusznév magyarul.
