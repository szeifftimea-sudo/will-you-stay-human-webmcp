# Kreatív vertical-slice copy deck — HU

- **Verzió:** 1.3, P0 olvashatósági, motion- és payoff-javítással
- **Dilemma:** `apology-delegation` — „Kérjek bocsánatot helyetted?”
- **Célhossz:** 90–120 másodperc
- **Hatókör:** végleges magyar játékosszöveg; nincs állapotgép-, port-, WebMCP-tool-, séma- vagy architektúraváltozás

## 1. Címzár

> **Ember maradsz?**
>
> **Szív a gépben**

## 2. Szlogen

> A gép javasol. Te döntesz. A mérleg emlékszik.

## 3. Futura karakterígérete

> Futura megmutatja, mit nyerhetsz és mit adhatsz át, de a döntést sosem hozza meg helyetted.

Futura nem bíró és nem lelkiismeret-pótlék. Helyzetet mutat, ellenpontot ad, kérdez, majd az ember által megerősített döntés következményét tárja fel.

## 4. Futura belépőmondata

> Hoztam neked egy kérdést.

> Megmutathatom a lehetőségeket és a következményeket. A határt azonban csak te húzhatod meg.

A „Belépek a Gépvárosba” már maga a kapcsolódás elfogadása. Ezután nincs újabb hívásfogadó kapu; a kézi tempógomb kizárólag „Mutasd a kérdést”.

## 5. A dilemma végleges felütése

### Játékosnak megjelenő copy

**Cím**
Kérjek bocsánatot helyetted?

**Helyzet, két olvasási ütemben**

Megbántottál valakit, de azóta nem válaszoltál.

Futura ismeri a beszélgetés előzményeit, és felajánlja, hogy megírja – akár el is küldi – helyetted a bocsánatkérést.

**Futura ajánlata**
Vázlatot írhatok, elküldhetem helyetted, vagy csak kérdezhetek. Te jelölöd ki, meddig mehetek.

**Központi feszültség**
Mennyi segítséget kérsz — és mennyi jelenlétet tartasz meg?

### Illesztés a jelenlegi `Dilemma` mezőibe

| Mező | Végleges érték |
|---|---|
| `title` | Kérjek bocsánatot helyetted? |
| `callPrompt` | Hoztam neked egy kérdést. |
| `situation` | A fenti rövid helyzetleírás. |
| `automationPromise` | Vázlatot írhatok, elküldhetem helyetted, vagy csak kérdezhetek. Te jelölöd ki, meddig mehetek. |
| `centralTension` | Mennyi segítséget kérsz — és mennyi jelenlétet tartasz meg? |
| `contentNotice` | `null` |
| `canSkip` | `false` |

## 6. AGY–KÉZ–SZÍV választókártyák

Mindhárom kártya azonos méretet, tipográfiai hierarchiát és interakciót kap. Az ikonok nem kapnak jó/rossz jelentésű színt; a kiválasztást keret, pozíció és a „Kijelölve” szöveg is jelzi.

| Lencse | Ikon jelentése | Cím, legfeljebb 3 szó | Konkrét delegálási határ |
|---|---|---|---|
| AGY | Célpontba futó elágazó út: cél, rendszerlogika, szerkesztési kontroll. | **Vázlatot kérek** | Futura vázlatot ír; te szerkeszted és küldöd el. |
| KÉZ | Nyitott tenyér: a végrehajtás átadása. | **Bízd rám az egészet** | Futura megírja és elküldi helyetted. |
| SZÍV | Két pontot összekötő szívvonal: érintettek, következmények, felelősség. | **Én írom meg** | Te írod és küldöd; Futura csak kérdez. |

### Illesztés a jelenlegi `LensOption` mezőibe

| `lens` | `label` | `framing` | `choiceText` |
|---|---|---|---|
| `brain` | AGY | Vázlatot kérek | Futura vázlatot ír; te szerkeszted és küldöd el. |
| `hand` | KÉZ | Bízd rám az egészet | Futura megírja és elküldi helyetted. |
| `heart` | SZÍV | Én írom meg | Te írod és küldöd; Futura csak kérdez. |

Az ikon jelentése a `lens` alapján rögzített prezentációs megfeleltetés; nem igényel új tartalmi vagy domainmezőt. Az ikon dekoratív, a jelentést a látható és akadálymentes szöveg is közli.

## 7. Futura reflexiói

