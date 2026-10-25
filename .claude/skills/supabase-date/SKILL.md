---
name: supabase-date
description: Contractul de date B-Fit Studio cu Supabase - tabelele cliente, orar, confirmari, incasari, prezente, planuri_antrenament, coloanele folosite și regulile de business (bifare, anulare, abonamente). Folosește la orice modificare care citește sau scrie date, în executaActiuneSupabase sau callBackend.
---

# Date în Supabase

Toate operațiile trec prin `callBackend(actionName, payload, callback)` → `executaActiuneSupabase()` în `app.js`. Planurile de antrenament și auth-ul apelează `supabaseClient` direct.

Structura de mai jos e dedusă din ce folosește `app.js`. Schema reală (tipuri, RLS, triggere, coloane nefolosite) e în panoul Supabase și nu e în repo: nu presupune coloane care nu apar aici.

## Tabele

Majoritatea tabelelor păstrează forma din vechiul Google Sheets: cheia de rând e `row`, iar `user_id` leagă datele de utilizatoarea logată.

| Tabel | Coloane folosite |
|---|---|
| `cliente` | `row`, `id` (`cli_<row>`), `nume`, `tipAbonament`, `incluse`, `efectuate`, `ramase`, `dataStart`, `dataExpirare`, `status` (`Activ` / `Finalizat` / ...), `user_id` |
| `orar` | `row`, `ziRaw` (`W_YYYY_MM_DD_Zi`), `ora` (`HH:mm`), `clienta`, `antrenament`, `blocat` (bool), `bifat` (bool), `slotIndex` (0 … locuri-1, din Setări; implicit 0-2), `client_id`, `user_id` |
| `confirmari` (fostul `programari`, tab-ul Confirmări) | `row`, `sectiune` (`Activ` / `Hold`), `nume`, `prezenta`, `mentiuni`, `client_id`, `user_id` |
| `incasari` | `row`, `data` (`dd.mm.yyyy`), `clienta`, `suma` (text, fără „RON”), `metoda`, `tip`, `luna` (nume lună RO), `client_id`, `user_id` |
| `prezente` | `row`, `data`, `zi`, `ora`, `clienta`, `antrenament`, `client_id`, `user_id` |
| `planuri_antrenament` | `id`, `user_id`, `clienta`, `titlu`, `subtitlu`, `continut_json`, `updated_at` |

## Reguli

- **user_id:** orice citire filtrează `.eq('user_id', uid)` și orice insert setează `user_id`, ca în codul existent. Protecția reală trebuie să vină din RLS în Supabase; filtrul din browser nu e suficient singur.
- **Ore:** mereu `normalizeazaOraUi()` înainte de scriere și comparare (`06:00`, nu `6:00`).
- **Date calendaristice:** format românesc `dd.mm.yyyy` prin `formateazaDataRoLocal()`.
- **Clientele sunt legate prin nume** (`ilike('nume', ...)`), iar `client_id` se completează din `gasesteIdDupaNume`. La redenumire (`actualizeazaDateClienta`) numele se actualizează și în `orar` și `prezente`.
- **ID clientă:** la creare se inserează, apoi se setează `id = 'cli_' + row`.
- **Sedințe pe abonament:** `getNrSedinteAbonamentLocal(tip)`; abonamentul durează 30 de zile de la `dataStart`.

## Bifare și anulare (contabilitatea ședințelor)

- **`bifeazaPrezenta`:** slot `bifat = true`; inserează sau actualizează rândul în `prezente` (după `data` + `ora` + `clienta`); dacă nici antrenamentul, nici abonamentul nu e „gratuit”: `efectuate + 1`, `ramase = max(0, incluse - efectuate)`, iar la `ramase == 0` → `status = 'Finalizat'`.
- **`anuleazaSlot`:** golește slotul; doar dacă era bifat: șterge rândul din `prezente` și, dacă nu era gratuit, `efectuate - 1`, recalculează `ramase`, `status = 'Activ'`.
- Orice modificare a acestor fluxuri trebuie să păstreze simetria bifare ↔ anulare.

## Erori și cache local

- Clientul Supabase **nu aruncă excepții** la eroare; întoarce `{ data, error }`. Codul existent nu verifică `error` la scrieri (problemă cunoscută). În codul nou verifică `error` și semnalează eșecul cu `showToast(..., 'error')`.
- După acțiuni, UI-ul actualizează `DB` și `localStorage['BFIT_DB_LOCAL']` pentru afișare instant. Păstrează-le sincron cu ce s-a scris în Supabase.

## Fără Supabase

Dacă `supabaseClient` e `null` (biblioteca de pe CDN nu s-a încărcat), `callBackend` doar afișează „Eroare sincronizare”. Nu există alt backend (vechiul Google Sheets / Apps Script a fost scos).

## Link de share pentru plan

Clienta fără cont deschide `?plan=<uuid>`; planul se citește prin funcția Supabase `citeste_plan_share(p_id)` (security definer), nu direct din tabel. Link-ul e doar pentru citire.
