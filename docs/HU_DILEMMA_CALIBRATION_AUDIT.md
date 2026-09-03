# Magyar dilemmakatalógus — 12 ágú kalibrációs audit

- **Verzió:** 0.2.1 — sessionfolyam PO-döntésével kiegészített változat
- **Dátum:** 2026. szeptember 2.
- **Alkotmány:** [`DECISION_RITUAL_CONSTITUTION_HU.md`](./DECISION_RITUAL_CONSTITUTION_HU.md) 0.2
- **Tartalmi forrás:** [`HU_DILEMMA_CATALOG_SPEC.md`](./HU_DILEMMA_CATALOG_SPEC.md) 0.2.1
- **Hatókör:** a négy magyar induló dilemma 12 ágának végső tartalmi és játékkalibrációs újraauditja
- **Nem része:** alkalmazáskód, UI, teszt, állapotgép, WebMCP-szerződés, commit vagy deployment

## 1. Vezetői eredmény

| Státusz | Ágak száma |
|---|---:|
| `MEGTARTHATÓ` | **12** |
| `ÚJRATERVEZENDŐ` | **0** |
| `ELTÁVOLÍTANDÓ` | **0** |

Az első audit hat hibás ágát nem pusztán újraszámoztuk: ahol szükséges volt, megváltozott az alaphelyzet, a delegálási határ, a reflexió, a nyereség, az ár és a következménycopy. Az új eredmény:

- mindhárom irány jóhiszemű, felelős ember számára legitim lehet;
- nincs szabályszegésre, automatikus kizárásra vagy feketedobozos ítéletre épülő csapdaág;
- minden dilemma egyetlen Kapcsolódás-referenst használ mindhárom ágban;
- a Szabadság sehol nem pusztán a Kényelem időhatásának újraszámolása;
- a Felelősség az aktív emberi gyakorlatot méri, az elszámoltathatóság minden ágban emberi vagy szervezeti marad;
- mind a négy AGY `Kontroll +1` megfelel a szerkeszthetőség, felülbírálhatóság, visszakövethetőség és használat előtti emberi ellenőrzés négyes feltételének;
- nincs összpontszám, automatikus győztes SZÍV, gonosz KÉZ vagy erkölcsileg biztonságos középútként kezelt AGY.

## 2. Lezárt PO-döntések

1. A játék nyíltan normatív az átlátható delegálás, emberi jóváhagyás és nem delegálható elszámoltathatóság mellett, de nem rangsorolja automatikusan az AGY–KÉZ–SZÍV módokat.
2. A Felelősség a lényegi mérlegelés, ellenőrzés, szerzőség, döntési munka, indoklás és cselekvés személyes megtartását méri. Negatív delta mellett sem csökken az elszámoltathatóság.
3. A négy Kapcsolódás-referens rögzített: megbántott ember; saját tanulási feladat és gondolatmenet; eredeti jelentkezői bizonyíték; elsődleges forrás és bizonyítéklánc.
4. Futura nagy tétű vagy más embert kizáró végső döntést nem hozhat. A dokumentált emberi felülvizsgálat azt jelenti, hogy a végleges döntés emberi.
5. A `0` az alapérték, a `±2` erős vagy több bizonyítékot igényel, és nincs deltaösszeg-alapú kiegyenlítés.
6. A négy magyar dilemma egyetlen sessionben, a rögzített sorrendben játszható végig. Az első három kör után a „Jöhet a következő kérdés” CTA reset nélkül léptet tovább, miközben az Embermérleg és az outcome history megmarad; reset csak a negyedik dilemma utáni `GAME_COMPLETE` állapotban lehetséges. Ehhez nem készül új domainfázis vagy WebMCP-tool.

## 3. A hat újratervezett ág előtte–utána

