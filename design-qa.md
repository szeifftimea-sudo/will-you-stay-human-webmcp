# Design QA — Gépvárosi Journey vertical slice

- **Ellenőrzés dátuma:** 2026-08-29
- **Ellenőrzött viewportok:** 1113 × 900 asztali; 390 × 844 mobil
- **Ellenőrzött út:** Kapcsolódás → Dilemma → Irány → kijelölés → Ellenpont → Megtartás → Megerősítés → Lenyomat
- **Domain- és WebMCP-szerződés:** változatlan
- **Eredmény:** a teljes vizuális Journey, a fő mozgásritmus és a reszponzív kompozíció ellenőrzése sikeres

## Forrás és implementáció együttes összehasonlítása

| Jelenet | Forrás + implementáció ugyanabban a képen | Megfigyelés |
|---|---|---|
| Kapcsolódás | `docs/evidence/design/comparison-entry.png` | Azonos emberalak-, kapu-, fényút- és címhierarchia; egyetlen belépési cselekvés. |
| Irány | `docs/evidence/design/comparison-direction.png` | Három városi útból materializálódó, vastagsággal és kontaktárnyékkal rendelkező döntési tárgy. |
| Ellenpont | `docs/evidence/design/comparison-ritual.png` | Ugyanaz a kijelölt tárgy fordul át; nem külön információs panel érkezik. |
| Lenyomat | `docs/evidence/design/comparison-outcome.png` | A következmény után külön fizikai Embermérleg emelkedik elő; nem analytics widget. |

A referenciától való két tudatos eltérés a jóváhagyott guardrailt követi: nincs felül rögzített SaaS-stepper, és az Embermérleg a reveal előtt egyáltalán nem renderelődik.

## Végleges Journey-evidence

Asztali állapotok:

- `journey-entry-desktop.png`
- `journey-connection-desktop.png`
- `journey-direction-desktop.png`
- `journey-selection-desktop.png`
- `journey-reflection-desktop.png`
- `journey-confirmation-desktop.png`
- `journey-sealed-desktop.png`
- `journey-outcome-card-desktop.png`
- `journey-outcome-balance-desktop.png`

Mobil állapotok:

- `journey-entry-mobile.png`
- `journey-direction-mobile.png`
- `journey-selection-mobile.png`
- `journey-reflection-mobile.png`
- `journey-confirmation-mobile.png`
- `journey-sealed-mobile.png`
- `journey-outcome-card-mobile.png`
- `journey-outcome-balance-mobile.png`

Az olvasható tempójú állapot-walkthrough: `docs/evidence/design/journey-design-qa.gif`. Ez az álló állapotok sorrendi bizonyítéka; az átmenetek pontos jelentését és időzítését a `docs/JOURNEY_VERTICAL_SLICE.md` mozgástáblája, valamint az alábbi ellenőrzés rögzíti.

## P0 emberikontroll- és nyitónarratíva-regresszió

A 2026-08-29-i P0 ellenőrzés két hibát kezelt: az Ellenpont után a másik irány választása nem volt elég látható, a nyitás pedig a belépés után még egyszer kapcsolat-elfogadást sugallt. A javítás nem hozott létre új domainállapotot vagy parancsutat.

| Ellenőrzött követelmény | Eredmény | Bizonyíték |
|---|---|---|
| A belépés maga a kapcsolódás | passed | `p0-entry-desktop.png`: a `NO_SESSION` jelenetben nincs „FUTURA KAPCSOLÓDVA” státusz; az egyetlen CTA „Belépek a Gépvárosba”. |
| Futura új kérdést hoz, nem üzenetet vesz át | passed | `p0-futura-arrival-desktop.png`: „Hoztam neked egy kérdést.”, majd kizárólag „Mutasd a kérdést”. |
| A dilemma külön jelenetben érkezik | passed | `p0-dilemma-desktop.png`: a kérdés és a helyzet látható, az irányok csak a „Megnézem a lehetőségeket” után jelennek meg. |
| AGY kijelölése és AGY-specifikus Ellenpont | passed | `p0-agy-selected-desktop.png`, `p0-agy-reflection-actions-desktop.png`. |
| Két jól látható emberi döntés az Ellenpont után | passed | Desktop: `p0-agy-reflection-actions-desktop.png`; mobil: `p0-agy-reflection-actions-mobile.png`. Az elsődleges és másodlagos gomb ugyanabban a döntési blokkban van; mobilon teljes szélességűek. |
| Visszatérés a három irányhoz | passed | `p0-return-options-desktop.png`, `p0-return-options-mobile.png`: mindhárom kártya újra választható, a korábbi reflexió érvényvesztése jelzett. |
| Másik irány ténylegesen kijelölhető | passed | `p0-kez-selected-desktop.png`: a KÉZ ugyanazon `selectLens` Player UI-parancsúton kijelölhető. |
| Megerősítés előtt még van visszalépés | passed | `p0-confirmation-back-desktop.png`, `p0-confirmation-back-mobile.png`: a „Másik irányt választok” teljes értékű gombként látható. |
| Végleges megerősítés után nincs visszalépés | passed | `p0-confirmed-no-back-desktop.png`: a döntés lezárult, csak a lenyomat feltárása folytatható. |

