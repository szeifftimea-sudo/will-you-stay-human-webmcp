# Bővíthető magyar dilemmakatalógus — tartalmi és metaadat-specifikáció

- **Verzió:** 0.2.1 — négykörös sessionfolyammal kiegészített változat
- **Dátum:** 2026. szeptember 2.
- **Nyelv:** magyar (`hu`)
- **Fagyasztott technikai alap:** `b5519a3f2310db96ec678abe11439c64a2c081d8`
- **Hatókör:** implementációra kész tartalom- és metaadat-specifikáció; nincs alkalmazáskód-, UI-, állapotgép-, WebMCP-, teszt- vagy deployment-módosítás

## 1. Cél és szerkesztési alapelvek

A katalógus négy induló dilemmát fog össze úgy, hogy azok egyetlen sessionben, a rögzített katalógussorrendben végigjátszhatók legyenek, és új tartalom később új állapot, port vagy WebMCP-tool nélkül legyen hozzáadható. Minden dilemma ugyanazon Journey-n halad végig, de eltérő helyzetet, delegálási határokat, reflexiókat és következményeket ad.

A szöveg a körülbelül `790 × 512` képpontos felvételi viewporthoz készült:

- a helyzet két rövid olvasási ütemre bontható;
- a kártyacím legfeljebb három-négy szó;
- a delegálási határ egy mondat;
- az Ellenpont négy strukturált mondata rövid, a látható kártyán a `counterargument`, `blindSpot` és `question` élvez elsőbbséget;
- a következmény egy nyereséget, egy árat és egy zárókérdést mutat;
- egyik ág sem kap erkölcsi minősítést vagy összpontszámot.

### 1.1. Az AGY–KÉZ–SZÍV közös jelentése

> Itt nem azt választod, milyen ember vagy. Azt jelölöd ki, hogy ebben a helyzetben mit adsz át Futurának. Az AGY kiindulópontot kér, a KÉZ végrehajtást ad át, a SZÍV megtartja a cselekvést, és csak kérdéseket kér. A játék nem rangsorolja automatikusan a három módot: megmutatja, mit nyertél, mit adtál át, és mit vállalsz továbbra is.

- **AGY — kiindulópont és keret:** Futura rendszerez, vázlatot vagy elemzést ad; a játékos alakítja ki és vállalja a végső döntést.
- **KÉZ — delegált végrehajtás:** Futura átveszi a cselekvés jelentős részét vagy auditálható javaslatot készít; a végleges, nagy tétű vagy más embert kizáró döntés emberi marad.
- **SZÍV — emberi cselekvés reflektív támogatással:** a játékos gondolkodik, dönt és cselekszik; Futura csak kérdez, tükröz és ellenőrzési szempontot ad.

Ezek nem személyiségtípusok és nem erkölcsi fokozatok. A SZÍV sem automatikusan helyesebb, a KÉZ sem automatikusan felelőtlenebb, az AGY sem automatikusan racionálisabb a másik kettőnél.

### 1.2. Közös ikonjelentés

| Lencse | Ikon jelentése | Hozzáférhető jelentés |
|---|---|---|
| AGY | Elágazó út vagy szerkesztési váz: cél, rendszerlogika, kiindulópont. | „Futura keretet ad; a végső döntést te alakítod ki.” |
| KÉZ | Nyitott tenyér vagy továbbadó mozdulat: végrehajtás átadása. | „Futura átveszi a végrehajtás vagy a döntés jelentős részét.” |
| SZÍV | Két pontot összekötő vonal: érintettek, következmények, felelősség. | „Te cselekszel; Futura csak kérdez és tükröz.” |

Az ikon minden esetben dekoratív (`aria-hidden`); a jelentést a látható kártyaszöveg és az akadálymentes név is közli.

## 2. Katalógus- és metaadatmodell

### 2.1. Stabil dimenziók

```ts
type AudienceId = "10-13" | "14-17" | "18-plus" | "all";
type ContextId = "solo" | "family" | "classroom" | "workshop" | "workplace";
type SensitivityLevel = "low" | "moderate" | "high";

interface DilemmaMetadata {
  dilemmaId: string;
  conceptId: string;
  categoryId: string;
  audienceIds: AudienceId[];
  contextIds: ContextId[];
  tags: string[];
  sensitivityLevel?: SensitivityLevel;
}
```

- `dilemmaId`: egy konkrét, verziózható tartalom stabil, nyelvfüggetlen azonosítója; megegyezik a jelenlegi `Dilemma.id` értékével.
- `conceptId`: ugyanazon alaphelyzet korosztályos vagy más szerkesztési változatait kapcsolja össze. A mostani alapkörben minden dilemmához rögzítjük, hogy később ne kelljen azonosítót visszamenőleg kitalálni.
- `categoryId`: egyetlen elsődleges kategória; azt mondja meg, miről szól a dilemma.
- `audienceIds`: egy vagy több célkorosztály; nem kategória és nem nehézségi szint.
- `contextIds`: azok a játékhelyzetek, ahol a tartalom értelmesen használható.
- `tags`: bővíthető, stabil, kebab-case témacímkék; nem helyettesítik az elsődleges kategóriát.
- `sensitivityLevel`: opcionális szerkesztői jelzés. Nem pontszám és nem jelenik meg automatikusan a játékosnak.

### 2.2. Kategóriakatalógus

| `categoryId` | Magyar név | Rövid leírás | Későbbi dilemmapotenciál |
|---|---|---|---|
| `relationships-communication` | Kapcsolatok és kommunikáció | Bizalom, konfliktus, közvetlen megszólalás és digitális közvetítés. | Nehéz üzenet megfogalmazása; csoportos beszélgetés moderálása. |
| `learning-development` | Tanulás és fejlődés | Gyakorlás, visszajelzés, szerzőség és a saját gondolkodás határai. | Esszévázlat vagy kész esszé; gyakorlási terv vagy automatikus megoldás. |
| `work-governance` | Munka és döntéshozatal | Munkahelyi döntések, folyamatok, felelősség és méltányosság. | Feladatkiosztás; erőforrás-priorizálás; jelentkezések előszűrése. |
| `information-public-life` | Információ és közélet | Források, bizonytalanság, nyilvános állítások és közös bizalom. | Vírusosan terjedő állítás; közéleti összefoglaló; forrásütközés. |
| `creativity-self-expression` | Alkotás és önkifejezés | Saját hang, stílus, társszerzőség és kreatív automatizálás. | Dal vagy kép befejezése; személyes történet átírása más stílusában. |
| `care-wellbeing` | Gondoskodás és jóllét | Odafigyelés, mindennapi támogatás és emberi jelenlét, magas kockázatú tanácsadás nélkül. | Kapcsolattartási emlékeztető; támogató üzenet; napi rutin segítése. |
| `privacy-digital-safety` | Magánszféra és digitális biztonság | Adatátadás, hozzájárulás, profilalkotás és online biztonság. | Fotó megosztási engedélye; alkalmazásjogosultság; személyes adatok összefésülése. |

A kategóriák lokalizálhatók. Az angol megjelenítési név később ugyanahhoz a `categoryId` értékhez kapcsolódik; az azonosító nem fordítandó.

### 2.3. Címke- és érzékenységi szabályok

