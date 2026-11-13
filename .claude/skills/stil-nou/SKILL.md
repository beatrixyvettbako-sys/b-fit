---
name: stil-nou
description: Redesign-ul B-Fit Studio pe stilul nou (sticla din Orar): rețeta vizuală și ordinea ecranelor. Folosește când treci un ecran (Confirmări, Fișă, Încasări, planuri, chat, notificări, Setări, ferestre, ecranul clientului) pe stilul nou sau la orice ajustare vizuală. Împreună cu skill-ul cod-curat.
---

# Stilul nou (după Orar)

Regulile de cod (modifici în loc să adaugi, ștergi ce rămâne fără efect, clase comune, fără `!important`, fără BOM) sunt în skill-ul `cod-curat` și se aplică întotdeauna. Aici e doar rețeta vizuală.

## Rețeta stilului nou (după Orar)

- **Antetul (obligatoriu, la fel pe fiecare ecran redesenat, ca pe Orar și Confirmări):**
  - sus e transparent;
  - în pagină, sub antet, stă titlul mare (`.orar-titlu-mare` > `.orar-titlu-text` > `h1`, opțional cu un `span` mic deasupra);
  - după primii 60px de derulare, titlul mare se estompează, iar titlul mic apare **la mijlocul** antetului (`#pageTitle` pe tab-uri, `.clienta-title` pe ecranele `.stil-nou-ecran`), iar antetul devine sticlă (alb 0,55 / întunecat 0,6, blur 10px);
  - butoanele din antet sunt bule rotunde de sticlă de 40px. Dacă există buton doar pe o parte, pune pe cealaltă un loc gol de 40px (`.meniu-antet-loc`), ca titlul să rămână centrat;
  - fără avatar, nume sau alte elemente în antet în locul titlului.
  - **Excepție aleasă de utilizatoare: Meniul.** Nu are titlu mare. La derulare, în antet apar avatarul mic și numele (`.meniu-antet-profil`), la stânga, nu un titlu centrat.

- **Variabile comune** (definite pe `body`, temă deschisă și întunecată): `--m-text`, `--m-muted`, `--m-card`, `--m-btn`, `--m-border`, `--m-divider`, `--m-accent-text`, `--m-shadow`, `--m-float`, `--m-float-sm`. Le folosești pe acestea, nu culori noi.
- **Card de sticlă:** `background: var(--m-card); border: 1px solid var(--m-border); box-shadow: var(--m-shadow); border-radius: 24px;` (22px la carduri mici, 20px la pastile). Are `position: relative` și copiii lui primesc și ei `position: relative`.
- **Lumina din stânga-sus:** un `::before` absolut cu `linear-gradient(160deg, rgba(255,255,255,.16) 0%, transparent 32%)` pe tema întunecată și `rgba(255,255,255,.7) 0%, rgba(255,255,255,.12) 30%, transparent 48%` pe tema deschisă.
- **Câmpuri și butoane mici:** `background: var(--m-btn); border: 1px solid var(--m-border); box-shadow: var(--m-float-sm); border-radius: 12px`.
- **Antet de tabel / etichete:** `color: var(--m-muted)`, 0.7rem, fără bandă colorată. Separatoarele folosesc `var(--m-divider)`, iar ultimul rând nu are linie.
- **Cifre mari** (ca `.orar-cifra`): 1.6rem, 800, `letter-spacing: -0.5px`, cu eticheta dedesubt.
- **Text pe ecran:** pe containerul tab-ului pui `--text: var(--m-text); --text-muted: var(--m-muted); padding: 10px 8px 0;`.
- **Clasa `stil-nou` pe `body`** aduce fundalul cu pete de lumină, antetul transparent cu butoane-bulă și bara de jos de sticlă. Ca să treci un ecran pe stilul nou, adaugi id-ul tab-ului în cele două liste din `app.js`: cea din `comutaTab` și cea de la pornire, lângă `pe-orar`. `pe-orar` rămâne doar pentru ce ține strict de Orar (bara de zile, calibrarea).
- **Ecranele de deasupra aplicației** (`.clienta-app`: Notificări, conversații, poze) primesc clasa `stil-nou-ecran` pe ecran și `stil-nou-antet` pe `<header>`. Asta aduce fundalul, bulele de sticlă rotunde și antetul transparent, care devine sticlă cu titlul mic la derulare (listenerul de `scroll` din `app.js` pune `titlu-strans`). Titlul mare se pune în pagină cu `.orar-titlu-mare`.
- **Liste de sticlă (componente comune):** `.lista-titlu` pentru eticheta grupului („Azi”, „Antrenament”) și `.lista-sticla` pentru cardul cu rânduri despărțite de `--m-divider`. Le folosesc Notificările, Istoricul și Meniul. Rândurile de meniu (`.drawer-nav-card`) din `.lista-sticla` devin automat rânduri fără card propriu, cu iconița în bulă.
- **Titlul mare și cifrele de sus:** refolosești `.orar-titlu-mare` / `.orar-titlu-text` și `.orar-cifre` / `.orar-cifra` (variante de culoare `-verde`, `-rosu`, `-portocaliu`, `-accent`). Ca filtru, `.orar-cifra` e `<button>`, iar cea aleasă primește clasa `activ`.
- **Avatar:** `.slot-num` cu `avatarSlotHtml(c)`, iar apăsarea deschide `arataFisaScurta(id)`.
- Culorile de sens rămân cele din `CLAUDE.md` (verde, roșu, portocaliu Hold).

## Ordinea redesign-ului (o versiune per ecran)

Gata: Orar, Confirmări (titlu mare, cifre-filtru, rânduri cu avatar, fișa pe scurt cu ținta / mențiunea / Hold), Notificări (grupate pe zile, un card pe grup), Istoric prezențe, Meniul principal (card de profil, grupuri Antrenament / Nutriție / Aplicație; ieșirea e în Profil), Încasări (luna ‹ ›, cifre, „De reînnoit”, listă pe zile, încasarea nouă în fereastra de jos cu pastile care completează aceleași `<select>`-uri). Funcții comune pentru cifre: `htmlCifra`, `cifraFataDeLunaTrecuta`, `scurteazaEticheteCifre`. Pentru submeniurile din sertar (Setări etc.) se pun rândurile într-un `.lista-sticla`, iar antetul primește `stil-nou-antet`; `#appDrawer` are deja `stil-nou-ecran`. Urmează: Încasări → Fișă client → Plan antrenament / alimentar → Chat → Notificări → Setări și submeniuri → ferestre (`customModal`, fișa pe scurt, căutare) → ecranul clientului (`#clientaScreen`).

## Verificare înainte de „gata”

- `git diff` doar pe ecranul cerut. Dacă diff-ul adaugă reguli la sfârșitul `style.css`, regula 1 a fost încălcată.
- Compari stilurile calculate înainte și după pe celelalte tab-uri: o fotografie din pagină cu `getComputedStyle` pe toate elementele din fiecare `.tab-content`, pe ambele teme. Celelalte ecrane trebuie să rămână identice.
- 360 / 390 / 448 / desktop, temă deschisă și întunecată: fără scroll orizontal și fără butoane cu textul rupt pe două rânduri.