A lassú, olvasható P0 állapotvideó: `docs/evidence/design/p0-human-control-flow.gif`. Sorrendje: „Belépek a Gépvárosba” → „Hoztam neked egy kérdést” → „Kérjek bocsánatot helyetted?” → három irány → AGY kijelölés → AGY Ellenpont és a két emberi döntés → visszatérés → KÉZ kijelölés. A vizuális horgony és a javított Ellenpont együttes összehasonlítása: `docs/evidence/design/comparison-p0-human-control.png`.

## Guardrail-ellenőrzés

| Kritérium | Eredmény | Bizonyíték |
|---|---|---|
| A Gépváros maga az interfész | passed | A döntési út városi fényút, a dilemma átvonuló jel, a megerősítés kapu, a reveal városreakció. |
| Nincs dashboard-váz | passed | Nincs sidebar, alkalmazásheader, panelrács, tab, badge, metricsor vagy technikai státuszpanel a normál játékban. |
| Egyetlen folytonos döntési tárgy | passed | A kijelölt AGY-kártya viszi végig a kijelölést, Ellenpontot, emberi pecsétet, lezárást és következményt. |
| Valódi digitális játéktárgyak | passed | Perem, vastagság, perspektíva, kontaktárnyék, felületi fény és fókusz/hover tárgykiemelés. |
| Nem SaaS-stepper a Journey | passed | A haladást a város fényútjai, a kamera és a tárgy állapota jelzi; nincs lépésszám vagy látható progressbar. |
| Emberi kontroll látható | passed | Az Ellenpontnál és a megerősítés előtt a megtartás és a visszaválasztás egyaránt jól látható Player UI-művelet; Futura a küszöbnél megáll. |
| Embermérleg reveal-only tárgy | passed | Reveal előtt nincs a DOM-ban; utána a fő kompozíció nagy mechanikus tárgyaként jelenik meg. |
| Egy fő feladat jelenetenként | passed | Minden állapotban egy domináns CTA vagy játékosi döntés látható. |
| Mobil kompozíció | passed | 390 × 844-en minden fő tárgy, címke és CTA elérhető, vízszintes túlcsordulás nélkül. |
| Hozzáférhetőség | passed | Billentyűzetes fókusz tárgykiemeléssel jár; képernyőolvasó-címkék megmaradtak; reduced motion támogatott. |

## Tárgy- és dramaturgiai folytonosság

1. Futura 150 ms-os eltéréssel kiosztja a három döntési tárgyat.
2. A kijelölt tárgy az emberhez közelít és egyszer felvillan; a másik kettő hátrébb húzódik, de választható marad.
3. Az Ellenpont ugyanannak a tárgynak a hátoldalaként tárul fel, miközben a választott fényút egyszer megtörik.
4. A megtartás után az emberi pecsét ugyanarra a tárgyra kerül.
5. A „Saját gondolatod a döntéshez” jegyzetlap a kártya mellől csúszik elő; nem hagyományos űrlappanel.
6. A végleges megerősítés lezárja ugyanazt a tárgyat; Futura nem lépi át az emberi küszöböt.
7. A reveal ugyanazt a tárgyat nyitja meg nyereség–ár oldallá.
8. Csak ezután emelkedik elő az Embermérleg, majd a változó jelölők egymás után mozdulnak.