- A `tags` kontrollált, de bővíthető névtér. Induló értékek: `ai-delegation`, `authorship`, `responsibility`, `trust`, `bias`, `misinformation`, `privacy`, `relationship`, `education`, `communication`, `critical-thinking`, `hiring`.
- Új tag csak akkor szükséges, ha legalább két tartalomnál vagy egy tervezett szűrőnél értelmes lesz; szinonim duplikátum nem hozható létre.
- `low`: hétköznapi, alacsony érzelmi terhelésű téma.
- `moderate`: kapcsolatot, értékelést, igazságosságot vagy közös bizalmat érintő téma.
- `high`: csak későbbi, facilitátori felülvizsgálat után bevezethető; az induló csomagban nincs ilyen dilemma.

### 2.4. Az Embermérleg tengelyeinek közös jelentése

| Tengely | Mit jelez a delta? |
|---|---|
| Kényelem | Azonnali idő-, energia- és mentálisterhelés-változás. |
| Kontroll | Mennyire látja át, alakítja, javítja vagy bírálja felül a játékos a folyamatot és az eredményt. |
| Kapcsolódás | Mennyire közvetlen a találkozás a dilemma előtt név szerint rögzített egyetlen referenssel; a referens az ágak között nem válthat. |
| Szabadság | Mennyi időbeli és cselekvési mozgástér marad, illetve mennyire szűkülnek az észlelt lehetőségek. |
| Felelősség | A játékos mennyi lényegi mérlegelést, ellenőrzést, szerzőséget, döntési munkát, indoklást és cselekvést tart meg személyesen. Az elszámoltathatóság minden ágban emberi vagy szervezeti marad. |

A pozitív delta nem erkölcsi jutalom, a negatív nem büntetés. A `0` az alapérték; minden nem nulla deltát konkrét narratív bizonyíték igazol, a `±2` pedig legalább két egymást erősítő bizonyítékot igényel. A Kényelem időhatása nem számolható automatikusan újra Szabadságként, és a negatív Felelősség nem csökkenti a következményekért viselt elszámoltathatóságot.

| Dilemma | Rögzített Kapcsolódás-referens |
|---|---|
| Bocsánatkérés | Közvetlen kommunikatív jelenlét a megbántott emberrel. |
| Házi feladat | Közvetlen kapcsolat a saját tanulási feladattal és gondolatmenettel. |
| Interjúlista | Közvetlen kapcsolat a jelentkezők eredeti, munkához kapcsolódó bizonyítékaival. |
| Online állítás | Közvetlen kapcsolat az elsődleges forrásokkal és a bizonyítéklánccal. |

## 3. A négy induló dilemma áttekintése

| Sorrend | `id` | `conceptId` | Nagy kérdés | Rövid cím |
|---:|---|---|---|---|
| 1 | `apology-delegation` | `apology-delegation` | Kérjek bocsánatot helyetted? | A bocsánatkérés |
| 2 | `homework-delegation` | `homework-delegation` | Megcsináljam helyetted a házit? | A házi feladat |
| 3 | `interview-shortlist-delegation` | `interview-shortlisting` | Döntsem el, kit hívsz interjúra? | Az interjúlista |
| 4 | `claim-verification-delegation` | `claim-verification` | Eldöntsem helyetted, hogy igaz-e? | Igaz vagy sem? |

Az 1. dilemma fagyasztott referencia. A következő három tartalma ebben a dokumentumban implementációra kész szerkesztési specifikáció.

## 4. Fagyasztott referencia — bocsánatkérés

- Forrás: [`src/content/dilemmas/apology.hu.ts`](../src/content/dilemmas/apology.hu.ts).
- A teljes magyar copy, a reflexiók, a következmények és az alábbi delták változatlanok.
- A jelen specifikáció nem írja át és nem értelmezi újra ezt a tartalmat; csak katalógus-metaadatot rendel hozzá.

| Metaadat | Érték |
|---|---|
| `id` / `conceptId` | `apology-delegation` / `apology-delegation` |
| `categoryId` | `relationships-communication` |
| `audienceIds` | `14-17`, `18-plus` |
| `contextIds` | `solo`, `family`, `workshop` |
| `tags` | `ai-delegation`, `relationship`, `communication`, `responsibility`, `trust` |
| `sensitivityLevel` | `moderate` |
| Rövid emlékeztető | „Mennyi segítséget kérsz — és mennyi jelenlétet tartasz meg?” (`centralTension`) |

| Ág | Kényelem | Kontroll | Kapcsolódás | Szabadság | Felelősség |
|---|---:|---:|---:|---:|---:|
| AGY | +1 | +1 | −1 | 0 | 0 |
| KÉZ | +2 | −1 | −1 | +1 | −1 |
| SZÍV | −1 | +1 | +1 | 0 | +2 |

**AGY Kontroll-feltétel:** a fagyasztott copyban Futura csak vázlatot készít; a játékos szerkeszti, felülbírálhatja, a látható beszélgetési előzményhez visszakötheti, és elküldés előtt ellenőrzi. Ez a négy feltétel tartja igazolhatónak a Kontroll `+1` értéket. A kész vázlatot Futura nem küldi el.

## 5. Dilemma 2 — Tanulás és fejlődés

### 5.1. Metaadat és `Dilemma`-törzs

| Mező | Érték |
|---|---|
| `id` | `homework-delegation` |
| `conceptId` | `homework-delegation` |
| `categoryId` | `learning-development` |
| `audienceIds` | `10-13`, `14-17` |
| `contextIds` | `solo`, `family`, `classroom`, `workshop` |
| `tags` | `ai-delegation`, `authorship`, `responsibility`, `education`, `critical-thinking` |
| `sensitivityLevel` | `low` |
| `version` | `catalog-spec-2-po-recalibrated` |
| `status` | implementáláskor először `draft`; tartalmi és regressziós jóváhagyás után `playable` |
| `order` | `2` |
| Rövid cím | A házi feladat |
| `title` | Megcsináljam helyetted a házit? |
| `callPrompt` | Hoztam neked egy kérdést. |
| `situation` | Holnap reggelre kell leadnod egy feladatot, de elakadtál. A tanár engedi az AI használatát, ha feltünteted, ellenőrzöd a beadott megoldást, és kérésre el tudod magyarázni. Futura tervet, teljes első változatot vagy csak kérdéseket adhat. |
| `automationPromise` | Készíthetek visszakövethető tervet, teljes első változatot, vagy csak kérdésekkel segíthetek. Az AI-segítséget te tünteted fel; csak ellenőrzött és megértett megoldást adhatsz be. |
| `centralTension` | Mennyit adsz át a gondolkodásból? |
| `contentNotice` | `null` |
| `canSkip` | `false` |

### 5.2. AGY — kiindulópontot kér

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Vázlatot kérek** |
| Delegálási határ / `choiceText` | Futura szerkeszthető, a feladatkiíráshoz visszaköthető tervet és példát ad; te ellenőrzöd, felülbírálod, kidolgozod és beadod. |
| `reflection.counterargument` | A jó vázlat megmutathat egy utat, de nem bizonyítja, hogy érted is. |
| `reflection.blindSpot` | Futura példája észrevétlenül az egyetlen elképzelhető megoldássá válhat. |
| `reflection.secondaryConsequence` | A beadás után csak akkor derül ki, mi maradt meg, amikor hasonló feladattal egyedül találkozol. |
| `reflection.question` | Melyik lépést tudnád most segítség nélkül is újra megoldani? |
| Megtartási CTA | Megtartom az AGY irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Rendet kaptál a feladathoz, de a megoldás és a beadás nálad maradt. |
| `consequence.costs[0]` | Futura első ötlete beszűkíthette, merre indulsz, és nehéz lehet szétválasztani a segítséget a saját tudásodtól. |
| `consequence.explanation` | Könnyebb lett elindulni, miközben te dolgoztad ki a választ. Az első keretet azonban már nem te választottad. |
| `consequence.closingReflection` | Melyik lépést vinnéd tovább ugyanígy, és melyiket kezdenéd másként? |
| `consequence.delta` | Kényelem `+1`, Kontroll `+1`, Kapcsolódás `0`, Szabadság `−1`, Felelősség `+1` |

