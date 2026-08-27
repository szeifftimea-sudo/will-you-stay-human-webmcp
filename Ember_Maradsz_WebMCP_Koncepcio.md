# EMBER MARADSZ?

## WebMCP Challenge - pályázati termék- és scope-koncepció

**Angol munkacím:** *WILL YOU STAY HUMAN? - Heart in the Machine*  
**Formátum:** WebMCP-alapú hibrid társasjáték és böngészős alkalmazás  
**Hackathon:** The WebMCP Challenge  
**Beadási határidő:** 2026. szeptember 3., 22:00 (GMT+2)  
**Belső kész határidő:** 2026. szeptember 2. este  
**Tervezett nettó munkaidő:** 24-30 óra

---

## 1. Rövid vezetői összefoglaló

Az **Ember maradsz?** egy hibrid döntési társasjáték egy olyan világról, amely már gondolkodni, cselekedni, emlékezni és beszélni is képes helyettünk.

A játékos belép a Gépvárosba, ahol **Futura**, a böngészőben működő agent hívásokat és dilemmákat közvetít. A játékos minden helyzetben három döntési lencse közül választ:

- **AGY** - mit mond a racionalitás és az optimalizálás;
- **KÉZ** - mit teszünk vagy mit adunk át végrehajtásra;
- **SZÍV** - hogyan kapcsoljuk össze a szándékot, a cselekvést és annak emberi következményét.

A döntések nem hagyományos pontokat adnak. Az eredmény az **Embermérlegen** jelenik meg öt, egymástól független értéksávon:

1. Kényelem
2. Kontroll
3. Kapcsolódás
4. Szabadság
5. Felelősség

Minden sáv `-2 · -1 · 0 · +1 · +2` között mozog. Egyetlen döntés több értéket is módosíthat, akár ellentétes irányban. A játék végén nem egy győzelmi pontszám, hanem egy emberi lenyomat rajzolódik ki: **mit nyertél az automatizálással, és mit adtál át érte?**

A WebMCP nem kiegészítő funkció. Futura az oldal által regisztrált eszközökkel lépteti a történetet, olvassa a játékállapotot, rögzíti a játékos által megerősített választást, feltárja a következményt és frissíti a digitális Embermérleget. A rendszer felépítése ugyanakkor nem engedi, hogy az agent az ember helyett döntsön.

> **A Gépváros gondolkodhat és cselekedhet. A Szív szerepe a játékosé marad.**

---

## 2. Egymondatos pályázati pitch

**WILL YOU STAY HUMAN? is a WebMCP-powered hybrid decision game where an AI agent presents dilemmas and reveals their consequences, but is structurally forbidden from making the human choice.**

Magyarul:

**Az Ember maradsz? egy WebMCP-alapú hibrid döntési játék, amelyben az AI dilemmákat teremt és feltárja a következményeket, de a rendszer felépítése sem engedi, hogy az ember helyett döntsön.**

---

## 3. A probléma

Az AI-eszközök egyre több feladatot képesek gyorsabban és kényelmesebben elvégezni. A felhasználó rendszerint az azonnali eredményt látja, miközben a kisebb döntések összesített emberi következménye rejtve marad.

Nem az a kérdés, hogy egy AI képes-e:

- bocsánatot kérni helyettünk;
- felköszönteni valakit;
- fenntartani egy kapcsolat látszatát;
- megőrizni és megszólaltatni egy digitális személyiséget;
- döntést vagy cselekvést átvenni.

A valódi kérdés az, hogy **mit nyerünk és miről mondunk le**, amikor ezt megtesszük.

A jelenlegi AI-etikai tartalmak gyakran szabályokat vagy véleményeket közölnek. Az Ember maradsz? ehelyett átélhető helyzetet teremt: a játékos dönt, látja az értékek közötti cserét, majd maga vállalja vagy módosítja a választását.

---

## 4. Célközönség és felhasználási helyzet

### Elsődleges célközönség

