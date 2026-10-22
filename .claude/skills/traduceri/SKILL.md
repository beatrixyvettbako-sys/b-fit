---
name: traduceri
description: Reguli pentru suportul bilingv RO/EN din B-Fit Studio - dicționarul i18n, funcția t(), schimbarea limbii. Folosește când adaugi sau modifici orice text vizibil în interfață (butoane, etichete, toast-uri, mesaje, placeholder-e).
---

# Traduceri RO / EN

## Cum funcționează

- Dicționarul `i18n` e la începutul `app.js`, cu două blocuri: `ro` și `en`. Cele două au exact aceleași chei (în prezent 144).
- `t('cheie')` întoarce textul în limba curentă; dacă lipsește în EN, cade pe RO, apoi pe numele cheii.
- Limba curentă: `currentLang`, salvată în `localStorage['beatrix_lang']`, implicit `ro`.
- `seteazaLimba(lang)` schimbă limba și re-randează tot: `aplicaTraduceriInterfataStatic()` (textele fixe din HTML, setate prin ID), apoi orarul, programările, selectoarele și istoricele.
- Titlurile tab-urilor sunt separat, în `tabsOrder` (`titleRo` / `titleEn`), nu în `i18n`.

## Reguli pentru text nou

1. Orice text vizibil nou primește o cheie în **ambele** blocuri, `ro` și `en`, în aceeași poziție, cu același nume de cheie (camelCase, în engleză, ca cele existente).
2. În JS folosește `t('cheie')`, nu text scris direct.
3. Text fix din `index.html` (element static cu ID): adaugă linia corespunzătoare în `aplicaTraduceriInterfataStatic()`, altfel nu se schimbă la comutarea limbii.
4. Text din HTML generat dinamic: se ia cu `t()` la randare; randarea e rechemată de `seteazaLimba`.
5. Diacriticele în RO se păstrează (ă, â, î, ș, ț).

## Alte mecanisme existente

- **Texte fixe din `index.html`:** atributele `data-en`, `data-en-placeholder`, `data-en-title`, `data-en-aria` pe elementul cu textul (fără copii HTML). `aplicaTraduceriAtribute()` (chemată din `aplicaTraduceriInterfataStatic`) le schimbă și păstrează originalul în `data-ro*`.
- **Șabloane HTML din JS:** `tr('text ro', 'text en')`.
- **Valori salvate în română** (abonamente „8 sedinte”, statusuri, luni, status exerciții): rămân în română în bază; la afișare `traduceValoare(text)` folosind `TRADUCERI_VALORI_EN`. Opțiunile din `<select>` care se potrivesc sunt traduse automat.
- **Nu se traduc:** datele utilizatoarei (nume, titluri de planuri, mențiuni) și tipurile de antrenament (Fesieri, Picioare…).

## Excepții existente

Există câteva texte traduse inline cu `currentLang === 'en' ? ... : ...` (ex. în `randeazaOrarInstant`) și câteva toast-uri doar în română (ex. „Eroare sincronizare” în `callBackend`). Nu le muta în `i18n` decât dacă sarcina o cere; codul nou urmează regulile de mai sus.

## Verificare

După modificări, compară cheile `ro` și `en` (trebuie să fie identice) și comută limba în aplicație pe tab-ul afectat.
