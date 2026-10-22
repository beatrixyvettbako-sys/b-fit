# B-Fit Studio

Aplicație web de management pentru studioul de fitness B-Fit Studio: orar săptămânal, programări, fișe cliente, încasări, planuri de antrenament.
Comunică cu utilizatoarea în română, concis și tehnic, fără introduceri sau concluzii inutile.

## Arhitectură

- **Frontend:** SPA / PWA vanilla (fără framework, fără build). Folosită în principal ca aplicație instalată pe telefon; trebuie să meargă identic în browser mobil și desktop.
  - `index.html`: markup, `style.css`: stiluri, `app.js`: toată logica (~4.600 linii), `sw.js`: service worker, `manifest.json`, `icon.svg`.
- **Backend:** Supabase (`app.js`, sus: `SUPABASE_URL`, `SUPABASE_KEY` publishable).
  - Date: tabelele `cliente`, `orar`, `programari`, `incasari`, `prezente`, `planuri_antrenament`, prin `executaActiuneSupabase()` apelată din `callBackend()`.
  - Autentificare: Supabase Auth (email/parolă, magic link, OAuth). Avatare: Storage, bucket `avatars`.
  - Detalii despre tabele și reguli → skill-ul `supabase-date`.
- Google Sheets / Apps Script (`Code.gs`) a fost backend-ul vechi; a fost scos complet din cod. Nu-l reintroduce.
- **Cache local:** `DB` (în memorie) + `localStorage["BFIT_DB_LOCAL"]` pentru afișare instant; preferințe în `beatrix_lang` și `beatrix_theme`.
- **Hosting:** GitHub Pages din branch-ul `main` al `beatrixyvettbako-sys/b-fit`, subdomeniu `app.beatrixyvett.com` (fișierul `CNAME` trebuie să rămână în repo; DNS: CNAME `app` în Namecheap). Domeniul principal `beatrixyvett.com` e rezervat pentru site-ul de prezentare. Link-urile de share folosesc constanta `URL_APLICATIE` din `app.js`. Branch-ul `gh-pages` e vechi și nefolosit.

## Flux de lucru

1. Modific fișierele local, chirurgical (diff-uri mici, nu rescrieri de fișiere întregi).
2. Utilizatoarea testează local în browser (desktop + Device Toolbar pe mobil). Panoul din dreapta: `preview_start` cu configurația `b-fit` (`.claude/launch.json`, `http://127.0.0.1:5500`).
   - La orice modificare vizuală verific pe mai multe lățimi de telefon, nu pe una singură: **360** (Android mic), **390** (iPhone), **448** (Android mare, ex. Pixel 8 Pro) și desktop. Fără text rupt pe două rânduri în butoane, fără scroll orizontal, fără elemente tăiate.
3. Commit + push **doar** când utilizatoarea cere explicit (skill-ul `/publica`). Niciodată din proprie inițiativă.

## Principii de inginerie

- Gândește înainte de a coda: înțelege problema și codul existent înainte să modifici ceva.
- Cea mai simplă soluție suficient de bună pentru producție. YAGNI, KISS, DRY. Fără abstractizări premature, layere în plus sau programare defensivă excesivă.
- Modificări minimale, strict pe cerință. Nu refactoriza și nu „curăța” cod fără legătură cu sarcina.
- Reutilizează utilitarele existente în loc să scrii altele noi, de exemplu `normalizeazaOraUi`, `gasesteClientaValida`, `actualizeazaStilSelect`, `t()`, `showToast`, `customConfirm`.
- Repară cauza, nu simptomul.
- Fără dependențe sau librării noi când JS nativ și CSS pur sunt suficiente.
- Riscurile reale de urmărit: sincronizarea cu Supabase, cache-ul PWA / service worker, persistența offline (`BFIT_DB_LOCAL`), diferențele standalone vs browser.
- Oprește-te când soluția e corectă și stabilă; fără cosmetizări fără beneficiu.

## Fără halucinații

- Citește codul înainte să afirmi ceva despre el. Nu inventa funcții, ID-uri, clase CSS, tabele sau coloane; verifică-le cu căutare în fișiere.
- Separă clar ce ai verificat în cod de ce deduci.
- Structura bazei Supabase (coloane, RLS, triggere) nu e în repo: ce se vede e doar ce folosește `app.js`. Dacă o sarcină depinde de baza de date, spune ce nu poți verifica.
- La ambiguitate reală, pune o întrebare scurtă înainte de a scrie cod.

## Zero regresii

- La orice ajustare vizuală e interzisă eliminarea sau redenumirea ID-urilor HTML, a claselor de stare folosite în JS (`.is-expanded`, `.hour-block-current-highlight`, `state-ora-17/18` etc.), a listenerilor, a atributelor `onclick`, a `list="listaClienteVizibile"` și a funcțiilor de randare.
- `index.html` și `app.js` sunt legate prin ID-uri: înainte să schimbi sau să ștergi un ID, caută-l în ambele fișiere.
- Modificările din `style.css` nu trebuie să strice calculele din `app.js` bazate pe înălțimi (`header`, `#dayButtonsContainer`, `#bottomNav`, vezi skill-ul `orar-layout`).
- După o editare, verifică cu `git diff` că nu s-a pierdut nimic în afara cerinței.

## Identitate vizuală

- Primary `#5c4d7d` · Accent mov `#8b5cf6` · Verde (confirmări, sume) `#15803d` · Roșu (anulări, absențe) `#b91c1c` · Portocaliu (Hold) `#f5b041`.
- Header: titlul paginii + trigger-ul sertarului de calendar pe tab-ul Orar (`comutaExpandareBaraCalendar`). Poate fi rearanjat la cerere, cu listenerii și ID-urile intacte.
- Cardul „Finalul Programului” (`#endScheduleCard`): ilustrația cu ganteră și mesajele de final de zi.

## Skill-uri

- `publica`: versionare cache PWA + commit + push. Doar la cerere explicită.
- `orar-layout`: tab-ul Orar: sloturi, scroll automat, calibrare pe ecran.
- `traduceri`: suportul RO/EN.
- `supabase-date`: tabele, coloane și reguli de business pentru date.