| Ág | 0.1 probléma | 0.2 megoldás | Régi delta | Végleges delta |
|---|---|---|---|---|
| Házi feladat — KÉZ | A teljes gépi megoldás beadása csalásra épülő csapda volt; az ellenőrzés hiányzott. | A tanár engedi és feltüntetést kér; Futura teljes első változatot készít, a diák tételesen ellenőriz, javít és magyaráz. | `+2, −2, 0, +1, −2` | `+2, −1, −1, +1, −1` |
| Házi feladat — SZÍV | A rögzített tanulási referens ellenére Kapcsolódás `0` maradt, hogy a SZÍV ne kapjon több pozitív értéket. | A közvetlen saját gondolatmenet Kapcsolódás `+1`; az idő, elakadás, saját hiba és másik időablak szűkülése valódi ár. | `−2, +1, 0, −1, +2` | `−2, +1, +1, −1, +2` |
| Interjúlista — KÉZ | Futura gyakorlatilag végleges rövidlistát és kizárást hozott létre, kötelező emberi felülvizsgálat nélkül. | Auditálható javaslat, eredeti anyaghoz kötött állítás, minden kizárási javaslat kötelező felülvizsgálata, emberi végdöntés. | `+2, −2, −2, +1, −1` | `+2, −1, −1, 0, −1` |
| Interjúlista — SZÍV | A Szabadság `−2` ugyanazt az időterhet számolta újra, amelyet a Kényelem már mért. | A lassúság valós narratív ár, de bizonyított opcióvesztés nélkül Szabadság `0`; a saját torzítások konkrétak. | `−2, +1, +1, −2, +2` | `−2, +1, +1, 0, +2` |
| Online állítás — KÉZ | Feketedobozos igaz/hamis címke; Kapcsolódás más referensre váltott, a Szabadság duplán jutalmazta a gyorsaságot. | Forrásolt, bizonytalanságot jelző előzetes ítélet; három emberi továbbadási opció; elsődlegesforrás-referens. | `+2, −2, +1, +1, −2` | `+2, −1, −1, 0, −1` |
| Online állítás — SZÍV | A közvetlen forrásmunka mellett mesterséges Kapcsolódás `−1` büntette a SZÍV-et. | Kapcsolódás `+1` a forrásközelségből; valós ár a kompetenciakorlát, torzítás, bizonytalanság és a korai helyesbítési ablak szűkülése. | `−2, +2, −1, −1, +2` | `−2, +2, +1, −1, +2` |

A vektorok sorrendje mindenhol: **Kényelem, Kontroll, Kapcsolódás, Szabadság, Felelősség**.

## 4. Az AGY `Kontroll +1` kötelező újraauditja

| Dilemma | Szerkeszthető | Felülbírálható | Visszakövethető | Ember ellenőrzi használat előtt | Eredmény |
|---|---|---|---|---|---|
| Bocsánatkérés | A vázlat szabadon átírható. | A játékos bármely mondatot elhagyhat vagy cserélhet. | A vázlat a játékos által ismert beszélgetési előzményhez köthető. | A játékos szerkeszt és személyesen küld; Futura nem küldi el. | `Kontroll +1` igazolt. |
| Házi feladat | A terv és példa szerkeszthető. | A diák más megoldási utat választhat. | Minden elem a látható feladatkiíráshoz kötött. | A diák ellenőrzi, kidolgozza és csak utána adja be. | `Kontroll +1` igazolt. |
| Interjúlista | Az összevetés szerkeszthető. | A sorrend és megállapítás felülírható. | Minden állítás az eredeti jelentkezéshez vezet. | Az ember olvas, ellenőriz és dönt a meghívásról. | `Kontroll +1` igazolt. |
| Online állítás | A forrástérkép és következtetés szerkeszthető. | A gépi keret elvethető. | Közvetlen hivatkozások vezetnek az elsődleges forrásokhoz. | A játékos megnyitja a kulcsforrást, majd dönt a továbbadásról. | `Kontroll +1` igazolt. |

## 5. Végleges 12 ágú delta-tábla

