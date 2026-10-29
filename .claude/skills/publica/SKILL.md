---
name: publica
description: Publică modificările B-Fit Studio pe GitHub Pages - urcă versiunea cache-ului PWA în sw.js și index.html, verifică diff-ul, face commit și push pe main. Doar când utilizatoarea cere explicit publicarea.
disable-model-invocation: true
---

# Publicare pe GitHub Pages

Rulează doar la cererea explicită a utilizatoarei (`/publica` sau „publică”). Utilizatoarea a testat deja local.

## 1. Verifică ce se publică

- `git status` și `git diff --stat`. Arată pe scurt ce fișiere și ce zone s-au schimbat.
- `CNAME` trebuie să existe (conține `app.beatrixyvett.com`); fără el se pierde domeniul.
- Dacă apar fișiere neașteptate (backup-uri, fișiere temporare, `.zip`), întreabă înainte să le incluzi.
- `git fetch` și verifică dacă `origin/main` are commit-uri noi (de ex. editări făcute direct pe GitHub). Dacă da, oprește-te și explică înainte de orice merge.

## 2. Urcă versiunea (dacă s-a schimbat `index.html`, `style.css` sau `app.js`)

Un singur număr de versiune N, sincron în 3 locuri:

- `sw.js`: `const CACHE_NAME = 'bfit-cache-vN';`
- `index.html`: `style.css?v=fitFinalN`
- `index.html`: `app.js?v=fitFinalN`

N = versiunea curentă + 1. Citește-o din fișiere; dacă cele 3 locuri nu au același număr, ia maximul + 1 și spune asta.

Verifică și că `ASSETS_TO_CACHE` din `sw.js` conține `./`, `./index.html`, `./style.css`, `./app.js`, `./manifest.json`, `./icon.svg`.

Fiecare fișier din `ASSETS_TO_CACHE` și din `<script src>` din `index.html` (ex. `vendor/supabase-2.118.0.js`) trebuie să fie în commit: verifică cu `git status` că niciunul nu e netracked. Un fișier lipsă pe GitHub Pages lasă aplicația fără Supabase și blochează instalarea service worker-ului nou.

## 3. Commit și push

- Mesaj de commit scurt, în română, despre ce s-a schimbat pentru utilizatoare (nu „update files”), plus numărul versiunii. Ex: `Orar: scroll la ora curentă corectat (v53)`.
- `git push origin main`. La primul push se poate deschide fereastra de login GitHub în browser: utilizatoarea se loghează singură, tu nu introduci credențiale.
- Dacă push-ul eșuează, arată eroarea exactă; nu folosi `--force`.

## 4. După publicare

Spune că GitHub Pages se actualizează în 1-2 minute și că pe telefon (PWA instalată) versiunea nouă apare când aplicația e închisă complet și redeschisă (pagina se ia de pe rețea la fiecare deschidere).

## Reguli service worker (de păstrat la orice modificare în `sw.js`)

- Service worker-ul e înregistrat din `app.js` (`navigator.serviceWorker.register('sw.js')`); fără asta `sw.js` nu rulează deloc.
- Cererile către `supabase.co` merg exclusiv prin rețea, ocolind cache-ul.
- Pagina (navigare): întâi rețeaua, cache doar offline, ca versiunea nouă să apară la prima deschidere.
- Resursele statice: stale-while-revalidate, cu `cache: 'no-cache'` (GitHub Pages trimite `max-age=600`).
- La `activate`, cache-urile cu alt nume decât `CACHE_NAME` se șterg.
