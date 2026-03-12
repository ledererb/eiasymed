// EasyMed Design Showcase — Dynamic Content
(function () {

    // ── Toast ──
    function showToast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 1800);
    }

    function copyText(text) {
        navigator.clipboard.writeText(text).then(() => showToast('Copied: ' + text));
    }

    // ── Swatch Renderer ──
    function renderSwatches(containerId, colors) {
        const el = document.getElementById(containerId);
        colors.forEach(([name, hex]) => {
            const s = document.createElement('div');
            s.className = 'swatch';
            s.onclick = () => copyText(hex);
            // If color is very light, add a subtle border
            const isLight = isLightColor(hex);
            s.innerHTML = `
        <div class="swatch-color" style="background:${hex};${isLight ? 'border-bottom:1px solid #eee;' : ''}"></div>
        <div class="swatch-info">
          <span class="swatch-name">${name}</span>
          <span class="swatch-hex">${hex}</span>
        </div>`;
            el.appendChild(s);
        });
    }

    function isLightColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 220;
    }

    // ── Colors ──
    renderSwatches('neutral-swatches', [
        ['Neutral 50', '#F5F5F5'],
        ['Neutral 100', '#ECECEC'],
        ['Neutral 200', '#D9D9D9'],
        ['Neutral 400', '#CFCECE'],
        ['Neutral 500', '#BFC8CE'],
        ['Neutral 600', '#5F7D95'],
    ]);
    renderSwatches('primary-swatches', [
        ['White', '#FFFFFF'],
        ['Primary 50', '#DFFFFD'],
        ['Primary 100', '#90FFF8'],
        ['Primary 200', '#1CEEE0'],
        ['Primary 300', '#62A9CD'],
        ['Primary 500', '#186D98'],
        ['Primary 900', '#082432'],
    ]);
    renderSwatches('brand-swatches', [
        ['Brand 50', '#FFF1F9'],
        ['Brand 400', '#EC51A8'],
        ['Brand 500', '#C43284'],
        ['Brand 600', '#A2005B'],
    ]);
    renderSwatches('status-swatches', [
        ['Új érdeklődő', '#60C4FF'],
        ['Ajánlata van', '#FF9D00'],
        ['Konzultáció', '#FFCE48'],
        ['In progress', '#32B000'],
        ['Befejezte', '#1B6100'],
        ['Várakozik', '#E695FF'],
        ['Elutasítva', '#9C9C9C'],
        ['Alert/Pending', '#FF0000'],
        ['Inaktív', '#000000'],
    ]);
    renderSwatches('calendar-swatches', [
        ['Green 50', '#D7EBCF'],
        ['Blue 50', '#B7E4FF'],
        ['Yellow 50', '#FFE8A7'],
        ['Red 50', '#FFD5E0'],
        ['Orange 50', '#FFD592'],
        ['Lilac 50', '#F5D2FF'],
    ]);

    // ── Gradients ──
    const gradients = [
        ['Light Blue', 'linear-gradient(114deg, #FFFFFF 1%, #DFFFFD 36%, #B7FAF6 100%)'],
        ['Dark Blue', 'linear-gradient(114deg, #186D98 1%, #62A9CD 36%, #1CEEE0 100%)'],
        ['Light Pink', 'linear-gradient(114deg, #FFF7FB 9%, #F5C5E0 60%, #FCB4DC 100%)'],
        ['Dark Pink', 'linear-gradient(113deg, #A2005B 1%, #FF74C1 67%, #FFCEE9 100%)'],
        ['Light Mixed', 'linear-gradient(128deg, #C0FBF9 20%, #FFF1F9 61%, #FFE5F3 91%)'],
        ['Dark Mixed', 'linear-gradient(132deg, #90FFF8 1%, #BEA8D0 50%, #ED51A8 100%)'],
        ['Base 1', 'linear-gradient(95deg, #FFFFFF 1%, #DFFFFD 37%, #F5BEDD 67%)'],
        ['Base 2', 'linear-gradient(98deg, #FFFFFF 1%, #FFF1F9 50%, #90FFF8 100%)'],
        ['Base 3 Very Light', 'linear-gradient(95deg, #FFFFFF 1%, #FFFFFF 37%, #DBFFFC 52%, #F5BEDD 78%)'],
    ];
    const gGrid = document.getElementById('gradient-grid');
    gradients.forEach(([name, css]) => {
        const card = document.createElement('div');
        card.className = 'gradient-card';
        card.style.background = css;
        card.onclick = () => copyText(css);
        card.innerHTML = `<span class="gradient-label">${name}</span>`;
        gGrid.appendChild(card);
    });

    // ── Typography ──
    const typeTokens = [
        ['Display/Bold/24', 24, 700, 'EasyMed Fogászati Rendszer'],
        ['Display (SB)/20', 20, 600, 'Kezelési terv áttekintés'],
        ['Heading/20 Medium', 20, 500, 'Páciens adatlapja'],
        ['Display (SB)/16', 16, 600, 'Következő időpont részletei'],
        ['Heading/16 Medium', 16, 500, 'Röntgen felvételek'],
        ['Display (SB)/14', 14, 600, 'Anamnézis összefoglaló'],
        ['Body/14 Medium', 14, 500, 'A kezelés során alkalmazott anyagok listája'],
        ['Body/14 Regular', 14, 400, 'A páciens legutóbbi vizsgálata 2026. február 28-án történt.'],
        ['14 Light Italic', 14, 300, 'Megjegyzés: allergiás jodocainre'],
        ['Display (SB)/12', 12, 600, 'STÁTUSZ'],
        ['Body/12 Medium', 12, 500, 'Utolsó módosítás: ma 14:30'],
        ['Body/12 Regular', 12, 400, 'Kérjük ellenőrizze az adatokat mentés előtt.'],
        ['10 Display', 10, 600, 'FOGSZÁM'],
        ['Small/10 Medium', 10, 500, 'Módosítva: 2026.03.05'],
        ['Small/10 Regular', 10, 400, 'Automatikusan generált azonosító'],
        ['8 Display', 8, 600, 'VERZIÓ'],
        ['8 Medium', 8, 500, 'v2.1.0'],
        ['8 Regular', 8, 400, 'Utoljára szinkronizálva: 15:30'],
    ];
    const tList = document.getElementById('type-list');
    const weightNames = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };
    typeTokens.forEach(([token, size, weight, sample]) => {
        const row = document.createElement('div');
        row.className = 'type-row';
        row.innerHTML = `
      <div class="type-meta">
        <span class="type-token">${token}</span>
        <div class="type-details">${size}px · ${weightNames[weight] || weight} (${weight})</div>
      </div>
      <div class="type-sample" style="font-size:${size}px;font-weight:${weight}">${sample}</div>`;
        tList.appendChild(row);
    });

    // ── Shadows ──
    const shadows = [
        ['Shadow 50', '0 1px 2px rgba(0,0,0,0.05)'],
        ['Shadow 100', '0 2px 4px rgba(0,0,0,0.08)'],
        ['Shadow 200', '0 4px 8px rgba(0,0,0,0.10)'],
        ['Shadow 300', '0 8px 16px rgba(0,0,0,0.12)'],
        ['Shadow 400', '0 12px 24px rgba(0,0,0,0.16)'],
    ];
    const sGrid = document.getElementById('shadow-grid');
    shadows.forEach(([label, val]) => {
        const card = document.createElement('div');
        card.className = 'shadow-card';
        card.style.boxShadow = val;
        card.onclick = () => copyText(val);
        card.innerHTML = `<div style="width:48px;height:48px;border-radius:10px;background:var(--grad-light-blue);margin:0 auto"></div><div class="shadow-label">${label}</div>`;
        sGrid.appendChild(card);
    });

    // ── Strokes ──
    const strokes = [
        ['Primary 600', '#186D98'],
        ['Brand 500', '#C43284'],
        ['Brand 400', '#EC51A8'],
        ['Brand 50', '#FFF1F9'],
        ['Neutral 200', '#D9D9D9'],
        ['Neutral 100', '#ECECEC'],
    ];
    const stGrid = document.getElementById('stroke-grid');
    strokes.forEach(([label, color]) => {
        const card = document.createElement('div');
        card.className = 'stroke-card';
        card.style.borderColor = color;
        card.onclick = () => copyText(color);
        card.innerHTML = `<div class="stroke-line" style="background:${color}"></div><div class="stroke-label">Stroke ${label}</div><div style="font-size:10px;color:var(--neutral-500);margin-top:4px">${color}</div>`;
        stGrid.appendChild(card);
    });

    // ── Status Badges ──
    const statusBadges = [
        ['Új érdeklődő', '#60C4FF', '#E3F2FD'],
        ['Ajánlata van', '#FF9D00', '#FFF8E1'],
        ['Konzultáció', '#FFCE48', '#FFFDE7'],
        ['Folyamatban', '#32B000', '#E8F5E9'],
        ['Befejezte', '#1B6100', '#E8F5E9'],
        ['Várakozik', '#E695FF', '#F3E5F5'],
        ['Elutasítva', '#9C9C9C', '#F5F5F5'],
        ['Alert', '#FF0000', '#FFEBEE'],
        ['Inaktív', '#000000', '#EEEEEE'],
    ];
    const sbContainer = document.getElementById('status-badges');
    statusBadges.forEach(([label, fg, bg]) => {
        const b = document.createElement('span');
        b.className = 'badge';
        b.style.background = bg;
        b.style.color = fg;
        b.textContent = '● ' + label;
        sbContainer.appendChild(b);
    });

    const calBadges = [
        ['Fogkő', '#D7EBCF', '#2E7D32'],
        ['Konzultáció', '#B7E4FF', '#186D98'],
        ['Tömés', '#FFE8A7', '#E65100'],
        ['Sürgős', '#FFD5E0', '#C62828'],
        ['Kontroll', '#FFD592', '#E65100'],
        ['Egyéb', '#F5D2FF', '#7B1FA2'],
    ];
    const cbContainer = document.getElementById('cal-badges');
    calBadges.forEach(([label, bg, fg]) => {
        const b = document.createElement('span');
        b.className = 'badge';
        b.style.background = bg;
        b.style.color = fg;
        b.textContent = label;
        cbContainer.appendChild(b);
    });

    // ── Nav active state ──
    const navLinks = document.querySelectorAll('.showcase-nav a');
    const sections = document.querySelectorAll('.section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 80) current = s.id;
        });
        navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
    });

})();