## Mozgási ellenőrzés

| Esemény | Implementált ritmus | Jelentés |
|---|---:|---|
| Kártyakiosztás | 650 ms; 150 ms-os sorolás | Futura kiosztja a három lehetséges irányt. |
| Kijelölés | 620 ms | A választott tárgy térben közelebb kerül az emberhez. |
| Ellenpont-fordítás | 780 ms | A kijelölt tárgy rejtett oldala tárul fel. |
| Útfény megszakítása | 720–780 ms | A választott út vakfoltja látható törést okoz. |
| Jegyzetlap és emberi pecsét | 650–760 ms | A megtartás emberi nyomot hagy. |
| Döntés lezárása | 620–720 ms | A megerősített út többé nem írható vissza. |
| Reveal és városreakció | 980–1600 ms | A következmény felszabadul. |
| Embermérleg előemelkedése | 1050 ms, 1900 ms késleltetéssel | A mérleg csak a narratív nyereség és ár után érkezik. |
| Jelölők | 680 ms, tengelyenként 210 ms-os sorolás | Csak a változó tengelyek mozdulnak. |
| Deltaértékek | 320 ms, a jelölő után | A szám csak a fizikai elmozdulás következményeként jelenik meg. |

Nyugalmi állapotban nincs folyamatos neonmozgatás. A fényimpulzusok és tárgymozgások konkrét eseményt jelentenek. `prefers-reduced-motion: reduce` alatt a térbeli mozgások és villanások gyors, egyszeri áttűnésre rövidülnek.

## Működési és technikai ellenőrzés

- Automatizált regresszió: 4 tesztfájl, 18/18 teszt sikeres.
- Production build: sikeres.
- Böngészőkonzol: 0 hiba, 0 figyelmeztetés a végigjátszott Journey alatt.
- Az Embermérleg a reveal előtt nincs renderelve; a reveal után megjelenik.
- A kijelölés, visszaválasztás, megtartás és megerősítés továbbra is kizárólag Player UI-eredetű; a visszaválasztás a meglévő `selectLens` parancsot használja.
- A domainmag, portok, WebMCP-toolnevek és tool-szerződések nem változtak.

## 2026-08-30 — célzott P0 olvashatóság és payoff

A gyors korábbi funkcionális videó nem szolgált ritmusreferenciaként. A mostani QA külön, olvasható állapotidőkkel készült 1113 × 900 és tényleges 790 × 512 CSS-viewporton.

| Követelmény | Eredmény | Bizonyíték |
|---|---|---|
| A nyitó CTA 790 × 512-en hajtás fölött marad | passed | `targeted-p0-entry-790x512.png` |
| Dilemma két, legalább 18 px-es olvasási ütemben | passed | `targeted-p0-dilemma-790x512.png` |
| Három rövid, azonos súlyú döntési tárgy | passed | `targeted-p0-direction-790x512.png`, `targeted-p0-direction-desktop.png` |
| AGY-kijelölés után rövid előkészítés és „Megfordítom a kártyát” | passed | `targeted-p0-agy-selected-790x512.png`, `targeted-p0-selection-desktop.png` |
| Térbeli kártyafordítás, tömör Ellenpont, két jól látható döntés | passed | `targeted-p0-reflection-790x512.png`, `targeted-p0-reflection-desktop.png` |
| Megtartás és végleges megerősítés tartalmilag eltér | passed | `targeted-p0-confirmation-790x512.png`, `targeted-p0-confirmation-desktop.png` |
| Következmény és Embermérleg nem jelenik meg egyszerre | passed | `targeted-p0-outcome-790x512.png` és `targeted-p0-balance-790x512.png`; külön DOM-állapotok ugyanazon `CONSEQUENCE_REVEALED` fázison belül |
| A következménykártya szövege a jelenet főszereplője | passed | `targeted-p0-outcome-desktop.png` |
| A mérleg fizikai tárgy, soros AGY-deltákkal és szöveges `0 → ±1` jelzéssel | passed | `targeted-p0-balance-desktop.png` |
| Billentyűzet- és képernyőolvasó-struktúra | passed | Minden CTA és irány natív `button`; a fókusz látható; a két visszaválasztás fókuszolható; a DOM-snapshotok pontos neveket és állapotokat adnak; a teljes Player UI-flow regressziós tesztje sikeres. |

