# Journey vertical slice — képernyő és állapotgép

- **Dátum:** 2026-08-29
- **Vizuális irány:** filmszerű, bejárható döntési rítus; a Gépváros maga az interfész
- **Alapelv:** egyszerre egy aktuális feladat; a korábbi állomások csak halvány városi lenyomatként maradnak jelen

| Döntési út | Domainállapot | A képernyő egyetlen fókusza | Parancs eredete |
|---|---|---|---|
| Kapcsolódás | `NO_SESSION` → `MACHINE_CITY_READY` | Belépés a Gépvárosba, majd Futura megérkezése újabb kapcsolódási döntés nélkül | Agent/fallback indítás |
| Dilemma | `MACHINE_CITY_READY` → `AWAITING_HUMAN_SELECTION` | A konkrét kérdés megértése, majd a lehetőségek játékos általi kérése | `present_dilemma`; a lehetőségek kinyitása Player UI-prezentáció |
| Irány | `AWAITING_HUMAN_SELECTION` → `TENTATIVE_SELECTION_RECORDED` | Egyetlen AGY–KÉZ–SZÍV irány kijelölése | kizárólag Player UI |
| Ellenpont | `TENTATIVE_SELECTION_RECORDED` → `REFLECTION_PRESENTED` | A kijelölt irány vakfoltja és nyitott kérdése | `present_choice_reflection` |
| Megtartás | `REFLECTION_PRESENTED` → `READY_FOR_CONFIRMATION` | Az irány megtartása vagy módosítása | kizárólag Player UI |
| Megerősítés | `READY_FOR_CONFIRMATION` → `DECISION_CONFIRMED` | Végleges emberi megerősítés | kizárólag Player UI |
| Lenyomat | `DECISION_CONFIRMED` → `CONSEQUENCE_REVEALED` → `GAME_COMPLETE` | Előbb csak a következménykártya, majd ugyanazon domainállapot második prezentációs ütemében az Embermérleg | reveal: agent/fallback; a prezentációs továbblépés és körzárás: UI |

## Vizuális állandók

- Ugyanaz a hátulról látott emberalak és ugyanaz a Gépváros marad a jelenetek tengelyében.
- A kamera a körkapus belépőből a három elágazó útra közelít; további oldalak vagy dashboard-sablon helyett ugyanaz a városi tér alakul át.
- A fényrendszer petrolkék–cián alapot, réz–borostyán döntési hangsúlyt és törtfehér tipográfiát használ.
- Az AGY, KÉZ és SZÍV három azonos súlyú, ikonra és rövid szövegre épülő városi útelágazás. Egyik sem kap „jó” vagy „rossz” színt.
- Az AGY, KÉZ és SZÍV vastagsággal, peremmel, kontaktárnyékkal és perspektívával rendelkező digitális játéktárgyként materializálódik a három városi útból.
- A kijelölt tárgy az emberhez közelebb emelkedik és fényimpulzust kap, a másik kettő hátrébb húzódik, de továbbra is választható; a változás térbeli, nem badge- vagy egyszerű keretcsere.
- A kijelölt tárgy ugyanaz a kártya marad a teljes rítusban: az Ellenpontnál megfordul, Megtartáskor emberi pecsétet kap, Megerősítéskor lezárul, a Lenyomatnál pedig újra felnyílik.
- Az Ellenpont után két jól látható emberi döntés marad: a kijelölt irány megtartása vagy visszatérés a három irányhoz. A visszatérés nem hoz létre új domainállapotot; az új kártya a meglévő `selectLens` parancsot használja és új reflexiót követel.
- Az Ellenpont a kijelölt tárgy hátoldalaként és a hozzá tartozó városi út fényének egyszeri megzavarásaként jelenik meg.
- A „Saját gondolatod a döntéshez” jegyzetlap a megtartott kártya alól csúszik elő; nem külön alkalmazás-űrlapként jelenik meg, és a megerősítéskor visszasimul a tárgy alá.
- A Megerősítés külön körkapus jelenet és emberi küszöb. Futura ezt nem lépheti át.
- A Lenyomat két prezentációs ütem ugyanazon `CONSEQUENCE_REVEALED` domainállapoton belül: előbb a nagy következménykártya, csak a „Megnézem a döntés lenyomatát” után a fizikai Embermérleg. Nincs új domainállapot és nincs összpontszám.
- A technikai fázis, revision, azonosítók és toolnevek rejtve maradnak. A WebMCP Inspector csak az `?inspector=1` queryvel érhető el.