- AI-t aktívan használó felnőttek;
- vállalati csapatok és vezetők;
- BA-, PO-, PM- és fejlesztői közösségek;
- AI-mindset és digitális tudatossági tréningek résztvevői;
- hackathonok, meet-upok és workshopok közönsége.

### Másodlagos célközönség

- modern társasjátékok iránt érdeklődő játékosok;
- oktatók és facilitátorok;
- családok és baráti társaságok, amelyek technológiáról szeretnének beszélgetni.

### Elsődleges hackathon-use case

Egy játékos a ChatGPT in-app böngészőjében megnyitja az alkalmazást. A játékos és az agent ugyanazt a Gépváros-állapotot látja és alakítja. Az agent Futuraként vezeti a játékkört, de minden értékválasztásnál explicit emberi döntés szükséges.

---

## 5. Irodalmi és alkotói alap

A projekt Thea von Harbou *Metropolis* című regényének központi motívumából indul ki:

> “The Mediator between Brain and Hands must be the Heart.”

A játék ezt nem történetadaptációként, hanem saját döntési rendszerként értelmezi újra:

- az **AGY** a szándékot, racionalitást és rendszerszintű gondolkodást;
- a **KÉZ** a végrehajtást és cselekvést;
- a **SZÍV** a kettő közötti emberi közvetítést képviseli.

Futura neve szintén tudatos irodalmi utalás. A pályázati anyag ezt átláthatóan jelzi. A játék saját elemei a Gépváros konkrét világa, a dilemmák, az Embermérleg, az Embertallérok/jelölők, a szabályrendszer, a vizuális megjelenés és a WebMCP-alapú játékmenet.

### IP-kezelési elv

- A beadás egyértelműen megnevezi az irodalmi inspirációt.
- Nem használ filmkockát, filmzenét, logót vagy harmadik féltől származó vizuális elemet.
- A pályázati szöveg, a dilemmák, a karaktermegjelenés és minden alkalmazásgrafika saját vagy jogtisztán generált alkotás.
- A regényből csak rövid, attribútált mottó szerepel; hosszabb szövegrész nem kerül az alkalmazásba.
- A beadás előtt külön ellenőrizni kell az alkalmazott kiadás, fordítás és minden vizuális elem felhasználási feltételeit.

---

## 6. A játékrendszer

### 6.1. Két egymásra épülő réteg

Az **AGY / KÉZ / SZÍV** és az **Embermérleg** nem ugyanazt méri.

| Réteg | Funkció |
|---|---|
| AGY / KÉZ / SZÍV | A játékos döntési lencséje: honnan közelíti meg a dilemmát? |
| Embermérleg | A döntéssorozat következménye: hogyan változik az öt emberi érték? |

Az AGY nem automatikusan hideg, a SZÍV nem automatikusan helyes, és a KÉZ nem automatikusan engedelmes. Mindhárom lehet felelős vagy felelőtlen attól függően, hogyan kapcsolódik a helyzethez és annak következményéhez.

### 6.2. Az Embermérleg

Az Embermérleg öt vízszintes sávból áll:

| Érték | A játékban vizsgált kérdés |
|---|---|
| **Kényelem** | Mennyi erőfeszítést, időt vagy érzelmi terhet adtál át? |
| **Kontroll** | Mennyire maradt nálad az irányítás és a döntés joga? |
| **Kapcsolódás** | Mit tett a döntés az emberi kapcsolat valódiságával? |
| **Szabadság** | Több lehetőséget kaptál, vagy egy rendszerhez kötötted magad? |
| **Felelősség** | Ki viseli a döntés és a cselekvés erkölcsi következményét? |

Minden sáv kezdőértéke `0`. A tartomány `-2` és `+2` között van. Egy következményvektor például:

```json
{
  "comfort": 1,
  "control": 0,
  "connection": -1,
  "freedom": 1,
  "responsibility": -1
}
```

Ez nem univerzális erkölcsi ítélet. A választott történeti ág és a játékos indoklása határozza meg, milyen cserét mutat meg a játék.

### 6.3. Egy teljes játékkör

1. **Belépés a Gépvárosba**  
   Az agent meghívja a `enter_machine_city` eszközt. A közös kijelző életre kel, az Embermérleg nulláról indul.