A referencia és a tényleges asztali Irány-jelenet közös összehasonlító képe: `docs/evidence/design/comparison-targeted-p0-direction.png`. A lassú, olvasható teljes állapotfelvétel: `docs/evidence/design/targeted-p0-readable-flow.gif`. A GIF állapotritmust bizonyít; a valódi 3D-fordítást, kiosztást, pecsételést és soros jelölőmozgást a futó prototípus és a fenti CSS-időzítések adják.

Az Embermérleg CTA-ja a single-dilemma slice-ban a meglévő `CONSEQUENCE_REVEALED → GAME_COMPLETE` domainátmenetet, majd a meglévő Player UI `resetGame` parancsot futtatja egymás után. Új állapot, port, tool vagy szerződés nem jött létre.

## Összegzés

A vertical slice nem Gépváros-témájú dashboardként, hanem egyetlen bejárható döntési rítusként működik. A filmszerű háttér, a térbeli döntési tárgy, az emberi pecsét, a lezárt kapu és a két ütemre bontott payoff egy összefüggő játékdramaturgiát alkot. A célzott 790 × 512 és asztali kompozícióban is megmarad az egyetlen aktuális feladat fókusza.

## 2026-08-30 — P0 emberikontroll- és nyitóflow-regresszió

- A `REFLECTION_PRESENTED` jelenet 790 × 512-en egyszerre, azonos döntési blokkban mutatja a „Megtartom az AGY irányt” és a „Másik irányt választok” natív gombokat. Mindkettő legalább 18 px-es, fókuszolható és megfelelő kontrasztú. Bizonyíték: `p0-control-06-brain-reflection-two-actions-790x512.png`.
- A másodlagos döntés a meglévő UI-folyamon tér vissza a három irányhoz; nem hoz létre új doménállapotot. Bizonyíték: `p0-control-07-returned-directions-790x512.png`.
- A visszatérés után másik irány kijelölhető; a KÉZ-kijelölés a meglévő `selectLens` parancsutat használja. Bizonyíték: `p0-control-08-hand-selected-790x512.png`.
- A végleges megerősítés előtt ugyanez a visszalépés látható; `DECISION_CONFIRMED` után már nem renderelődik.
- Mobilon 390 × 844-en a két Ellenpont-döntés és a megerősítés előtti visszalépés teljes szélességben, egymás alatt látható; nincs vízszintes túlcsordulás. Bizonyíték: `p0-reflection-two-actions-mobile-390x844.png`, `p0-confirmation-back-mobile-390x844.png`.
- A fókuszolhatóságot külön regressziós ellenőrzés igazolja mindkét Ellenpont-gombra és a megerősítés előtti visszalépésre. A böngészőkonzol a teljes ellenőrzés alatt 0 hibát és 0 figyelmeztetést adott.
- A nyitó narratíva most pontosan: „Belépek a Gépvárosba” → „Hoztam neked egy kérdést.” → „Kérjek bocsánatot helyetted?”. Nincs második kapcsolódási vagy hívásfogadó kapu.
- A 8 képkockás, 21,2 másodperces, lassú állapotvideó: `docs/evidence/design/p0-human-control-flow.gif`. SHA-256: `4265fd639ab43bda9bf5d620f87c4bd40f531050a0ef53177e6363a82a437cf7`.

final result: passed

## 2026-08-30 — SZÍV Embermérleg release-korrekció

- A tesztvideóban látható `Szabadság −1`, `Felelősség +1` eltérés forrása a dilemma domainadatának regressziója volt; az Embermérleg nem tartalmazott SZÍV-specifikus prezentációs hardcode-ot.
- A kanonikus SZÍV-delta ismét: Kényelem `−1`, Kontroll `+1`, Kapcsolódás `+1`, Szabadság `0`, Felelősség `+2`.
- Az UI továbbra is kizárólag a session aktuális `balance` értékeit jeleníti meg.
- Az öttengelyes UI-regresszió engine → session → Embermérleg adatúton ellenőrzi a teljes SZÍV-vektort.
- A cím végleges formája: „A döntés lenyomata”.