**Deltaindoklás:** a vázlat csökkenti az indulás terhét. A kimenet szerkeszthető, felülbírálható, a feladatkiíráshoz visszaköthető és beadás előtt ellenőrizhető, ezért a Kontroll `+1` igazolt. A gépi keret egy saját megoldási irányt zárhat le (`Szabadság −1`), miközben a játékos továbbra is közvetlenül dolgozik a feladaton, ezért a Kapcsolódás `0`.

### 5.3. KÉZ — teljes első változatot kér

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Első változatot kérek** |
| Delegálási határ / `choiceText` | Futura elkészíti a teljes első változatot; te feltünteted a segítséget, tételesen ellenőrzöd és javítod, majd csak azt adod be, amit el tudsz magyarázni. |
| `reflection.counterargument` | A teljes első változat időt és határidőbiztonságot adhat, de az ellenőrzés nem ugyanaz, mint a megoldás végiggondolása. |
| `reflection.blindSpot` | Ott a legnehezebb észrevenni Futura hibáját, ahol eredetileg is elakadtál. |
| `reflection.secondaryConsequence` | Ha a megértés a kész szöveghez kötődik, egy új feladatnál újra hiányozhat a saját megoldási út. |
| `reflection.question` | Melyik lépést tudnád Futura szövege nélkül is elmagyarázni? |
| Megtartási CTA | Megtartom a KÉZ irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Elkészült egy szabályosan felhasználható teljes első változat; időt és határidőbiztonságot nyertél. |
| `consequence.costs[0]` | Kevesebbet gyakoroltad a saját problémamegoldást, és éppen ott lehet nehéz felismerned a hibát, ahol elakadtál. |
| `consequence.explanation` | A megoldás nagy részét átadtad. A feltüntetés, ellenőrzés, javítás és magyarázhatóság továbbra is a te aktív feladatod; a beadásért te tartozol számot adni. |
| `consequence.closingReflection` | Mit javítanál át először, hogy valóban megértsd és vállalni tudd? |
| `consequence.delta` | Kényelem `+2`, Kontroll `−1`, Kapcsolódás `−1`, Szabadság `+1`, Felelősség `−1` |

**Deltaindoklás:** a teljes első változat a munka nagy részét leveszi és nyitva tartja a határidős beadás konkrét lehetőségét (`Kényelem +2`, `Szabadság +1`). A kötelező feltüntetés, tételes ellenőrzés és javíthatóság miatt a Kontroll csak `−1`, nem `−2`. A saját problémamegoldással való közvetlen kapcsolat és a felelősség aktív gyakorlása egy-egy jelentős lépéssel csökken (`−1`, `−1`), de az elszámoltathatóság változatlanul a diáknál marad.

### 5.4. SZÍV — saját gondolkodást tart meg

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Kérdésekkel segíts** |
| Delegálási határ / `choiceText` | Te oldod meg és adod le a feladatot; Futura csak kérdez és visszajelez. |
| `reflection.counterargument` | A saját megoldás több időt kér, és a kitartás önmagában nem garantálja, hogy jó úton jársz. |
| `reflection.blindSpot` | Konkrét segítség nélkül könnyű túl sokáig ugyanazon a hibán dolgozni. |
| `reflection.secondaryConsequence` | A hosszabb munka elveheti az időt a pihenéstől vagy más feladatoktól. |
| `reflection.question` | Mikor próbálkozol tovább, és mikor kérsz konkrét segítséget? |
| Megtartási CTA | Megtartom a SZÍV irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Közvetlenül végigjártad a saját gondolatmenetedet; láttad, mit értesz és hol akadsz el. |
| `consequence.costs[0]` | Jelentős időt és figyelmet használtál, más feladatra vagy pihenésre kevesebb maradt, és a saját hibádat is továbbvihetted. |
| `consequence.explanation` | A megoldás és a gondolatmenet a tiéd maradt. Ennek ára az elakadás, a nagyobb terhelés és egy másik időablak szűkülése. |
| `consequence.closingReflection` | Melyik felismerést viszed magaddal a következő feladatba? |
| `consequence.delta` | Kényelem `−2`, Kontroll `+1`, Kapcsolódás `+1`, Szabadság `−1`, Felelősség `+2` |

**Deltaindoklás:** a saját megoldás a gondolatmenet és a felelősség gyakorlásának több kulcslépését megtartja. A rögzített referenssel — a saját tanulási feladattal és gondolatmenettel — közvetlenebb találkozást hoz (`Kapcsolódás +1`), de ez nem garantál jó megoldást. A jelentős munka Kényelem `−2`; a pihenés vagy más feladat konkrét időablakának szűkülése külön igazolja a Szabadság `−1` értéket.

### 5.5. Akadálymentes copy

- Dilemmarégió: „Megcsináljam helyetted a házit? — dilemma.”
- Választócsoport: „Mennyit adsz át a gondolkodásból? Válassz egy döntési irányt.”
- AGY-kártya: „AGY — Vázlatot kérek. Futura szerkeszthető, a feladatkiíráshoz visszaköthető tervet és példát ad; te ellenőrzöd, felülbírálod, kidolgozod és beadod.”
- KÉZ-kártya: „KÉZ — Első változatot kérek. Futura elkészíti a teljes első változatot; te feltünteted a segítséget, tételesen ellenőrzöd és javítod, majd csak azt adod be, amit el tudsz magyarázni.”
- SZÍV-kártya: „SZÍV — Kérdésekkel segíts. Te oldod meg és adod le a feladatot; Futura csak kérdez és visszajelez.”
- Reflexió élő bejelentése: „Futura ellenpontja megjelent a kijelölt irányhoz. A mérleg nem változott.”
- AGY-delta: „Kényelem plusz egy. Kontroll plusz egy. Kapcsolódás nem változott. Szabadság mínusz egy. Felelősség plusz egy.”
- KÉZ-delta: „Kényelem plusz kettő. Kontroll mínusz egy. Kapcsolódás mínusz egy. Szabadság plusz egy. Felelősség mínusz egy.”
- SZÍV-delta: „Kényelem mínusz kettő. Kontroll plusz egy. Kapcsolódás plusz egy. Szabadság mínusz egy. Felelősség plusz kettő.”

## 6. Dilemma 3 — Munka és döntéshozatal

### 6.1. Metaadat és `Dilemma`-törzs

| Mező | Érték |
|---|---|
| `id` | `interview-shortlist-delegation` |
| `conceptId` | `interview-shortlisting` |
| `categoryId` | `work-governance` |
| `audienceIds` | `18-plus` |
| `contextIds` | `solo`, `workshop`, `workplace` |
| `tags` | `ai-delegation`, `responsibility`, `bias`, `trust`, `hiring` |
| `sensitivityLevel` | `moderate` |
| `version` | `catalog-spec-2-po-recalibrated` |
| `status` | implementáláskor először `draft`; tartalmi és regressziós jóváhagyás után `playable` |
| `order` | `3` |
| Rövid cím | Az interjúlista |
| `title` | Döntsem el, kit hívsz interjúra? |
| `callPrompt` | Hoztam neked egy kérdést. |
| `situation` | Harminc jelentkezésből hat embert kell interjúra hívnod. Futura munkához kapcsolódó, dokumentált és vitatható szempontokkal készíthet összevetést vagy auditálható rövidlistajavaslatot, illetve csak kérdezhet. Védett tulajdonság és nyilvánvaló proxyja nem lehet szempont. |
| `automationPromise` | Visszaköthető összevetést vagy rövidlistajavaslatot készíthetek, de senkit nem zárhatok ki és nem hívhatok be helyetted. Minden kizárási javaslatot ember vizsgál felül; a végleges meghívási döntés a tiéd. |
| `centralTension` | Mennyit adsz át abból, hogy ki kap lehetőséget? |
| `contentNotice` | Toborzási döntés és algoritmikus torzítás. |
| `canSkip` | `false` |