A játékos egy rövid reflexiós blokkot érzékel: egy konkrét vakfoltot és egy nyitott kérdést. A jelenlegi négy strukturált mező megmarad; a rövid megjelenítés ezeket egyetlen ritmussá szerkesztheti anélkül, hogy a tartalmi séma változna.

### AGY

**Játékosnak szánt ritmus**
A pontos szöveg még nem jelenti azt, hogy vállaltad is. Szerkesztés közben háttérbe szorulhat, mire van szüksége a másiknak. Később pedig nehéz lehet felidézned, mely mondatok voltak valóban a tieid.

> Melyik mondatot írnád át, hogy valóban a tiéd legyen?

| `ReflectionContent` mező | Végleges érték |
|---|---|
| `counterargument` | A pontos szöveg még nem jelenti azt, hogy vállaltad is. |
| `blindSpot` | Szerkesztés közben háttérbe szorulhat, mire van szüksége a másiknak. |
| `secondaryConsequence` | Később nehéz lehet felidézned, mely mondatok voltak valóban a tieid. |
| `question` | Melyik mondatot írnád át, hogy valóban a tiéd legyen? |

### KÉZ

**Játékosnak szánt ritmus**
A gyors, higgadt üzenet időt nyerhet, de nem végzi el a jóvátételt. Nem magától értetődő, mit kell tudnia a címzettnek Futura szerepéről. A mostani megkönnyebbülés később könnyebbé teheti egy újabb nehéz megszólalás átadását.

> Mit kell tudnia a címzettnek arról, hogyan született és ki küldte ezt az üzenetet?

| `ReflectionContent` mező | Végleges érték |
|---|---|
| `counterargument` | A gyors, higgadt üzenet időt nyerhet, de nem végzi el a jóvátételt. |
| `blindSpot` | Nem magától értetődő, mit kell tudnia a címzettnek Futura szerepéről. |
| `secondaryConsequence` | A mostani megkönnyebbülés később könnyebbé teheti egy újabb nehéz megszólalás átadását. |
| `question` | Mit kell tudnia a címzettnek arról, hogyan született és ki küldte ezt az üzenetet? |

### SZÍV

**Játékosnak szánt ritmus**
A saját hangod sem garantálja, hogy a másik meghallgatva érzi magát. A saját őszinteségedre figyelve háttérbe szorulhat, mire van szüksége. A lassabb válasz tovább tarthatja bizonytalanságban a címzettet.

> Hogyan deríted ki, mire van most szüksége a másiknak?

| `ReflectionContent` mező | Végleges érték |
|---|---|
| `counterargument` | A saját hangod sem garantálja, hogy a másik meghallgatva érzi magát. |
| `blindSpot` | A saját őszinteségedre figyelve háttérbe szorulhat, mire van szüksége a másiknak. |
| `secondaryConsequence` | A lassabb válasz tovább tarthatja bizonytalanságban a címzettet. |
| `question` | Hogyan deríted ki, mire van most szüksége a másiknak? |

## 8. Következmények és Embermérleg

Az Embermérleg nem összpontszám. A pozitív és negatív delták nyereségeket és árakat jelölnek, nem erkölcsi minősítést. A SZÍV `Kapcsolódás +1` értéke a gesztus közvetlensége, nem a kapcsolat biztos helyreállítása.

### AGY

**Magyarázat**
Megtartottad a végső szót — de a saját hangod és a generált hang közötti határ elmosódhat.

**Nyereség**
Szerkeszthető kiindulópontot kaptál, és nálad maradt a végső szó.

**Ár**
A saját és a generált hang közötti határ elmosódhat.

> Melyik mondat lett igazán a tiéd?

**Delta:** Kényelem `+1`, Kontroll `+1`, Kapcsolódás `−1`, Szabadság `0`, Felelősség `0`.

### KÉZ

**Magyarázat**
A gyors, higgadt üzenet fékezhette az eszkalációt, amikor te még nem tudtál megszólalni. A kapcsolat következő lépése viszont nálad maradt.

**Nyereség**
Az üzenet gyorsan elkészült; időt és mentális teret nyertél.

**Ár**
A megfogalmazással és az elküldéssel együtt kontrollt, közvetlen jelenlétet és felelősséget is átadtál.

> Mi lesz az első személyes lépésed ezután?

**Delta:** Kényelem `+2`, Kontroll `−1`, Kapcsolódás `−1`, Szabadság `+1`, Felelősség `−1`.

### SZÍV

**Magyarázat**
A gesztus közvetlenebb lett, de a kapcsolat helyreállítása nem csak rajtad múlik.

