---
name: comparatie-nisa
description: Compară o funcție nouă sau o schimbare de flux din B-Fit Studio cu aplicațiile de top din nișă (Trainerize, TrueCoach, Everfit, My PT Hub, Hevy Coach; pentru clienți Hevy, Nike Training Club, Apple Fitness+), cu plângerile din recenzii, și propune o soluție mai bună și mai simplă. Folosește înainte de a implementa o funcție nouă, o schimbare vizibilă de flux sau de organizare (bibliotecă, programări, fișă, nutriție, mesaje), sau când utilizatoarea întreabă „cum fac aplicațiile de top”. Nu pentru reparații mici, texte sau ajustări de stil.
---

# Comparație cu aplicațiile de nișă

Scopul: B-Fit să fie cel puțin la nivelul aplicațiilor de top și să rezolve ce le reproșează utilizatorii, fără să devină mai complicată.

## Când

- Funcție nouă sau schimbare de flux / organizare vizibilă pentru antrenor sau client.
- Întrebări de tipul „cum au aplicațiile de top?”.
- Nu la bug-uri mici, texte, culori sau spațieri: acolo se aplică direct regulile din CLAUDE.md.

## Pași

1. **Problema reală:** ce vrea antrenorul / clientul să obțină, în cuvintele utilizatoarei. Citește întâi codul existent (ce avem deja).
2. **Cum fac ei** (căutări web, trimise deodată, mod `standard`; `extended` doar dacă rezultatele sunt subțiri):
   - Antrenori: Trainerize, TrueCoach, Everfit, My PT Hub, Hevy Coach (centrele lor de ajutor, blogurile de update).
   - Clienți: Hevy, Nike Training Club, Apple Fitness+, MyFitnessPal (la nutriție).
   - Termenii exacți din interfață (ex. Trainerize: „Master Programs” / „Master Workouts”; Everfit: „Workout Library” / „Program Library”).
3. **Ce reproșează utilizatorii:** recenzii App Store / Google Play, forumurile de idei (ex. ideas.abcfitness.com pentru Trainerize), Reddit (r/personaltraining, r/fitness). Notează plângerile repetate, nu cazurile izolate.
4. **Propunerea B-Fit**, pe scurt:
   - ce preluăm de la ei (ce funcționează și e familiar);
   - ce plângere evităm și cum;
   - ce aducem în plus (automat în loc de manual, mai puțini pași, potrivit unui studio mic);
   - ce lăsăm deliberat pe mai târziu (YAGNI).
5. **Verificat vs dedus:** spune clar ce ai găsit pe web (cu sursele, ca link-uri) și ce știi din memorie sau deduci. Nu inventa nume de meniuri sau funcții.
6. Așteaptă confirmarea utilizatoarei înainte de implementare, apoi implementează după regulile din CLAUDE.md (diff-uri mici, verificare pe 360 / 390 / 448 / desktop).

## Principii pentru propunere

- Simplu pentru un studio mic: o persoană care lucrează de pe telefon, între clienți.
- Automat unde se poate (calculat din date existente), manual doar ca opțiune în plus. Plângerea clasică la aplicațiile mari: totul trebuie etichetat / configurat de mână.
- Nu dubla datele (ex. șabloanele derivate din aceleași fișiere, nu copiate).
- Termeni clari în română, cu echivalentul obișnuit din nișă în engleză; texte neutre („client/clienți”).
- Refolosește stilurile glass existente pentru butoane și selectoare.
- Răspuns scurt: comparația în câteva puncte, nu un raport lung.