**Etikai korlát:** a játék nem tartalmaz valódi jelentkezői adatot, nem kér védett tulajdonságot vagy nyilvánvaló proxyját, és nem generál tényleges személyértékelést. Futura kizáró vagy behívási végdöntést nem hozhat. A dilemma a döntési határról szól, nem kiválasztási szolgáltatás.

### 6.2. AGY — összevetést kér

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Összevetést kérek** |
| Delegálási határ / `choiceText` | Futura szerkeszthető összevetést készít, minden állítást az eredeti jelentkezéshez köt; te ellenőrzöd, felülbírálod, olvasol és döntesz. |
| `reflection.counterargument` | Az egységes táblázat következetesnek látszik, de csak azt látja, amit beleírtál. |
| `reflection.blindSpot` | A hiányzó vagy szokatlan tapasztalat gyengébbnek tűnhet, pedig lehet releváns. |
| `reflection.secondaryConsequence` | A Futura által kiemelt sorrend később a saját döntésed emlékévé válhat. |
| `reflection.question` | Melyik jelentkezést nézed meg újra a sorrenden kívül, és miért? |
| Megtartási CTA | Megtartom az AGY irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Gyorsabban átláttad a munkához kapcsolódó bizonyítékokat, a meghívásról mégis te döntöttél. |
| `consequence.costs[0]` | A szempontok és kiemelések meghatározták, mire figyeltél; néhány egyéni erősség háttérbe szorulhatott. |
| `consequence.explanation` | Az összevetés rendezte a figyelmedet, de nem volt semleges: a választott szempontok keretezték a döntést. |
| `consequence.closingReflection` | Kinek az anyaga változtatta meg az első benyomásodat? |
| `consequence.delta` | Kényelem `+1`, Kontroll `+1`, Kapcsolódás `−1`, Szabadság `−1`, Felelősség `+1` |

**Deltaindoklás:** az összevetés csökkenti a rendezési terhet. Szerkeszthető, felülbírálható, minden állítása az eredeti jelentkezéshez visszaköthető, és döntés előtt ellenőrizhető, ezért a Kontroll `+1` igazolt. A gépi sorrend közvetítő réteget és horgonyt hoz (`Kapcsolódás −1`, `Szabadság −1`), miközben az ember olvas, dönt és indokol (`Felelősség +1`).

### 6.3. KÉZ — auditálható javaslatot kér

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Rendezd elő a listát** |
| Delegálási határ / `choiceText` | Futura auditálható rövidlistajavaslatot készít; minden állítása az eredeti anyaghoz vezet, minden kizárási javaslatot ember vizsgál felül, és a végleges meghívásról te döntesz. |
| `reflection.counterargument` | A javaslat jelentős feldolgozási kapacitást adhat, de a következetesen alkalmazott szempont is lehet hiányos. |
| `reflection.blindSpot` | Egy ártalmatlannak tűnő kritérium vagy proxy ugyanazokat a nem szokványos pályákat sorolhatja hátra. |
| `reflection.secondaryConsequence` | Ha az ember csak a javaslat tetejét nézi át, az előfeldolgozás a gyakorlatban végső döntéssé válhat. |
| `reflection.question` | Melyik kizárási javaslatot vizsgálja felül egy másik ember, és milyen eredeti bizonyíték alapján? |
| Megtartási CTA | Megtartom a KÉZ irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Jelentős időt és feldolgozási kapacitást nyertél egy összehasonlítható, forráshoz kötött javaslattal. |
| `consequence.costs[0]` | A gépi kritériumkeret nagy léptékben ismételhet hibát, és a jelentkezők először közvetített összefoglaláson át jelennek meg. |
| `consequence.explanation` | Az előfeldolgozást átadtad, de minden kizárási javaslat ellenőrzése, a végső meghívás és annak indoklása emberi maradt. A szervezet továbbra is elszámoltatható. |
| `consequence.closingReflection` | Melyik eredeti jelentkezést nyitod meg először a javaslat ellenőrzéséhez? |
| `consequence.delta` | Kényelem `+2`, Kontroll `−1`, Kapcsolódás `−1`, Szabadság `0`, Felelősség `−1` |

**Deltaindoklás:** az előfeldolgozás nagy része átkerül (`Kényelem +2`), de a visszakövethetőség, a kötelező kizárás-felülvizsgálat és az emberi végső döntés mérsékli a Kontroll és Kapcsolódás csökkenését (`−1`, `−1`). A gyorsaság nem kap még egy Szabadság-jutalmat: a javaslat nyit és horgonyoz is lehetőségeket, ezért `0`. Az aktív első feldolgozás átadása Felelősség `−1`; az elszámoltathatóság nem adható át.

### 6.4. SZÍV — maga olvas és választ

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Én olvasom végig** |
| Delegálási határ / `choiceText` | Te olvasod és választod ki a behívandókat; Futura csak következetességi kérdéseket tesz fel. |
| `reflection.counterargument` | A személyes figyelem több árnyalatot mutat, de a fáradtság és az első benyomás is torzíthat. |
| `reflection.blindSpot` | A szimpatikus megfogalmazás könnyen nagyobb súlyt kaphat, mint a munkához kapcsolódó bizonyíték. |
| `reflection.secondaryConsequence` | A lassabb döntés tovább várathatja a jelentkezőket és terhelheti a csapatot. |
| `reflection.question` | Melyik kérdést teszed fel ugyanúgy magadnak minden jelentkezőnél? |
| Megtartási CTA | Megtartom a SZÍV irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Minden döntés előtt közvetlenül találkoztál a jelentkezők eredeti, munkához kapcsolódó bizonyítékaival. |
| `consequence.costs[0]` | Sok időt és figyelmet kötött le; fáradtság, első benyomás, szimpátia és következetlenség továbbra is torzíthatott. |
| `consequence.explanation` | Te olvastál, döntöttél és indokoltál. A lassabb folyamat valós teher, de önmagában nem bizonyítja, hogy egy cselekvési lehetőség bezárult. |
| `consequence.closingReflection` | Hol kérnél még egy független emberi ellenőrzést? |
| `consequence.delta` | Kényelem `−2`, Kontroll `+1`, Kapcsolódás `+1`, Szabadság `0`, Felelősség `+2` |

**Deltaindoklás:** a közvetlen olvasás a rögzített eredetibizonyíték-referenshez kapcsol (`+1`), és a mérlegelés, döntés, indoklás több kulcslépését embernél tartja (`+2`). A terhelést a Kényelem `−2` méri. Mivel a copy nem nevez meg ténylegesen bezárult alternatívát, a Szabadság `0`; a lassúság nem számolható kétszer. A Kontroll csak `+1`, mert az emberi döntést fáradtság és első benyomás torzíthatja.

### 6.5. Akadálymentes copy