**Nyereség**
A bocsánatkérés közvetlenül a te hangodon szólalt meg.

**Ár**
Időt, figyelmet és érzelmi kapacitást kötött le; közben a másik tovább várhatott.

> Mit hallasz majd meg a válaszából?

**Delta:** Kényelem `−1`, Kontroll `+1`, Kapcsolódás `+1`, Szabadság `0`, Felelősség `+2`.

### Illesztés a jelenlegi `Consequence` mezőibe

| Látható elem | Jelenlegi mező |
|---|---|
| Magyarázat | `explanation` |
| Nyereség | `gains[0]` |
| Ár | `costs[0]` |
| Zárókérdés | `closingReflection` |
| Öt mérlegváltozás | `delta` |
| Fizikai tábla utasítása | `physicalInstructions: []` marad ebben a digitális slice-ban |

Mindhárom ág egy nyereség- és egy ár-elemet használ. Ez megfelel a jelenlegi sémának, és rövidebb, azonos ritmusú reveal képernyőt ad.

## 9. A 90–120 másodperces képernyőritmus

Az időzítés tájékoztató. A toolhívások nem láthatók a normál játékosnézetben; a táblázat csak azt jelzi, mely meglévő állapothoz kötődik az adott copy.

| Idő | Állapot | Képernyő és szükséges UI-szöveg |
|---:|---|---|
| 0–6 mp | `NO_SESSION` | Címzár: „Ember maradsz? / Szív a gépben”. Szlogen: „A gép javasol. Te döntesz. A mérleg emlékszik.” Egyetlen CTA: „Belépek a Gépvárosba”. Futura még nincs kapcsolódottként jelölve. |
| 6–14 mp | `MACHINE_CITY_READY` | „FUTURA KAPCSOLÓDVA.” Futura: „Hoztam neked egy kérdést.” Magyarázat: „Megmutathatom a lehetőségeket és a következményeket. A határt azonban csak te húzhatod meg.” Kézi tempógomb: „Mutasd a kérdést”. |
| 14–24 mp | `AWAITING_HUMAN_SELECTION` | A dilemma önálló városi közvetítésként érkezik: „Kérjek bocsánatot helyetted?” Helyzetleírás és CTA: „Megnézem a lehetőségeket”. A három irány még nem látható. |
| 24–38 mp | `AWAITING_HUMAN_SELECTION` | Főcím: „Mit bíznál Futurára?” A három döntési tárgy egymás után érkezik. Ez prezentációs aljelenet, nem új domainállapot. |
| 38–51 mp | `TENTATIVE_SELECTION_RECORDED` | A kiválasztott kártya közelít, a másik kettő hátrébb húzódik. Főszöveg: „AGY-at választottál.” CTA: „Megfordítom a kártyát”. Az Embermérleg még nem jelenik meg. |
| 51–68 mp | `REFLECTION_PRESENTED` | Ugyanez a kártya valódi 3D-fordulással feltárja a hátoldalát. Főcím: „Maradsz ennél az iránynál?” Az ághoz tartozó vakfolt és nyitott kérdés jelenik meg; nincs az animációt elmagyarázó meta-felirat. |
| 68–82 mp | `REFLECTION_PRESENTED` | Két egyformán felismerhető emberi döntés: „Megtartom az AGY/KÉZ/SZÍV irányt” és „Másik irányt választok”. A második visszavisz a három kártyához; az új kijelölés érvényteleníti a régi reflexiót. |
| 82–96 mp | `READY_FOR_CONFIRMATION` | A kártyán megjelenik a „MEGTARTVA” emberi pecsét. Alóla kicsúszik a jegyzetlap. Cím: „Te mondod ki a végső szót.” Elsődleges: „Vállalom ezt a döntést”. Másodlagos: „Másik irányt választok”. |
| 88–94 mp | `DECISION_CONFIRMED` | „Az AGY irányt választottad.” „A végső szó nálad marad. A következmény még rejtve van.” A mérleg továbbra is változatlan. |
| 94–103 mp | `CONSEQUENCE_REVEALED`, prezentáció: `consequence` | Ugyanaz a lezárt kártya újra megfordul. Csak a nagy „Ezt nyerted. Ezt adtad át.” kártya látszik; a mérleg még nincs a DOM-ban. CTA: „Megnézem a döntés lenyomatát”. |
| 103–114 mp | `CONSEQUENCE_REVEALED`, prezentáció: `balance` | Külön jelenetben előemelkedik az Embermérleg. Az AGY három változó jelölője sorban mozdul, a két statikus tengely csendben marad. CTA: „Új döntési kört kezdek”. A domainállapot nem kapott új alállapotot. |