| Dilemma | Ág | Kényelem | Kontroll | Kapcsolódás | Szabadság | Felelősség | Státusz |
|---|---|---:|---:|---:|---:|---:|---|
| Bocsánatkérés | AGY | +1 | +1 | −1 | 0 | 0 | `MEGTARTHATÓ` |
| Bocsánatkérés | KÉZ | +2 | −1 | −1 | +1 | −1 | `MEGTARTHATÓ` |
| Bocsánatkérés | SZÍV | −1 | +1 | +1 | 0 | +2 | `MEGTARTHATÓ` |
| Házi feladat | AGY | +1 | +1 | 0 | −1 | +1 | `MEGTARTHATÓ` |
| Házi feladat | KÉZ | +2 | −1 | −1 | +1 | −1 | `MEGTARTHATÓ` |
| Házi feladat | SZÍV | −2 | +1 | +1 | −1 | +2 | `MEGTARTHATÓ` |
| Interjúlista | AGY | +1 | +1 | −1 | −1 | +1 | `MEGTARTHATÓ` |
| Interjúlista | KÉZ | +2 | −1 | −1 | 0 | −1 | `MEGTARTHATÓ` |
| Interjúlista | SZÍV | −2 | +1 | +1 | 0 | +2 | `MEGTARTHATÓ` |
| Online állítás | AGY | +1 | +1 | −1 | 0 | +1 | `MEGTARTHATÓ` |
| Online állítás | KÉZ | +2 | −1 | −1 | 0 | −1 | `MEGTARTHATÓ` |
| Online állítás | SZÍV | −2 | +2 | +1 | −1 | +2 | `MEGTARTHATÓ` |

## 6. Ágankénti bizonyítás

### 6.1. Bocsánatkérés

**Kapcsolódás-referens:** közvetlen kommunikatív jelenlét a megbántott emberrel.

| Ág | Delegálási határ és legitim nyereség | Delta-bizonyítás | Vakfolt és ár | Státusz |
|---|---|---|---|---|
| AGY | Futura szerkeszthető vázlatot ad; az ember átír és személyesen küld. Gyors, szerkeszthető kezdőpont. | Ké `+1`: részmunka eltűnik. Ko `+1`: szerkeszthető, felülbírálható, előzményhez kötött, küldés előtt ellenőrzött. Ka `−1`: gépi szöveg közvetít. Sz `0`: nincs bizonyított opciónyitás vagy -zárás. Fe `0`: a gépi vázlat és az emberi szerkesztés vegyes, egyik irány sem dominál. | A gépi keret elrejtheti, mire van szüksége a másiknak; később nehéz lehet felidézni, mely mondat származott valóban a játékostól. | `MEGTARTHATÓ` |
| KÉZ | Futura gyors, higgadt üzenetet készít és küldhet a kijelölt, átlátható határon belül. Krízisben időt és mentális kapacitást adhat, megállíthat eszkalációt. | Ké `+2`: a megfogalmazás és végrehajtás jelentős része átkerül. Ko `−1`: kevesebb közvetlen alakítás, de a határ látható. Ka `−1`: a közlés automatizált közvetítésen át érkezik. Sz `+1`: biztonságos kommunikációs lehetőséget tart nyitva akkor is, amikor a játékos még nem tud megszólalni. Fe `−1`: kevesebb szerzőség és végrehajtás marad embernél. | A gyorsaság nem garantál meghallgatottságot; a címzettnek tudnia kell, hogyan született és ki küldte az üzenetet. | `MEGTARTHATÓ` |
| SZÍV | Az ember maga ír és küld, Futura csak kérdez. A közvetlen gesztus és szerzőség megmarad. | Ké `−1`: időt, figyelmet és érzelmi kapacitást kér. Ko `+1`: az ember alakítja és ellenőrzi a saját szövegét. Ka `+1`: közvetlen kommunikáció a referenssel. Sz `0`: a saját hang önmagában nem nyit vagy zár bizonyított opciót. Fe `+2`: szerzőség, mérlegelés és cselekvés több kulcslépése emberi. | Meghosszabbíthatja a másik bizonytalanságát; a saját hang sem garantálja, hogy a címzett meghallgatva érzi magát. | `MEGTARTHATÓ` |

**Dilemmaeredmény:** mindhárom ág legitim. A SZÍV Kapcsolódás `+1` a gesztus közvetlenségét, nem a kapcsolat biztos helyreállítását jelenti.

### 6.2. Házi feladat

**Kapcsolódás-referens:** közvetlen kapcsolat a saját tanulási feladattal és gondolatmenettel.

