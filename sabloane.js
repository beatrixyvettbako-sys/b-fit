// Șabloanele B-Fit (generate din Planuri de Antrenament Personalizate nou.xlsx). Se copiază la Plan nou; nu se salvează în bază.
// Exercițiile au în plus mușchii vizați (muschi) și tipul notării (tip: kg, rep, sec, circuit, min).
const SABLOANE_PLAN = [{"id":"bfit-2-zile","nr_zile":2,"tip":"Full Body Split","focus":"Toate grupele musculare majore","titlu":"Full Body Split · 2 zile pe săptămână","subtitlu":"2 sesiuni / săpt (48-72h pauză) · Toate grupele musculare majore","continut_json":{"sectiuni_inceput":[{"titlu":"Organizarea săptămânii","continut":"- Ziua 1 (Full Body A): Luni sau Marți. Tempo controlat pe coborâre\n- Ziua 2 (Full Body B): Joi sau Vineri. Recuperare 48h după Ziua 1"}],"sesiuni":[{"titlu":"Ziua 1: Full Body A (Focus Glutes, Cvadriceps & Spate)","exercitii":[{"nr":1,"exercitiu":"Hip Thrust cu haltera la bancă","muschi":"Fesieri (gluteul mare), Biceps Femural","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Burete gros pe bazin, sprijin pe omoplați la marginea băncii, tălpi la nivelul umerilor, tibii verticale la vârf, bărbia în piept; 1 sec contracție maximă voluntară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Genuflexiuni la Smith / Goblet Squat","muschi":"Cvadriceps, Fesieri (gluteul mare), Core","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Picioarele puțin peste lățimea umerilor, vârfuri la 15-30°, coborâre controlată 3 secunde sub paralel, pieptul sus, coloană neutră fără flexie lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet (Fesieri, Erectori, Spate)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Tălpi la lățimea șoldurilor, bară la 2-3 cm de tibii, priză pronată, bracing abdominal, menține bara lipită de picioare, blochează la verticală strângând fesierii.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Tracțiuni la helcometru cu priză largă","muschi":"Dorsali mari, Biceps brahial, Trapez inferior","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Priză pronată la 1.5 lățimea umerilor; trunchi ușor înclinat înapoi (10-15°); trage bara spre claviculă ducând coatele în jos și spre spate; apropie omoplații la final.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Ramat la cablu din șezut cu mâner V","muschi":"Spate mijlociu (Romboid, Trapez mediu), Dorsali","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Pieptul sus, spatele drept, trage mânerele spre abdomenul inferior, umerii coborâți departe de urechi, strânge omoplații 1 sec la contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Împins cu gantere pe bancă înclinată (30°)","muschi":"Pectorali mari (clavicular), Deltoid anterior, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Omoplații fixați pe bancă, coatele la 45-60° față de trunchi, coborâre controlată până la piept, împinge fără a desprinde umerii la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":7,"exercitiu":"Fluturări laterale cu gantere pentru umeri","muschi":"Deltoid lateral","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Brațe ușor îndoite la coate; ridică până la înălțimea umerilor conducând cu coatele; tempo 2-3 secunde pe coborâre, fără balans din trunchi.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":8,"exercitiu":"Plank / Scândură izometrică","muschi":"Core profund, Fesieri, Umeri","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Antebrațe paralele, coate sub umeri, bazin neutru (ușoară retroversie); încordează simultan abdomenul, fesierii și coapsele; respirație constantă.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 2: Full Body B (Lanț Posterior, Femurali, Spate & Brațe)","exercitii":[{"nr":1,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet, Fesieri, Biceps Femural","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Picioare la lățimea șoldurilor, bară lipită de tibii, privire neutră, bracing profund, împinge prin călcâie și strânge fesierii fără hiperextensie lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Îndreptări românești cu gantere / haltera (RDL)","muschi":"Biceps Femural, Fesieri, Erectori spinali","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Retragerea șoldului în spate (hip hinge), genunchi semi-flexați și ficși, greutatea alunecă lipită de picioare, contracție pe fesieri la revenire.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Presă de picioare (picioare sus & depărtate)","muschi":"Cvadriceps, Fesieri, Biceps Femural","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Tălpi în jumătatea superioară a platformei, coborâre adâncă fără rotunjirea bazinului, nu bloca brusc genunchii la finalul împingerii.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Flexii femurali la aparat (șezut/culcat)","muschi":"Biceps Femural (Semitendinos, Semimembranos)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Burete pe treimea inferioară a gambei, bazinul lipit de bancă; flexie explozivă, pauză 1 sec la contracție, revenire lentă în 3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Ramat din aplecat cu gantera pe bancă","muschi":"Dorsali mari, Spate mijlociu, Deltoid posterior","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trunchi stabil la 45° sau paralel cu solul, coloană neutră, trage gantera spre șold, nu spre piept, condu mișcarea prin coate.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Face Pull la cablu cu sfoara","muschi":"Deltoid posterior, Rotatori externi, Trapez","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Scripete la nivelul ochilor, trage spre tâmple separând sfoara și rotind umerii extern; coatele la înălțimea umerilor, contracție 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":7,"exercitiu":"Extensia coatelor la cablu cu sfoară (Triceps)","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Coatele lipite de trunchi și imobilizate, extinde complet în jos depărtând sfoara spre exterior la final; blochează tricepsul 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":8,"exercitiu":"Flexii biceps cu gantere prin supinație","muschi":"Biceps brahial, Brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Brațe verticale, rotește palma spre tavan la urcare, menține coatele fixe fără a le împinge înainte; întindere completă la bază.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":9,"exercitiu":"Crunch la cablu / Ridicări de picioare","muschi":"Drept abdominal, Core profund","tip":"rep","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Crunch: flexie exclusiv din torace cu expirare completă. Ridicări: basculare a bazinului fără elan din șolduri, coborâre lentă.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},
{"id":"bfit-2-zile-ciclu","nr_zile":2,"tip":"Full Body + Upper/Lower","focus":"Ciclu de 2 săptămâni, alternat","titlu":"Full Body + Upper/Lower · 2 zile, ciclu de 2 săptămâni","subtitlu":"2 sesiuni / săpt (48-72h pauză) · Ciclu de 2 săptămâni: Full Body, apoi Upper/Lower","continut_json":{"sectiuni_inceput":[{"titlu":"Organizarea săptămânilor","continut":"- Săptămâna 1: Full Body A (Luni sau Marți) și Full Body B (Joi sau Vineri)\n- Săptămâna 2: Upper Body A (Luni sau Marți) și Lower Body A (Joi sau Vineri)\n- Apoi ciclul se reia de la Săptămâna 1, cu greutăți puțin mai mari unde execuția a fost corectă"}],"sesiuni":[{"titlu":"Săpt. 1 · Ziua 1: Full Body A (Focus Glutes, Cvadriceps & Spate)","exercitii":[{"nr":1,"exercitiu":"Hip Thrust cu haltera la bancă","muschi":"Fesieri (gluteul mare), Biceps Femural","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Burete gros pe bazin, sprijin pe omoplați la marginea băncii, tălpi la nivelul umerilor, tibii verticale la vârf, bărbia în piept; 1 sec contracție maximă voluntară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Genuflexiuni la Smith / Goblet Squat","muschi":"Cvadriceps, Fesieri (gluteul mare), Core","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Picioarele puțin peste lățimea umerilor, vârfuri la 15-30°, coborâre controlată 3 secunde sub paralel, pieptul sus, coloană neutră fără flexie lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet (Fesieri, Erectori, Spate)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Tălpi la lățimea șoldurilor, bară la 2-3 cm de tibii, priză pronată, bracing abdominal, menține bara lipită de picioare, blochează la verticală strângând fesierii.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Tracțiuni la helcometru cu priză largă","muschi":"Dorsali mari, Biceps brahial, Trapez inferior","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Priză pronată la 1.5 lățimea umerilor; trunchi ușor înclinat înapoi (10-15°); trage bara spre claviculă ducând coatele în jos și spre spate; apropie omoplații la final.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Ramat la cablu din șezut cu mâner V","muschi":"Spate mijlociu (Romboid, Trapez mediu), Dorsali","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Pieptul sus, spatele drept, trage mânerele spre abdomenul inferior, umerii coborâți departe de urechi, strânge omoplații 1 sec la contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Împins cu gantere pe bancă înclinată (30°)","muschi":"Pectorali mari (clavicular), Deltoid anterior, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Omoplații fixați pe bancă, coatele la 45-60° față de trunchi, coborâre controlată până la piept, împinge fără a desprinde umerii la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":7,"exercitiu":"Fluturări laterale cu gantere pentru umeri","muschi":"Deltoid lateral","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Brațe ușor îndoite la coate; ridică până la înălțimea umerilor conducând cu coatele; tempo 2-3 secunde pe coborâre, fără balans din trunchi.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":8,"exercitiu":"Plank / Scândură izometrică","muschi":"Core profund, Fesieri, Umeri","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Antebrațe paralele, coate sub umeri, bazin neutru (ușoară retroversie); încordează simultan abdomenul, fesierii și coapsele; respirație constantă.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Săpt. 1 · Ziua 2: Full Body B (Lanț Posterior, Femurali, Spate & Brațe)","exercitii":[{"nr":1,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet, Fesieri, Biceps Femural","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Picioare la lățimea șoldurilor, bară lipită de tibii, privire neutră, bracing profund, împinge prin călcâie și strânge fesierii fără hiperextensie lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Îndreptări românești cu gantere / haltera (RDL)","muschi":"Biceps Femural, Fesieri, Erectori spinali","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Retragerea șoldului în spate (hip hinge), genunchi semi-flexați și ficși, greutatea alunecă lipită de picioare, contracție pe fesieri la revenire.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Presă de picioare (picioare sus & depărtate)","muschi":"Cvadriceps, Fesieri, Biceps Femural","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Tălpi în jumătatea superioară a platformei, coborâre adâncă fără rotunjirea bazinului, nu bloca brusc genunchii la finalul împingerii.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Flexii femurali la aparat (șezut/culcat)","muschi":"Biceps Femural (Semitendinos, Semimembranos)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Burete pe treimea inferioară a gambei, bazinul lipit de bancă; flexie explozivă, pauză 1 sec la contracție, revenire lentă în 3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Ramat din aplecat cu gantera pe bancă","muschi":"Dorsali mari, Spate mijlociu, Deltoid posterior","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trunchi stabil la 45° sau paralel cu solul, coloană neutră, trage gantera spre șold, nu spre piept, condu mișcarea prin coate.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Face Pull la cablu cu sfoara","muschi":"Deltoid posterior, Rotatori externi, Trapez","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Scripete la nivelul ochilor, trage spre tâmple separând sfoara și rotind umerii extern; coatele la înălțimea umerilor, contracție 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":7,"exercitiu":"Extensia coatelor la cablu cu sfoară (Triceps)","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Coatele lipite de trunchi și imobilizate, extinde complet în jos depărtând sfoara spre exterior la final; blochează tricepsul 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":8,"exercitiu":"Flexii biceps cu gantere prin supinație","muschi":"Biceps brahial, Brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Brațe verticale, rotește palma spre tavan la urcare, menține coatele fixe fără a le împinge înainte; întindere completă la bază.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":9,"exercitiu":"Crunch la cablu / Ridicări de picioare","muschi":"Drept abdominal, Core profund","tip":"rep","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Crunch: flexie exclusiv din torace cu expirare completă. Ridicări: basculare a bazinului fără elan din șolduri, coborâre lentă.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Săpt. 2 · Ziua 1: Upper Body A (Spate & Brațe + Piept)","exercitii":[{"nr":1,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet (Fesieri, Dorsali, Trapez)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Spatele neutru, aer în abdomen (bracing), bara glisează aproape de picioare, blochează la verticală fără arcuire lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Tracțiuni la helcometru priză pronată largă","muschi":"Dorsali mari, Biceps brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trunchi înclinat la 10-15°, trage spre claviculă ducând coatele în jos și spre spate, apropie ferm omoplații.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Ramat la aparat din șezut / cablu","muschi":"Dorsali, Romboid, Trapez mijlociu","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trage mânerele spre abdomenul inferior, umerii coborâți, strânge omoplații la contracție 1 secundă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Împins de la piept cu gantere din culcat","muschi":"Pectorali mari, Deltoid anterior, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Omoplații retrași și fixați pe bancă, coatele la 45-60°, coborâre controlată până la piept, împinge controlat.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Flexii biceps cu gantere prin supinație","muschi":"Biceps brahial, Brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Brațe verticale, răsucește palma spre exterior la vârf, coatele rămân fixe și orientate spre sol.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Extensii triceps la cablu cu sfoară","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Coatele imobilizate, extinde antebrațele în jos și depărtează sfoara spre exterior la final, pauză 1 sec la blocare.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Săpt. 2 · Ziua 2: Lower Body A (Cvadriceps & Fesieri)","exercitii":[{"nr":1,"exercitiu":"Genuflexiuni la Smith / bara liberă","muschi":"Cvadriceps, Fesieri, Adductori","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Vârfuri orientate spre exterior la 15-30°, tempo excentric 3 secunde, pieptul sus și spatele perfect drept pe tot parcursul.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust cu haltera la bancă","muschi":"Fesieri (Gluteus maximus), Biceps Femural","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Sprijin omoplați pe marginea băncii, tălpi la lățimea umerilor, 1 sec contracție voluntară la extensie maximă, coborâre controlată.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Fandări înapoi cu gantere (Reverse Lunges)","muschi":"Fesieri, Cvadriceps, Femurali","tip":"kg","seturi_repetari":"3 × 12 / picior","pauza":"90-120 sec","indicatii":"Pas amplu înapoi, genunchi la 90°, trunchi ușor aplecat în față, împinge prin călcâiul piciorului din față fără balans.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Extensii picioare la aparat","muschi":"Cvadriceps (izolare)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Spatele lipit de spătar, blocare 1 secundă la vârf, mișcare controlată la coborâre.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Abducții la aparat din șezut","muschi":"Fesieri mijlocii & superiori","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Apleacă trunchiul înainte la 45°, deschidere largă, menține 1-2 secunde pe contracție maximă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Ridicări pe vârfuri la aparat (Gambe)","muschi":"Gambe (Gastrocnemian, Solear)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Coborâre completă sub nivelul treptei, pauză 1 sec jos, contracție maximă 1 sec sus pe degetul mare.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},
{"id":"bfit-3-zile","nr_zile":3,"tip":"Lower-Upper-Lower","focus":"Fesieri, Picioare, Trunchi","titlu":"Lower-Upper-Lower · 3 zile pe săptămână","subtitlu":"3 sesiuni / săpt (O zi pauză) · Fesieri, Picioare, Trunchi","continut_json":{"sectiuni_inceput":[{"titlu":"Organizarea săptămânii","continut":"- Ziua 1 (Lower Body A): Luni. Activare optimă a lanțului anterior și fesierilor\n- Ziua 2 (Upper Body & Core): Miercuri. Postură, spate tonifiat și stabilitate centrală\n- Ziua 3 (Lower Body B): Vineri. Hipertrofie gluteală și femurali"}],"sesiuni":[{"titlu":"Ziua 1: Lower Body A (Cvadriceps & Fesieri)","exercitii":[{"nr":1,"exercitiu":"Genuflexiuni la Smith / bara liberă","muschi":"Cvadriceps, Fesieri, Adductori","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Picioare ușor depărtate peste umeri, vârfuri la exterior 15-30°, coborâre 3 secunde sub paralel, genunchii pe direcția degetelor, spate drept.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust cu haltera la bancă / machine","muschi":"Fesieri (Gluteus maximus), Biceps Femural","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Burete de protecție, tibii verticale la extensie completă, bărbia în piept, 1 secundă contracție maximă voluntară la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Fandări înapoi cu gantere (Reverse Lunges)","muschi":"Fesieri, Cvadriceps, Femurali","tip":"kg","seturi_repetari":"3 × 12 / picior","pauza":"90-120 sec","indicatii":"Pas generos înapoi pentru unghi de 90° la genunchiul anterior, trunchi ușor aplecat în față, împinge puternic în călcâi la revenire.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Extensii picioare la aparat (Leg Extensions)","muschi":"Cvadriceps (Rectus femoris, Vastus)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Spatele lipit de spătar, genunchi aliniați cu axul, blocare 1 secundă la vârf, revenire controlată fără ciocnirea discurilor.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Abducții la aparat din șezut","muschi":"Fesieri mijlocii & superiori (Gluteus medius)","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Trunchi aplecat la 45° cu mâinile pe aparat pentru izolarea fesierului mediu; deschidere amplă, pauză 1-2 sec la contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Ridicări pe vârfuri la aparat (Gambe)","muschi":"Gambe (Gastrocnemian, Solear)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Coborâre amplă sub nivelul treptei pentru întinderea tendonului ahilian, pauză 1 sec jos, contracție maximă 1 sec sus pe degetul mare.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 2: Upper Body & Core (Postură, Spate & Stabilitate)","exercitii":[{"nr":1,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet (Fesieri, Dorsali, Trapez)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Tălpi la lățimea șoldurilor, coboară bazinul până atingi bara, pieptul deschis, bracing intra-abdominal, extensie completă fără arcuire lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Tracțiuni la helcometru priză pronată largă","muschi":"Dorsali mari, Biceps, Rotunzi (Teres major)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Înclinare ușoară 10-15°, trage bara spre claviculă ducând coatele spre înapoi, apropie ferm omoplații la final, întindere completă la revenire.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Ramat la aparat din șezut / cablu","muschi":"Dorsali, Romboid, Trapez mijlociu","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Pieptul sprijinit sau spatele drept, umerii coborâți departe de urechi, trage spre abdomenul inferior și menține 1 sec pe contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Împins de la piept cu gantere din culcat","muschi":"Pectorali mari, Deltoid anterior, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Omoplații fixați pe bancă, coatele la 45-60° față de trunchi, coborâre controlată până la nivelul pieptului, împinge fără smucituri.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Presă militară pentru umeri cu gantere","muschi":"Deltoid anterior și lateral, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Spătar la 75-80°, abdomenul încordat pentru protecția lombară; împinge deasupra capului fără arcuirea spatelui; coboară până la nivelul bărbiei.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Fluturări laterale la cablu / cu gantere","muschi":"Deltoid lateral","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Brațe ușor flexate, condu mișcarea cu cotul până la nivelul umerilor; coborâre lentă 2-3 secunde, fără balans din trunchi.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":7,"exercitiu":"Extensii triceps la cablu cu sfoară / bara dreaptă","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Coate imobilizate lângă corp, extensie completă și deschidere spre exterior la final, blochează 1 sec pe contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":8,"exercitiu":"Flexii biceps cu gantere pe bancă înclinată 45°","muschi":"Biceps brahial (cap lung), Brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Spatele și capul lipite de bancă, alungire musculară maximă la bază, flexie cu supinație completă la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":9,"exercitiu":"Ridicări de picioare la paralele / atârnat","muschi":"Drept abdominal inferior, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Evită balansul; inițiază mișcarea basculând bazinul spre piept, coborâre lentă și controlată a picioarelor.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 3: Lower Body B (Lanț Posterior & Fesieri Focus)","exercitii":[{"nr":1,"exercitiu":"Îndreptări românești (RDL) cu haltera","muschi":"Biceps Femural, Fesieri, Erectori spinali","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Hip hinge strict, împinge șoldul în spate, genunchi ușor flexați, haltera coboară lipită de tibii, contracție voluntară a fesierilor la revenire.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust unilateral la cablu / cu gantera","muschi":"Fesieri (Gluteus maximus & medius)","tip":"kg","seturi_repetari":"3 × 12 / picior","pauza":"90-120 sec","indicatii":"Sprijin pe omoplați la marginea băncii, tibie verticală la piciorul de lucru, contracție fermă 1 secundă la extensie completă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Flexii femurali la aparat (culcat pe burtă)","muschi":"Biceps Femural (toate capetele)","tip":"kg","seturi_repetari":"4 × 12-15","pauza":"60 sec","indicatii":"Burete pe treimea inferioară a gambei, bazin lipit pe bancă; flexie puternică cu 1 sec pauză, tempo de coborâre de 3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Step-up pe cutie / bancă cu gantere","muschi":"Fesieri, Cvadriceps","tip":"kg","seturi_repetari":"3 × 12 / picior","pauza":"90-120 sec","indicatii":"Piciorul activ pe bancă, călcâiul apasă ferm, împinge exclusiv din piciorul superior fără elan de la sol; coborâre lentă 3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Extensii de șold (Kickbacks) la cablu","muschi":"Fesieri (Gluteus maximus & medius)","tip":"kg","seturi_repetari":"3 × 15-20 / pic","pauza":"60 sec","indicatii":"Trunchi aplecat la 45°, coloană neutră; du piciorul în spate și ușor spre exterior la 30-45°, strânge tare fesierul la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Russian Twist cu disc / minge","muschi":"Oblici interni/externi, Drept abdominal","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Trunchi la 45°, picioare ușor ridicate, rotește umerii dintr-o parte în alta controlând mișcarea exclusiv din tors.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},
{"id":"bfit-4-zile","nr_zile":4,"tip":"Upper-Lower Split","focus":"Echilibru tren inferior & superior","titlu":"Upper-Lower Split · 4 zile pe săptămână","subtitlu":"4 sesiuni / săpt (Pauză după 2 zile) · Echilibru tren inferior & superior","continut_json":{"sectiuni_inceput":[{"titlu":"Organizarea săptămânii","continut":"- Ziua 1 (Lower Body A): Luni. Tonifiere tren inferior\n- Ziua 2 (Upper Body A): Marți. Trunchi superior & brațe tonifiate\n- Ziua 3 (Lower Body B): Joi. Izolare gluteală și bicepși femurali\n- Ziua 4 (Upper Body B): Vineri. Deltoizi, piept și definire abdomen"}],"sesiuni":[{"titlu":"Ziua 1: Lower Body A (Cvadriceps & Fesieri)","exercitii":[{"nr":1,"exercitiu":"Genuflexiuni la Smith / bara liberă","muschi":"Cvadriceps, Fesieri, Adductori","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Vârfuri orientate spre exterior la 15-30°, tempo excentric 3 secunde, pieptul sus și spatele perfect drept pe tot parcursul.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust cu haltera la bancă","muschi":"Fesieri (Gluteus maximus), Biceps Femural","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Sprijin omoplați pe marginea băncii, tălpi la lățimea umerilor, 1 sec contracție voluntară la extensie maximă, coborâre controlată.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Fandări înapoi cu gantere (Reverse Lunges)","muschi":"Fesieri, Cvadriceps, Femurali","tip":"kg","seturi_repetari":"3 × 12 / picior","pauza":"90-120 sec","indicatii":"Pas amplu înapoi, genunchi la 90°, trunchi ușor aplecat în față, împinge prin călcâiul piciorului din față fără balans.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Extensii picioare la aparat","muschi":"Cvadriceps (izolare)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Spatele lipit de spătar, blocare 1 secundă la vârf, mișcare controlată la coborâre.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Abducții la aparat din șezut","muschi":"Fesieri mijlocii & superiori","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Apleacă trunchiul înainte la 45°, deschidere largă, menține 1-2 secunde pe contracție maximă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Ridicări pe vârfuri la aparat (Gambe)","muschi":"Gambe (Gastrocnemian, Solear)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Coborâre completă sub nivelul treptei, pauză 1 sec jos, contracție maximă 1 sec sus pe degetul mare.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 2: Upper Body A (Spate & Brațe + Piept)","exercitii":[{"nr":1,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet (Fesieri, Dorsali, Trapez)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Spatele neutru, aer în abdomen (bracing), bara glisează aproape de picioare, blochează la verticală fără arcuire lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Tracțiuni la helcometru priză pronată largă","muschi":"Dorsali mari, Biceps brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trunchi înclinat la 10-15°, trage spre claviculă ducând coatele în jos și spre spate, apropie ferm omoplații.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Ramat la aparat din șezut / cablu","muschi":"Dorsali, Romboid, Trapez mijlociu","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trage mânerele spre abdomenul inferior, umerii coborâți, strânge omoplații la contracție 1 secundă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Împins de la piept cu gantere din culcat","muschi":"Pectorali mari, Deltoid anterior, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Omoplații retrași și fixați pe bancă, coatele la 45-60°, coborâre controlată până la piept, împinge controlat.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Flexii biceps cu gantere prin supinație","muschi":"Biceps brahial, Brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Brațe verticale, răsucește palma spre exterior la vârf, coatele rămân fixe și orientate spre sol.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Extensii triceps la cablu cu sfoară","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Coatele imobilizate, extinde antebrațele în jos și depărtează sfoara spre exterior la final, pauză 1 sec la blocare.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 3: Lower Body B (Lanț Posterior & Fesieri)","exercitii":[{"nr":1,"exercitiu":"Îndreptări românești (RDL) cu haltera","muschi":"Biceps Femural, Fesieri, Erectori spinali","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Hip hinge strict, genunchi semi-flexați, greutatea coboară pe tibii, oprește când șoldul nu mai merge înapoi, contractă fesierii.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust unilateral la cablu sau ganteră","muschi":"Fesieri (Gluteus maximus), Stabilitate","tip":"kg","seturi_repetari":"3 × 12 / picior","pauza":"90-120 sec","indicatii":"Sprijin omoplați pe bancă, tibie verticală, bărbia în piept, 1 secundă contracție maximă voluntară la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Flexii femurali la aparat (culcat pe burtă)","muschi":"Biceps Femural (toate capetele)","tip":"kg","seturi_repetari":"4 × 12-15","pauza":"60 sec","indicatii":"Bazinul și coapsele lipite pe bancă, flexie explozivă, pauză 1 sec la vârf, revenire lentă în 3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Step-up pe cutie / bancă cu gantere","muschi":"Fesieri (Gluteus maximus), Cvadriceps","tip":"kg","seturi_repetari":"3 × 12 / picior","pauza":"90-120 sec","indicatii":"Călcâi bine apăsat pe cutie, împinge exclusiv prin piciorul de sus, coborâre lentă de 3 secunde fără impuls din sol.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Kickback la cablu pentru fesieri","muschi":"Fesieri (Gluteus maximus & superior)","tip":"kg","seturi_repetari":"3 × 15-20 / pic","pauza":"60 sec","indicatii":"Trunchi la 45°, coloană stabilă; duce piciorul spre înapoi și exterior la 30-45° cu genunchiul ușor îndoit; strânge tare fesierul.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 4: Upper Body B (Umeri, Piept, Spate & Core)","exercitii":[{"nr":1,"exercitiu":"Împins deasupra capului la aparat (Shoulder Press)","muschi":"Deltoid anterior & lateral, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Coatele orientate la 30-45° înainte în plan scapular, împinge controlat fără blocarea coatelor, coborâre lentă 2-3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Presă militară pentru umeri cu gantere","muschi":"Deltoid anterior & lateral, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Spătar la 75-80°, abdomen încordat, împinge ganterele fără a arcui spatele, coboară până la nivelul bărbiei.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Fluturări laterale la cablu / gantere","muschi":"Deltoid lateral","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Condu mișcarea cu cotul, tempo lent 2-3 secunde pe coborâre, izolare fără balansare din trunchi.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Presă pentru piept la aparat (Chest Press Machine)","muschi":"Pectoral mare, Deltoid ant, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Mânere aliniate cu linia pieptului, piept deschis, coate la 45-60°, împinge prin pectorali fără blocare bruscă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Împins cu gantere pe bancă înclinată (30°)","muschi":"Pectorali mari, Deltoid ant, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Omoplații fixați, coborâre controlată până la piept, împinge fără a ridica umerii de pe bancă la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Fluturări la aparat (Pec Deck / Seated Fly)","muschi":"Pectoral mare (izolare & stretch)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Coate ușor îndoite la 10-15° și blocate în acel unghi, apropie conducând cu coatele, 1 sec contracție izometrică.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":7,"exercitiu":"Ramat din aplecat cu gantera pe bancă","muschi":"Dorsali mari, Spate mijlociu, Deltoid post","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trunchi stabil la 45°, trage greutatea spre șold conducând prin cot, fără elan din picioare.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":8,"exercitiu":"Ridicări de picioare la paralele / atârnat","muschi":"Drept abdominal inferior, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Evită balansul, basculează bazinul în sus aducând genunchii spre piept, coborâre lentă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":9,"exercitiu":"Plank / Scândură izometrică","muschi":"Core profund, Fesieri, Umeri","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Antebrațe paralele, bazin în poziție neutră, încordează simultan abdomenul, fesierii și cvadricepsul.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},
{"id":"bfit-5-zile","nr_zile":5,"tip":"Avansat","focus":"Maximizare hipertrofie & glutes","titlu":"Avansat · 5 zile pe săptămână","subtitlu":"5 sesiuni / săpt (Planificare volum) · Maximizare hipertrofie & glutes","continut_json":{"sectiuni_inceput":[{"titlu":"Organizarea săptămânii","continut":"- Ziua 1 (Lower A): Luni\n- Ziua 2 (Upper Pull): Marți\n- Ziua 3 (Lower B): Joi\n- Ziua 4 (Upper Push & Core): Vineri\n- Ziua 5 (Glute Sculpt, Core & Conditioning / Cardio): Sâmbătă"}],"sesiuni":[{"titlu":"Ziua 1: Lower A (Fesieri & Cvadriceps Focus)","exercitii":[{"nr":1,"exercitiu":"Hip Thrust cu haltera la bancă","muschi":"Fesieri (Gluteus maximus), Biceps Femural","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Burete gros, tibii verticale la extensie completă, bărbia în piept, 1 sec contracție voluntară maximă la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Genuflexiuni la Smith / bara liberă","muschi":"Cvadriceps, Fesieri, Adductori","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Vârfuri la 15-30°, coborâre controlată 3 secunde sub paralel, pieptul sus, coloană neutră fără flexie lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Bulgarian Split Squats cu gantere","muschi":"Fesieri, Cvadriceps, Femurali","tip":"kg","seturi_repetari":"3 × 10-12 / pic","pauza":"90-120 sec","indicatii":"Trunchi aplecat la 15-20° în față pentru activarea maximă a fesierului; împinge exclusiv prin călcâiul din față.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Extensii picioare la aparat (Leg Extensions)","muschi":"Cvadriceps (Rectus femoris, Vastus)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Spatele lipit de spătar, extensie completă cu blocare 1 secundă la vârf, revenire lentă și controlată.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 2: Upper Pull (Spate, Deltoid Posterior & Biceps)","exercitii":[{"nr":1,"exercitiu":"Îndreptări convenționale cu haltera","muschi":"Lanț posterior complet (Fesieri, Dorsali, Trapez)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Bara aproape de tibii, bracing intra-abdominal, extensie completă fără hiperextensie lombară la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Tracțiuni la helcometru cu priză largă","muschi":"Dorsali mari, Biceps brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trunchi înclinat la 10-15°, trage bara spre claviculă, apropie ferm omoplații la contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Ramat la cablu din șezut cu mâner V","muschi":"Spate mijlociu, Romboid, Dorsali","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Spatele drept, trage mânerele spre abdomenul inferior, umerii coborâți, strânge omoplații 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Ramat din aplecat cu gantera pe bancă","muschi":"Dorsali mari, Spate mijlociu, Deltoid posterior","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Trunchi la 45°, coloană neutră, trage spre șold conducând mișcarea prin cot, fără elan.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Face Pull la cablu cu sfoara","muschi":"Deltoid posterior, Rotatori externi, Trapez","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Scripete la nivelul feței, trage spre tâmple separând capetele sforii și rotind umerii extern.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Flexii biceps cu gantere prin supinație","muschi":"Biceps brahial, Brahial","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Spatele drept, brațe verticale, flexie cu rotație spre exterior, alungire maximă la bază.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 3: Lower B (Fesieri & Lanț Posterior)","exercitii":[{"nr":1,"exercitiu":"Îndreptări românești (RDL) cu haltera","muschi":"Biceps femural, Fesieri, Erectori spinali","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Retragerea șoldului în spate, spatele drept și omoplații fixați, oprește când șoldul nu mai merge înapoi, contractă fesierii.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust la aparat / Smith Machine","muschi":"Fesieri (Gluteus maximus)","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Sprijin omoplați, tibii verticale la vârf, bărbia în piept, 1 secundă contracție maximă voluntară, coborâre lentă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Flexii femurali la aparat (șezut / culcat)","muschi":"Biceps femural","tip":"kg","seturi_repetari":"4 × 12-15","pauza":"60 sec","indicatii":"Bazinul lipit de bancă, flexie explozivă, pauză 1 sec la vârf, revenire în 3 secunde pentru întindere completă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Kickback la cablu pentru fesieri","muschi":"Fesieri (Gluteus maximus & superior)","tip":"kg","seturi_repetari":"3 × 15-20 / pic","pauza":"60 sec","indicatii":"Trunchi la 45°, coloană stabilă, duce piciorul spre înapoi și exterior la 30-45°, strânge tare fesierul la vârf.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 4: Upper Push & Core (Umeri, Piept & Triceps)","exercitii":[{"nr":1,"exercitiu":"Presă pentru piept la aparat (Chest Press)","muschi":"Pectoral mare, Deltoid ant, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Mânere aliniate cu pieptul, omoplați fixați pe spătar, coate la 45-60°, împinge prin contracția pectoralilor.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Fluturări la aparat (Pec Deck / Seated Fly)","muschi":"Pectoral mare (izolare / stretch)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Coate ușor îndoite și blocate în acel unghi, apropie conducând cu coatele, 1 sec contracție izometrică.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Împins deasupra capului la aparat (Shoulder Press)","muschi":"Deltoid anterior & lateral, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Coate în plan scapular la 30-45°, împinge controlat fără blocarea bruscă a coatelor, fără arcuire lombară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Presă militară pentru umeri cu gantere","muschi":"Deltoid anterior & lateral, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Spătar la 75-80°, abdomen încordat, împinge deasupra capului fără a arcui coloana.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Fluturări laterale la cablu / gantere","muschi":"Deltoid lateral","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Brațe ușor îndoite, condu cu cotul până la înălțimea umerilor, tempo lent de 2-3 secunde la coborâre.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Extensii triceps la cablu cu sfoară","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Coate imobilizate lângă corp, extinde în jos și depărtează sfoara spre exterior la finalul cursei.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":7,"exercitiu":"Ridicări de picioare la paralele / atârnat","muschi":"Drept abdominal inferior, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Evită balansul, basculare a bazinului în sus aducând genunchii spre piept, coborâre lentă.","greutate_kg":"","seturi_finalizate":"","status":""}]},
{"titlu":"Ziua 5: Glute Sculpt, Core & Conditioning / Cardio","exercitii":[{"nr":1,"exercitiu":"Abducții la aparat din șezut","muschi":"Fesieri mijlocii & superiori","tip":"kg","seturi_repetari":"4 × 20","pauza":"60 sec","indicatii":"Trunchi aplecat la 45°, mâini pe aparat, deschidere amplă, pauză 1-2 secunde pe contracție maximă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Abduction la cablu","muschi":"Fesieri mijlocii & superiori","tip":"kg","seturi_repetari":"3 × 15 / picior","pauza":"60 sec","indicatii":"Menține corpul rigid, mișcarea se face strict din articulația șoldului; control pe toată traiectoria.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Fandări în mers cu gantere","muschi":"Fesieri, Cvadriceps, Femurali","tip":"kg","seturi_repetari":"3 × 20 pași","pauza":"90-120 sec","indicatii":"Pas generos, unghi de 90° la genunchi, trunchi ușor aplecat în față, împinge puternic în călcâi.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Circuit Core Complet","muschi":"Transvers abdominal, Oblici, Drept abdominal","tip":"circuit","seturi_repetari":"3 circuite","pauza":"60 sec","indicatii":"Combinație: Ridicări de omoplat cu minge (2kg), Plank (bazin neutru), Russian Twist (rotește din tors), Crunch (flexie torace).","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Cardio ritmat (Bandă / Stairmaster)","muschi":"Sistem cardiovascular, Rezistență tren inferior","tip":"min","seturi_repetari":"15-20 min","pauza":"","indicatii":"Înclinație 10-12%, viteză 4.5-5.5 km/h, pășește ferm pe toată talpa, menține trunchiul drept fără sprijin pe mânere (Zona 2 aerobică).","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},
{"id":"bfit-6-zile","nr_zile":6,"tip":"Push-Pull-Legs","focus":"Fiecare grupă de 2 ori pe săptămână","titlu":"Push-Pull-Legs · 6 zile pe săptămână","subtitlu":"6 sesiuni / săpt (o zi pauză) · Fiecare grupă de 2 ori pe săptămână","continut_json":{"sectiuni_inceput":[{"titlu":"Organizarea săptămânii","continut":"- Ziua 1 (Push A): Luni\n- Ziua 2 (Pull A): Marți\n- Ziua 3 (Legs A): Miercuri\n- Ziua 4 (Push B): Joi\n- Ziua 5 (Pull B): Vineri\n- Ziua 6 (Legs B): Sâmbătă\n- Duminică: pauză completă\n- Pentru clienți cu cel puțin un an de antrenament constant. Dacă somnul sau recuperarea scad, revino la programul de 4 sau 5 zile."}],"sesiuni":[{"titlu":"Ziua 1: Push A (Piept, Umeri & Triceps)","exercitii":[{"nr":1,"exercitiu":"Împins de la piept cu gantere din culcat","muschi":"Pectorali mari, Deltoid anterior, Triceps","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Omoplații retrași și fixați pe bancă, coatele la 45-60°, coborâre controlată până la piept, împinge controlat.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Împins cu gantere pe bancă înclinată (30°)","muschi":"Pectorali mari (clavicular), Deltoid anterior, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Omoplații fixați pe bancă, coatele la 45-60° față de trunchi, coborâre controlată până la piept, împinge fără a desprinde umerii la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Presă militară pentru umeri cu gantere","muschi":"Deltoid anterior și lateral, Triceps","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Spătar la 75-80°, abdomenul încordat pentru protecția lombară; împinge deasupra capului fără arcuirea spatelui; coboară până la nivelul bărbiei.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Fluturări laterale cu gantere pentru umeri","muschi":"Deltoid lateral","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Brațe ușor îndoite la coate; ridică până la înălțimea umerilor conducând cu coatele; tempo 2-3 secunde pe coborâre, fără balans din trunchi.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Fluturări la aparat (Pec Deck / Seated Fly)","muschi":"Pectoral mare (izolare & stretch)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Coate ușor îndoite la 10-15° și blocate în acel unghi, apropie conducând cu coatele, 1 sec contracție izometrică.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Extensia coatelor la cablu cu sfoară (Triceps)","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Coatele lipite de trunchi și imobilizate, extinde complet în jos depărtând sfoara spre exterior la final; blochează tricepsul 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Ziua 2: Pull A (Spate & Biceps)","exercitii":[{"nr":1,"exercitiu":"Tracțiuni la helcometru cu priză largă","muschi":"Dorsali mari, Biceps brahial, Trapez inferior","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Priză pronată la 1.5 lățimea umerilor; trunchi ușor înclinat înapoi (10-15°); trage bara spre claviculă ducând coatele în jos și spre spate; apropie omoplații la final.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Ramat la cablu din șezut cu mâner V","muschi":"Spate mijlociu (Romboid, Trapez mediu), Dorsali","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Pieptul sus, spatele drept, trage mânerele spre abdomenul inferior, umerii coborâți departe de urechi, strânge omoplații 1 sec la contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Ramat din aplecat cu gantera pe bancă","muschi":"Dorsali mari, Spate mijlociu, Deltoid posterior","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Trunchi stabil la 45° sau paralel cu solul, coloană neutră, trage gantera spre șold, nu spre piept, condu mișcarea prin coate.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Face Pull la cablu cu sfoara","muschi":"Deltoid posterior, Rotatori externi, Trapez","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Scripete la nivelul ochilor, trage spre tâmple separând sfoara și rotind umerii extern; coatele la înălțimea umerilor, contracție 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Flexii biceps cu gantere prin supinație","muschi":"Biceps brahial, Brahial","tip":"kg","seturi_repetari":"3 × 12","pauza":"60 sec","indicatii":"Brațe verticale, rotește palma spre tavan la urcare, menține coatele fixe fără a le împinge înainte; întindere completă la bază.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Crunch la cablu / Ridicări de picioare","muschi":"Drept abdominal, Core profund","tip":"rep","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Crunch: flexie exclusiv din torace cu expirare completă. Ridicări: basculare a bazinului fără elan din șolduri, coborâre lentă.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Ziua 3: Legs A (Cvadriceps & Fesieri)","exercitii":[{"nr":1,"exercitiu":"Genuflexiuni la Smith / bara liberă","muschi":"Cvadriceps, Fesieri, Adductori","tip":"kg","seturi_repetari":"4 × 8-10","pauza":"90-120 sec","indicatii":"Vârfuri orientate spre exterior la 15-30°, tempo excentric 3 secunde, pieptul sus și spatele perfect drept pe tot parcursul.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust cu haltera la bancă","muschi":"Fesieri (gluteul mare), Biceps Femural","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Burete gros pe bazin, sprijin pe omoplați la marginea băncii, tălpi la nivelul umerilor, tibii verticale la vârf, bărbia în piept; 1 sec contracție maximă voluntară.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Presă de picioare (picioare sus & depărtate)","muschi":"Cvadriceps, Fesieri, Biceps Femural","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Tălpi în jumătatea superioară a platformei, coborâre adâncă fără rotunjirea bazinului, nu bloca brusc genunchii la finalul împingerii.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Extensii picioare la aparat","muschi":"Cvadriceps (izolare)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Spatele lipit de spătar, blocare 1 secundă la vârf, mișcare controlată la coborâre.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Abducții la aparat din șezut","muschi":"Fesieri mijlocii & superiori","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Apleacă trunchiul înainte la 45°, deschidere largă, menține 1-2 secunde pe contracție maximă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Ridicări pe vârfuri la aparat (Gambe)","muschi":"Gambe (Gastrocnemian, Solear)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Coborâre completă sub nivelul treptei, pauză 1 sec jos, contracție maximă 1 sec sus pe degetul mare.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Ziua 4: Push B (Umeri, Piept & Core)","exercitii":[{"nr":1,"exercitiu":"Împins deasupra capului la aparat (Shoulder Press)","muschi":"Deltoid anterior & lateral, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Coatele orientate la 30-45° înainte în plan scapular, împinge controlat fără blocarea coatelor, coborâre lentă 2-3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Presă pentru piept la aparat (Chest Press Machine)","muschi":"Pectoral mare, Deltoid ant, Triceps","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Mânere aliniate cu linia pieptului, piept deschis, coate la 45-60°, împinge prin pectorali fără blocare bruscă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Fluturări laterale la cablu / cu gantere","muschi":"Deltoid lateral","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Brațe ușor flexate, condu mișcarea cu cotul până la nivelul umerilor; coborâre lentă 2-3 secunde, fără balans din trunchi.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Extensii triceps la cablu cu sfoară / bara dreaptă","muschi":"Triceps brahial (toate capetele)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Coate imobilizate lângă corp, extensie completă și deschidere spre exterior la final, blochează 1 sec pe contracție.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Plank / Scândură izometrică","muschi":"Core profund, Fesieri, Umeri","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Antebrațe paralele, coate sub umeri, bazin neutru (ușoară retroversie); încordează simultan abdomenul, fesierii și coapsele; respirație constantă.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Ziua 5: Pull B (Spate, Deltoid Posterior & Biceps)","exercitii":[{"nr":1,"exercitiu":"Tracțiuni la helcometru priză pronată largă","muschi":"Dorsali mari, Biceps brahial","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Trunchi înclinat la 10-15°, trage spre claviculă ducând coatele în jos și spre spate, apropie ferm omoplații.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Ramat la aparat din șezut / cablu","muschi":"Dorsali, Romboid, Trapez mijlociu","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Trage mânerele spre abdomenul inferior, umerii coborâți, strânge omoplații la contracție 1 secundă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Face Pull la cablu cu sfoara","muschi":"Deltoid posterior, Rotatori externi, Trapez","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Scripete la nivelul ochilor, trage spre tâmple separând sfoara și rotind umerii extern; coatele la înălțimea umerilor, contracție 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Flexii biceps cu gantere pe bancă înclinată 45°","muschi":"Biceps brahial (cap lung), Brahial","tip":"kg","seturi_repetari":"3 × 12","pauza":"60 sec","indicatii":"Spatele și capul lipite de bancă, alungire musculară maximă la bază, flexie cu supinație completă la vârf.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Ridicări de picioare la paralele / atârnat","muschi":"Drept abdominal inferior, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Evită balansul; inițiază mișcarea basculând bazinul spre piept, coborâre lentă și controlată a picioarelor.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Ziua 6: Legs B (Lanț Posterior & Fesieri)","exercitii":[{"nr":1,"exercitiu":"Îndreptări românești (RDL) cu haltera","muschi":"Biceps Femural, Fesieri, Erectori spinali","tip":"kg","seturi_repetari":"4 × 8-10","pauza":"90-120 sec","indicatii":"Hip hinge strict, împinge șoldul în spate, genunchi ușor flexați, haltera coboară lipită de tibii, contracție voluntară a fesierilor la revenire.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Hip Thrust la aparat / Smith Machine","muschi":"Fesieri (Gluteus maximus)","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Sprijin omoplați, tibii verticale la vârf, bărbia în piept, 1 secundă contracție maximă voluntară, coborâre lentă.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Bulgarian Split Squats cu gantere","muschi":"Fesieri, Cvadriceps, Femurali","tip":"kg","seturi_repetari":"3 × 10-12 / pic","pauza":"90-120 sec","indicatii":"Trunchi aplecat la 15-20° în față pentru activarea maximă a fesierului; împinge exclusiv prin călcâiul din față.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Flexii femurali la aparat (culcat pe burtă)","muschi":"Biceps Femural (toate capetele)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Burete pe treimea inferioară a gambei, bazin lipit pe bancă; flexie puternică cu 1 sec pauză, tempo de coborâre de 3 secunde.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Kickback la cablu pentru fesieri","muschi":"Fesieri (Gluteus maximus & superior)","tip":"kg","seturi_repetari":"3 × 15-20 / pic","pauza":"60 sec","indicatii":"Trunchi la 45°, coloană stabilă; duce piciorul spre înapoi și exterior la 30-45° cu genunchiul ușor îndoit; strânge tare fesierul.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Russian Twist cu disc / minge","muschi":"Oblici interni/externi, Drept abdominal","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Trunchi la 45°, picioare ușor ridicate, rotește umerii dintr-o parte în alta controlând mișcarea exclusiv din tors.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}}];

// Aceleași șabloane în engleză (aceleași id-uri și structură), folosite când limba e EN
const SABLOANE_PLAN_EN = [{"id":"bfit-2-zile","nr_zile":2,"tip":"Full Body Split","focus":"All major muscle groups","titlu":"Full Body Split · 2 days per week","subtitlu":"2 sessions / week (48-72h rest) · All major muscle groups","continut_json":{"sectiuni_inceput":[{"titlu":"Weekly schedule","continut":"- Day 1 (Full Body A): Monday or Tuesday. Controlled tempo on the way down\n- Day 2 (Full Body B): Thursday or Friday. 48h recovery after Day 1"}],"sesiuni":[{"titlu":"Day 1: Full Body A (Focus Glutes, Quads & Back)","exercitii":[{"nr":1,"exercitiu":"Barbell Hip Thrust on bench","muschi":"Glutes (gluteus maximus), Hamstrings","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Thick pad on the hips, shoulder blades on the edge of the bench, feet shoulder-width apart, shins vertical at the top, chin tucked; 1 sec maximal voluntary contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Smith Machine Squats / Goblet Squat","muschi":"Quadriceps, Glutes (gluteus maximus), Core","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Feet slightly wider than shoulders, toes out 15-30°, controlled 3-second descent below parallel, chest up, neutral spine with no lumbar flexion.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain (Glutes, Erectors, Back)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Feet hip-width apart, bar 2-3 cm from the shins, overhand grip, brace your core, keep the bar close to your legs, lock out upright by squeezing the glutes.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Wide-Grip Lat Pulldown","muschi":"Lats, Biceps brachii, Lower trapezius","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Overhand grip at 1.5× shoulder width; torso leaning slightly back (10-15°); pull the bar to the collarbone driving the elbows down and back; squeeze the shoulder blades at the end.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Seated Cable Row with V-handle","muschi":"Mid back (Rhomboids, Middle trapezius), Lats","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Chest up, back straight, pull the handles to the lower abdomen, shoulders down away from the ears, squeeze the shoulder blades for 1 sec at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Incline Dumbbell Press (30°)","muschi":"Pectoralis major (clavicular), Front deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Shoulder blades pinned to the bench, elbows at 45-60° from the torso, controlled descent to the chest, press without lifting the shoulders at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":7,"exercitiu":"Dumbbell Lateral Raises","muschi":"Lateral deltoid","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Arms slightly bent at the elbows; raise to shoulder height leading with the elbows; 2-3 second tempo on the way down, no swinging from the torso.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":8,"exercitiu":"Plank / Isometric hold","muschi":"Deep core, Glutes, Shoulders","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Forearms parallel, elbows under shoulders, neutral pelvis (slight posterior tilt); tighten abs, glutes and thighs at the same time; breathe steadily.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 2: Full Body B (Posterior Chain, Hamstrings, Back & Arms)","exercitii":[{"nr":1,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain, Glutes, Hamstrings","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Feet hip-width apart, bar close to the shins, neutral gaze, deep bracing, drive through the heels and squeeze the glutes without lumbar hyperextension.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Dumbbell / Barbell Romanian Deadlifts (RDL)","muschi":"Hamstrings, Glutes, Spinal erectors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Push the hips back (hip hinge), knees slightly bent and fixed, weight slides close to the legs, squeeze the glutes on the way up.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Leg Press (feet high & wide)","muschi":"Quadriceps, Glutes, Hamstrings","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Feet on the upper half of the platform, deep descent without rounding the pelvis, don't snap the knees locked at the end of the push.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Machine Leg Curls (seated/lying)","muschi":"Hamstrings (Semitendinosus, Semimembranosus)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Pad on the lower third of the calf, hips pressed to the bench; explosive curl, 1 sec pause at the contraction, slow 3-second return.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"One-Arm Dumbbell Row on bench","muschi":"Lats, Mid back, Rear deltoid","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Torso stable at 45° or parallel to the floor, neutral spine, pull the dumbbell toward the hip, not the chest, lead with the elbow.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Cable Face Pull with rope","muschi":"Rear deltoid, External rotators, Trapezius","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Pulley at eye level, pull toward the temples splitting the rope and rotating the shoulders outward; elbows at shoulder height, 1 sec contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":7,"exercitiu":"Cable Rope Pushdown (Triceps)","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Elbows tucked to the torso and fixed, extend fully down spreading the rope outward at the end; hold the triceps for 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":8,"exercitiu":"Dumbbell Supinated Biceps Curls","muschi":"Biceps brachii, Brachialis","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Arms vertical, turn the palm toward the ceiling on the way up, keep the elbows fixed without pushing them forward; full stretch at the bottom.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":9,"exercitiu":"Cable Crunch / Leg Raises","muschi":"Rectus abdominis, Deep core","tip":"rep","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Crunch: flex only through the torso with a full exhale. Raises: tilt the pelvis without momentum from the hips, lower slowly.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},{"id":"bfit-2-zile-ciclu","nr_zile":2,"tip":"Full Body + Upper/Lower","focus":"2-week cycle, alternating","titlu":"Full Body + Upper/Lower · 2 days, 2-week cycle","subtitlu":"2 sessions / week (48-72h rest) · 2-week cycle: Full Body, then Upper/Lower","continut_json":{"sectiuni_inceput":[{"titlu":"Weekly schedule","continut":"- Week 1: Full Body A (Monday or Tuesday) and Full Body B (Thursday or Friday)\n- Week 2: Upper Body A (Monday or Tuesday) and Lower Body A (Thursday or Friday)\n- Then the cycle restarts from Week 1, with slightly heavier weights where the form was correct"}],"sesiuni":[{"titlu":"Wk 1 · Day 1: Full Body A (Focus Glutes, Quads & Back)","exercitii":[{"nr":1,"exercitiu":"Barbell Hip Thrust on bench","muschi":"Glutes (gluteus maximus), Hamstrings","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Thick pad on the hips, shoulder blades on the edge of the bench, feet shoulder-width apart, shins vertical at the top, chin tucked; 1 sec maximal voluntary contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Smith Machine Squats / Goblet Squat","muschi":"Quadriceps, Glutes (gluteus maximus), Core","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Feet slightly wider than shoulders, toes out 15-30°, controlled 3-second descent below parallel, chest up, neutral spine with no lumbar flexion.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain (Glutes, Erectors, Back)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Feet hip-width apart, bar 2-3 cm from the shins, overhand grip, brace your core, keep the bar close to your legs, lock out upright by squeezing the glutes.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Wide-Grip Lat Pulldown","muschi":"Lats, Biceps brachii, Lower trapezius","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Overhand grip at 1.5× shoulder width; torso leaning slightly back (10-15°); pull the bar to the collarbone driving the elbows down and back; squeeze the shoulder blades at the end.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Seated Cable Row with V-handle","muschi":"Mid back (Rhomboids, Middle trapezius), Lats","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Chest up, back straight, pull the handles to the lower abdomen, shoulders down away from the ears, squeeze the shoulder blades for 1 sec at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Incline Dumbbell Press (30°)","muschi":"Pectoralis major (clavicular), Front deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Shoulder blades pinned to the bench, elbows at 45-60° from the torso, controlled descent to the chest, press without lifting the shoulders at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":7,"exercitiu":"Dumbbell Lateral Raises","muschi":"Lateral deltoid","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Arms slightly bent at the elbows; raise to shoulder height leading with the elbows; 2-3 second tempo on the way down, no swinging from the torso.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":8,"exercitiu":"Plank / Isometric hold","muschi":"Deep core, Glutes, Shoulders","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Forearms parallel, elbows under shoulders, neutral pelvis (slight posterior tilt); tighten abs, glutes and thighs at the same time; breathe steadily.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Wk 1 · Day 2: Full Body B (Posterior Chain, Hamstrings, Back & Arms)","exercitii":[{"nr":1,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain, Glutes, Hamstrings","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Feet hip-width apart, bar close to the shins, neutral gaze, deep bracing, drive through the heels and squeeze the glutes without lumbar hyperextension.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Dumbbell / Barbell Romanian Deadlifts (RDL)","muschi":"Hamstrings, Glutes, Spinal erectors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Push the hips back (hip hinge), knees slightly bent and fixed, weight slides close to the legs, squeeze the glutes on the way up.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Leg Press (feet high & wide)","muschi":"Quadriceps, Glutes, Hamstrings","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Feet on the upper half of the platform, deep descent without rounding the pelvis, don't snap the knees locked at the end of the push.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Machine Leg Curls (seated/lying)","muschi":"Hamstrings (Semitendinosus, Semimembranosus)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Pad on the lower third of the calf, hips pressed to the bench; explosive curl, 1 sec pause at the contraction, slow 3-second return.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"One-Arm Dumbbell Row on bench","muschi":"Lats, Mid back, Rear deltoid","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Torso stable at 45° or parallel to the floor, neutral spine, pull the dumbbell toward the hip, not the chest, lead with the elbow.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Cable Face Pull with rope","muschi":"Rear deltoid, External rotators, Trapezius","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Pulley at eye level, pull toward the temples splitting the rope and rotating the shoulders outward; elbows at shoulder height, 1 sec contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":7,"exercitiu":"Cable Rope Pushdown (Triceps)","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Elbows tucked to the torso and fixed, extend fully down spreading the rope outward at the end; hold the triceps for 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":8,"exercitiu":"Dumbbell Supinated Biceps Curls","muschi":"Biceps brachii, Brachialis","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Arms vertical, turn the palm toward the ceiling on the way up, keep the elbows fixed without pushing them forward; full stretch at the bottom.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":9,"exercitiu":"Cable Crunch / Leg Raises","muschi":"Rectus abdominis, Deep core","tip":"rep","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Crunch: flex only through the torso with a full exhale. Raises: tilt the pelvis without momentum from the hips, lower slowly.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Wk 2 · Day 1: Upper Body A (Back & Arms + Chest)","exercitii":[{"nr":1,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain (Glutes, Lats, Trapezius)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Neutral back, air in the belly (bracing), the bar slides close to the legs, lock out upright without arching the lower back.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Wide Overhand-Grip Lat Pulldown","muschi":"Lats, Biceps brachii","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Torso leaning 10-15°, pull to the collarbone driving the elbows down and back, squeeze the shoulder blades firmly.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Seated Machine / Cable Row","muschi":"Lats, Rhomboids, Middle trapezius","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Pull the handles to the lower abdomen, shoulders down, squeeze the shoulder blades at the contraction for 1 second.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Flat Dumbbell Chest Press","muschi":"Pectoralis major, Front deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Shoulder blades retracted and pinned to the bench, elbows at 45-60°, controlled descent to the chest, press with control.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Dumbbell Supinated Biceps Curls","muschi":"Biceps brachii, Brachialis","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Arms vertical, twist the palm outward at the top, elbows stay fixed and pointing to the floor.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Cable Rope Triceps Extensions","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Elbows fixed, extend the forearms down and spread the rope outward at the end, 1 sec pause at lockout.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Wk 2 · Day 2: Lower Body A (Quads & Glutes)","exercitii":[{"nr":1,"exercitiu":"Smith Machine / Free Barbell Squats","muschi":"Quadriceps, Glutes, Adductors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Toes pointed out 15-30°, 3-second eccentric tempo, chest up and back perfectly straight throughout.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Barbell Hip Thrust on bench","muschi":"Glutes (Gluteus maximus), Hamstrings","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Shoulder blades on the edge of the bench, feet shoulder-width apart, 1 sec voluntary contraction at full extension, controlled descent.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Dumbbell Reverse Lunges","muschi":"Glutes, Quadriceps, Hamstrings","tip":"kg","seturi_repetari":"3 × 12 / leg","pauza":"90-120 sec","indicatii":"Big step back, knee at 90°, torso leaning slightly forward, drive through the heel of the front foot without swinging.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Machine Leg Extensions","muschi":"Quadriceps (isolation)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Back pressed against the backrest, 1 second hold at the top, controlled movement on the way down.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Seated Machine Hip Abductions","muschi":"Glutes (medius & upper)","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Lean the torso forward to 45°, open wide, hold 1-2 seconds at peak contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Machine Calf Raises","muschi":"Calves (Gastrocnemius, Soleus)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Full descent below step level, 1 sec pause at the bottom, 1 sec peak contraction at the top on the big toe.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},{"id":"bfit-3-zile","nr_zile":3,"tip":"Lower-Upper-Lower","focus":"Glutes, Legs, Upper body","titlu":"Lower-Upper-Lower · 3 days per week","subtitlu":"3 sessions / week (One rest day) · Glutes, Legs, Upper body","continut_json":{"sectiuni_inceput":[{"titlu":"Weekly schedule","continut":"- Day 1 (Lower Body A): Monday. Optimal activation of the anterior chain and glutes\n- Day 2 (Upper Body & Core): Wednesday. Posture, toned back and core stability\n- Day 3 (Lower Body B): Friday. Glute and hamstring hypertrophy"}],"sesiuni":[{"titlu":"Day 1: Lower Body A (Quads & Glutes)","exercitii":[{"nr":1,"exercitiu":"Smith Machine / Free Barbell Squats","muschi":"Quadriceps, Glutes, Adductors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Feet slightly wider than shoulders, toes out 15-30°, 3-second descent below parallel, knees tracking over the toes, back straight.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Barbell Hip Thrust on bench / machine","muschi":"Glutes (Gluteus maximus), Hamstrings","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Protective pad, shins vertical at full extension, chin tucked, 1 second maximal voluntary contraction at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Dumbbell Reverse Lunges","muschi":"Glutes, Quadriceps, Hamstrings","tip":"kg","seturi_repetari":"3 × 12 / leg","pauza":"90-120 sec","indicatii":"Take a generous step back for a 90° angle at the front knee, torso leaning slightly forward, drive hard through the heel on the way up.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Machine Leg Extensions","muschi":"Quadriceps (Rectus femoris, Vastus)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Back pressed against the backrest, knees aligned with the pivot, 1 second hold at the top, controlled return without clanking the plates.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Seated Machine Hip Abductions","muschi":"Glutes (medius & upper, Gluteus medius)","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Torso leaning 45° with hands on the machine to isolate the glute medius; open wide, 1-2 sec pause at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Machine Calf Raises","muschi":"Calves (Gastrocnemius, Soleus)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Deep descent below step level to stretch the Achilles tendon, 1 sec pause at the bottom, 1 sec peak contraction at the top on the big toe.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 2: Upper Body & Core (Posture, Back & Stability)","exercitii":[{"nr":1,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain (Glutes, Lats, Trapezius)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Feet hip-width apart, lower the hips until you reach the bar, chest open, intra-abdominal bracing, full extension without arching the lower back.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Wide Overhand-Grip Lat Pulldown","muschi":"Lats, Biceps, Teres major","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Slight lean back 10-15°, pull the bar to the collarbone driving the elbows back, squeeze the shoulder blades firmly at the end, full stretch on the return.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Seated Machine / Cable Row","muschi":"Lats, Rhomboids, Middle trapezius","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Chest supported or back straight, shoulders down away from the ears, pull to the lower abdomen and hold 1 sec at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Flat Dumbbell Chest Press","muschi":"Pectoralis major, Front deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Shoulder blades pinned to the bench, elbows at 45-60° from the torso, controlled descent to chest level, press without jerking.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Dumbbell Military Shoulder Press","muschi":"Front and lateral deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Backrest at 75-80°, abs tight to protect the lower back; press overhead without arching the back; lower to chin level.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Cable / Dumbbell Lateral Raises","muschi":"Lateral deltoid","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Arms slightly bent, lead the movement with the elbow up to shoulder height; slow 2-3 second descent, no swinging from the torso.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":7,"exercitiu":"Cable Triceps Extensions with rope / straight bar","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Elbows fixed by the body, full extension and spread outward at the end, hold 1 sec at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":8,"exercitiu":"Incline Dumbbell Biceps Curls (45° bench)","muschi":"Biceps brachii (long head), Brachialis","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Back and head against the bench, maximal stretch at the bottom, curl with full supination at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":9,"exercitiu":"Hanging / Parallel Bar Leg Raises","muschi":"Lower rectus abdominis, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Avoid swinging; start the movement by tilting the pelvis toward the chest, lower the legs slowly and with control.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 3: Lower Body B (Posterior Chain & Glutes Focus)","exercitii":[{"nr":1,"exercitiu":"Barbell Romanian Deadlifts (RDL)","muschi":"Hamstrings, Glutes, Spinal erectors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Strict hip hinge, push the hips back, knees slightly bent, the bar slides down close to the shins, voluntary glute contraction on the way up.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Single-Leg Cable / Dumbbell Hip Thrust","muschi":"Glutes (Gluteus maximus & medius)","tip":"kg","seturi_repetari":"3 × 12 / leg","pauza":"90-120 sec","indicatii":"Shoulder blades on the edge of the bench, working shin vertical, firm 1 second contraction at full extension.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Machine Leg Curls (lying face down)","muschi":"Hamstrings (all heads)","tip":"kg","seturi_repetari":"4 × 12-15","pauza":"60 sec","indicatii":"Pad on the lower third of the calf, hips pressed to the bench; powerful curl with a 1 sec pause, 3-second lowering tempo.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Dumbbell Box / Bench Step-ups","muschi":"Glutes, Quadriceps","tip":"kg","seturi_repetari":"3 × 12 / leg","pauza":"90-120 sec","indicatii":"Working foot on the bench, heel pressing firmly, push only through the top leg with no push-off from the floor; slow 3-second descent.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Cable Hip Extensions (Kickbacks)","muschi":"Glutes (Gluteus maximus & medius)","tip":"kg","seturi_repetari":"3 × 15-20 / leg","pauza":"60 sec","indicatii":"Torso leaning 45°, neutral spine; move the leg back and slightly out at 30-45°, squeeze the glute hard at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Russian Twist with plate / ball","muschi":"Internal/external obliques, Rectus abdominis","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Torso at 45°, feet slightly raised, rotate the shoulders side to side controlling the movement only from the torso.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},{"id":"bfit-4-zile","nr_zile":4,"tip":"Upper-Lower Split","focus":"Lower & upper body balance","titlu":"Upper-Lower Split · 4 days per week","subtitlu":"4 sessions / week (Rest after 2 days) · Lower & upper body balance","continut_json":{"sectiuni_inceput":[{"titlu":"Weekly schedule","continut":"- Day 1 (Lower Body A): Monday. Lower body toning\n- Day 2 (Upper Body A): Tuesday. Toned upper body & arms\n- Day 3 (Lower Body B): Thursday. Glute and hamstring isolation\n- Day 4 (Upper Body B): Friday. Delts, chest and ab definition"}],"sesiuni":[{"titlu":"Day 1: Lower Body A (Quads & Glutes)","exercitii":[{"nr":1,"exercitiu":"Smith Machine / Free Barbell Squats","muschi":"Quadriceps, Glutes, Adductors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Toes pointed out 15-30°, 3-second eccentric tempo, chest up and back perfectly straight throughout.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Barbell Hip Thrust on bench","muschi":"Glutes (Gluteus maximus), Hamstrings","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Shoulder blades on the edge of the bench, feet shoulder-width apart, 1 sec voluntary contraction at full extension, controlled descent.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Dumbbell Reverse Lunges","muschi":"Glutes, Quadriceps, Hamstrings","tip":"kg","seturi_repetari":"3 × 12 / leg","pauza":"90-120 sec","indicatii":"Big step back, knee at 90°, torso leaning slightly forward, drive through the heel of the front foot without swinging.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Machine Leg Extensions","muschi":"Quadriceps (isolation)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Back pressed against the backrest, 1 second hold at the top, controlled movement on the way down.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Seated Machine Hip Abductions","muschi":"Glutes (medius & upper)","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Lean the torso forward to 45°, open wide, hold 1-2 seconds at peak contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Machine Calf Raises","muschi":"Calves (Gastrocnemius, Soleus)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Full descent below step level, 1 sec pause at the bottom, 1 sec peak contraction at the top on the big toe.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 2: Upper Body A (Back & Arms + Chest)","exercitii":[{"nr":1,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain (Glutes, Lats, Trapezius)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Neutral back, air in the belly (bracing), the bar slides close to the legs, lock out upright without arching the lower back.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Wide Overhand-Grip Lat Pulldown","muschi":"Lats, Biceps brachii","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Torso leaning 10-15°, pull to the collarbone driving the elbows down and back, squeeze the shoulder blades firmly.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Seated Machine / Cable Row","muschi":"Lats, Rhomboids, Middle trapezius","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Pull the handles to the lower abdomen, shoulders down, squeeze the shoulder blades at the contraction for 1 second.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Flat Dumbbell Chest Press","muschi":"Pectoralis major, Front deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Shoulder blades retracted and pinned to the bench, elbows at 45-60°, controlled descent to the chest, press with control.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Dumbbell Supinated Biceps Curls","muschi":"Biceps brachii, Brachialis","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Arms vertical, twist the palm outward at the top, elbows stay fixed and pointing to the floor.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Cable Rope Triceps Extensions","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Elbows fixed, extend the forearms down and spread the rope outward at the end, 1 sec pause at lockout.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 3: Lower Body B (Posterior Chain & Glutes)","exercitii":[{"nr":1,"exercitiu":"Barbell Romanian Deadlifts (RDL)","muschi":"Hamstrings, Glutes, Spinal erectors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Strict hip hinge, knees slightly bent, the weight slides down the shins, stop when the hips can't go back any further, squeeze the glutes.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Single-Leg Cable or Dumbbell Hip Thrust","muschi":"Glutes (Gluteus maximus), Stability","tip":"kg","seturi_repetari":"3 × 12 / leg","pauza":"90-120 sec","indicatii":"Shoulder blades on the bench, shin vertical, chin tucked, 1 second maximal voluntary contraction at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Machine Leg Curls (lying face down)","muschi":"Hamstrings (all heads)","tip":"kg","seturi_repetari":"4 × 12-15","pauza":"60 sec","indicatii":"Hips and thighs pressed to the bench, explosive curl, 1 sec pause at the top, slow 3-second return.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Dumbbell Box / Bench Step-ups","muschi":"Glutes (Gluteus maximus), Quadriceps","tip":"kg","seturi_repetari":"3 × 12 / leg","pauza":"90-120 sec","indicatii":"Heel pressed firmly into the box, push only through the top leg, slow 3-second descent with no push-off from the floor.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Cable Glute Kickback","muschi":"Glutes (Gluteus maximus & upper)","tip":"kg","seturi_repetari":"3 × 15-20 / leg","pauza":"60 sec","indicatii":"Torso at 45°, stable spine; move the leg back and out at 30-45° with the knee slightly bent; squeeze the glute hard.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 4: Upper Body B (Shoulders, Chest, Back & Core)","exercitii":[{"nr":1,"exercitiu":"Machine Overhead Press (Shoulder Press)","muschi":"Front & lateral deltoid, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Elbows angled 30-45° forward in the scapular plane, press with control without locking the elbows, slow 2-3 second descent.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Dumbbell Military Shoulder Press","muschi":"Front & lateral deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Backrest at 75-80°, abs tight, press the dumbbells without arching the back, lower to chin level.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Cable / Dumbbell Lateral Raises","muschi":"Lateral deltoid","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Lead the movement with the elbow, slow 2-3 second tempo on the way down, isolation with no swinging from the torso.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Machine Chest Press (Chest Press Machine)","muschi":"Pectoralis major, Front delt, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Handles aligned with the chest line, chest open, elbows at 45-60°, press through the pecs without snapping into lockout.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Incline Dumbbell Press (30°)","muschi":"Pectoralis major, Front delt, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Shoulder blades pinned, controlled descent to the chest, press without lifting the shoulders off the bench at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Machine Flyes (Pec Deck / Seated Fly)","muschi":"Pectoralis major (isolation & stretch)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Elbows slightly bent at 10-15° and locked at that angle, bring together leading with the elbows, 1 sec isometric contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":7,"exercitiu":"One-Arm Dumbbell Row on bench","muschi":"Lats, Mid back, Rear delt","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Torso stable at 45°, pull the weight toward the hip leading with the elbow, no momentum from the legs.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":8,"exercitiu":"Hanging / Parallel Bar Leg Raises","muschi":"Lower rectus abdominis, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Avoid swinging, tilt the pelvis up bringing the knees toward the chest, lower slowly.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":9,"exercitiu":"Plank / Isometric hold","muschi":"Deep core, Glutes, Shoulders","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Forearms parallel, pelvis in neutral position, tighten abs, glutes and quads at the same time.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},{"id":"bfit-5-zile","nr_zile":5,"tip":"Advanced","focus":"Maximum hypertrophy & glutes","titlu":"Advanced · 5 days per week","subtitlu":"5 sessions / week (Volume planning) · Maximum hypertrophy & glutes","continut_json":{"sectiuni_inceput":[{"titlu":"Weekly schedule","continut":"- Day 1 (Lower A): Monday\n- Day 2 (Upper Pull): Tuesday\n- Day 3 (Lower B): Thursday\n- Day 4 (Upper Push & Core): Friday\n- Day 5 (Glute Sculpt, Core & Conditioning / Cardio): Saturday"}],"sesiuni":[{"titlu":"Day 1: Lower A (Glutes & Quads Focus)","exercitii":[{"nr":1,"exercitiu":"Barbell Hip Thrust on bench","muschi":"Glutes (Gluteus maximus), Hamstrings","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Thick pad, shins vertical at full extension, chin tucked, 1 sec maximal voluntary contraction at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Smith Machine / Free Barbell Squats","muschi":"Quadriceps, Glutes, Adductors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Toes out 15-30°, controlled 3-second descent below parallel, chest up, neutral spine with no lumbar flexion.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Dumbbell Bulgarian Split Squats","muschi":"Glutes, Quadriceps, Hamstrings","tip":"kg","seturi_repetari":"3 × 10-12 / leg","pauza":"90-120 sec","indicatii":"Torso leaning 15-20° forward for maximal glute activation; push only through the front heel.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Machine Leg Extensions","muschi":"Quadriceps (Rectus femoris, Vastus)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Back pressed against the backrest, full extension with a 1 second hold at the top, slow and controlled return.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 2: Upper Pull (Back, Rear Delts & Biceps)","exercitii":[{"nr":1,"exercitiu":"Conventional Barbell Deadlifts","muschi":"Full posterior chain (Glutes, Lats, Trapezius)","tip":"kg","seturi_repetari":"4 × 8","pauza":"90-120 sec","indicatii":"Bar close to the shins, intra-abdominal bracing, full extension without lumbar hyperextension at the top.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Wide-Grip Lat Pulldown","muschi":"Lats, Biceps brachii","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Torso leaning 10-15°, pull the bar to the collarbone, squeeze the shoulder blades firmly at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Seated Cable Row with V-handle","muschi":"Mid back, Rhomboids, Lats","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Back straight, pull the handles to the lower abdomen, shoulders down, squeeze the shoulder blades for 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"One-Arm Dumbbell Row on bench","muschi":"Lats, Mid back, Rear deltoid","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Torso at 45°, neutral spine, pull toward the hip leading with the elbow, no momentum.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Cable Face Pull with rope","muschi":"Rear deltoid, External rotators, Trapezius","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Pulley at face level, pull toward the temples splitting the rope ends and rotating the shoulders outward.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Dumbbell Supinated Biceps Curls","muschi":"Biceps brachii, Brachialis","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Back straight, arms vertical, curl with outward rotation, maximal stretch at the bottom.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 3: Lower B (Glutes & Posterior Chain)","exercitii":[{"nr":1,"exercitiu":"Barbell Romanian Deadlifts (RDL)","muschi":"Hamstrings, Glutes, Spinal erectors","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Push the hips back, back straight and shoulder blades set, stop when the hips can't go back any further, squeeze the glutes.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Machine / Smith Machine Hip Thrust","muschi":"Glutes (Gluteus maximus)","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Shoulder blades supported, shins vertical at the top, chin tucked, 1 second maximal voluntary contraction, slow descent.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Machine Leg Curls (seated / lying)","muschi":"Hamstrings","tip":"kg","seturi_repetari":"4 × 12-15","pauza":"60 sec","indicatii":"Hips pressed to the bench, explosive curl, 1 sec pause at the top, 3-second return for a full stretch.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Cable Glute Kickback","muschi":"Glutes (Gluteus maximus & upper)","tip":"kg","seturi_repetari":"3 × 15-20 / leg","pauza":"60 sec","indicatii":"Torso at 45°, stable spine, move the leg back and out at 30-45°, squeeze the glute hard at the top.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 4: Upper Push & Core (Shoulders, Chest & Triceps)","exercitii":[{"nr":1,"exercitiu":"Machine Chest Press","muschi":"Pectoralis major, Front delt, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Handles aligned with the chest, shoulder blades pinned to the backrest, elbows at 45-60°, press by contracting the pecs.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Machine Flyes (Pec Deck / Seated Fly)","muschi":"Pectoralis major (isolation / stretch)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Elbows slightly bent and locked at that angle, bring together leading with the elbows, 1 sec isometric contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Machine Overhead Press (Shoulder Press)","muschi":"Front & lateral deltoid, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Elbows in the scapular plane at 30-45°, press with control without snapping the elbows locked, no lumbar arching.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Dumbbell Military Shoulder Press","muschi":"Front & lateral deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"90-120 sec","indicatii":"Backrest at 75-80°, abs tight, press overhead without arching the spine.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Cable / Dumbbell Lateral Raises","muschi":"Lateral deltoid","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Arms slightly bent, lead with the elbow up to shoulder height, slow 2-3 second tempo on the way down.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":6,"exercitiu":"Cable Rope Triceps Extensions","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Elbows fixed by the body, extend down and spread the rope outward at the end of the movement.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":7,"exercitiu":"Hanging / Parallel Bar Leg Raises","muschi":"Lower rectus abdominis, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Avoid swinging, tilt the pelvis up bringing the knees toward the chest, lower slowly.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 5: Glute Sculpt, Core & Conditioning / Cardio","exercitii":[{"nr":1,"exercitiu":"Seated Machine Hip Abductions","muschi":"Glutes (medius & upper)","tip":"kg","seturi_repetari":"4 × 20","pauza":"60 sec","indicatii":"Torso leaning 45°, hands on the machine, open wide, 1-2 second pause at peak contraction.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":2,"exercitiu":"Cable Hip Abduction","muschi":"Glutes (medius & upper)","tip":"kg","seturi_repetari":"3 × 15 / leg","pauza":"60 sec","indicatii":"Keep the body rigid, the movement comes strictly from the hip joint; control through the full range.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":3,"exercitiu":"Dumbbell Walking Lunges","muschi":"Glutes, Quadriceps, Hamstrings","tip":"kg","seturi_repetari":"3 × 20 steps","pauza":"90-120 sec","indicatii":"Generous step, 90° angle at the knee, torso leaning slightly forward, drive hard through the heel.","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":4,"exercitiu":"Full Core Circuit","muschi":"Transverse abdominis, Obliques, Rectus abdominis","tip":"circuit","seturi_repetari":"3 circuits","pauza":"60 sec","indicatii":"Combo: Ball crunches (2kg), Plank (neutral pelvis), Russian Twist (rotate from the torso), Crunch (torso flexion).","greutate_kg":"","seturi_finalizate":"","status":""},{"nr":5,"exercitiu":"Steady cardio (Treadmill / Stairmaster)","muschi":"Cardiovascular system, Lower body endurance","tip":"min","seturi_repetari":"15-20 min","pauza":"","indicatii":"Incline 10-12%, speed 4.5-5.5 km/h, step firmly on the whole foot, keep the torso upright without holding the handles (aerobic Zone 2).","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}},
{"id":"bfit-6-zile","nr_zile":6,"tip":"Push-Pull-Legs","focus":"Each muscle group twice a week","titlu":"Push-Pull-Legs · 6 days per week","subtitlu":"6 sessions / week (one rest day) · Each muscle group twice a week","continut_json":{"sectiuni_inceput":[{"titlu":"Weekly schedule","continut":"- Day 1 (Push A): Monday\n- Day 2 (Pull A): Tuesday\n- Day 3 (Legs A): Wednesday\n- Day 4 (Push B): Thursday\n- Day 5 (Pull B): Friday\n- Day 6 (Legs B): Saturday\n- Sunday: full rest\n- For clients with at least one year of consistent training. If sleep or recovery drops, go back to the 4 or 5 day program."}],"sesiuni":[{"titlu":"Day 1: Push A (Chest, Shoulders & Triceps)","exercitii":[{"nr":1,"exercitiu":"Flat Dumbbell Chest Press","muschi":"Pectoralis major, Front deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Shoulder blades retracted and pinned to the bench, elbows at 45-60°, controlled descent to the chest, press with control.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Incline Dumbbell Press (30°)","muschi":"Pectoralis major (clavicular), Front deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Shoulder blades pinned to the bench, elbows at 45-60° from the torso, controlled descent to the chest, press without lifting the shoulders at the top.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Dumbbell Military Shoulder Press","muschi":"Front and lateral deltoid, Triceps","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Backrest at 75-80°, abs tight to protect the lower back; press overhead without arching the back; lower to chin level.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Dumbbell Lateral Raises","muschi":"Lateral deltoid","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Arms slightly bent at the elbows; raise to shoulder height leading with the elbows; 2-3 second tempo on the way down, no swinging from the torso.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Machine Flyes (Pec Deck / Seated Fly)","muschi":"Pectoralis major (isolation & stretch)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Elbows slightly bent at 10-15° and locked at that angle, bring together leading with the elbows, 1 sec isometric contraction.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Cable Rope Pushdown (Triceps)","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Elbows tucked to the torso and fixed, extend fully down spreading the rope outward at the end; hold the triceps for 1 sec.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 2: Pull A (Back & Biceps)","exercitii":[{"nr":1,"exercitiu":"Wide-Grip Lat Pulldown","muschi":"Lats, Biceps brachii, Lower trapezius","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Overhand grip at 1.5× shoulder width; torso leaning slightly back (10-15°); pull the bar to the collarbone driving the elbows down and back; squeeze the shoulder blades at the end.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Seated Cable Row with V-handle","muschi":"Mid back (Rhomboids, Middle trapezius), Lats","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Chest up, back straight, pull the handles to the lower abdomen, shoulders down away from the ears, squeeze the shoulder blades for 1 sec at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"One-Arm Dumbbell Row on bench","muschi":"Lats, Mid back, Rear deltoid","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Torso stable at 45° or parallel to the floor, neutral spine, pull the dumbbell toward the hip, not the chest, lead with the elbow.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Cable Face Pull with rope","muschi":"Rear deltoid, External rotators, Trapezius","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Pulley at eye level, pull toward the temples splitting the rope and rotating the shoulders outward; elbows at shoulder height, 1 sec contraction.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Dumbbell Supinated Biceps Curls","muschi":"Biceps brachii, Brachialis","tip":"kg","seturi_repetari":"3 × 12","pauza":"60 sec","indicatii":"Arms vertical, turn the palm toward the ceiling on the way up, keep the elbows fixed without pushing them forward; full stretch at the bottom.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Cable Crunch / Leg Raises","muschi":"Rectus abdominis, Deep core","tip":"rep","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Crunch: flex only through the torso with a full exhale. Raises: tilt the pelvis without momentum from the hips, lower slowly.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 3: Legs A (Quads & Glutes)","exercitii":[{"nr":1,"exercitiu":"Smith Machine / Free Barbell Squats","muschi":"Quadriceps, Glutes, Adductors","tip":"kg","seturi_repetari":"4 × 8-10","pauza":"90-120 sec","indicatii":"Toes pointed out 15-30°, 3-second eccentric tempo, chest up and back perfectly straight throughout.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Barbell Hip Thrust on bench","muschi":"Glutes (gluteus maximus), Hamstrings","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Thick pad on the hips, shoulder blades on the edge of the bench, feet shoulder-width apart, shins vertical at the top, chin tucked; 1 sec maximal voluntary contraction.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Leg Press (feet high & wide)","muschi":"Quadriceps, Glutes, Hamstrings","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Feet on the upper half of the platform, deep descent without rounding the pelvis, don't snap the knees locked at the end of the push.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Machine Leg Extensions","muschi":"Quadriceps (isolation)","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Back pressed against the backrest, 1 second hold at the top, controlled movement on the way down.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Seated Machine Hip Abductions","muschi":"Glutes (medius & upper)","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Lean the torso forward to 45°, open wide, hold 1-2 seconds at peak contraction.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Machine Calf Raises","muschi":"Calves (Gastrocnemius, Soleus)","tip":"kg","seturi_repetari":"3 × 15-20","pauza":"60 sec","indicatii":"Full descent below step level, 1 sec pause at the bottom, 1 sec peak contraction at the top on the big toe.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 4: Push B (Shoulders, Chest & Core)","exercitii":[{"nr":1,"exercitiu":"Machine Overhead Press (Shoulder Press)","muschi":"Front & lateral deltoid, Triceps","tip":"kg","seturi_repetari":"3-4 × 10-12","pauza":"90-120 sec","indicatii":"Elbows angled 30-45° forward in the scapular plane, press with control without locking the elbows, slow 2-3 second descent.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Machine Chest Press (Chest Press Machine)","muschi":"Pectoralis major, Front delt, Triceps","tip":"kg","seturi_repetari":"3 × 10-12","pauza":"90-120 sec","indicatii":"Handles aligned with the chest line, chest open, elbows at 45-60°, press through the pecs without snapping into lockout.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Cable / Dumbbell Lateral Raises","muschi":"Lateral deltoid","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Arms slightly bent, lead the movement with the elbow up to shoulder height; slow 2-3 second descent, no swinging from the torso.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Cable Triceps Extensions with rope / straight bar","muschi":"Triceps brachii (all heads)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Elbows fixed by the body, full extension and spread outward at the end, hold 1 sec at the contraction.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Plank / Isometric hold","muschi":"Deep core, Glutes, Shoulders","tip":"sec","seturi_repetari":"3 × 45-60s","pauza":"60 sec","indicatii":"Forearms parallel, elbows under shoulders, neutral pelvis (slight posterior tilt); tighten abs, glutes and thighs at the same time; breathe steadily.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 5: Pull B (Back, Rear Delts & Biceps)","exercitii":[{"nr":1,"exercitiu":"Wide Overhand-Grip Lat Pulldown","muschi":"Lats, Biceps brachii","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Torso leaning 10-15°, pull to the collarbone driving the elbows down and back, squeeze the shoulder blades firmly.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Seated Machine / Cable Row","muschi":"Lats, Rhomboids, Middle trapezius","tip":"kg","seturi_repetari":"3 × 12","pauza":"90-120 sec","indicatii":"Pull the handles to the lower abdomen, shoulders down, squeeze the shoulder blades at the contraction for 1 second.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Cable Face Pull with rope","muschi":"Rear deltoid, External rotators, Trapezius","tip":"kg","seturi_repetari":"3 × 15","pauza":"60 sec","indicatii":"Pulley at eye level, pull toward the temples splitting the rope and rotating the shoulders outward; elbows at shoulder height, 1 sec contraction.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Incline Dumbbell Biceps Curls (45° bench)","muschi":"Biceps brachii (long head), Brachialis","tip":"kg","seturi_repetari":"3 × 12","pauza":"60 sec","indicatii":"Back and head against the bench, maximal stretch at the bottom, curl with full supination at the top.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Hanging / Parallel Bar Leg Raises","muschi":"Lower rectus abdominis, Iliopsoas","tip":"rep","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Avoid swinging; start the movement by tilting the pelvis toward the chest, lower the legs slowly and with control.","greutate_kg":"","seturi_finalizate":"","status":""}]},{"titlu":"Day 6: Legs B (Posterior Chain & Glutes)","exercitii":[{"nr":1,"exercitiu":"Barbell Romanian Deadlifts (RDL)","muschi":"Hamstrings, Glutes, Spinal erectors","tip":"kg","seturi_repetari":"4 × 8-10","pauza":"90-120 sec","indicatii":"Strict hip hinge, push the hips back, knees slightly bent, the bar slides down close to the shins, voluntary glute contraction on the way up.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":2,"exercitiu":"Machine / Smith Machine Hip Thrust","muschi":"Glutes (Gluteus maximus)","tip":"kg","seturi_repetari":"4 × 10-12","pauza":"90-120 sec","indicatii":"Shoulder blades supported, shins vertical at the top, chin tucked, 1 second maximal voluntary contraction, slow descent.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":3,"exercitiu":"Dumbbell Bulgarian Split Squats","muschi":"Glutes, Quadriceps, Hamstrings","tip":"kg","seturi_repetari":"3 × 10-12 / leg","pauza":"90-120 sec","indicatii":"Torso leaning 15-20° forward for maximal glute activation; push only through the front heel.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":4,"exercitiu":"Machine Leg Curls (lying face down)","muschi":"Hamstrings (all heads)","tip":"kg","seturi_repetari":"3 × 12-15","pauza":"60 sec","indicatii":"Pad on the lower third of the calf, hips pressed to the bench; powerful curl with a 1 sec pause, 3-second lowering tempo.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":5,"exercitiu":"Cable Glute Kickback","muschi":"Glutes (Gluteus maximus & upper)","tip":"kg","seturi_repetari":"3 × 15-20 / leg","pauza":"60 sec","indicatii":"Torso at 45°, stable spine; move the leg back and out at 30-45° with the knee slightly bent; squeeze the glute hard.","greutate_kg":"","seturi_finalizate":"","status":""},
{"nr":6,"exercitiu":"Russian Twist with plate / ball","muschi":"Internal/external obliques, Rectus abdominis","tip":"kg","seturi_repetari":"3 × 20","pauza":"60 sec","indicatii":"Torso at 45°, feet slightly raised, rotate the shoulders side to side controlling the movement only from the torso.","greutate_kg":"","seturi_finalizate":"","status":""}]}],"sectiuni_final":[],"nota_subsol":""}}];

// Biblioteca de start pentru planurile alimentare: rețete generale, în formatul importului din text.
// Generatorul alege din ea și din planurile salvate; gramajele sunt pentru ziua de repaus și se potrivesc apoi pe ținte.
// „Tranzit:” = varianta fără bucătărie (supermarket / delegație), cu „;” între produse.
const BIBLIOTECA_RETETE_START = `# MIC DEJUN
## Iaurt grecesc cu proteină, fructe și granola
- Iaurt grecesc 2% — 200 g
- Proteină whey — 25 g
- Afine — 100 g
- Granola — 30 g
Preparare: Amesteci pudra proteică în iaurt, apoi adaugi fructele și granola deasupra.
Tranzit: 1 iaurt proteic de băut; 1 banană; 1 pumn de nuci
## Shakshuka cu spanac
- Ouă — 2 buc
- Ceapă verde — 35 g
- Ardei gras — 50 g
- Roșii — 150 g
- Sos de roșii — 50 g
- Spanac — 50 g
- Pâine integrală — 35 g
- Sare, piper, boia
Preparare: Călești ceapa și ardeiul în puțină apă, adaugi roșiile și sosul, apoi ouăle; spanacul la final, cu capac.
Tranzit: 2–3 ouă fierte; 1 felie pâine integrală; roșii cherry
## Omletă cu lipie și mozzarella
- Ouă — 2 buc
- Albuș de ou — 60 g
- Ulei de măsline — 5 g
- Lipie integrală — 30 g
- Mozzarella — 25 g
- Roșii — 75 g
- Castraveți — 75 g
Preparare: Omleta în tigaie antiaderentă cu uleiul măsurat; lipia încălzită, legumele crude alături.
Tranzit: 2–3 ouă fierte; 1 felie pâine integrală; roșii și castraveți
## Wrap cu brânză de vaci și avocado
- Lipie integrală — 30 g
- Ouă — 2 buc
- Brânză de vaci — 80 g
- Avocado — 40 g
- Ardei gras — 100 g
- Salată verde — 50 g
Tranzit: 150 g brânză de vaci; 1 lipie integrală; roșii cherry
## Terci proteic de ovăz cu banană
- Fulgi de ovăz — 35 g
- Iaurt grecesc 2% — 150 g
- Semințe de chia — 10 g
- Banană — 80 g
- Scorțișoară
Preparare: Ovăzul fiert în apă sau lăsat peste noapte în iaurt; banana și chia deasupra.
Tranzit: 200 g iaurt grecesc; 1 banană medie; 15 g mix de semințe
## Iaurt cu caju și fructe
- Iaurt grecesc 2% — 200 g
- Caju — 15 g
- Piersici — 120 g
Tranzit: 300 ml chefir; 15 g caju; 1 piersică
## Ouă fierte cu pâine și legume crocante
- Ouă — 2 buc
- Pâine integrală — 35 g
- Castraveți — 100 g
Tranzit: 2 ouă fierte; 1 felie pâine integrală; 1 castravete
## Clătite proteice
- Ouă — 1 buc
- Proteină whey — 25 g
- Făină de ovăz — 25 g
- Băutură vegetală de migdale — 60 ml
- Afine — 50 g
Preparare: Compoziția în tigaie antiaderentă, la foc mediu, 1–2 minute pe fiecare parte.
Tranzit: 1 iaurt proteic; 1 baton proteic
## Toast cu hummus și roșii
- Pâine integrală — 50 g
- Humus — 50 g
- Roșii — 100 g
- Busuioc, sare, piper
Tranzit: 1 sandviș integral cu hummus; 1 roșie
## Toast cu ricotta, fistic și miere
- Pâine integrală — 50 g
- Ricotta — 50 g
- Fistic — 10 g
- Miere — 10 g
Tranzit: 1 iaurt grecesc; 1 felie pâine integrală; 1 linguriță miere
## Ovăz peste noapte cu mure și nuci
- Fulgi de ovăz — 30 g
- Băutură vegetală de migdale — 100 ml
- Iaurt grecesc 2% — 30 g
- Mure — 70 g
- Nuci — 10 g
- Vanilie, scorțișoară
Preparare: Amesteci ovăzul cu băutura de migdale și iaurtul și le lași la frigider peste noapte; dimineața, murele și nucile deasupra.
Tranzit: 1 iaurt cu fructe; 1 pumn de nuci
# GUSTARE
## Chefir cu fruct și semințe
- Chefir — 250 ml
- Piersici — 150 g
- Mix de semințe — 10 g
Tranzit: 1 sticlă de ayran (300 ml); 1 banană mică
## Iaurt cu unt de arahide și prune
- Iaurt grecesc 2% — 150 g
- Unt de arahide — 12 g
- Prune — 100 g
Tranzit: 150 g iaurt grecesc; 15 g caju; 2 prune
## Lapte bătut cu caju și măr
- Lapte bătut — 250 ml
- Caju — 15 g
- Măr — 100 g
Tranzit: 250 ml lapte bătut; 15 g caju
## Avocado toast pe lipie
- Lipie integrală — 30 g
- Avocado — 45 g
- Ouă — 1 buc
- Roșii — 80 g
Tranzit: 1 iaurt de băut simplu; 1 piersică
## Brânză de vaci cu fructe
- Brânză de vaci — 150 g
- Afine — 100 g
Tranzit: 1 cutie de brânză de vaci; 1 măr
## Măr cu unt de arahide
- Măr — 150 g
- Unt de arahide — 15 g
Tranzit: 1 măr; 1 pumn de migdale
# PRÂNZ
## Pulpe de pui și cartofi la cuptor
- Pulpă de pui — 150 g
- Cartofi — 180 g
- Ulei de măsline — 5 g
- Boia, usturoi, cimbru, rozmarin
Preparare: La cuptor, pe hârtie de copt, 35–40 de minute la 200°C.
Tranzit: 150 g piept de pui la grătar; 1 cartof copt; salată
## Paste integrale cu creveți și pesto
- Paste integrale — 55 g
- Creveți — 180 g
- Pesto — 15 g
- Parmezan — 10 g
- Usturoi, piper, busuioc
Tranzit: 1 salată cu creveți; 1 lipie integrală
## Gulaș de vită cu mămăligă
- Mușchi de vită — 170 g
- Mălai — 55 g
- Ulei de măsline — 6 g
- Ceapă, ardei, roșii pentru sos
- Boia, foi de dafin, chimen
Preparare: Carnea tăiată cuburi, înăbușită la foc mic cu legumele în sos de roșii și boia; mămăliga alături.
Tranzit: 150 g friptură de vită; 1 lipie integrală; roșii cherry
## Curcan marinat cu piure de cartofi
- Piept de curcan — 170 g
- Iaurt 2% — 55 g
- Cartofi — 225 g
- Murături, boia, usturoi, cimbru
Preparare: Curcanul marinat în iaurt și condimente, la cuptor sau pe grătar; piureul cu puțină apă de la fiert.
Tranzit: 150 g piept de curcan la grătar; salată; 1 lipie integrală
## Curcan cu linte și salată de varză
- Piept de curcan — 150 g
- Linte — 45 g
- Ulei de măsline — 10 g
- Varză — 150 g
- Ardei gras — 50 g
Tranzit: 150 g piept de curcan la grătar; salată mare de varză; 1 lipie integrală mică
## Pui cu orez și broccoli
- Piept de pui — 150 g
- Orez — 45 g
- Ulei de măsline — 10 g
- Broccoli — 200 g
- Usturoi
Tranzit: 150 g piept de pui la grătar; 3–4 linguri de orez; legume la grătar
## Bowl cu ton și năut
- Ton în apă — 130 g
- Năut fiert — 100 g
- Ulei de măsline — 10 g
- Roșii — 90 g
- Castraveți — 90 g
Tranzit: 1 conservă de ton; 1 conservă mică de năut; roșii cherry
## Pește alb cu cartofi copți
- Pește alb — 170 g
- Cartofi — 160 g
- Ulei de măsline — 10 g
- Roșii — 100 g
- Castraveți — 100 g
Tranzit: 1 conservă de ton; 1 cartof copt; salată asortată
## Mușchiuleț de porc cu cartof copt
- Mușchiuleț de porc — 150 g
- Cartofi — 150 g
- Ulei de măsline — 10 g
- Roșii — 100 g
- Castraveți — 100 g
Tranzit: 150 g fâșii de porc la caserolă; 1 lipie integrală; roșii cherry
## Tocăniță de vită cu orez
- Carne tocată de vită slabă — 140 g
- Orez — 40 g
- Ulei de măsline — 10 g
- Roșii — 100 g
- Ardei gras — 100 g
Tranzit: 150 g friptură de vită slabă; 1 lipie integrală; roșii cherry
## Penne cu roșii și pui
- Paste integrale — 50 g
- Piept de pui — 120 g
- Roșii cherry — 150 g
- Sos de roșii — 80 g
- Busuioc, ierburi de Provence
Tranzit: 1 salată cu pui; 1 lipie integrală
# CINĂ
## Paste cu somon, roșii și telemea
- Somon — 140 g
- Paste integrale — 55 g
- Telemea — 25 g
- Roșii cherry — 100 g
- Spanac — 50 g
- Usturoi, oregano
Tranzit: 1 conservă de somon; 1 lipie integrală; roșii cherry
## Salată de creveți cu quinoa și avocado
- Creveți — 150 g
- Quinoa — 30 g
- Avocado — 50 g
- Castraveți — 100 g
- Roșii — 150 g
- Salată verde — 70 g
- Lămâie, sare, piper
Tranzit: 1 salată cu creveți; 1 pâine integrală mică
## Poke bowl cu tofu și edamame
- Tofu — 100 g
- Edamame — 50 g
- Quinoa — 20 g
- Morcovi — 50 g
- Ardei gras — 50 g
- Ridichi — 50 g
- Sos de soia, ghimbir, lămâie
Tranzit: 1 salată cu tofu sau năut; 1 lipie integrală
## Dovlecei spiralați cu ton și fasole albă
- Ton în apă — 100 g
- Dovlecei — 300 g
- Fasole albă fiartă — 50 g
- Pătrunjel, lămâie
Tranzit: 1 conservă de ton; 1 conservă mică de fasole albă; castraveți
## Pește alb cu legume coapte
- Pește alb — 180 g
- Vinete — 125 g
- Conopidă — 125 g
- Ulei de măsline — 10 g
- Smântână 12% — 30 g
Tranzit: 1 conservă de ton; 1 pungă de salată verde; 1 lipie integrală
## Creveți cu ciuperci și mămăligă
- Creveți — 180 g
- Ciuperci — 150 g
- Ulei de măsline — 5 g
- Mălai — 40 g
- Smântână 12% — 30 g
Tranzit: 200 g brânză de vaci; 1 lipie integrală; ardei gras și castraveți
## Pui cu fasole și varză
- Piept de pui — 150 g
- Fasole albă fiartă — 110 g
- Ulei de măsline — 10 g
- Varză — 150 g
Tranzit: 1 conservă mică de fasole albă; 1 conservă de piept de pui; roșii cherry
## Wrap cald cu ton și mozzarella
- Lipie integrală — 45 g
- Ton în apă — 120 g
- Mozzarella — 30 g
- Ardei gras — 50 g
- Salată verde — 50 g
Tranzit: 1 lipie integrală; 1 conservă de ton; 30 g mozzarella; castraveți
## Mușchi de vită cu legume
- Mușchi de vită — 150 g
- Ciuperci — 100 g
- Ardei gras — 75 g
- Dovlecei — 75 g
- Ulei de măsline — 10 g
- Smântână 12% — 30 g
Tranzit: 150 g friptură de vită rece; salată verde; 1 lipie integrală
## Chiftele de vită la cuptor
- Carne tocată de vită slabă — 140 g
- Conopidă — 125 g
- Ciuperci — 125 g
- Ulei de măsline — 10 g
- Smântână 12% — 30 g
Tranzit: 150 g friptură de vită slabă; salată asortată; 1 lipie integrală
# GUSTARE
## Iaurt grecesc cu miere și nuci
- Iaurt grecesc 2% — 170 g
- Miere — 10 g
- Nuci — 10 g
Tranzit: 1 iaurt grecesc; 1 pumn de nuci
## Ouă fierte cu castravete și pâine
- Ouă — 2 buc
- Castraveți — 150 g
- Pâine integrală — 25 g
Tranzit: 2 ouă fierte; 1 castravete
## Brânză cottage cu roșii
- Brânză cottage — 150 g
- Roșii — 100 g
- Pâine integrală — 30 g
Tranzit: 1 caserolă de brânză cottage; roșii cherry
## Humus cu legume crocante
- Humus — 60 g
- Morcovi — 80 g
- Castraveți — 80 g
- Ardei gras — 60 g
Tranzit: 1 cutie mică de humus; legume tăiate la caserolă
## Banană cu unt de arahide
- Banană — 100 g
- Unt de arahide — 12 g
Tranzit: 1 banană; 1 pumn de arahide
## Shake proteic cu banană
- Proteină whey — 25 g
- Banană — 80 g
- Lapte 1,5% — 200 ml
Preparare: Totul în blender sau în shaker, cu gheață după gust.
Tranzit: 1 shake proteic gata făcut
## Chefir cu ovăz și căpșuni
- Chefir — 250 ml
- Fulgi de ovăz — 20 g
- Căpșuni — 100 g
Tranzit: 1 sticlă de chefir; 1 măr
## Mozzarella cu roșii și busuioc
- Mozzarella — 50 g
- Roșii — 150 g
- Ulei de măsline — 3 g
- Busuioc, sare, piper
Tranzit: 1 salată caprese la caserolă
## Sandviș cu pastramă de curcan
- Pastramă de curcan — 60 g
- Pâine de secară — 40 g
- Castraveți — 80 g
Tranzit: 1 sandviș cu curcan
## Iaurt cu zmeură și semințe
- Iaurt grecesc 2% — 150 g
- Zmeură — 100 g
- Semințe de dovleac — 10 g
Tranzit: 1 iaurt cu fructe; 1 pumn de semințe
## Kiwi cu migdale
- Kiwi — 150 g
- Migdale — 15 g
Tranzit: 2 kiwi; 1 pumn de migdale
## Edamame cu sare de mare
- Edamame — 120 g
- Sare de mare
Tranzit: 1 punguță de edamame
# MIC DEJUN
## Omletă cu ciuperci și spanac
- Ouă — 2 buc
- Albuș de ou — 60 g
- Ciuperci — 100 g
- Spanac — 50 g
- Pâine integrală — 35 g
- Ulei de măsline — 5 g
Tranzit: 2–3 ouă fierte; 1 felie pâine integrală
## Sandviș cu ou și avocado
- Pâine de secară — 60 g
- Ouă — 2 buc
- Avocado — 40 g
- Roșii — 60 g
Tranzit: 1 sandviș cu ou; 1 roșie
## Ovăz cu lapte, măr și scorțișoară
- Fulgi de ovăz — 40 g
- Lapte 1,5% — 200 ml
- Măr — 100 g
- Proteină whey — 15 g
- Scorțișoară
Preparare: Ovăzul fiert în lapte 3–4 minute, apoi proteina amestecată și mărul ras deasupra.
Tranzit: 1 iaurt proteic; 1 măr
## Pâine cu brânză cottage și roșii
- Pâine integrală — 60 g
- Brânză cottage — 120 g
- Roșii — 100 g
- Castraveți — 50 g
Tranzit: 1 caserolă de brânză cottage; 1 chiflă integrală
## Budincă de chia cu zmeură
- Semințe de chia — 25 g
- Lapte 1,5% — 150 ml
- Iaurt grecesc 2% — 100 g
- Zmeură — 80 g
Preparare: Chia în lapte, lăsată la frigider peste noapte; dimineața iaurtul și zmeura deasupra.
Tranzit: 1 iaurt grecesc; fructe de sezon
## Wrap cu ou și pastramă de curcan
- Tortilla integrală — 40 g
- Ouă — 2 buc
- Pastramă de curcan — 40 g
- Ardei gras — 50 g
Tranzit: 1 wrap cu curcan de la magazin
# PRÂNZ
## Pui cu quinoa și legume
- Piept de pui — 150 g
- Quinoa — 50 g
- Dovlecei — 100 g
- Ardei gras — 80 g
- Ulei de măsline — 10 g
Tranzit: 150 g piept de pui la grătar; 1 salată cu quinoa
## Cotlet de porc cu fasole verde și cartofi
- Cotlet de porc — 140 g
- Cartofi — 150 g
- Fasole verde — 150 g
- Ulei de măsline — 5 g
Tranzit: 150 g friptură de porc la caserolă; salată
## Vită cu cartofi dulci și broccoli
- Pulpă de vită — 150 g
- Cartofi dulci — 200 g
- Broccoli — 150 g
- Ulei de măsline — 8 g
Tranzit: 150 g friptură de vită; 1 cartof copt
## Chili cu vită și fasole roșie
- Carne tocată de vită slabă — 130 g
- Fasole roșie — 120 g
- Sos de roșii — 150 g
- Ceapă — 50 g
- Orez — 30 g
- Ulei de măsline — 5 g
- Chimen, boia, usturoi
Preparare: Carnea rumenită cu ceapa, apoi fasolea, sosul și condimentele, 15 minute la foc mic; orezul alături.
Tranzit: 1 conservă de chili cu fasole; 1 lipie integrală
## Curcan cu paste integrale și broccoli
- Piept de curcan — 140 g
- Paste integrale — 60 g
- Broccoli — 150 g
- Parmezan — 10 g
- Ulei de măsline — 5 g
Tranzit: 150 g piept de curcan la grătar; 1 salată de paste
## Somon cu cartofi și salată verde
- Somon — 140 g
- Cartofi — 200 g
- Salată verde — 80 g
- Ulei de măsline — 5 g
- Lămâie, mărar
Tranzit: 1 conservă de somon; 1 cartof copt; salată
## Paste integrale cu ton și roșii
- Paste integrale — 60 g
- Ton în apă — 120 g
- Roșii cherry — 150 g
- Ulei de măsline — 8 g
- Busuioc, usturoi
Tranzit: 1 salată de paste cu ton
## Pui cu bulgur și salată de castraveți
- Piept de pui — 150 g
- Bulgur — 50 g
- Castraveți — 150 g
- Iaurt grecesc 2% — 50 g
- Mărar, usturoi
Tranzit: 150 g piept de pui la grătar; 1 lipie integrală; castraveți
## Porc cu varză călită
- Mușchiuleț de porc — 150 g
- Varză — 250 g
- Sos de roșii — 80 g
- Pâine integrală — 40 g
- Ulei de măsline — 8 g
- Cimbru, piper, foi de dafin
Tranzit: 150 g friptură de porc; salată de varză; 1 felie pâine integrală
# CINĂ
## Omletă cu legume și mozzarella
- Ouă — 3 buc
- Ardei gras — 80 g
- Ciuperci — 80 g
- Mozzarella — 25 g
- Ulei de măsline — 5 g
Tranzit: 3 ouă fierte; legume tăiate la caserolă
## Salată de pui cu avocado
- Piept de pui — 130 g
- Avocado — 50 g
- Salată verde — 80 g
- Roșii — 100 g
- Ulei de măsline — 5 g
- Lămâie, sare, piper
Tranzit: 1 salată cu pui de la magazin
## Curcan cu legume la cuptor
- Piept de curcan — 150 g
- Dovlecei — 150 g
- Ardei gras — 100 g
- Ceapă — 50 g
- Cartofi — 120 g
- Ulei de măsline — 8 g
Tranzit: 150 g piept de curcan la grătar; legume la grătar
## Cod cu cartofi dulci și spanac
- Cod — 180 g
- Cartofi dulci — 150 g
- Spanac — 80 g
- Ulei de măsline — 8 g
Tranzit: 1 conservă de ton; 1 cartof copt; salată verde
## Salată de ton cu ou și fasole albă
- Ton în apă — 100 g
- Ouă — 1 buc
- Fasole albă fiartă — 80 g
- Salată verde — 80 g
- Roșii — 80 g
- Ulei de măsline — 5 g
Tranzit: 1 conservă de ton; 1 conservă mică de fasole albă; roșii cherry
## Tofu cu orez și legume la wok
- Tofu — 150 g
- Orez — 40 g
- Ardei gras — 80 g
- Morcovi — 50 g
- Broccoli — 80 g
- Ulei de măsline — 5 g
- Sos de soia, ghimbir
Tranzit: 1 salată cu tofu sau năut; 1 lipie integrală
## Vită cu ciuperci, dovlecei și orez
- Pulpă de vită — 140 g
- Orez — 40 g
- Dovlecei — 100 g
- Ciuperci — 100 g
- Ulei de măsline — 5 g
Tranzit: 150 g friptură de vită; salată verde
## Cotlet de porc cu salată de varză
- Cotlet de porc — 140 g
- Varză — 150 g
- Morcovi — 50 g
- Pâine integrală — 40 g
- Ulei de măsline — 5 g
Tranzit: 150 g friptură de porc slabă; salată de varză
## Păstrăv cu broccoli și cartofi
- Păstrăv — 180 g
- Broccoli — 150 g
- Cartofi — 120 g
- Ulei de măsline — 5 g
- Lămâie, usturoi
Tranzit: 1 conservă de somon sau ton; 1 cartof copt; salată
# MIC DEJUN
## Hrișcă cu lapte, pară și nuci
- Hrișcă — 40 g
- Lapte 1,5% — 200 g
- Pară — 100 g
- Nuci — 10 g
- Scorțișoară
Preparare: Hrișca fiartă în lapte 10–12 minute; para tăiată cubulețe și nucile deasupra.
Tranzit: 200 g iaurt grecesc; 1 pară; 1 pumn de nuci
## Omletă cu cașcaval și ciuperci
- Ouă — 2 buc
- Albuș de ou — 60 g
- Cașcaval — 20 g
- Ciuperci — 80 g
- Pâine de secară — 40 g
Preparare: Ciupercile călite în puțină apă, apoi ouăle bătute; cașcavalul ras deasupra, cu capac.
Tranzit: 2–3 ouă fierte; 1 felie pâine de secară; 1 bucată de cașcaval
## Iaurt cu mango și semințe de in
- Iaurt grecesc 0% — 250 g
- Mango — 100 g
- Fulgi de ovăz — 20 g
- Semințe de in — 10 g
Tranzit: 1 iaurt grecesc; 1 fruct; 1 pumn de semințe
## Rondele de orez cu unt de migdale și cottage
- Rondele de orez — 25 g
- Unt de migdale — 15 g
- Brânză cottage 2% — 150 g
- Banană — 80 g
Tranzit: 150 g brânză cottage; 2 rondele de orez; 1 banană
## Ouă ochiuri cu sparanghel
- Ouă — 2 buc
- Sparanghel — 100 g
- Ulei de măsline — 5 g
- Pâine integrală — 40 g
- Rucola — 30 g
Preparare: Sparanghelul la tigaie 4–5 minute cu uleiul măsurat, apoi ouăle ochiuri alături.
Tranzit: 2–3 ouă fierte; 1 felie pâine integrală; legume crude
## Mei cu iaurt, portocală și migdale
- Mei, crud — 40 g
- Iaurt grecesc 2% — 150 g
- Portocală — 120 g
- Migdale — 10 g
Preparare: Meiul fiert în apă 15 minute, lăsat să se răcească; iaurtul, portocala și migdalele deasupra.
Tranzit: 200 g iaurt grecesc; 1 portocală; 1 pumn de migdale
## Sandviș cu telemea și legume
- Pâine integrală — 60 g
- Telemea — 40 g
- Ouă — 1 buc
- Roșii — 100 g
- Castraveți — 100 g
Tranzit: 1 sandviș cu brânză din pâine integrală; 1 ou fiert; roșii cherry
# GUSTARE
## Pară cu cottage și nuci
- Brânză cottage 2% — 120 g
- Pară — 120 g
- Nuci — 10 g
Tranzit: 1 iaurt proteic; 1 pară
## Brânză de vaci cu struguri
- Brânză de vaci — 120 g
- Struguri — 100 g
Tranzit: 1 iaurt proteic; 1 ciorchine mic de struguri
## Iaurt cu ananas
- Iaurt grecesc 0% — 200 g
- Ananas — 120 g
Tranzit: 1 iaurt grecesc; 1 caserolă de ananas
## Iaurt cu curmale și alune
- Iaurt grecesc 2% — 150 g
- Curmale — 25 g
- Alune de pădure — 10 g
Tranzit: 1 iaurt grecesc; 2 curmale; 1 pumn mic de alune
## Rondele de orez cu humus și pastramă
- Rondele de orez — 20 g
- Humus — 30 g
- Pastramă de curcan — 50 g
Tranzit: 1 pachet mic de pastramă de curcan; 2 rondele de orez
## Iaurt cu cireșe
- Iaurt grecesc 2% — 170 g
- Cireșe — 120 g
Tranzit: 1 iaurt grecesc; 1 caserolă de cireșe
## Pepene galben cu telemea
- Pepene galben — 200 g
- Telemea — 40 g
- Pâine integrală — 25 g
Tranzit: 1 caserolă de pepene; 1 bucată de telemea
# PRÂNZ
## Macrou la cuptor cu cartofi și sfeclă
- Macrou, crud — 130 g
- Cartofi — 150 g
- Sfeclă roșie — 100 g
- Ulei de măsline — 5 g
Preparare: Macroul și cartofii la cuptor 25 de minute; sfecla coaptă sau fiartă, tăiată felii.
Tranzit: 1 conservă de macrou; 1 cartof copt; salată
## Chiftele de curcan cu cușcuș
- Carne tocată de curcan — 150 g
- Cușcuș — 50 g
- Castraveți — 100 g
- Roșii — 100 g
- Iaurt grecesc 2% — 50 g
Preparare: Chiftelele la cuptor 20 de minute; cușcușul opărit cu apă fierbinte, 5 minute sub capac; iaurtul ca sos.
Tranzit: 150 g piept de curcan la grătar; 1 salată cu cușcuș
## Pui cu orez brun și mazăre
- Piept de pui — 150 g
- Orez brun — 50 g
- Mazăre verde — 80 g
- Morcovi — 60 g
- Ulei de măsline — 5 g
Tranzit: 150 g piept de pui la grătar; 3–4 linguri de orez; legume
## Vită cu hrișcă și ciuperci
- Mușchi de vită — 140 g
- Hrișcă — 50 g
- Ciuperci — 100 g
- Ceapă — 40 g
- Ulei de măsline — 5 g
Preparare: Carnea și ciupercile călite cu ceapa; hrișca fiartă separat 15 minute.
Tranzit: 150 g vită la grătar; 1 garnitură de orez; legume
## Somon cu quinoa și sparanghel
- Somon — 140 g
- Quinoa — 50 g
- Sparanghel — 120 g
- Lămâie
Preparare: Somonul și sparanghelul la cuptor 15 minute, cu lămâie; quinoa fiartă 12 minute.
Tranzit: 1 conservă de somon; 1 salată cu quinoa
## Curcan cu orez brun și varză de Bruxelles
- Piept de curcan — 150 g
- Orez brun — 50 g
- Varză de Bruxelles — 120 g
- Ulei de măsline — 5 g
Tranzit: 150 g piept de curcan la grătar; 3–4 linguri de orez; legume la grătar
## Tortilla cu pui, porumb și fasole
- Tortilla integrală — 60 g
- Piept de pui — 130 g
- Porumb dulce — 50 g
- Fasole roșie — 50 g
- Ardei gras — 60 g
- Salată verde — 40 g
Tranzit: 1 wrap cu pui din supermarket; 1 fruct
## Paste cu curcan tocat și sos de roșii
- Paste integrale — 60 g
- Carne tocată de curcan — 130 g
- Sos de roșii — 100 g
- Parmezan — 10 g
Preparare: Carnea rumenită, apoi sosul, 10 minute la foc mic; pastele fierte al dente; parmezanul ras deasupra.
Tranzit: 1 salată de paste cu pui
# CINĂ
## Hering cu cartofi și castraveți
- Hering — 120 g
- Cartofi — 120 g
- Ceapă — 40 g
- Castraveți — 100 g
Tranzit: 1 conservă de pește; 1 cartof copt; salată
## Salată cu ton, porumb și rucola
- Ton în apă — 130 g
- Porumb dulce — 50 g
- Rucola — 50 g
- Roșii cherry — 100 g
- Ulei de măsline — 5 g
- Pâine integrală — 30 g
Tranzit: 1 salată cu ton; 1 felie pâine integrală
## Pește alb cu praz și orez brun
- Pește alb — 160 g
- Praz — 100 g
- Orez brun — 40 g
- Ulei de măsline — 5 g
Preparare: Prazul călit în puțină apă, peștele deasupra, cu capac, 10 minute; orezul fiert separat.
Tranzit: 1 conservă de ton; 3–4 linguri de orez; salată
## Pui cu dovleac copt și rucola
- Piept de pui — 150 g
- Dovleac — 200 g
- Rucola — 40 g
- Semințe de dovleac — 10 g
Preparare: Puiul și dovleacul cubulețe la cuptor 25 de minute; rucola și semințele la final.
Tranzit: 150 g piept de pui la grătar; salată cu semințe
## Omletă cu praz și telemea
- Ouă — 2 buc
- Albuș de ou — 100 g
- Praz — 80 g
- Telemea — 30 g
- Pâine de secară — 30 g
Tranzit: 2–3 ouă fierte; 1 bucată de telemea; legume crude
## Salată de vită cu varză roșie și cușcuș
- Mușchi de vită — 130 g
- Varză roșie — 120 g
- Cușcuș — 40 g
- Ulei de măsline — 5 g
Tranzit: 150 g vită la grătar; 1 salată de varză
## Curcan cu sfeclă coaptă și telemea
- Piept de curcan — 150 g
- Sfeclă roșie — 150 g
- Telemea — 25 g
- Rucola — 40 g
Tranzit: 150 g piept de curcan la grătar; salată cu brânză
## Tofu cu hrișcă și legume
- Tofu — 150 g
- Hrișcă — 40 g
- Ardei gras — 80 g
- Broccoli — 100 g
- Ulei de măsline — 5 g
Preparare: Tofu rumenit cu uleiul măsurat, apoi legumele la wok 5 minute; hrișca fiartă separat.
Tranzit: 1 salată cu tofu sau edamame; 1 fruct
`;
