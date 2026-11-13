---
name: stil-nou
description: Redesign-ul B-Fit Studio pe stilul nou (sticla din Orar): rețeta vizuală și ordinea ecranelor. Folosește când treci un ecran (Confirmări, Fișă, Încasări, planuri, chat, notificări, Setări, ferestre, ecranul clientului) pe stilul nou sau la orice ajustare vizuală. Împreună cu skill-ul cod-curat.
---

# Stilul nou (după Orar)

Regulile de cod (modifici în loc să adaugi, ștergi ce rămâne fără efect, clase comune, fără `!important`, fără BOM) sunt în skill-ul `cod-curat` și se aplică întotdeauna. Aici e doar rețeta vizuală.

## Rețeta stilului nou (după Orar)

- **Variabile comune** (definite pe `body`, temă deschisă și întunecată): `--m-text`, `--m-muted`, `--m-card`, `--m-btn`, `--m-border`, `--m-divider`, `--m-accent-text`, `--m-shadow`, `--m-float`, `--m-float-sm`. Le folosești pe acestea, nu culori noi.
- **Card de sticlă:** `background: var(--m-card); border: 1px solid var(--m-border); box-shadow: var(--m-shadow); border-radius: 24px;` (22px la carduri mici, 20px la pastile). Are `position: relative` și copiii lui primesc și ei `position: relative`.
- **Lumina din stânga-sus:** un `::before` absolut cu `linear-gradient(160deg, rgba(255,255,255,.16) 0%, transparent 32%)` pe tema întunecată și `rgba(255,255,255,.7) 0%, rgba(255,255,255,.12) 30%, transparent 48%` pe tema deschisă.
- **Câmpuri și butoane mici:** `background: var(--m-btn); border: 1px solid var(--m-border); box-shadow: var(--m-float-sm); border-radius: 12px`.
- **Antet de tabel / etichete:** `color: var(--m-muted)`, 0.7rem, fără bandă colorată. Separatoarele folosesc `var(--m-divider)`, iar ultimul rând nu are linie.
- **Cifre mari** (ca `.orar-cifra`): 1.6rem, 800, `letter-spacing: -0.5px`, cu eticheta dedesubt.
- **Text pe ecran:** pe containerul tab-ului pui `--text: var(--m-text); --text-muted: var(--m-muted); padding: 10px 8px 0;`.
- **Fundalul cu pete de lumină:** adaugi id-ul tab-ului în lista din `comutaTab` (`app.js`, clasa `stil-nou` pe `body`). Regulile fundalului folosesc deja `body:is(.pe-orar, .stil-nou)`, deci nu le copiezi.
- Culorile de sens rămân cele din `CLAUDE.md` (verde, roșu, portocaliu Hold).

## Ordinea redesign-ului (o versiune per ecran)

Gata: Orar, Confirmări. Urmează: Încasări → Fișă client → Plan antrenament / alimentar → Chat → Notificări → Setări și submeniuri → ferestre (`customModal`, fișa pe scurt, căutare) → ecranul clientului (`#clientaScreen`).

## Verificare înainte de „gata”

- `git diff` doar pe ecranul cerut. Dacă diff-ul adaugă reguli la sfârșitul `style.css`, regula 1 a fost încălcată.
- Compari stilurile calculate înainte și după pe celelalte tab-uri: o fotografie din pagină cu `getComputedStyle` pe toate elementele din fiecare `.tab-content`, pe ambele teme. Celelalte ecrane trebuie să rămână identice.
- 360 / 390 / 448 / desktop, temă deschisă și întunecată: fără scroll orizontal și fără butoane cu textul rupt pe două rânduri.