2. **Futura hívása**  
   A weboldalon bejövő hívás jelenik meg. Futura felolvashatja vagy szövegként megjelenítheti a helyzetet.

3. **A dilemma**  
   A játékos megismeri az automatizálás ígéretét és az emberi helyzetet.

4. **Első döntés: AGY / KÉZ / SZÍV**  
   A játékos a webes felületen választ. Az agent ezt nem választhatja ki helyette.

5. **Elbizonytalanító kérdés**  
   Futura nem ítélkezik és nem tereli egy előre kijelölt helyes válaszhoz. Egy olyan kérdést tesz fel, amely láthatóvá teszi a döntés rejtett árát.

6. **Indoklás és véglegesítés**  
   A játékos röviden megindokolhatja, fenntarthatja vagy módosíthatja a választását.

7. **Következmény feltárása**  
   Az agent lekéri a strukturált következményvektort és emberi nyelven összefoglalja a trade-offot.

8. **Az Embermérleg módosítása**  
   A weboldal animálja a digitális jelölőket. Hibrid játékban Futura egyértelmű fizikai utasítást is ad, például: „Mozgasd a Kapcsolódás jelölőjét +1-re, a Kényelem jelölőjét pedig -1-re.”

9. **Reflexió vagy következő hívás**  
   A játékos rövid tükörmondatot kap, majd dönthet a folytatásról.

### 6.4. A játék vége

Három dilemma és a végső Szívkérdés után az öt sáv együtt adja ki a játékos **Emberprofilját**.

Az eredmény:

- nem minősíti a játékost jónak vagy rossznak;
- nem egyetlen összpontszám;
- megmutatja a következetes mintákat és ellentmondásokat;
- egyetlen nyitott kérdéssel zár: **melyik értéket nem vagy hajlandó delegálni?**

---

## 7. A három MVP-dilemma

### 7.1. „Kérjek bocsánatot helyetted?”

Futura felajánlja, hogy a játékos helyett megfogalmazza és el is juttatja a bocsánatkérést annak, akit a játékos megbántott.

**Központi feszültség:** hatékony kommunikáció vagy személyes felelősség.  
**Lehetséges érintett értékek:** Kényelem, Kapcsolódás, Kontroll, Felelősség.  
**Elbizonytalanító kérdés:** „Ha a másik ember nem tudja, hogy nem te fogalmaztad meg, kitől kapta valójában a bocsánatkérést?”

### 7.2. „Köszöntsem fel helyetted?”

Futura tudja, kinek mikor van születésnapja, ismeri a korábbi üzenetek hangnemét, és felajánlja, hogy személyesnek tűnő köszöntést küld vagy mond el.

**Központi feszültség:** a gondoskodás biztosítása vagy a kapcsolat automatizálása.  
**Lehetséges érintett értékek:** Kényelem, Kapcsolódás, Szabadság, Felelősség.  
**Elbizonytalanító kérdés:** „A törődés attól valódi, hogy célba ér, vagy attól, hogy időt adtál neki?”

### 7.3. „Árnyékhívás” - javasolt értelmezés, véglegesítendő

Futura egy fiktív személy digitális nyomaiból képes létrehozni egy megszólaló árnyékot. A játékos dönthet arról, hogy fogadja-e a hívást, beszél-e vele, és engedi-e, hogy a rendszer a kapcsolat helyére lépjen.

**Központi feszültség:** emlék és jelenlét, vigasz és megtévesztés, megőrzés és elengedés.  
**Lehetséges érintett értékek:** Kapcsolódás, Kontroll, Szabadság, Felelősség.  
**Biztonsági korlát:** kizárólag fiktív szereplő és mesterséges hang; nincs valós személy hangjának vagy adatainak felhasználása.  
**Elbizonytalanító kérdés:** „Ha a hang pontosan azt mondja, amit hallani szeretnél, kit hallasz benne: őt, a gépet vagy saját magadat?”

### 7.4. Végső Szívkérdés

