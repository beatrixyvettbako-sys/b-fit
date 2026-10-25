---
name: orar-layout
description: Reguli pentru tab-ul Orar din B-Fit Studio - structura orelor și sloturilor, scroll automat la ora curentă, calibrarea cardului de final pe ecran mobil. Folosește la orice modificare de layout, CSS sau logică pe Orar, la scroll automat sau la redimensionări de ecran.
---

# Tab-ul Orar: layout, sloturi, scroll

## Structură date și randare (`randeazaOrarInstant` în `app.js`)

- Ore standard: `06:00` ... `18:00` (13 ore). Se pot adăuga ore custom (`adaugaOraCustom`).
- **Numărul de locuri pe oră vine din Setări (`setariOrar.locuri`, 1-8, implicit 3)**; `slotIndex` 0 … N-1. Randarea pune exact un loc pe fiecare index (completează lipsurile, la dubluri păstrează locul ocupat); locurile de peste N rămân vizibile cât au clientă, prezență sau sunt deschise. Insert-urile în Supabase (`comutaBlocareOra`, `adaugaOraCustom`) creează N rânduri.
- **Zilele din bară** vin din `getZileActive()`: Luni–Vineri, plus `Sambata`/`Duminica` când `setariOrar.weekend` e activ (bara primește clasa `sapte-zile`, nume scurte). Ziua implicită: `getZiImplicitaAzi()`. `setariOrar` se salvează în `user_metadata.setari_orar` (Supabase Auth) + `localStorage["beatrix_setari_orar"]`.
- Ziua e identificată prin `ziRaw` = `W_YYYY_MM_DD_Zi` (cheia săptămânii + ziua), construit cu `construiesteTagZiLocal`. Atenție la cazul special `Marti` / `Marți`: ambele variante sunt căutate.
- Orele se normalizează mereu cu `normalizeazaOraUi` (format `HH:mm`).
- Săptămâna trecută se randează din `DB.prezente` (read-only, „✓ Istoric”), nu din `DB.orarSloturi`.
- Blocarea unei ore (`comutaBlocareOra`) se aplică pe toate sloturile orei.

## Scroll automat la ora curentă

- `autoScrollLaOraCurenta(faraHighlight)`: găsește blocul orei curente, închide sertarul calendarului dacă e deschis (`#calendarExpandableCard.is-expanded`), calibrează layout-ul, apoi `window.scrollTo` cu offset.
- Offset-ul vine din `getTopOffsetSubZile()` = înălțimea `header` + `#dayButtonsContainer` + 5px. Dacă schimbi înălțimea header-ului sau a barei de zile în CSS, scroll-ul se recalculează singur; nu hardcoda valori.
- Highlight-ul orei curente: clasa `.hour-block-current-highlight`, scoasă și repusă în `requestAnimationFrame` ca să repornească animația.
- `history.scrollRestoration = 'manual'` (sus în `app.js`): browserul nu restaurează singur scroll-ul; nu schimba.

## Calibrare pe ecran (`calibreazaLayoutEcran`)

- Ca ora curentă să poată ajunge sus pe ecran chiar și seara, `#endScheduleCard` primește `minHeight` calculat: spațiul vizibil = `innerHeight` − header − bara de zile − `#bottomNav` − 10px.
- La 17:00 și 18:00 cardul primește clasele `state-ora-17` / `state-ora-18`.
- Calculele se bazează pe `getBoundingClientRect()` ale `header`, `#dayButtonsContainer`, `#bottomNav`, `#detailsIstoricOrar`, `#endScheduleCard`. Aceste ID-uri/elemente nu se redenumesc.

## Reguli la modificări vizuale

- Cardurile de oră (`.hour-block`) și rândurile de slot (`.slot-row`) rămân compacte, ca o zi să se vadă confortabil pe telefon.
- Testează pe lățime de telefon (Device Toolbar, ex. 375-430px) și în modul standalone (PWA): ora curentă trebuie să ajungă sub bara de zile, fără să fie acoperită de header sau `#bottomNav`.
- Verifică și seara (17:00-18:00) și săptămâna trecută / viitoare, unde nu există scroll la ora curentă.