| Ág | Delegálási határ és legitim nyereség | Delta-bizonyítás | Vakfolt és ár | Státusz |
|---|---|---|---|---|
| AGY | Futura visszaköthető tervet és példát ad; a diák ellenőriz, felülbírál, kidolgoz és bead. Könnyebb indulás. | Ké `+1`: az indulás részterhe csökken. Ko `+1`: a négy kötelező feltétel teljesül. Ka `0`: a diák továbbra is közvetlenül dolgozik a feladaton. Sz `−1`: az első példa egy saját megoldási irányt horgonyozhat. Fe `+1`: kidolgozás, ellenőrzés és beadás emberi. | A rendezett terv nem bizonyít megértést; az első példa egyetlen elképzelhető úttá válhat. | `MEGTARTHATÓ` |
| KÉZ | A tanár engedi az AI-t; Futura teljes első változatot készít, a diák feltüntet, ellenőriz, javít és magyaráz. Idő, kész első változat, határidőbiztonság. | Ké `+2`: a megoldási munka nagy része átkerül. Ko `−1`: a kötelező felülvizsgálat és javíthatóság megmarad, de a lényegi megoldás gépi. Ka `−1`: kevesebb közvetlen saját problémamegoldás. Sz `+1`: nyitva marad a határidős beadás konkrét lehetősége. Fe `−1`: a megoldás jelentős része delegált, az ellenőrzés és magyarázat emberi. | A diák éppen ott nehezebben ismeri fel a hibát, ahol eredetileg elakadt; a kész szöveghez kötődő megértés nem biztos, hogy új helyzetre átvihető. | `MEGTARTHATÓ` |
| SZÍV | A diák maga old meg, Futura csak kérdez és visszajelez. Közvetlen saját gondolatmenet. | Ké `−2`: a teljes gondolkodási munka és elakadás terhe emberi. Ko `+1`: saját folyamat, Futura kérdéseivel ellenőrizhető. Ka `+1`: közvetlen kapcsolat a rögzített referenssel. Sz `−1`: pihenés vagy más feladat konkrét időablaka szűkül. Fe `+2`: gondolkodás, szerzőség, ellenőrzés és beadás emberi. | Megerősítheti a saját hibát, elakadhat, és kevesebb idő maradhat más kötelezettségre. | `MEGTARTHATÓ` |

**Dilemmaeredmény:** a KÉZ átlátható, szabályos delegálás lett, nem csalási csapda. A SZÍV tanulási közvetlensége pozitív, de nem garantál jó megoldást vagy jobb jegyet.

### 6.3. Interjúlista

**Kapcsolódás-referens:** közvetlen kapcsolat a jelentkezők eredeti, munkához kapcsolódó bizonyítékaival.

| Ág | Delegálási határ és legitim nyereség | Delta-bizonyítás | Vakfolt és ár | Státusz |
|---|---|---|---|---|
| AGY | Futura szerkeszthető összevetést készít, minden állítást eredeti jelentkezéshez köt; az ember olvas és dönt. Gyors áttekintés. | Ké `+1`: a rendezés részterhe csökken. Ko `+1`: a négy kötelező feltétel teljesül. Ka `−1`: táblázatos közvetítő réteg jelenik meg. Sz `−1`: a gépi sorrend horgonyoz egy értékelési utat. Fe `+1`: az olvasás, felülbírálás, meghívás és indoklás emberi. | A szokatlan tapasztalat háttérbe kerülhet; a sorrend később saját első benyomásnak tűnhet. | `MEGTARTHATÓ` |
| KÉZ | Futura auditálható rövidlistajavaslatot készít; minden kizárási javaslat kötelező emberi felülvizsgálatot kap, a meghívás végdöntése emberi. Jelentős idő- és feldolgozási kapacitás. | Ké `+2`: az előfeldolgozás nagy része gépi. Ko `−1`: a kritériumkeret gépi, de visszakövethető, vitatható és felülbírálható. Ka `−1`: a jelentkezők először közvetített összefoglaláson át jelennek meg, de az eredeti minden döntésnél elérhető. Sz `0`: idő nyílik, a javaslat horgonyoz; nincs bizonyított domináns irány. Fe `−1`: az első értékelési munka átkerül, a felülvizsgálat és végdöntés emberi. | A hibás kritérium skálázódhat; ha az ember csak a lista tetejét nézi, a javaslat tényleges döntéssé válhat. | `MEGTARTHATÓ` |
| SZÍV | Az ember minden eredeti jelentkezést elolvas és dönt; Futura csak következetességi kérdéseket ad. Közvetlen eredeti bizonyíték. | Ké `−2`: minden anyag elolvasása jelentős teher. Ko `+1`: az ember alakít és felülvizsgál, de saját torzítása megmarad. Ka `+1`: közvetlen találkozás az eredeti bizonyítékokkal. Sz `0`: lassabb folyamat, de nincs megnevezett bezárult opció. Fe `+2`: olvasás, döntés és indoklás több kulcslépése emberi. | Fáradtság, első benyomás, szimpátia és következetlenség torzíthat; a folyamat lassabb. | `MEGTARTHATÓ` |