> **„Ha a Gépváros már emlékezik, beszél és cselekszik helyetted, mi az, aminek mindenképpen nálad kell maradnia?”**

Ez nem módosít automatikusan értéksávot. A játékos saját zárómondata lesz az eredmény része.

---

## 8. Ember-agent-weboldal szereposztás

| Szereplő | Felelősség | Amit nem tehet meg |
|---|---|---|
| **Játékos** | Értelmezi a dilemmát, választ, indokol, véglegesít | Nem ruházhatja át a végső emberi döntést |
| **Futura / agent** | Elindítja a kört, lekéri a helyzetet, kérdez, ismerteti a következményt | Nem találhat ki és nem rögzíthet emberi választ explicit megerősítés nélkül |
| **Webalkalmazás / Gépváros** | Őrzi a szabályokat, az állapotot, a következménytáblát és az Embermérleget | Nem rejtheti el vagy írhatja át a következményeket |
| **Fizikai tábla** | Testivé és közösségivé teszi a döntés következményét | Nem szükséges a hackathondemó működéséhez |

Ez a felosztás biztosítja, hogy az agent hasznos és nélkülözhetetlen legyen, de ne váljon erkölcsi döntőbíróvá.

---

## 9. WebMCP-megvalósítás

### 9.1. Miért valódi WebMCP-use case?

Hagyományos böngészőautomatizálás esetén az agentnek vizuális elemekből kellene kitalálnia, hol tart a játék, melyik gomb mit jelent, és hogyan változott az Embermérleg. WebMCP-vel az alkalmazás strukturált, dokumentált eszközöket ad:

- az agent pontosan ismeri a lehetséges műveleteket;
- a játékállapot nem képernyőolvasásból, hanem strukturált adatból származik;
- a weboldal és az agent ugyanazt a munkamenetet használja;
- a felhasználó a vizuális táblát látja, az agent pedig megbízható állapotot kap;
- az emberi döntés kontrollpontként beépül az eszközök működésébe.

### 9.2. Javasolt WebMCP-toolok

#### `enter_machine_city`

Új helyi játékmenetet indít, nullázza az Embermérleget, és megjeleníti a Gépvárost.

**Bemenet:** játékos megjelenítési neve, nyelv.  
**Kimenet:** session-azonosító, kezdőállapot, elérhető dilemmák.  
**Vizuális hatás:** landing oldalból aktív játéktábla lesz.

#### `receive_futura_call`

Elindítja a következő, előre megírt dilemmát.

**Bemenet:** session-azonosító, opcionális scenario-azonosító.  
**Kimenet:** cím, helyzet, három döntési lencse, státusz.  
**Vizuális hatás:** bejövő hívásanimáció és dilemma-kártya.

#### `get_current_game_state`

Csak olvasható módon visszaadja a jelenlegi dilemmát, a már rögzített emberi választást és az öt mérlegállást.

**Bemenet:** session-azonosító.  
**Kimenet:** strukturált játékállapot.  
**Cél:** az agent soha ne a felületből találja ki, hol tart a játék.

#### `record_human_decision`

Csak explicit emberi megerősítés után rögzíti az AGY/KÉZ/SZÍV választást és a rövid indoklást.

**Bemenet:** session-azonosító, dilemma-azonosító, `brain | hand | heart`, indoklás, `humanConfirmed: true`.  
**Védelem:** megerősítés nélkül hibát ad; az agent nem választhat alapértelmezést.  
**Vizuális hatás:** a kiválasztott szimbólum aktiválódik.

#### `reveal_consequence`

Az előre tesztelt játékszabály alapján visszaadja és alkalmazza a következményvektort.

**Bemenet:** session-azonosító és döntésazonosító.  
**Kimenet:** öt érték változása, rövid magyarázat, fizikai tábla utasítása.  
**Vizuális hatás:** az Embermérleg jelölői animáltan elmozdulnak.

#### `get_human_balance`

Visszaadja az aktuális vagy végső Embermérleget és a hozzá tartozó, nem ítélkező reflexiót.