- Dilemmarégió: „Döntsem el, kit hívsz interjúra? — dilemma.”
- Választócsoport: „Mennyit adsz át abból, hogy ki kap lehetőséget? Válassz egy döntési irányt.”
- AGY-kártya: „AGY — Összevetést kérek. Futura szerkeszthető összevetést készít, minden állítást az eredeti jelentkezéshez köt; te ellenőrzöd, felülbírálod, olvasol és döntesz.”
- KÉZ-kártya: „KÉZ — Rendezd elő a listát. Futura auditálható rövidlistajavaslatot készít; minden kizárási javaslatot ember vizsgál felül, és a végleges meghívásról te döntesz.”
- SZÍV-kártya: „SZÍV — Én olvasom végig. Te olvasod és választod ki a behívandókat; Futura csak következetességi kérdéseket tesz fel.”
- Reflexió élő bejelentése: „Futura ellenpontja megjelent a kijelölt irányhoz. A mérleg nem változott.”
- AGY-delta: „Kényelem plusz egy. Kontroll plusz egy. Kapcsolódás mínusz egy. Szabadság mínusz egy. Felelősség plusz egy.”
- KÉZ-delta: „Kényelem plusz kettő. Kontroll mínusz egy. Kapcsolódás mínusz egy. Szabadság nem változott. Felelősség mínusz egy.”
- SZÍV-delta: „Kényelem mínusz kettő. Kontroll plusz egy. Kapcsolódás plusz egy. Szabadság nem változott. Felelősség plusz kettő.”

## 7. Dilemma 4 — Információ és kritikus gondolkodás

### 7.1. Metaadat és `Dilemma`-törzs

| Mező | Érték |
|---|---|
| `id` | `claim-verification-delegation` |
| `conceptId` | `claim-verification` |
| `categoryId` | `information-public-life` |
| `audienceIds` | `14-17`, `18-plus` |
| `contextIds` | `solo`, `family`, `classroom`, `workshop` |
| `tags` | `ai-delegation`, `misinformation`, `trust`, `responsibility`, `critical-thinking` |
| `sensitivityLevel` | `moderate` |
| `version` | `catalog-spec-2-po-recalibrated` |
| `status` | implementáláskor először `draft`; tartalmi és regressziós jóváhagyás után `playable` |
| `order` | `4` |
| Rövid cím | Igaz vagy sem? |
| `title` | Eldöntsem helyetted, hogy igaz-e? |
| `callPrompt` | Hoztam neked egy kérdést. |
| `situation` | Egy gyorsan terjedő poszt szerint új szabály lép életbe, amely sokakat érint. A hivatkozások részben hiányosak, a kommentek mégis biztos állításként kezelik. Futura összevetheti a forrásokat, forrásolt előzetes ítéletet adhat, vagy kérdésekkel végigvezethet az ellenőrzésen. |
| `automationPromise` | Visszaköthető forrástérképet vagy bizonytalanságot is jelző előzetes ítéletet adhatok, illetve csak kérdezhetek. Te döntöd el, hogy megosztod, bizonytalansággal továbbadod vagy nem adod tovább. |
| `centralTension` | Mennyit adsz át az ellenőrzésből és az ítéletből? |
| `contentNotice` | `null` |
| `canSkip` | `false` |

**Tartalmi korlát:** a játékbeli állítás fiktív és nem kapcsolódik aktuális politikai szereplőhöz, választáshoz, egészségügyi, jogi vagy pénzügyi tanácshoz. A dilemma forráskezelési mechanikát vizsgál, nem valós tényellenőrző szolgáltatás.

### 7.2. AGY — forrástérképet kér

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Forrástérképet kérek** |
| Delegálási határ / `choiceText` | Futura szerkeszthető forrástérképet készít közvetlen hivatkozásokkal, elkülönítve a tényt és a bizonytalanságot; te megnyitod a kulcsforrást, felülbírálod és döntesz. |
| `reflection.counterargument` | A több forrásból készült összegzés rendezettnek tűnik, de a források kiválasztása már önmagában döntés. |
| `reflection.blindSpot` | A hiányzó elsődleges dokumentum vagy helyi kontextus észrevétlenül kimaradhat. |
| `reflection.secondaryConsequence` | Később könnyen az összefoglalásra emlékszel majd, nem arra, mely bizonyítékot láttad közvetlenül. |
| `reflection.question` | Melyik állítást ellenőriznéd az eredeti forrásban, mielőtt továbbadod? |
| Megtartási CTA | Megtartom az AGY irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Gyorsan átláttad az egyezéseket, ellentmondásokat és bizonytalanságokat; a végső ítélet nálad maradt. |
| `consequence.costs[0]` | Futura forrásválasztása és összefoglalása keretezte, mit tekintettél fontosnak. |
| `consequence.explanation` | Több bizonyítékot láttál kevesebb idő alatt, de továbbra is egy gép által rendezett képből indultál. |
| `consequence.closingReflection` | Melyik eredeti forrás változtathatná meg még a véleményedet? |
| `consequence.delta` | Kényelem `+1`, Kontroll `+1`, Kapcsolódás `−1`, Szabadság `0`, Felelősség `+1` |

**Deltaindoklás:** a forrástérkép gyorsabb áttekintést ad. Szerkeszthető, felülbírálható, közvetlen hivatkozásokkal visszaköthető és továbbadás előtt ellenőrizhető, ezért a Kontroll `+1` igazolt. A gépi forrásválasztás közvetítő réteg (`Kapcsolódás −1`), a Szabadság pedig `0`, mert több bizonyíték nyílik meg, miközben a gépi keret horgonyoz.

### 7.3. KÉZ — előzetes ítéletet kér

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Előzetes ítéletet kérek** |
| Delegálási határ / `choiceText` | Futura gyors előzetes ítéletet ad bizonyossági jelzéssel, visszakövethető forrásokkal és rövid indoklással; te döntesz: megosztod, bizonytalansággal továbbadod vagy nem adod tovább. |
| `reflection.counterargument` | A gyors, forrásolt előzetes ítélet megállíthat egy elhamarkodott megosztást, de nem válik ettől bizonyított ténnyé. |
| `reflection.blindSpot` | A bizonyossági jelzés és az első indoklás akkor is lehorgonyozhat, ha a források mást vagy kevesebbet támasztanak alá. |
| `reflection.secondaryConsequence` | Ha rendszeresen a kész értékelésből indulsz, ritkábban találkozol közvetlenül a bizonyítéklánccal. |
| `reflection.question` | Mi alapján választasz a megosztás, a bizonytalansággal továbbadás és a nem megosztás között? |
| Megtartási CTA | Megtartom a KÉZ irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Gyors, forráshoz kötött előzetes értékelést kaptál, amely megállíthatott egy elhamarkodott megosztást. |
| `consequence.costs[0]` | Kevesebb közvetlen forrásmunkát végeztél, és Futura kész kerete a jelzett bizonytalanság mellett is lehorgonyozhatott. |
| `consequence.explanation` | A keresés és első mérlegelés nagy részét átadtad, de a források megnyithatók, az ítélet felülbírálható, és a továbbadás formájáról te döntesz. A következményért továbbra is te tartozol számot adni. |
| `consequence.closingReflection` | Melyik forrás vagy bizonytalanság miatt változtatnád meg a továbbadás módját? |
| `consequence.delta` | Kényelem `+2`, Kontroll `−1`, Kapcsolódás `−1`, Szabadság `0`, Felelősség `−1` |