**Dilemmaeredmény:** Futura egyik ágban sem hoz behívási vagy kizárási végdöntést. Védett tulajdonság és nyilvánvaló proxyja nem lehet szempont; a kritériumok dokumentáltak és vitathatók.

### 6.4. Online állítás

**Kapcsolódás-referens:** közvetlen kapcsolat az elsődleges forrásokkal és a bizonyítéklánccal.

| Ág | Delegálási határ és legitim nyereség | Delta-bizonyítás | Vakfolt és ár | Státusz |
|---|---|---|---|---|
| AGY | Futura szerkeszthető forrástérképet készít közvetlen linkekkel; az ember kulcsforrást nyit, felülbírál és dönt. Gyors áttekintés. | Ké `+1`: a keresés és rendezés részterhe csökken. Ko `+1`: a négy kötelező feltétel teljesül. Ka `−1`: a gépi összefoglalás közvetítő réteg. Sz `0`: több forrás nyílik meg, de a keret horgonyoz. Fe `+1`: az ellenőrzés kulcspontja és a továbbadás emberi. | A forrásválasztás már döntés; később az összefoglalás maradhat meg az eredeti bizonyíték helyett. | `MEGTARTHATÓ` |
| KÉZ | Futura gyors előzetes ítéletet, bizonytalanságot, forrásokat és indoklást ad; az ember választ a három továbbadási mód között. Gyors, forrásolt jelzés. | Ké `+2`: a keresés és első mérlegelés nagy része gépi. Ko `−1`: kész keret érkezik, de forrásolt és felülbírálható. Ka `−1`: a forrástalálkozást gépi értékelés közvetíti. Sz `0`: a három opció nyitva marad, a kész ítélet horgonyoz; nincs domináns irány. Fe `−1`: egy jelentős ellenőrzési lépés átkerül, a továbbadás emberi. | A bizonyossági jelzés nem bizonyíték; a kész ítélet lehorgonyozhat, és gyengülhet a közvetlen forrásrutin. | `MEGTARTHATÓ` |
| SZÍV | Az ember elsődleges forrásokat nyit és vet össze; Futura csak kérdez és ellenőrzési szempontot ad. Közvetlen bizonyítéklánc. | Ké `−2`: teljes forrásmunka és figyelemteher. Ko `+2`: több közvetlen forrás, teljes vizsgálhatóság és felülbírálhatóság. Ka `+1`: közvetlen találkozás a rögzített referenssel. Sz `−1`: a gyorsan terjedő állítás korai helyesbítési időablaka konkrétan szűkül. Fe `+2`: ellenőrzés, ítélet, fogalmazás és továbbadás emberi. | Maradhat bizonytalanság; megerősítési torzítás vagy hiányos forrásértékelési kompetencia hibás ítélethez vezethet. | `MEGTARTHATÓ` |

**Dilemmaeredmény:** a KÉZ nem feketedoboz és nem vált Kapcsolódás-referenst. A SZÍV pozitív Kapcsolódása nem erkölcsi jutalom, a konkrét gyors helyesbítési opció elvesztése pedig a Kényelemtől különálló Szabadság-ár.

## 7. Keresztmetszeti normatív torzítás audit

### 7.1. „SZÍV mindig szent”