## Negatív vizuális guardrail

- Nincs sidebar, alkalmazásfejléc, panelrács, tab, badge, metricsor vagy felül rögzített SaaS-stepper.
- A jelenetek nem ugyanabban a kártyasablonban cserélnek szöveget: a kameraállás, a városi út, az ember helyzete és a fényviszony is állapotot jelez.
- A Döntési út nem külön navigációs réteg: az elért állomásokat a városi fényút, a megnyíló vagy lezáródó kapu és a tárgyak helyzete jelzi. Nincs a városra szórt ikonhalmaz.
- Az Embermérleg gravírozott tárgyként, sínekkel és mozgó jelölőkkel jelenik meg, nem diagramként vagy analytics widgetként.

## Mozgás és hozzáférhetőség

- Állapotváltáskor a következő játékelem rövid materializálódó animációval érkezik.
- A fókusz az új jelenet címére kerül; a programozott fókusz nem rajzol interaktív keretet.
- Az ikonok mellett minden jelentés szövegesen is megjelenik; az útválasztók billentyűzettel aktiválhatók.
- A megtartási és megerősítési jelenetben a „Másik irányt választok” teljes értékű, legalább 18 px-es, billentyűzettel fókuszolható másodlagos gomb. Végleges megerősítés után nem renderelődik visszalépés.
- A `prefers-reduced-motion` beállítás minden díszítő mozgást minimálisra csökkent.

## Mozgásritmus — implementált események

| Játékesemény | Vizuális jelentés | Időzítés |
|---|---|---:|
| Kapcsolat létrejött | A Futura-jel végigfut a városi kommunikációs vonalon | 620 ms |
| Dilemma megérkezett | A közvetítés és a kérdés felépül a városi térben | 560–760 ms |
| Választások kiosztása | A három játéktárgy 150 ms-os eltéréssel, egymás után materializálódik | 650 ms/tárgy; indulás 300/450/600 ms |
| Irány kijelölése | A választott tárgy közelít és egyszer felvillan, a másik kettő hátrébb húzódik | 620 ms |
| Ellenpont feltárása | A kijelölt kártya megfordul; a városi fényút egyszer megtörik | 780 ms |
| Megtartás | Emberi „MEGTARTVA” pecsét érkezik a kártyára; a jegyzetlap kicsúszik alóla | 650/760 ms |
| Emberi küszöb | A kapu kinyílik, Futura jele a túloldalon áll meg | 720–760 ms |
| Döntés lezárása | A kapu összezár, a lenyomat rejtve marad | 620 ms |
| Következmény felszabadítása | A lezárt kártya újra megfordul, egyszeri városi fényvillanással | 980–1600 ms |
| Embermérleg előemelkedése | A játékos külön CTA-ja után a mechanikus tárgy a városi padlóból fordul fel | 1050 ms, 1900 ms késleltetéssel |
| Jelölők elmozdulása | Csak a változó tengelyek korongjai csúsznak, 210 ms-os soros eltéréssel | 680 ms/jelölő |
| Delta megjelenése | A rövid delta csak a hozzá tartozó jelölő mozgása után jelenik meg | 320 ms; 3700 ms + soros eltérés |
| Kör lezárása CTA | A mérlegmozgások után, ugyanazon fizikai tárgy részeként marad elérhető | az Embermérleggel együtt, a mozgás után olvashatóan |

Nyugalmi állapotban nincs folyamatos neon- vagy parallax-effekt. A fény és a tárgymozgás mindig egy canonical játékeseményt jelez. `prefers-reduced-motion: reduce` esetén az időzített térbeli mozgások gyors, egyszeri áttűnésre rövidülnek.
