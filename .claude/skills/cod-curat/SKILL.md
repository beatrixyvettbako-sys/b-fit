---
name: cod-curat
description: Reguli de cod curat și optimizat pentru tot B-Fit Studio (app.js, style.css, index.html, sw.js): modifici ce există în loc să adaugi straturi, ștergi ce rămâne fără efect, fără duplicate, performanță pe telefon, fără regresii. Folosește la ORICE modificare de cod, oricât de mică.
---

# Cod curat și optimizat

Scopul: fiecare schimbare lasă codul cel puțin la fel de curat și de rapid cum era. Fără straturi de „reparații peste reparații”.

## Înainte de a scrie

1. **Cauți ce există deja.** Funcții: `Grep "function nume|nume ="`. Clase: `Grep "\.clasa\b"` în `style.css`, `index.html` și `app.js`. Utilitare de refolosit: `t()`, `tr()`, `showToast`, `customConfirm`, `normalizeazaOraUi`, `gasesteClientaValida`, `actualizeazaStilSelect`, `escAttr`, `traduceValoare`, `callBackend`.
2. **Repari cauza, nu simptomul.** Dacă o valoare e greșită, o corectezi unde se calculează. Nu adaugi a doua corecție mai jos.
3. **Citești doar zona necesară** (Grep + Read cu `offset`/`limit`), nu fișiere întregi.

## Când scrii

### General
- **Modifici în loc să adaugi.** Schimbi regula sau funcția existentă. Nu adaugi una nouă care o suprascrie sau o ocolește pe cea veche.
- **Ce rămâne fără efect se șterge în aceeași schimbare:** reguli CSS suprascrise, funcții nefolosite, variabile, clase, comentarii depășite. Înainte să ștergi ceva, verifici cu Grep că nu e folosit în alt fișier.
- **Fără duplicate.** Aceeași logică în două locuri înseamnă o funcție comună. Aceeași proprietate CSS în două reguli pentru același element înseamnă o singură regulă.
- **Comentarii scurte, în română,** care spun *de ce*, nu *ce*. Le actualizezi când schimbi codul de lângă ele.

### JS (`app.js`)
- Listenerii se pun **o singură dată** (la pornire sau prin delegare pe container), nu la fiecare randare.
- Randarea construiește HTML-ul o dată și face un singur `innerHTML`. Fără `querySelector` repetat în bucle.
- La derulare și atingere: listeneri `passive`, fără citiri de layout (`getBoundingClientRect`, `offsetHeight`) amestecate cu scrieri de stil. Calculele grele merg o dată pe cadru (`requestAnimationFrame`).
- Supabase: fără apeluri în bucle (le grupezi). `localStorage["BFIT_DB_LOCAL"]` se scrie o dată pe acțiune, nu la fiecare pas.
- Fără `console.log` rămas, fără cod comentat „pentru mai târziu”.

### CSS (`style.css`)
- Regula nouă stă **lângă regulile ecranului sau ale componentei**, nu la sfârșitul fișierului.
- O clasă folosită pe mai multe ecrane (de ex. `.slot-input`, `.slot-num`, `.day-btn`, `.btn-clear`, `.btn-trash-action`, `.pill-select`) nu-și schimbă aspectul global. Pui o singură regulă cu prefixul ecranului (`#tabX .clasa`).
- Fără `!important` nou și fără `style=""` nou. Dacă unul existent te blochează, îl modifici chiar pe el.
- Culori și umbre: variabilele existente (`--m-*`, `--primary`, `--accent-rgb` etc.), nu valori noi scrise de mână.
- Animezi doar `transform` și `opacity`. `backdrop-filter`, umbrele mari și `will-change` se folosesc cu măsură (pe telefon costă la fiecare cadru). Nu folosești `:has()` pe `html`/`body` pentru stări care se schimbă des.
- Pseudo-elementele nu intră în `:is()`.

### HTML (`index.html`)
- ID-urile, clasele de stare, `onclick`-urile și `list="listaClienteVizibile"` nu se redenumesc și nu se șterg (vezi `CLAUDE.md`, Zero regresii). Elementele noi urmează tiparul celor existente din același ecran.

### Fișiere
- Scrii în UTF-8 **fără BOM**. În PowerShell 5.1 nu folosești `Set-Content -Encoding utf8`, care adaugă BOM. Folosești Edit.
- Versiunea cache-ului PWA o urci doar la publicare (skill-ul `publica`).

## Înainte de „gata”

- `git diff`:
  - Atinge doar ce s-a cerut?
  - Au apărut reguli la sfârșitul `style.css` sau funcții noi care dublează altele existente? Atunci refaci.
  - La o curățare, diff-ul trebuie să aibă mai multe rânduri șterse decât adăugate.
- Regresii: compari stilurile calculate (`getComputedStyle`) înainte și după, pe ecranele pe care nu trebuia să le schimbi. Consola fără erori.
- Vizual: 360 / 390 / 448 / desktop, temă deschisă și întunecată (vezi `CLAUDE.md`).
- Ce n-ai putut verifica (telefon real, baza de date) spui clar.