**Nem igazolt automatikus rangsor.** A SZÍV mind a négy dilemmában több aktív felelősséggyakorlást tart meg, ezért a Felelősség pozitív; ez a mód definíciójából és a konkrét cselekvésből következik, nem erkölcsi pont. Ugyanakkor minden SZÍV-ág valós terhelést és saját emberi vakfoltot mutat:

- bocsánatkérés: érzelmi kapacitás, késlekedés, a meghallgatottság bizonytalansága;
- házi feladat: elakadás, saját hiba, másik időablak szűkülése;
- interjúlista: fáradtság, első benyomás, szimpátia, következetlenség;
- online állítás: bizonytalanság, kompetenciakorlát, megerősítési torzítás, korai helyesbítési ablak szűkülése.

Egyik pozitív Kapcsolódás-delta sem ígér jó eredményt: csak a rögzített referenssel való közvetlenséget jelzi.

### 7.2. „KÉZ mindig gonosz”

**Nem igazolt.** Mind a négy KÉZ-ág hiteles jóhiszemű célt ad:

- gyors higgadt kommunikáció és deeszkaláció;
- szabályosan felhasználható első változat és határidőbiztonság;
- jelentős, auditálható feldolgozási kapacitás;
- gyors, forrásolt előzetes ítélet egy elhamarkodott megosztás megállításához.

A KÉZ negatív kontroll-, kapcsolódás- vagy felelősséggyakorlási deltái a delegált munkából következnek, nem erkölcsi büntetések. Egyik ág sem tünteti el az emberi elszámoltathatóságot.

### 7.3. „AGY mindig biztonságos középút”

**Nem igazolt.** Az AGY mind a négy esetben szerkeszthető és ellenőrizhető kiindulópontot ad, ezért a Kontroll `+1` jogos. Ugyanakkor minden ág konkrét horgonyzási árat hordoz: saját mondatok eredete, megoldási út, jelentkezői sorrend vagy forrásválasztás. Az AGY nem semleges; csak korrigálható.

### 7.4. Deltaösszeg és erkölcsi profil

A vektorokat nem összegezzük. Az Online állítás SZÍV-ága például több erős pozitív tengelyt és erős valós árat hordoz, de ebből nem következik „jobb” összpontszám. A KÉZ kényelmi nyeresége sem kompenzáció, az AGY mérsékelt profilja sem rangsor. A reveal mindenhol külön mondja ki a nyereséget, az árat és a továbbra is emberi vállalást.

## 8. Elfogadási kapu

- [x] 12/12 ág `MEGTARTHATÓ`.
- [x] Mindhárom irány minden dilemmában jóhiszemű, felelős ember számára legitim lehet.
- [x] Nincs csapdaág.
- [x] Minden nem nulla delta konkrét narratív bizonyítékkal rendelkezik.
- [x] Nincs narratíva–delta ellentmondás.
- [x] Minden dilemma ugyanazt az egy Kapcsolódás-referenst használja mindhárom ágban.
- [x] A Szabadság nem duplikálja a Kényelmet.
- [x] Az elszámoltathatóság sehol nem delegálható.
- [x] Mind a négy AGY `Kontroll +1` megfelel a kötelező négy feltételnek.
- [x] Nagy tétű vagy kizáró KÉZ-végdöntés sehol nincs.
- [x] Nincs automatikusan győztes SZÍV, gonosz KÉZ vagy biztonságos AGY.

## 9. Megmaradt blokkolók és PO-kérdések

**Valódi tartalmi implementációs blokkoló:** nincs.

A három dokumentum 0.2-es tartalmi csomagja és a katalógus 0.2.1-es sessionfolyam-kiegészítése végső PO-jóváhagyásra kész. Ez a jóváhagyás után tehető külön implementációs feladattá; ebben a körben kód-, UI-, teszt-, állapotgép- vagy WebMCP-módosítás nem engedélyezett.

Két nem blokkoló későbbi PO-döntés:

1. A toborzási `contentNotice` játékosoldali vagy csak facilitátori megjelenítése.
2. Az angol és korosztályos változatok külön kulturális kalibrációjának ütemezése.