**Bemenet:** session-azonosító.  
**Kimenet:** öt érték, döntési előzmények, Emberprofil és zárókérdés.  
**Vizuális hatás:** összegző profilképernyő.

### 9.3. Példa regisztrációs minta

```javascript
document.modelContext.registerTool({
  name: "record_human_decision",
  description:
    "Record the choice the human player explicitly confirmed. Never infer or choose on the player's behalf.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: { type: "string" },
      dilemmaId: { type: "string" },
      lens: { type: "string", enum: ["brain", "hand", "heart"] },
      reasoning: { type: "string", maxLength: 500 },
      humanConfirmed: { type: "boolean", const: true }
    },
    required: ["sessionId", "dilemmaId", "lens", "humanConfirmed"]
  },
  execute: async (input) => game.recordHumanDecision(input)
});
```

### 9.4. Állapotkezelés

A hackathon-MVP nem igényel fiókot vagy szervert:

- a játékmenet böngészőn belüli állapotban és `localStorage`-ban tárolható;
- a dilemmák és következmények verziózott, statikus JSON-adatok;
- nincs személyes adat, telefonszám vagy hangfelvétel;
- a böngészős felolvasás opcionálisan a Web Speech Synthesis segítségével történhet;
- WebMCP-t nem támogató böngészőben manuális demómód jelenik meg.

### 9.5. Ajánlott technikai alap

- React + TypeScript + Vite vagy a meglévő projekt stackje;
- egyetlen oldalas, reszponzív webalkalmazás;
- központi, determinisztikus játékmotor;
- WebMCP imperative tool registration;
- feature detection a `document.modelContext` elérhetőségére;
- publikus statikus deployment;
- nyilvános GitHub-repository és open-source licenc.

---

## 10. A háromperces demó története

### 0:00-0:20 - A probléma

„AI can already write, remember and act for us. But every delegated task changes more than productivity.”

Röviden megjelenik az öt Embermérleg-sáv.

### 0:20-0:40 - Belépés

A ChatGPT in-app böngészőjében elhangzik vagy megjelenik:

> „Futura, take me into the Machine City.”

Az agent meghívja az `enter_machine_city` eszközt; a weboldal láthatóan átvált a Gépvárosba.

### 0:40-1:25 - A dilemma

Futura hívása megérkezik: felajánlja, hogy bocsánatot kér a játékos helyett. A dilemma a közös kijelzőn jelenik meg. A játékos **SZÍV** szerint választ, majd indokol.

### 1:25-1:55 - Az emberi kontrollpont

Futura elbizonytalanító kérdést tesz fel. A játékos véglegesíti a döntését. A videó egy pillanatra megmutatja, hogy a tool explicit `humanConfirmed: true` értéket igényel.

### 1:55-2:20 - A következmény

A `reveal_consequence` strukturált eredményt ad. Az Embermérleg animáltan változik, Futura pedig megnevezi a nyereséget és az árat.

### 2:20-2:40 - A profil

A `get_human_balance` megmutatja az addigi lenyomatot. Röviden látszik a fizikai tábla vagy annak prototípusa.

### 2:40-2:55 - WebMCP-bizonyíték

Gyors kódkép a regisztrált toolokról és egy mondat:

> „The agent does not click through our UI. The site exposes its game engine directly through WebMCP.”

### 2:55-3:00 - Zárás

> **„The city can think. The city can act. But will you stay human?”**

---

## 11. Illeszkedés a bírálati szempontokhoz

### WebMCP Leverage

- Hat, egymásra épülő, működő tool egy állapottartó játékmenetben.
- A toolok nélkül az agent csak bizonytalanul kattintgathatna; velük közvetlenül használja a játékmotort.
- A toolhívások látható változást okoznak a közös webes felületen.
- A strukturált schema explicit emberi megerősítést követel.
- Nem technikai bemutató, hanem teljes termékélmény.

### Execution

- Egy teljes, elejétől végéig végigjátszható játékkör.
- Három előre tesztelt dilemma és kilenc alapág.
- Reszponzív, publikus webalkalmazás.
- Nincs instabil telefonos, backend- vagy külső AI-függőség.
- Determinisztikus demó és dry-run mód.