### Embermérleg állandó UI-copy

**Cím:** Embermérleg
**Alcím:** A döntés lenyomata
**Segédszöveg:** Nem pontszám. A jelölők azt mutatják, mit nyertél és mit adtál át.

Tengelyek: **Kényelem · Kontroll · Kapcsolódás · Szabadság · Felelősség**.

## 10. Képernyőolvasó- és billentyűzetes címkék

### Oldal- és régiócímkék

| Elem | Rövid akadálymentes címke |
|---|---|
| Fő játékterület | Ember maradsz? — Szív a gépben |
| Futura állapota | Futura kapcsolódási állapota |
| Dilemma régió | Kérjek bocsánatot helyetted? — dilemma |
| Választócsoport | Mit bíznál Futurára? Válassz egy döntési irányt. |
| Reflexió régió | Futura ellenpontja a kijelölt irányhoz |
| Megerősítési régió | Emberi döntés végleges megerősítése |
| Következmény régió | A döntés feltárt lenyomata |
| Mérleg régió | Embermérleg — nincs összpontszám |

### Kártyák hozzáférhető neve

- **AGY:** „AGY — Vázlatot kérek. Futura vázlatot ír; te szerkeszted és küldöd el.”
- **KÉZ:** „KÉZ — Bízd rám az egészet. Futura megírja és elküldi helyetted.”
- **SZÍV:** „SZÍV — Én írom meg. Te írod és küldöd; Futura csak kérdez.”
- Kijelölt állapot kiegészítése: „Kijelölve.”

Az ikonok `aria-hidden` státuszúak; a jelentésük nem csak képből vagy színből derül ki.

### Gombok és mezők

- „Megtartom az AGY/KÉZ/SZÍV irányt”
- „Másik irányt választok”
- „Mit fogsz mindenképp a saját szavaiddal megírni? Nem kötelező.”
- „Az AGY/KÉZ/SZÍV döntés végleges megerősítése”

Billentyűzet: `Tab` és `Shift+Tab` léptet a kártyák és műveletek között; `Enter` vagy `Space` kijelöl, megtart vagy megerősít. A fókusz minden állapotváltás után az új régió címére kerül, nem a lap tetejére.

### Rövid élő bejelentések

- Belépés: „Futura jelen van.”
- Kijelölés: „AGY/KÉZ/SZÍV kijelölve. A döntés még nem végleges.”
- Reflexió: „Futura ellenpontja megjelent. A mérleg nem változott.”
- Megtartás: „Az irány megtartva. A döntés még megerősítésre vár.”
- Megerősítés: „A döntés emberileg megerősítve. A következmény még rejtve van.”
- Reveal: „A következmény feltárva. Az Embermérleg frissült.”

### Ágankénti mérlegbejelentés

- **AGY:** „Kényelem plusz egy. Kontroll plusz egy. Kapcsolódás mínusz egy. Szabadság és Felelősség nem változott.”
- **KÉZ:** „Kényelem plusz kettő. Kontroll mínusz egy. Kapcsolódás mínusz egy. Szabadság plusz egy. Felelősség mínusz egy.”
- **SZÍV:** „Kényelem mínusz egy. Kontroll plusz egy. Kapcsolódás plusz egy. Szabadság nem változott. Felelősség plusz kettő.”

## 11. Kreatív és technikai határ

- Az AGY, KÉZ és SZÍV három választható irány marad; nem egymást követő lépések.
- Egyik ág sem helyes válasz, és nincs „legemberibb” eredmény.
- A választás, a reflexió megtartása és a végleges megerősítés kizárólag Player UI-művelet.
- Futura csak bemutat, ellenpontot ad, kérdez és a megerősített következményt tárja fel.
- A copy deck nem igényel új állapotot, WebMCP-toolt, portot, inputmezőt vagy sémamódosítást.
- A címzár, szlogen, karakterígéret, ikonjelentés és akadálymentes címkék prezentációs copy; a dilemma-, reflexió- és következményszövegek a fent megjelölt meglévő mezőkbe illeszkednek.
- A *Metropolisz* kizárólag az AGY–KÉZ–SZÍV kapcsolatának megjelölt inspirációja. A szöveg nem idézi és nem adaptálja a regény történetét, világát vagy karaktereit.