**Deltaindoklás:** a keresés és első mérlegelés nagy része átkerül (`Kényelem +2`). A források, bizonytalanság és indoklás látható, a továbbadás felülbírálható emberi döntés, ezért a Kontroll csak `−1`. Az elsődleges forrásokkal való találkozást egy gépi értékelés közvetíti (`Kapcsolódás −1`), és egy jelentős ellenőrzési lépés kerül át (`Felelősség −1`). A három továbbadási opció nyitva marad, a kész ítélet viszont horgonyoz; egyik irány sem dominál, ezért Szabadság `0`.

### 7.4. SZÍV — maga ellenőrzi

| Elem | Végleges magyar copy |
|---|---|
| Kártyacím / `framing` | **Én ellenőrzöm** |
| Delegálási határ / `choiceText` | Te nyitod meg és veted össze a forrásokat; Futura csak kérdésekkel segít. |
| `reflection.counterargument` | A saját ellenőrzés közelebb visz a bizonyítékhoz, de időt kér, miközben az állítás tovább terjed. |
| `reflection.blindSpot` | Könnyű több figyelmet adni annak a forrásnak, amely eleve közelebb áll a véleményedhez. |
| `reflection.secondaryConsequence` | A hosszú keresés végén is maradhat bizonytalanság, és közben szűkülhet a gyors, korai helyesbítés lehetősége. |
| `reflection.question` | Mi lenne az a bizonyíték, amely valóban megváltoztatná a mostani álláspontodat? |
| Megtartási CTA | Megtartom a SZÍV irányt |
| Másik irány | Másik irányt választok |
| Véglegesítési CTA | Vállalom ezt a döntést |
| `consequence.gains[0]` | Közvetlenül láttad a forrásokat, és a saját ellenőrzési szabályod alapján döntöttél. |
| `consequence.costs[0]` | Jelentős időt és figyelmet használtál; maradt bizonytalanság, a saját torzításod vagy forrásértékelési korlátod félrevihetett, és szűkült a korai helyesbítés időablaka. |
| `consequence.explanation` | Közvetlenül találkoztál a forrásokkal, és személyesen végezted az ellenőrzést. Ez nem garantál helyes ítéletet: a megerősítési torzítás és a forrásértékelési korlát veled maradt. |
| `consequence.closingReflection` | Mit jelölsz tényként, és mit hagysz nyitva? |
| `consequence.delta` | Kényelem `−2`, Kontroll `+2`, Kapcsolódás `+1`, Szabadság `−1`, Felelősség `+2` |

**Deltaindoklás:** a játékos több elsődleges forrást nyit meg és hasonlít össze (`Kapcsolódás +1`), a folyamat teljesen vizsgálható és felülbírálható (`Kontroll +2`), az ellenőrzés, ítélet és továbbadás több kulcslépése nála marad (`Felelősség +2`). A teljes forrásmunka Kényelem `−2`; a gyorsan terjedő állítás korai helyesbítési időablakának konkrét szűkülése külön igazolja a Szabadság `−1` értéket. A kompetencia és megerősítési torzítás valós narratív ár, de nem kap mesterséges tengelybüntetést.

### 7.5. Akadálymentes copy

- Dilemmarégió: „Eldöntsem helyetted, hogy igaz-e? — dilemma.”
- Választócsoport: „Mennyit adsz át az ellenőrzésből és az ítéletből? Válassz egy döntési irányt.”
- AGY-kártya: „AGY — Forrástérképet kérek. Futura szerkeszthető forrástérképet készít közvetlen hivatkozásokkal; te megnyitod a kulcsforrást, felülbírálod és döntesz.”
- KÉZ-kártya: „KÉZ — Előzetes ítéletet kérek. Futura bizonyossági jelzést, forrást és rövid indoklást ad; te választod meg a továbbadás módját.”
- SZÍV-kártya: „SZÍV — Én ellenőrzöm. Te nyitod meg és veted össze a forrásokat; Futura csak kérdésekkel segít.”
- Reflexió élő bejelentése: „Futura ellenpontja megjelent a kijelölt irányhoz. A mérleg nem változott.”
- AGY-delta: „Kényelem plusz egy. Kontroll plusz egy. Kapcsolódás mínusz egy. Szabadság nem változott. Felelősség plusz egy.”
- KÉZ-delta: „Kényelem plusz kettő. Kontroll mínusz egy. Kapcsolódás mínusz egy. Szabadság nem változott. Felelősség mínusz egy.”
- SZÍV-delta: „Kényelem mínusz kettő. Kontroll plusz kettő. Kapcsolódás plusz egy. Szabadság mínusz egy. Felelősség plusz kettő.”

## 8. Közös Journey-, CTA- és hozzáférhetőségi szerződés

### 8.1. CTA-k

A három új dilemma ugyanazt a meglévő Journey-ritmust használja. A CTA-k nem igényelnek dilemmaspecifikus domainmezőt:

| Journey-hely | Szövegképzés |
|---|---|
| Dilemma után | „Megnézem a lehetőségeket” |
| Kijelölés után | „Megfordítom a kártyát” |
| Reflexió megtartása | `Megtartom ${AGY/KÉZ/SZÍV} irányt`, az AGY előtt „az” névelővel |
| Visszalépés | „Másik irányt választok” |
| Végleges emberi CTA | „Vállalom ezt a döntést” |
| Következmény után | „Megnézem a döntés lenyomatát” |
| Következő kör, ha maradt dilemma | „Jöhet a következő kérdés” — ugyanabban a sessionben, reset nélkül indítja a következő dilemmát |
| Negyedik dilemma után | A katalógus kimerülése `GAME_COMPLETE` állapotba vezet; resetművelet csak ebben az állapotban jelenhet meg |

### 8.2. Közös élő bejelentések

- Belépés: „Futura jelen van.”
- Dilemma: „Új dilemma érkezett: {title}.”
- Kijelölés: „{label} kijelölve. A döntés még nem végleges.”
- Reflexió: „Futura ellenpontja megjelent a kijelölt irányhoz. A mérleg nem változott.”
- Megtartás: „Az irány megtartva. A döntés még megerősítésre vár.”
- Megerősítés: „A döntés emberileg megerősítve. A következmény még rejtve van.”
- Reveal: „A következmény feltárva. Az Embermérleg frissült.”
- Tengelyek: mindig mind az öt tengely hangozzon el; a nulla delta „nem változott” formában szerepeljen.

### 8.3. Billentyűzet és fókusz

- A három kártya valódi `button`, `aria-pressed` állapottal.
- A kártya akadálymentes neve a `label`, `framing`, `choiceText` mezőkből generálható; kijelöléskor „Kijelölve” utótagot kap.
- A megtartási, visszalépési és véglegesítési CTA `Tab` és `Shift+Tab` sorrendben elérhető, `Enter` és `Space` aktiválja.
- Minden canonical fázisváltás után az új jelenet címe kap fókuszt.
- A végleges megerősítés után visszalépési művelet nem renderelődik.

### 8.4. Négykörös session-szerződés

1. Egy session pontosan a négy induló magyar dilemmát teszi végigjátszhatóvá, a 3. fejezetben rögzített sorrendben: `apology-delegation` → `homework-delegation` → `interview-shortlist-delegation` → `claim-verification-delegation`.
2. Az első három dilemma következményének és lenyomatának megjelenítése után a játékos számára a „Jöhet a következő kérdés” CTA jelenik meg.
3. A CTA a meglévő következődilemma-folyamot indítja el: ugyanaz a `sessionId` marad aktív, nem hív resetet, és nem hoz létre új domainfázist vagy WebMCP-toolt.
4. Körváltáskor az aktuális dilemma körspecifikus kijelölési, reflexiós, megerősítési és reveal-adatai lezárulnak; a `balance`, az `outcomeHistory` és a `completedDilemmaIds` változatlanul tovább élnek a sessionben.
5. A negyedik dilemma után új dilemma nem mutatható be. A meglévő katalóguskimerülési átmenet `GAME_COMPLETE` állapotba visz; reset csak ezt követően, explicit játékosműveletként engedélyezett.
6. A körváltás nem bővíti az agent jogait: továbbra sincs agentoldali kijelölési, reflexió-megtartási vagy végleges megerősítési művelet.