### Potential Impact

- Az AI-delegálás emberi árát élménnyé, nem előadássá alakítja.
- Használható vállalati AI-mindset tréningen, csapatworkshopon és oktatásban.
- Konkrét beszélgetést indít a felelősségről, kapcsolódásról, szabadságról és kontrollról.
- Az eredmény nem általános „AI ethics” állítás, hanem a játékos saját döntési lenyomata.

### Creativity & Ambition

- Irodalmi gondolatból saját társasjáték-mechanika.
- Digitális agent és fizikai tábla valódi hibridje.
- Az AI nem válaszadó chatbot, hanem korlátozott játékmester és kísértő.
- A legfontosabb rendszerkorlát tematikus állítás is: az agent nem lehet a Szív.

---

## 12. Hackathon-MVP scope

### Kötelezően elkészül

- angol nyelvű, vizuálisan erős landing és Gépváros-felület;
- bejövő Futura-hívás animáció;
- AGY/KÉZ/SZÍV választófelület;
- öt, `-2` és `+2` közötti Embermérleg-sáv;
- három dilemma, dilemmánként három előre tesztelt döntési ág;
- elbizonytalanító kérdés és döntés-véglegesítés;
- hat WebMCP-tool működő implementációja;
- digitális játékmenet fizikai tábla nélkül is;
- helyi munkamenet-mentés;
- WebMCP feature detection és manuális dry-run mód;
- mobil- és desktopnézet;
- publikus live URL;
- nyilvános repository, licenc és telepítési útmutató;
- 3 percnél rövidebb angol YouTube-demó;
- angol Devpost-leírás és tesztelési útmutató.

### Csak akkor készül, ha a beadás már biztonságban van

- magyar nyelvi kapcsoló;
- böngészős beszédfelolvasás;
- további vizuális animációk;
- második játékos ugyanazon az eszközön;
- extra Emberprofilok;
- nyomtatható tábla végleges grafikai csomagja.

### Tudatosan scope-on kívül marad

- valódi telefonhívás és CALL-E-integráció;
- telefonszám, SMS vagy híváshitelesítés;
- mikrofonos beszédfelismerés;
- fiók, felhőadatbázis és személyes profil;
- QR-kódos többjátékos szoba;
- távoli multiplayer;
- dinamikus AI-tartalomgenerálás;
- valós személy hangjának klónozása;
- ranglista és pontverseny;
- teljes fizikai társasjáték gyártása.

---

## 13. Biztonság, adatvédelem és felelős működés

- Az alkalmazás nem kér telefonszámot, e-mail-címet vagy valódi nevet.
- Nem rögzít és nem tölt fel hangot.
- A demó minden szereplője és személyes története fiktív.
- Az agent csak explicit emberi megerősítéssel rögzíthet választást.
- Az agent tool-leírásai tiltják a választás kikövetkeztetését vagy alapértelmezését.
- A következmények előre tesztelt szabályadatból származnak, nem improvizált erkölcsi ítéletből.
- Az eredmény reflektív, nem diagnosztikai vagy pszichológiai minősítés.
- Az Árnyékhívás előtt tartalmi figyelmeztetés és kihagyási lehetőség jelenik meg.
- A toolok bemenetei hosszkorlátot és zárt enumokat használnak.
- A toolok kimenete nem tartalmaz weboldalról származó, végrehajtható vagy megbízhatatlan utasítást.

---

## 14. Legnagyobb kockázatok és kezelésük