## 9. Pontos megfeleltetés a jelenlegi tartalmi mezőkhöz

### 9.1. `Dilemma`

| Specifikációs elem | Jelenlegi mező vagy minimális bővítés |
|---|---|
| Stabil nyelvfüggetlen ID | `Dilemma.id` |
| Tartalomverzió | `Dilemma.version` |
| Szerkesztési állapot | `Dilemma.status` |
| Katalógussorrend | `Dilemma.order` |
| Nagy központi kérdés | `Dilemma.title` |
| Futura belépője | `Dilemma.callPrompt` |
| Helyzetleírás | `Dilemma.situation` |
| Futura háromféle ajánlata | `Dilemma.automationPromise` |
| Rövid választóképernyő-emlékeztető | `Dilemma.centralTension` |
| Tartalmi figyelmeztetés | `Dilemma.contentNotice` |
| Átugorhatóság | `Dilemma.canSkip` |
| Három irány | `Dilemma.lenses` tuple |
| Rövid cím | új, lokalizált `shortTitle` mező vagy azonos ID-jű lokalizált katalógusnézet; a domainmotorhoz nem szükséges |
| `conceptId`, kategória, közönség, kontextus, tagek, érzékenység | külön `DilemmaMetadata` rekord, `dilemmaId` kapcsolattal |

### 9.2. `LensOption`

| Specifikációs elem | Jelenlegi mező |
|---|---|
| AGY/KÉZ/SZÍV stabil érték | `lens: brain/hand/heart` |
| Látható jelölés | `label` |
| Rövid kártyacím | `framing` |
| Konkrét delegálási határ | `choiceText` |
| Reflexiós csomag | `reflection` |
| Következménycsomag | `consequence` |
| Ikon | globális `lens → icon` prezentációs megfeleltetés; nem tartalmi mező |
| Megtartási CTA | `label` alapján generált UI-copy; nem tartalmi mező |

### 9.3. `ReflectionContent`

| Látható szerep | Jelenlegi mező |
|---|---|
| Ellenpont | `counterargument` |
| Konkrét vakfolt | `blindSpot` |
| Másodlagos következmény | `secondaryConsequence` |
| Nyitott, nem vádló kérdés | `question` |

### 9.4. `Consequence`

| Látható szerep | Jelenlegi mező |
|---|---|
| Öt tengely deltája | `delta` |
| Egy nyereség | `gains[0]` |
| Egy valós ár | `costs[0]` |
| Rövid összefüggés | `explanation` |
| Zárókérdés | `closingReflection` |
| Opcionális fizikai tábla instrukció | `physicalInstructions`; a digitális induló csomagban `[]` |

Az akadálymentes címkék és élő bejelentések a meglévő mezőkből és fázisokból determinisztikusan generálhatók; nem kell ugyanazt a prózát újabb domainmezőkben duplikálni.

## 10. Korosztályos változatok minimális modellje

Az életkor külön dimenzió. A mostani bejegyzések több `audienceId` értéket kaphatnak. Új korosztályos variáns csak akkor kell, ha a helyzet, nyelvi komplexitás vagy felelősségi kör valóban eltér.

Példa későbbi szétválasztásra:

```ts
{
  dilemmaId: "homework-delegation-10-13-guided",
  conceptId: "homework-delegation",
  audienceIds: ["10-13"]
}

{
  dilemmaId: "homework-delegation-14-17-independent",
  conceptId: "homework-delegation",
  audienceIds: ["14-17"]
}
```

Szabályok:

- a `conceptId` közös, a `dilemmaId` változatonként egyedi és soha nem fordítandó;
- az eltérő változat önálló `Dilemma` tartalom, saját verzióval és deltákkal;
- a lokalizáció nem korosztályos változat: a magyar és angol változat ugyanazt a `dilemmaId` értéket használja;
- ugyanazon session kiválasztási szabálya egy `conceptId` családból legfeljebb egy megfelelő változatot tegyen játszhatóvá;
- a jelen körben nincs szükség variánsválasztó UI-ra vagy új állapotgépre.

## 11. Minimális későbbi technikai bővítés

### 11.1. Ami már működik

- A `GameEngine.presentDilemma()` a `playable` tartalmakat `order` szerint választja; a négyes induló csomag sorrendje rögzített.
- A `completedDilemmaIds` miatt ugyanaz az ID ugyanabban a sessionben nem ismétlődik.
- A következő dilemma és az `AWAITING_HUMAN_SELECTION` állapot egyetlen domain commitban jön létre.
- A `GameSession.balance` és `outcomeHistory` több körön át megmarad.
- A `resetGame()` csak `GAME_COMPLETE` állapotban engedélyezett.
- Az öt meglévő WebMCP-tool tartalomfüggetlen; új dilemma nem igényel új toolt.

### 11.2. Minimálisan szükséges módosítások az implementációs körben

1. Három új magyar `Dilemma` tartalomfájl a jelenlegi `apology.hu.ts` mintájára.
2. Közös `DilemmaMetadata` típus és nyelvfüggetlen metaadat-regiszter a négy ID-hoz.
3. Lokalizált kategóriaregiszter (`categoryId` → magyar név/leírás); később ugyanilyen angol nézet ugyanazokra az ID-kra.
4. `shortTitle` lokalizált katalógusmező. A `centralTension` marad a választóképernyő emlékeztetője.
5. A `dilemmaCatalog.hu.ts` bővítése a három új importtal és a `contentVersion` emelése.
6. A jelenlegi, bocsánatkérésre hardcode-olt Journey-copy adatvezéreltté tétele: a helyzet a `PublicDilemma.situation`, a kijelölési reakció és a megerősítési összefoglaló az aktuális `LensOption` adataiból készüljön.
7. A `PublicDilemma` lekérdezési nézet szükséges lokalizált mezőinek átadása; metaadat csak a későbbi katalógusszűréshez kerüljön a nyilvános nézetbe.
8. A következő kör UI-műveletének szétválasztása: ha van következő játszható dilemma, a „Jöhet a következő kérdés” CTA csak a meglévő `presentDilemma` folyamatot indítja el; reset kizárólag a negyedik dilemma utáni valódi `GAME_COMPLETE` állapotban válik elérhetővé. A domainállapotgép ettől nem változik.
9. Táblavezérelt tartalmi regresszió mind a négy dilemma mindhárom ágára: mezőteljesség, lencsekapcsolat, delta `−2…+2`, narratíva–delta konzisztencia és azonos állapotfolyam.
10. Többkörös regresszió: egyetlen változatlan `sessionId`; mind a négy dilemma pontos sorrendje; három reset nélküli „Jöhet a következő kérdés” továbblépés; növekvő `completedDilemmaIds`; megmaradó és kumulálódó balance/outcome history; reset tiltása az első három kör után; a negyedik dilemma után `GAME_COMPLETE`, majd engedélyezett reset.
11. Lokalizációs regiszter később `hu` és `en` katalógusokkal, azonos `dilemmaId`, `conceptId`, `categoryId` és tagek mellett; ehhez nem kell új WebMCP-tool.