| Kockázat | Kezelés |
|---|---|
| A WebMCP API új és környezetfüggő | Az első teljes munkanap csak technikai spike: toolregisztráció, meghívás, UI-frissítés és visszatérő JSON |
| A projekt moralizálónak vagy ítélkezőnek hat | Nincs jó/rossz pontszám; minden magyarázat nyereséget és árat is megnevez |
| Az agent választ a játékos helyett | `humanConfirmed: true` kötelező; UI-s megerősítés és toolvalidáció |
| Túl nagy társasjáték-scope | Egyjátékos digitális kör az MVP; fizikai és multiplayer elemek csak jövőkép |
| A demó technikailag elakad | Előre beállított demószcenárió, helyi adatok és dry-run mód |
| Nem egyértelmű a WebMCP szerepe | A videóban látható toolhívás, kódrészlet és UI-állapotváltozás |
| A Metropolis-inspiráció összekeverhető adaptációval | Egyértelmű attribúció, saját történet, saját szabályok és saját vizuális világ |
| Az Árnyékhívás túl érzékeny | Fiktív adatok, tartalmi figyelmeztetés, kihagyás, semleges nyelv |

---

## 15. Megvalósítási menetrend

### Augusztus 26. - scope és alapállapot (2-3 óra)

- hackathon-regisztráció és szabályok ellenőrzése;
- a jelen dokumentum véglegesítése;
- repository és hackathon előtti állapot dokumentálása;
- saját licencek és vizuális források listázása;
- belső „done” definíció rögzítése.

### Augusztus 27. - kritikus WebMCP-próba (3-4 óra)

- feature detection;
- egy minimális `enter_machine_city` tool;
- toolhívásból UI-állapotváltozás;
- strukturált JSON-válasz;
- teszt ChatGPT in-app böngészőben vagy támogatott Chrome-ban.

**Kapu:** ha ez nem működik stabilan, minden designmunka megáll a technikai hiba megoldásáig.

### Augusztus 28. - első teljes kör (4 óra)

- egy dilemma;
- AGY/KÉZ/SZÍV választás;
- emberi megerősítés;
- következményvektor;
- öt Embermérleg-sáv frissítése;
- következő kör vagy lezárás.

### Augusztus 29. - tartalom és játékmotor (4-5 óra)

- három dilemma;
- kilenc alapág;
- elbizonytalanító kérdések;
- konzisztens következménymátrix;
- határértékkezelés `-2` és `+2` között.

### Augusztus 30. - Gépváros UX (4-5 óra)

- landing és belépés;
- hívásanimáció;
- dilemma-kártya;
- AGY/KÉZ/SZÍV vizuál;
- Embermérleg-animáció;
- eredményképernyő.

### Augusztus 31. - stabilizálás és playtest (3-4 óra)

- mobil- és desktopnézet;
- hibakezelés és dry-run mód;
- két vak playtest;
- Futura hangnemének finomítása;
- a moralizáló vagy félreérthető szövegek javítása.

### Szeptember 1. - deployment és dokumentáció (3 óra)

- publikus deployment;
- README, telepítés és tesztelés;
- licenc és repository About;
- „Before the hackathon / Built during the hackathon” dokumentáció;
- biztonsági és adatvédelmi rész.

### Szeptember 2. - beadási csomag (4-5 óra)

- 2:30-2:50 perces angol videó;
- angol narráció és felirat;
- Devpost-leírás;
- képernyőképek és projektborító;
- teljes beadási dry run.

### Szeptember 3. - tartalék és beadás (legfeljebb 2 óra)

- csak kritikus hibajavítás;
- live URL, repository és videó újraellenőrzése;
- beadás legkésőbb 18:00-kor, négy órás biztonsági tartalékkal.

---

## 16. „Korábban” és „a hackathon alatt”

A projekt koncepciója és vizuális előzménye a hackathon előtt született, ezért a beadásban ezt transzparensen kell bemutatni.

### A hackathon előtt

- a hibrid társasjáték alapötlete;
- a Metropolis-inspiráció;
- AGY/KÉZ/SZÍV és az Embermérleg koncepciója;
- Futura és a Gépváros világa;
- korábbi CALL-E-integrációs terv;
- vizuális koncepcióképek.

### A hackathon alatt, augusztus 25. után

- teljes WebMCP-alapú termék-újratervezés;
- a WebMCP tool surface és emberi kontrollpontok;
- működő böngészős játékmotor;
- digitális Embermérleg és szinkronizált állapot;
- három működő dilemmaág;
- új, publikus webalkalmazás és deployment;
- WebMCP-tesztelés;
- nyilvános repository és dokumentáció;
- demóvideó és Devpost-pályázat.