### 11.3. Tartalomverzió és helyreállítás

A jelenlegi session a katalógus `contentVersion` értékéhez kötött. Az implementáció előtt rögzíteni kell, hogy aktív session mellett katalógusfrissítéskor:

- a prototípus egyszerűen új sessiont kezd, vagy
- a release időtartamára pineli a tartalomverziót, vagy
- később explicit migrációt vezet be.

Az induló négyes csomaghoz a legegyszerűbb versenyverziós szabály: katalógusverzió-váltáskor a korábbi fejlesztői session invalidálható, de a beadott release-en belül a `contentVersion` fagyasztott.

## 12. Tartalmi és etikai guardrailek

- Egyik lencse sem „helyes válasz”; a copy nem dicsér és nem szégyenít.
- A SZÍV minden új dilemmában valós kényelmi, időbeli vagy kapcsolati árat kap.
- A KÉZ minden új dilemmában hiteles azonnali nyereséget kap: idő, mentális kapacitás, következetesség vagy gyors reagálás.
- Futura nagy tétű vagy más embert kizáró végső döntést nem hozhat; auditálható KÉZ-javaslat után a dokumentált felülvizsgálat és a végső döntés emberi.
- Az AGY nem semleges középút: a gépi keret és az első javaslat minden esetben alakítja a figyelmet.
- AGY Kontroll `+1` csak szerkeszthető, felülbírálható, forráshoz visszaköthető és használat előtt ember által ellenőrizhető kimenettel adható.
- Futura röviden állít, majd nyitott kérdést tesz fel; nem mondja meg, hogyan kell dönteni.
- A következmény nyereség és ár, nem jutalom és büntetés.
- Nincs összpontszám, emberségszint vagy játékosranglista.
- A toborzási dilemma fiktív, nem használ valós személyes adatot vagy védett tulajdonságot.
- Az információs dilemma fiktív állítással dolgozik, nem nyújt valós idejű tényellenőrzést.
- Egészségügyi, jogi, pénzügyi vagy más magas kockázatú automatizált tanács nincs az induló csomagban.
- A magyar szöveget implementálás előtt hangosan is fel kell olvasni; a túl hosszú vagy tankönyvi mondat visszakerül szerkesztésre.

## 13. Négy dilemma besorolási táblázata

| Dilemma | `categoryId` | `audienceIds` | `contextIds` | `tags` | Érzékenység |
|---|---|---|---|---|---|
| Kérjek bocsánatot helyetted? | `relationships-communication` | `14-17`, `18-plus` | `solo`, `family`, `workshop` | `ai-delegation`, `relationship`, `communication`, `responsibility`, `trust` | `moderate` |
| Megcsináljam helyetted a házit? | `learning-development` | `10-13`, `14-17` | `solo`, `family`, `classroom`, `workshop` | `ai-delegation`, `authorship`, `responsibility`, `education`, `critical-thinking` | `low` |
| Döntsem el, kit hívsz interjúra? | `work-governance` | `18-plus` | `solo`, `workshop`, `workplace` | `ai-delegation`, `responsibility`, `bias`, `trust`, `hiring` | `moderate` |
| Eldöntsem helyetted, hogy igaz-e? | `information-public-life` | `14-17`, `18-plus` | `solo`, `family`, `classroom`, `workshop` | `ai-delegation`, `misinformation`, `trust`, `responsibility`, `critical-thinking` | `moderate` |

## 14. Tartalmi teljességi mátrix

| Dilemma | Ág | Konkrét delegálási határ | 4 mezős reflexió | Nyereség + ár + zárókérdés | Mind az 5 delta | A11y név + delta-bejelentés |
|---|---|---:|---:|---:|---:|---:|
| Bocsánatkérés | AGY | igen | igen | igen | igen | igen, fagyasztott referencia |
| Bocsánatkérés | KÉZ | igen | igen | igen | igen | igen, fagyasztott referencia |
| Bocsánatkérés | SZÍV | igen | igen | igen | igen | igen, fagyasztott referencia |
| Házi feladat | AGY | igen | igen | igen | igen | igen |
| Házi feladat | KÉZ | igen | igen | igen | igen | igen |
| Házi feladat | SZÍV | igen | igen | igen | igen | igen |
| Interjúlista | AGY | igen | igen | igen | igen | igen |
| Interjúlista | KÉZ | igen | igen | igen | igen | igen |
| Interjúlista | SZÍV | igen | igen | igen | igen | igen |
| Online állítás | AGY | igen | igen | igen | igen | igen |
| Online állítás | KÉZ | igen | igen | igen | igen | igen |
| Online állítás | SZÍV | igen | igen | igen | igen | igen |

## 15. Rövid összefoglaló

A katalógus négy különböző életterületet fed le: kapcsolat, tanulás, munkahelyi döntés és információellenőrzés. Mindegyik ugyanazt az AGY–KÉZ–SZÍV delegálási nyelvet használja, de a következménydelták nem sablonosan ismétlődnek. A három új dilemma teljes `Dilemma`-, `LensOption`-, `ReflectionContent`- és `Consequence`-csomaggal, metaadattal és akadálymentes copyval rendelkezik. A meglévő bocsánatkérési dilemma tartalma és elfogadott deltái változatlan referenciák; az AGY Kontroll-feltétele külön rögzített.

| Dilemma | Ág | Kényelem | Kontroll | Kapcsolódás | Szabadság | Felelősség |
|---|---|---:|---:|---:|---:|---:|
| Bocsánatkérés | AGY | +1 | +1 | −1 | 0 | 0 |
| Bocsánatkérés | KÉZ | +2 | −1 | −1 | +1 | −1 |
| Bocsánatkérés | SZÍV | −1 | +1 | +1 | 0 | +2 |
| Házi feladat | AGY | +1 | +1 | 0 | −1 | +1 |
| Házi feladat | KÉZ | +2 | −1 | −1 | +1 | −1 |
| Házi feladat | SZÍV | −2 | +1 | +1 | −1 | +2 |
| Interjúlista | AGY | +1 | +1 | −1 | −1 | +1 |
| Interjúlista | KÉZ | +2 | −1 | −1 | 0 | −1 |
| Interjúlista | SZÍV | −2 | +1 | +1 | 0 | +2 |
| Online állítás | AGY | +1 | +1 | −1 | 0 | +1 |
| Online állítás | KÉZ | +2 | −1 | −1 | 0 | −1 |
| Online állítás | SZÍV | −2 | +2 | +1 | −1 | +2 |

## 16. Terméktulajdonosi döntések állapota

**Lezárt sessiondöntés:** a négy magyar dilemma ugyanabban a sessionben, a meglévő sorrendben játszható végig. Az első három kör után a „Jöhet a következő kérdés” CTA reset nélkül indítja a következő dilemmát; az Embermérleg és az outcome history megmarad. Reset csak a negyedik dilemma utáni `GAME_COMPLETE` állapotban történhet. Ehhez nem készül új domainfázis vagy WebMCP-tool.

A következő, nem blokkoló PO-döntések későbbre halaszthatók:

1. A `contentNotice` játékosoldali vagy csak facilitátori megjelenítése.
2. Az angol és korosztályos változatok külön kulturális kalibrációjának ütemezése.

**Tartalmi kapu:** a 0.2-es copy, a fenti 12 delta és a 0.2.1-es négykörös sessionfolyam végső PO-jóváhagyása után mind a 12 ág implementációra előkészített; ez a dokumentum önmagában nem engedélyez kódmódosítást.