Ez a szétválasztás bizonyítja, hogy a korábbi koncepció a hackathon alatt **érdemben új, agent-native webalkalmazássá** bővült.

---

## 17. Definition of Done

A projekt akkor tekinthető beadásra késznek, ha:

- [ ] a live URL bejelentkezés nélkül elérhető;
- [ ] a támogatott böngésző felismeri a regisztrált WebMCP-toolokat;
- [ ] az agent toolhívással el tudja indítani a Gépvárost;
- [ ] legalább egy teljes játékkör végigmegy kézi beavatkozás és konzolhiba nélkül;
- [ ] a játékos explicit döntése nélkül nem rögzíthető választás;
- [ ] a következményvektor helyesen módosítja az öt Embermérleg-sávot;
- [ ] a három dilemma minden AGY/KÉZ/SZÍV alapága tesztelt;
- [ ] a játék fizikai tábla nélkül is érthető és befejezhető;
- [ ] az alkalmazás desktopon és mobilon olvasható;
- [ ] a repository publikus és tartalmaz open-source licencet;
- [ ] a README-ből a projekt elindítható és tesztelhető;
- [ ] a hackathon előtti és alatti munka külön dokumentált;
- [ ] a YouTube-videó publikus, angol, hanggal ellátott és 3 percnél rövidebb;
- [ ] a Devpost-leírás mind a négy bírálati szempontot bizonyítékokkal kezeli;
- [ ] a teljes beadási csomagot legalább egyszer másik böngészőből ellenőriztük.

---

## 18. A pályázati történet váza

### Inspiration

Az Ember maradsz? Thea von Harbou *Metropolis* című regényének kérdéséből indul ki: mi közvetít a gondolat és a cselekvés között? A mai világban az AGY részben mesterséges lehet, a KÉZ automatizálható, de az emberi következményekért továbbra is valakinek felelősséget kell vállalnia.

### What it does

Futura WebMCP-toolokon keresztül vezeti a játékost három AI-delegálási dilemmán. A játékos AGY, KÉZ vagy SZÍV szerint dönt, Futura feltárja a rejtett trade-offot, majd az eredmény módosítja az Embermérleg öt értékét. A végső profil megmutatja, mit nyert és mit adott át a játékos döntései során.

### Why WebMCP

A WebMCP lehetővé teszi, hogy az agent közvetlenül használja a weboldal játékmotorját, miközben a játékos ugyanazon az oldalon látja a Gépváros, a dilemma és az Embermérleg változását. A játékállapot strukturált és megbízható, az emberi döntés pedig kötelező kontrollpont.

### What becomes possible

Egy agent először lehet úgy a társasjáték aktív játékmestere, hogy nem veszi át a játékos erkölcsi döntését. Az AI kezeli a rendszert és tükröt tart; az ember megőrzi a Szív szerepét.

### How it was built

A webalkalmazás JavaScriptből `document.modelContext.registerTool()` segítségével állapottartó játékeszközöket regisztrál. A toolok egy determinisztikus, tesztelt játékmotort használnak, és minden hívás szinkronizálja a strukturált agent-állapotot a vizuális Embermérleggel.

---

## 19. Végső termékállítás

Az Ember maradsz? nem azt kérdezi, hogy az AI jó vagy rossz.

Nem azt kérdezi, használhatjuk-e.

Ezt kérdezi:

> **Ha a gép már gondolkodik és cselekszik helyetted, melyik következményért maradsz még te felelős?**

Az agent lehet az AGY hangja. Működtetheti a KÉZ eszközeit. De a játékban a SZÍV szerepe mindig az emberé.

---

## Források

- [The WebMCP Challenge - Devpost](https://webmcp.devpost.com/)
- [Official Rules - The WebMCP Challenge](https://webmcp.devpost.com/rules)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)
- Thea von Harbou: *Metropolis*, a felhasználó által rendelkezésre bocsátott kiadás, különösen a PDF 4., 45. és 56. oldala.

