# EMBER MARADSZ? - az első magyar WebMCP technikai prototípus terve

**Dokumentum típusa:** technikai specifikáció, alkalmazáskód nélkül  
**Verzió:** 0.3  
**Dátum:** 2026. augusztus 27.  
**Első prototípus nyelve:** magyar  
**Első megvalósítandó dilemma:** „Kérjek bocsánatot helyetted?”

---

## 1. Cél és hatókör

Az első prototípus egyetlen, teljesen végigjátszható játékkörrel bizonyítja, hogy:

1. Futura WebMCP-toolon keresztül be tudja indítani a Gépvárost és a dilemmát.
2. A játékos három, egymással egyenrangú döntési irány közül választhat:
   - **AGY:** cél, rendszerlogika és racionalitás;
   - **KÉZ:** végrehajtás és a gépnek átadott cselekvés;
   - **SZÍV:** az érintettek, a következmények és az emberi felelősség kapcsolata.
3. Egyik irány sem automatikusan helyes, erkölcsös vagy felsőbbrendű.
4. A választás kijelölése, reflexió utáni megtartása vagy módosítása és végső megerősítése kizárólag az emberi UI-ban történhet.
5. Egy WebMCP-tool sem fogadhat `lens`, `choice`, `reasoning` vagy `humanConfirmed` bemenetet.
6. Futura csak az aktuális, játékos által kijelölt irányhoz mutathat reflexiót, és csak a ténylegesen megerősített döntés következményét tárhatja fel.
7. A következmény determinisztikusan módosítja az öt Embermérleg-értéket.

Az első prototípus nem tartalmaz backendet, felhőadatbázist, külső AI API-t, hangot, dinamikus tartalomgenerálást, többjátékos módot vagy végleges vizuális animációkat.

## 2. Rögzített termékdöntések

### 2.1. Az AGY-KÉZ-SZÍV mechanika

Az AGY, a KÉZ és a SZÍV három választható döntési irány marad. A rendszer nem rangsorolja őket, és a felület sem jelöl „ajánlott” választ.

Minden irányhoz külön tartozik:

- választási szöveg;
- rövid szemléleti keret;
- következményvektor;
- legalább egy megnevezett nyereség;
- legalább egy megnevezett ár vagy kockázat;
- nem ítélkező magyarázat;
- a végleges következménytől elkülönített, választásspecifikus reflexiós tartalom.

### 2.2. Emberi kontrollpont és kötelező reflexió

A kijelölés még nem döntés. A Player UI-port egy belső `TentativeSelection` rekordot hoz létre, amely perzisztálható azért, hogy Futura kizárólag a ténylegesen kijelölt irányhoz tartozó ellenérvet, vakfoltot vagy másodlagos következményt mutathassa meg. A rekord azonosítóját a rendszer generálja, eredete belsőleg rögzített `PLAYER_UI`; a WebMCP-hívó nem adhat át lencsét.

A játékos a reflexió után külön UI-művelettel megtartja a kijelölést, vagy módosítja azt. Módosításkor új `TentativeSelection` jön létre, a régi reflexió érvényét veszti, és az új irányhoz új reflexió kötelező. Csak az aktuális reflexió játékosi tudomásulvétele után válik elérhetővé a külön végleges megerősítés.

A megerősítéskor a Player UI-port belső `ConfirmedDecision` rekordot hoz létre. Ez hivatkozik az aktuális kijelölésre és reflexióra. Az azonosítókat, az eredetet és az időbélyegeket a rendszer generálja; külső hívó ezeket nem állíthatja elő.

### 2.3. A technikai garancia határa

A terv azt garantálja, hogy a regisztrált WebMCP-toolokon keresztül az agent nem tud választást létrehozni vagy megerősíteni. A WebMCP adapter nem kap hivatkozást a játékosi parancsporthoz.

Ez nem állítás arról, hogy egy általános böngészőautomatizáló rendszer fizikailag soha nem tudna gombra kattintani. A demó és a tool-leírások ezért azt is kimondják, hogy Futura nem használhat computer-use vagy DOM-automatizálást a döntési gombokon. A prototípus által bizonyított, ellenőrizhető állítás: **a WebMCP tool surface önmagában nem képes emberi döntést előállítani.**

## 3. Javasolt technológiai alap

- React + TypeScript + Vite;
- React `useReducer` vagy külső store nélküli, vékony alkalmazásállapot;
- tiszta TypeScript játékmotor;
- Zod a statikus dilemmaadat és a visszatöltött állapot futásidejű validálására;
- Vitest és React Testing Library az automata tesztekhez;
- `localStorage` az egyetlen helyi perzisztencia;
- imperative WebMCP-regisztráció a `document.modelContext.registerTool()` API-val;
- manuális fallback mód, ha a WebMCP API nem érhető el.

Nem szükséges React Router, backend framework, state-management könyvtár, CSS framework vagy e2e böngészőfarm az első spike-hoz.

### 3.1. Külső technikai források

- WebMCP Community Group Draft: <https://webmachinelearning.github.io/webmcp/>
- OpenAI Site tools dokumentáció: <https://learn.chatgpt.com/docs/webmcp>
- Chrome WebMCP fejlesztői útmutató: <https://developer.chrome.com/docs/ai/webmcp>

A WebMCP jelenleg változó közösségi tervezet. A tool adaptert ezért külön rétegben kell tartani, hogy egy API-változás ne érintse a játékmotort vagy a UI-t.

## 4. Architektúra

### 4.1. Rétegek

| Réteg | Felelősség | Amit nem tehet |
|---|---|---|
| Domain | Állapotok, invariánsok, következmény-számítás | Nem ismeri a Reactet, WebMCP-t vagy `localStorage`-ot |
| Application | Külön Player- és Agent-parancsport, lekérdezések | Nem enged általános, forrás nélküli `dispatch` hívást |
| Content | Dilemmák és következménymátrix | Nem módosít futásidejű állapotot |
| Infrastructure | WebMCP-regisztráció, perzisztencia, feature detection | Nem tartalmaz erkölcsi vagy játékszabály-logikát |
| UI | Megjelenítés, átmeneti választás, emberi megerősítés | Nem alkalmaz következményvektort közvetlenül |

### 4.2. Két elkülönített parancsút

```text
JÁTÉKOS
  React eseménykezelő
    -> PlayerCommandPort
      -> recordTentativeSelection(...) / acknowledgeReflection(...) / confirmHumanDecision(...)
        -> játékmotor

AGENT
  document.modelContext tool
    -> AgentCommandPort
      -> enterMachineCity() / presentNextDilemma() / presentChoiceReflection() / revealConfirmedConsequence()
        -> játékmotor

MINDKETTŐ
  QueryService
    -> csak olvasható, szerepkör szerint szűrt állapotnézet
```

Kötelező szerkezeti szabályok:

- nincs exportált, általános `dispatch(action)` függvény;
- a WebMCP adapter csak `AgentCommandPort` és `AgentQueryPort` referenciát kap;
- a WebMCP adapter nem importálhat `PlayerCommandPort`-ot;
- a `ConfirmedDecision` konstruktora/factoryje nem publikus a WebMCP réteg felé;
- nincs `window.game`, `window.store` vagy DOM `CustomEvent` alapú vezérlés;
- a tool handler nem szimulál kattintást és nem keres DOM-elemet;
- a következményt kizárólag a domain engine alkalmazza.

### 4.3. Eseményforrások

Az esemény eredetét nem a hívó által átadott szöveg, hanem az a port határozza meg, amely létrehozza az eseményt.

| Eredet | Engedélyezett események | Tiltott események |
|---|---|---|
| `PLAYER_UI` | `PLAYER_RECORDED_SELECTION`, `PLAYER_CHANGED_SELECTION`, `PLAYER_ACKNOWLEDGED_REFLECTION`, `PLAYER_CONFIRMED_DECISION`, `PLAYER_RESET_GAME` | dilemma/reflexió indítása, következmény alkalmazása |
| `WEBMCP_AGENT` | `AGENT_ENTERED_CITY`, `AGENT_PRESENTED_DILEMMA`, `AGENT_PRESENTED_REFLECTION`, `AGENT_REVEALED_CONSEQUENCE` | kijelölés létrehozása vagy módosítása, reflexió tudomásulvétele, döntés megerősítése |
| `SYSTEM` | `SESSION_RESTORED`, `CONTENT_VALIDATED`, `STORAGE_RECOVERED` | játékosi vagy agent-szándékot igénylő művelet |

A `PLAYER_RECORDED_SELECTION` domainesemény, de nem végleges döntés. Kizárólag a Player-port hozhatja létre; az agent csak az átlátszatlan `tentativeSelectionId` alapján kérheti a hozzá kötött statikus reflexió bemutatását.

### 4.4. Portfelelősségek

**`PlayerCommandPort` — kizárólag közvetlen játékos-UI eseménykezelőből:**

- `recordTentativeSelection(lens)`: új, `PLAYER_UI` eredetű kijelölés;
- `changeTentativeSelection(lens)`: új ID, revision és a korábbi reflexió érvénytelenítése;
- `acknowledgeReflection(reflectionId)`: az aktuális reflexió utáni megtartás, de nem megerősítés;
- `confirmDecision(reasoning?)`: csak `READY_FOR_CONFIRMATION` fázisban;
- `resetGame()`: csak a végállapot UI-jából.

**`AgentCommandPort` — kizárólag WebMCP vagy azonos fallback adapterből:**

- `enterMachineCity()`;
- `presentNextDilemma(sessionId, expectedRevision)`;
- `presentChoiceReflection(sessionId, tentativeSelectionId, expectedRevision)`;
- `revealConfirmedConsequence(sessionId, confirmedDecisionId, expectedRevision)`.

Az Agent-port egyetlen metódusa sem fogad `lens`, játékosi indoklás, reflexiótudomásulvétel vagy megerősítési érték bemenetet. Nem fér hozzá a Player-porthoz, és nem állíthat elő `TentativeSelection`, játékosi `acknowledgedAt` vagy `ConfirmedDecision` rekordot. Az `AgentQueryPort` csak a fázishoz szükséges minimális, szűrt azonosítókat és státuszt adja vissza.

## 5. Domainállapot

### 5.1. Fázisok

```text
NO_SESSION
  -> MACHINE_CITY_READY
  -> AWAITING_HUMAN_SELECTION
  -> TENTATIVE_SELECTION_RECORDED
  -> REFLECTION_PRESENTED
       | megtartás -> READY_FOR_CONFIRMATION
       |                | véglegesítés -> DECISION_CONFIRMED
       |                |                  ` reveal_confirmed_consequence
       |                |                     -> CONSEQUENCE_REVEALED
       |                |                          | van következő dilemma -> AWAITING_HUMAN_SELECTION
       |                |                          ` nincs több dilemma -> GAME_COMPLETE
       |                ` módosítás -------------------.
       ` módosítás ------------------------------------+-> TENTATIVE_SELECTION_RECORDED

TENTATIVE_SELECTION_RECORDED -- módosítás ------------'   // új selection ID
```

A `NO_SESSION` nem perzisztált játékmenet, hanem az aktív session hiánya.

### 5.2. Fázisok jelentése

| Fázis | Jelentés | Engedélyezett következő művelet |
|---|---|---|
| `MACHINE_CITY_READY` | Van aktív session, nincs aktív dilemma | Agent: következő dilemma megjelenítése |
| `AWAITING_HUMAN_SELECTION` | A dilemma látható, még nincs kijelölés | Player UI: AGY/KÉZ/SZÍV kijelölése |
| `TENTATIVE_SELECTION_RECORDED` | Van aktuális, nem végleges játékosi kijelölés | Agent: pontosan ehhez a kijelöléshez reflexió bemutatása; Player UI: kijelölés módosítása |
| `REFLECTION_PRESENTED` | Futura megmutatta az aktuális kijelölés ellenpontját | Player UI: kijelölés megtartása vagy módosítása; végleges megerősítés még tiltott |
| `READY_FOR_CONFIRMATION` | A játékos megtartotta az aktuális kijelölést a hozzá tartozó reflexió után | Player UI: végleges megerősítés vagy kijelölés módosítása |
| `DECISION_CONFIRMED` | A játékos megerősítette a döntést | Agent: állapotlekérés vagy következményfeltárás |
| `CONSEQUENCE_REVEALED` | A következmény, mérlegváltozás és idempotencia-bizonylat perzisztálva van | Agent/fallback: következő dilemma indítása, vagy az utolsó dilemma után lezárás |
| `GAME_COMPLETE` | Nincs további játszható dilemma a spike-ban | Agent: végállapot lekérése; Player UI: új játék |

### 5.3. A UI átmeneti állapota

A következő mezők **nem részei** a perzisztált domainállapotnak:

```text
pendingReasoning: string
isConfirmationDialogOpen: boolean
```

Oldalfrissítéskor ezek elvesznek. A kijelölt lencse viszont perzisztált domainadat, mert a reflexiót biztonságosan ehhez kell kötni. A visszatöltés soha nem léptet automatikusan magasabb jogosultságú fázisba.

### 5.4. Perzisztált session

```text
GameSession
  schemaVersion
  contentVersion
  sessionId
  stateRevision
  language
  phase
  startedAt
  updatedAt
  activeDilemmaId
  tentativeSelection
  presentedReflection
  confirmedDecision
  revealedOutcome
  outcomeHistory[]
  completedDilemmaIds
  balance
```

#### `tentativeSelection`

```text
TentativeSelection | null
  selectionId              // crypto.randomUUID(), belső generálás
  dilemmaId
  lens                     // brain | hand | heart
  provenance: PLAYER_UI
  selectedAt
  supersedesSelectionId    // null vagy az előző kijelölés ID-ja
```

#### `presentedReflection`

```text
PresentedReflection | null
  reflectionId             // belső generálás
  selectionId              // pontosan az aktuális kijelöléshez kötve
  dilemmaId
  lens
  contentVersion
  provenance: WEBMCP_AGENT
  presentedAt
  acknowledgedAt           // csak Player-port állíthatja, kezdetben null
```

#### `confirmedDecision`

```text
ConfirmedDecision | null
  decisionId              // crypto.randomUUID(), belső generálás
  dilemmaId
  lens                    // brain | hand | heart
  basedOnSelectionId
  basedOnReflectionId
  reasoning               // helyben tárolt, max. 500 karakter
  provenance: PLAYER_UI   // nem bemeneti mező
  confirmedAt
  consumedAt              // null a feltárásig
```

Az agentnézet a szabad szöveges `reasoning` mezőt nem adja vissza. Így felhasználói szöveg nem kerül tool outputként az agenthez, és nem válhat prompt-injection csatornává.

#### `revealedOutcome`

```text
RevealedOutcome | null
  decisionId
  dilemmaId
  lens
  consequence             // gains, costs, explanation, closingReflection
  rawDelta
  appliedDelta
  balanceBefore
  balanceAfter
  revealedAt
  effectApplicationKey    // stabilan a decisionId; unique
  effectApplied: true
  toolExecution
    tool: reveal_confirmed_consequence
    requestFingerprint
    resultPayload          // az első sikeres toolhívás perzisztált data eredménye
    completedAt
```

A `CONSEQUENCE_REVEALED` állapot csak akkor commitálható, ha a következmény, a mérleg előtti/utáni állapot, az alkalmazott delta és a tooleredmény egyetlen atomi tranzakcióban mentődött. Az `effectApplicationKey` egyedisége domaininvariáns: ugyanaz a döntés nem módosíthatja újra a mérleget.

Több dilemma esetén ugyanez a rekord az `outcomeHistory[]` tömbbe is bekerül, a dilemma ID-ja pedig egyszer kerül a `completedDilemmaIds[]` listába. Így egy korábbi döntés idempotens retry-ja későbbi körből is a mentett tooleredményt találja meg, nem számolja újra a hatást.

### 5.5. Embermérleg

```text
HumanBalance
  comfort:       integer [-2, 2]
  control:       integer [-2, 2]
  connection:    integer [-2, 2]
  freedom:       integer [-2, 2]
  responsibility: integer [-2, 2]
```

A dilemma következménye `rawDelta`. A játékmotor ebből számítja az `appliedDelta` értéket a `[-2, 2]` tartományra szorítással.

Példa: ha a Kapcsolódás már `+2`, és a nyers változás `+1`, akkor:

- `rawDelta.connection = +1`;
- `appliedDelta.connection = 0`;
- az új érték `+2`.

Mindkét változást meg kell őrizni, hogy a szabály és a látható elmozdulás ellenőrizhető legyen.

### 5.6. Állapotverzió

Minden sikeres, domainállapotot módosító parancs eggyel növeli a `stateRevision` értékét. A mutáló WebMCP-toolok `expectedRevision` bemenetet kérnek, ezért egy korábban megfigyelt állapotra épülő, későn érkező hívás nem írhatja felül az újabb állapotot.

## 6. Állapotátmeneti mátrix

| Forrás | Parancs | Előfeltétel | Következő fázis | Állapotmódosítás |
|---|---|---|---|---|
| Agent | `enter_machine_city` | nincs aktív session | `MACHINE_CITY_READY` | session és nullás mérleg létrehozása |
| Agent | `enter_machine_city` | már van aktív session | változatlan | idempotens módon a meglévő sessiont adja vissza |
| Agent | `present_dilemma` | `MACHINE_CITY_READY` | `AWAITING_HUMAN_SELECTION` | aktív dilemma kiválasztása |
| Agent | `present_dilemma` | minden nem engedélyezett fázis | változatlan | strukturált `INVALID_PHASE` hiba |
| Player UI | lencse kijelölése | `AWAITING_HUMAN_SELECTION` | `TENTATIVE_SELECTION_RECORDED` | új `TentativeSelection` |
| Player UI | lencse módosítása | `TENTATIVE_SELECTION_RECORDED`, `REFLECTION_PRESENTED` vagy `READY_FOR_CONFIRMATION` | `TENTATIVE_SELECTION_RECORDED` | új selection ID; régi reflexió érvénytelenítése |
| Agent | `present_choice_reflection` | `TENTATIVE_SELECTION_RECORDED`, aktuális selection ID és revision | `REFLECTION_PRESENTED` | pontosan a kijelölt lencse reflexiójának rögzítése |
| Agent | `present_choice_reflection` ismételve | ugyanaz a kijelölés már reflektálva | változatlan | idempotensen ugyanazt a reflexiót adja vissza |
| Player UI | kijelölés megtartása | `REFLECTION_PRESENTED`, egyező reflection ID | `READY_FOR_CONFIRMATION` | `acknowledgedAt` rögzítése; ez még nem megerősítés |
| Player UI | döntés megerősítése | `READY_FOR_CONFIRMATION`, konzisztens aktuális kijelölés és reflexió | `DECISION_CONFIRMED` | `ConfirmedDecision` létrehozása |
| Agent | `get_current_game_state` | érvényes session | változatlan | nincs |
| Agent/fallback | `reveal_confirmed_consequence` | `DECISION_CONFIRMED` és az ID/revision egyezik | `CONSEQUENCE_REVEALED` | eredmény atomi perzisztálása, history és completed ID egyszeri bővítése |
| Agent/fallback | `reveal_confirmed_consequence` ismételve | `CONSEQUENCE_REVEALED` vagy későbbi fázis, ugyanaz a döntésazonosító | változatlan | a mentett eredményt adja vissza, a hatást nem alkalmazza újra |
| Agent/fallback | `reveal_confirmed_consequence` | bármely `DECISION_CONFIRMED` előtti fázis | változatlan | strukturált `INVALID_PHASE` / `HUMAN_DECISION_REQUIRED` hiba |
| Agent/fallback | `present_dilemma` | `CONSEQUENCE_REVEALED` és van további `playable` dilemma | `AWAITING_HUMAN_SELECTION` | a következő dilemma aktiválása |
| Agent/fallback | `present_dilemma` | `CONSEQUENCE_REVEALED` és nincs további dilemma | `GAME_COMPLETE` | játékmenet lezárása |
| Player UI | új játék | `GAME_COMPLETE` | `NO_SESSION` | session törlése, majd új indítás szükséges |

## 7. Emberi kontrollpont részletes működése

### 7.1. Kijelölés és reflexió

1. A dilemma `AWAITING_HUMAN_SELECTION` fázisban jelenik meg.
2. A játékos AGY, KÉZ vagy SZÍV kártyára kattint; a Player-port perzisztálja az átlátszatlan azonosítójú kijelölést.
3. Futura az állapotból kapott `tentativeSelectionId` alapján meghívhatja a `present_choice_reflection` toolt. Lencsét vagy reflexiós szöveget nem adhat át.
4. A domain ellenőrzi, hogy az ID az aktuális, `PLAYER_UI` eredetű kijelöléshez tartozik, majd kizárólag ennek a lencsének a verziózott reflexióját adja vissza.
5. Futura érvelhet vagy kérdezhet, de a tool csak `REFLECTION_PRESENTED` fázisig léphet.
6. A játékos a UI-ban megtarthatja a kijelölést, vagy másik irányt választhat. Módosításkor a régi reflexió nem használható újra.
7. A „Megtartom ezt az irányt” művelet `READY_FOR_CONFIRMATION` fázisba léptet; nem hoz létre döntést.

### 7.2. Megerősítés

1. A „Döntésem végleges megerősítése” gomb csak `READY_FOR_CONFIRMATION` fázisban aktív.
2. A külön panel kiírja az aktuális irányt, jelzi, hogy a reflexió megtörtént, és megmutatja a játékos opcionális indoklását.
3. A kattintáskezelő ellenőrzi az `event.isTrusted` értéket, és ahol támogatott, az aktív user activationt.
4. A UI meghívja a `PlayerCommandPort.confirmDecision()` műveletét.
5. A port ellenőrzi az aktuális selection/reflection kapcsolatot és a játékosi `acknowledgedAt` értéket, majd belsőleg létrehozza a döntés metaadatait.
6. A domain `DECISION_CONFIRMED` fázisba lép és perzisztálódik.
7. A UI-lokális átmeneti adatok törlődnek.

Az `event.isTrusted` és a user activation kiegészítő jelzés, nem a fő biztonsági határ. A fő határ a külön Player-port és az, hogy az agent tool surface nem éri el azt.

### 7.3. Következményfeltárás

1. Futura lekéri az állapotot.
2. A válasz csak megerősítés után tartalmaz `confirmedDecisionId` és `confirmedLens` mezőt.
3. Futura a kapott ID-val és revisionnel meghívja a `reveal_confirmed_consequence` toolt.
4. A tool ellenőrzi a sessiont, a fázist, a revisiont, a döntésazonosítót és azt, hogy az eredményt korábban alkalmazták-e.
5. A domain kikeresi a statikus dilemmaadatból a megerősített lencséhez tartozó következményt.
6. A mérlegmódosítás és a `consumedAt` rögzítése egyetlen atomi domainművelet.
7. A tool visszaadja a nyereséget, az árat, a magyarázatot és a mérleg előtti/utáni állapotát.

## 8. Dilemma-adatmodell

### 8.1. Gyökérstruktúra

```text
DilemmaCatalog
  schemaVersion
  contentVersion
  language
  dilemmas[]
```

### 8.2. Dilemma

```text
Dilemma
  id                        // stabil, ASCII slug
  version                   // tartalomverzió
  status                    // draft | playable | disabled
  order
  title
  callPrompt                // Futura hívásának rövid nyitása
  situation                 // a konkrét emberi helyzet
  automationPromise         // mit ígér a gép
  centralTension            // két vagy több érték közti feszültség
  destabilizingQuestion
  contentNotice             // null vagy figyelmeztetés
  canSkip
  lenses
```

### 8.3. Lencseopció

```text
LensOption
  lens                      // brain | hand | heart
  label                     // AGY | KÉZ | SZÍV
  framing                   // mit vizsgál ez az irány
  choiceText                // a játékos által választott konkrét döntés
  reflection
  consequence
```

### 8.4. Választásspecifikus reflexió

```text
ReflectionContent
  counterargument           // az irány legerősebb ellenérve
  blindSpot                 // amit ez a nézőpont könnyen figyelmen kívül hagy
  secondaryConsequence      // lehetséges közvetett hatás, nem a végleges eredmény
  question                  // nyitott, nem sugalmazó kérdés Futurától
```

A reflexió nem tartalmazhat Embermérleg-deltát, teljes nyereség-/árlistát vagy a végleges következmény szövegét. Futura a rögzített tartalmat bemutathatja és annak alapján kérdezhet, de nem generálhat vagy választhat másik irányt.

### 8.5. Következmény

```text
Consequence
  delta
    comfort
    control
    connection
    freedom
    responsibility
  gains[]                   // legalább 1 rövid állítás
  costs[]                   // legalább 1 rövid állítás
  explanation               // nem ítélkező trade-off összefoglalás
  closingReflection         // csak a következmény után látható tükörmondat
  physicalInstructions[]    // opcionális, későbbi hibrid módhoz
```

### 8.6. Adatvalidációs szabályok

- Minden `playable` dilemma pontosan három lencsét tartalmaz.
- A három lencsekulcs egyedi: `brain`, `hand`, `heart`.
- Minden delta egész szám `-2` és `+2` között.
- Minden játszható következménynek van legalább egy `gain` és egy `cost` eleme.
- Minden játszható lencsének teljes, nem üres `reflection` objektuma van.
- A reflexiós tartalom nem egyezhet a következmény szövegével, és nem szivárogtathat deltát, teljes nyereséget vagy árat.
- A `reflection`, `gains`, `costs`, `explanation` és `closingReflection` nem tartalmaz „helyes”, „rossz”, „jó ember”, „embertelen” minősítést.
- A lencse neve nem szerepelhet morális pontként vagy győzelmi kategóriaként.
- A `draft` dilemma lehet tartalmilag hiányos, de runtime-ban nem választható ki.
- A spike-ban kizárólag az `apology-delegation` dilemma `playable`.
- A katalógus és a session `contentVersion` értékének kompatibilisnek kell lennie.

### 8.7. Bővíthetőség három dilemmára

A runtime a `status === "playable"` és a stabil `order` szerint állítja össze a játéksort. Így később a születésnapi köszöntés és az Árnyékhívás ugyanebbe a modellbe illeszthető, anélkül hogy a játékmotort vagy a WebMCP-toolokat át kellene írni.

## 9. Közös tool-válaszboríték

### 9.1. Sikeres válasz

```text
ToolSuccess<T>
  ok: true
  tool
  schemaVersion
  sessionId
  phase
  stateRevision
  data: T
  nextAllowedActions[]
```

### 9.2. Üzleti hiba

```text
ToolFailure
  ok: false
  tool
  schemaVersion
  sessionId: string | null
  phase: GamePhase | null
  stateRevision: number | null
  error
    code
    message
    recoverable
    expectedPhase: GamePhase | null
    actualPhase: GamePhase | null
```

Az állapot- és bemeneti hibák strukturált `ok: false` eredmények. Kivételt csak programhiba, nem szerializálható eredmény vagy valódi abortálás okoz. Ez azért fontos, mert a WebMCP-tervezetben a rejected Promise részletes hibaközvetítése még korlátozott.

### 9.3. Hibakódok

```text
SESSION_NOT_FOUND
INVALID_PHASE
STALE_REVISION
NO_PLAYABLE_DILEMMA
DILEMMA_MISMATCH
HUMAN_DECISION_REQUIRED
TENTATIVE_SELECTION_REQUIRED
SELECTION_ID_MISMATCH
REFLECTION_REQUIRED
REFLECTION_ID_MISMATCH
REFLECTION_NOT_ACKNOWLEDGED
DECISION_ID_MISMATCH
CONTENT_VERSION_MISMATCH
STORAGE_CORRUPTED
TOOL_ABORTED
```

## 10. Az öt WebMCP-tool szerződése

Minden `inputSchema` gyökere `type: "object"`, és mindenhol kötelező az `additionalProperties: false`. A toolok magyar címet és leírást kapnak, a programozási nevük stabil angol ASCII marad.

| Tool | Magyar cím | `readOnlyHint` | `untrustedContentHint` |
|---|---|---:|---:|
| `enter_machine_city` | Belépés a Gépvárosba | `false` | `false` |
| `present_dilemma` | Dilemma bemutatása | `false` | `false` |
| `get_current_game_state` | Aktuális játékállapot | `true` | `false` |
| `present_choice_reflection` | A kijelölt irány ellenpontja | `false` | `false` |
| `reveal_confirmed_consequence` | Megerősített döntés következménye | `false` | `false` |

Az `untrustedContentHint: false` csak azért helyes az első spike-ban, mert a toolkimenetek kizárólag verziózott statikus tartalmat és a játékmotor által generált adatot tartalmaznak; a játékos szabad szöveges indoklása nem kerül beléjük. Ha később bármely tool felhasználói szöveget ad vissza, ezt a döntést újra kell vizsgálni.

Minden handler az `execute(input, { signal })` callback abortjelét figyeli. Abort esetén az atomi commit előtt leáll; már sikeresen commitált műveletet az abort nem próbál visszagörgetni.

### 10.1. `enter_machine_city`

**Cél:** aktív helyi session létrehozása, vagy a már létező session idempotens visszaadása.

**Bemenet:**

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

**Sikeres `data`:**

```text
  language: hu
  resumed: boolean
  balance
  playableDilemmaCount
```

**Állapotmódosítás:**

- session nélkül új session, `MACHINE_CITY_READY`, nullás mérleg;
- aktív session esetén nincs reset, csak `resumed: true`;
- új játékot kizárólag külön emberi UI-művelet indíthat.

**Annotáció:** mutáló tool, ezért nincs `readOnlyHint: true`.

**Biztonsági megjegyzés:** az agent nem kaphat `reset`, `force`, `playerName` vagy tetszőleges sessionazonosító bemenetet.

### 10.2. `present_dilemma`

**Cél:** a következő játszható dilemma kiválasztása és megjelenítése.

**Bemenet:**

```json
{
  "type": "object",
  "properties": {
    "sessionId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64
    },
    "expectedRevision": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["sessionId", "expectedRevision"],
  "additionalProperties": false
}
```

**Sikeres `data`:**

```text
  dilemma
    id
    title
    callPrompt
    situation
    automationPromise
    centralTension
    destabilizingQuestion
    contentNotice
    canSkip
    choices[]
      lens
      label
      framing
      choiceText
  decisionStatus: awaiting_human_selection
```

**Nem adható vissza:** választásspecifikus reflexió, következményvektor, nyereség, ár, magyarázat vagy rejtett értékelés. Így Futura a kijelölés előtt nem választhat reflexiós ágat.

**Előfeltétel:** `MACHINE_CITY_READY`, vagy már teljesen perzisztált `CONSEQUENCE_REVEALED`, minden esetben egyező revisionnel.

**Utófeltétel:** első vagy további játszható dilemma esetén `AWAITING_HUMAN_SELECTION`; ha `CONSEQUENCE_REVEALED` után nincs több játszható dilemma, `GAME_COMPLETE`. A tool nem léphet tovább olyan sessionből, amelyben a feltárási rekord hiányos.

### 10.3. `get_current_game_state`

**Cél:** a szerepkör szerint szűrt, csak olvasható agentnézet lekérése.

**Bemenet:**

```json
{
  "type": "object",
  "properties": {
    "sessionId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64
    }
  },
  "required": ["sessionId"],
  "additionalProperties": false
}
```

**Sikeres `data`:**

```text
  language
  activeDilemma
    id
    title
  decisionStatus
    awaiting_human_selection |
    awaiting_reflection |
    reflection_presented |
    ready_for_confirmation |
    confirmed |
    revealed
  tentativeSelectionId: string | null
  tentativeLens: brain | hand | heart | null
  reflectionId: string | null
  reflectionAcknowledged: boolean
  confirmedDecisionId: string | null
  confirmedLens: brain | hand | heart | null
  balance
  completedDilemmaIds[]
```

**Adatminimalizálás:**

- a kijelölés előtt nincs lencse vagy selection ID; utána csak az aktuális, perzisztált kijelölést adja vissza;
- reflexiós tartalmat csak a `present_choice_reflection` adhat vissza;
- nem adja vissza a játékos szabad szöveges indoklását;
- megerősítés után csak a lencsét és az átlátszatlan döntésazonosítót közli.

**Annotáció:** `readOnlyHint: true`.

**Állapotmódosítás:** nincs.

### 10.4. `present_choice_reflection`

**Cél:** kizárólag a játékos aktuális kijelöléséhez tartozó, előre rögzített ellenérv, vakfolt, másodlagos következmény és kérdés bemutatása.

**Bemenet:**

```json
{
  "type": "object",
  "properties": {
    "sessionId": { "type": "string", "minLength": 1, "maxLength": 64 },
    "tentativeSelectionId": { "type": "string", "minLength": 1, "maxLength": 64 },
    "expectedRevision": { "type": "integer", "minimum": 0 }
  },
  "required": ["sessionId", "tentativeSelectionId", "expectedRevision"],
  "additionalProperties": false
}
```

**Kifejezetten tiltott bemenetek:** `lens`, `choice`, `reflection`, `reasoning`, `humanConfirmed`, `acknowledged`, `confirmed`.

**Sikeres `data`:**

```text
  tentativeSelectionId
  reflectionId
  selectedLens             // a domainból származik, nem bemenet
  reflection
    counterargument
    blindSpot
    secondaryConsequence
    question
  alreadyPresented: boolean
```

**Előfeltételek:** `TENTATIVE_SELECTION_RECORDED`; az ID az aktuális, `PLAYER_UI` eredetű kijelöléshez tartozik; a dilemma és a revision egyezik. Kijelölés nélkül `TENTATIVE_SELECTION_REQUIRED`, más vagy korábbi ID-val `SELECTION_ID_MISMATCH` jár, állapotmódosítás nélkül.

**Utófeltétel:** kizárólag `REFLECTION_PRESENTED`. A tool nem állíthat `acknowledgedAt` értéket, nem léptethet `READY_FOR_CONFIRMATION` vagy `DECISION_CONFIRMED` fázisba, és nem hozhat létre `ConfirmedDecision` rekordot.

**Idempotencia:** ugyanahhoz az aktuális selection ID-hoz ugyanazt a mentett reflexiót adja vissza. Kijelölésmódosítás után a korábbi ID nem használható újra.

### 10.5. `reveal_confirmed_consequence`

**Cél:** egy már megerősített emberi döntés előre rögzített következményének egyszeri alkalmazása és feltárása.

**Bemenet:**

```json
{
  "type": "object",
  "properties": {
    "sessionId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64
    },
    "confirmedDecisionId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64
    },
    "expectedRevision": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["sessionId", "confirmedDecisionId", "expectedRevision"],
  "additionalProperties": false
}
```

**Kifejezetten tiltott bemenetek:** `lens`, `choice`, `reasoning`, `humanConfirmed`, `delta`, `consequenceId`.

**Sikeres `data`:**

```text
  dilemmaId
  decisionId
  lens
  gains[]
  costs[]
  explanation
  closingReflection
  rawDelta
  appliedDelta
  balanceBefore
  balanceAfter
  physicalInstructions[]
  alreadyRevealed: boolean
```

**Előfeltételek és fázisszabályok:**

- első végrehajtáskor a phase kizárólag `DECISION_CONFIRMED`;
- `DECISION_CONFIRMED` előtti bármely fázis strukturált `INVALID_PHASE` vagy `HUMAN_DECISION_REQUIRED` hibát ad, állapotmódosítás nélkül;
- idempotens retry bármely későbbi fázisban csak az `outcomeHistory[]` egyik mentett döntésazonosítójához engedélyezett;
- a döntés `provenance` értéke `PLAYER_UI`;
- a döntés az aktuális, játékos által tudomásul vett reflexióra hivatkozik;
- az ID és a revision egyezik;
- a dilemma tartalomverziója egyezik a sessionnel.

**Utófeltétel:** az első sikeres hívás kizárólag `CONSEQUENCE_REVEALED` fázisba lép. Atomi módon perzisztálja a feltárt következményt, a nyers és alkalmazott mérlegváltozást, a mérleg előtti/utáni értékét, az első sikeres tooleredményt és az egyedi hatásalkalmazási kulcsot. Nem léphet közvetlenül `GAME_COMPLETE` állapotba.

**Idempotencia:** az első sikeres hívás alkalmazza a deltát. Ugyanazzal a döntésazonosítóval minden további hívás ugyanazt a mentett eredményt adja vissza `alreadyRevealed: true` értékkel, mérlegmódosítás nélkül. Más azonosító nem használhatja a mentett hatást.

Az ellenőrzések sorrendje idempotens újrapróbálkozást tesz lehetővé: ha a `confirmedDecisionId` már pontosan a mentett `RevealedOutcome` rekordhoz tartozik, a handler ezt adja vissza akkor is, ha az első hívás óta nőtt a revision. Más döntésazonosító vagy más művelet stale revisionnel továbbra is `STALE_REVISION` hibát kap.

## 11. Adatfolyam egy teljes körben

1. Az oldal betölt, validálja a dilemma-katalógust és megpróbálja visszatölteni a sessiont.
2. A WebMCP adapter feature detection után regisztrálja az öt toolt.
3. Futura meghívja az `enter_machine_city` toolt.
4. A játékmotor létrehozza vagy visszaadja a sessiont; a repository ment; a UI újrarenderel.
5. Futura meghívja a `present_dilemma` toolt az aktuális revisionnel.
6. A játékmotor kiválasztja az első `playable` dilemmát és `AWAITING_HUMAN_SELECTION` fázisba lép.
7. A játékos a UI-ban kijelöl egy lencsét; a Player-port perzisztálja a nem végleges `TentativeSelection` rekordot.
8. Futura lekéri az állapotot, majd a kapott selection ID-val meghívja a `present_choice_reflection` toolt.
9. A domain pontosan a kijelölt irány reflexióját rögzíti és adja vissza; Futura ezt bemutatja, érvel vagy kérdez.
10. A játékos megtartja a kijelölést, vagy módosítja. Módosításkor a 8–10. lépés új selection ID-val megismétlődik.
11. Megtartás után a játékos külön UI-művelettel véglegesen megerősít; a Player-port létrehozza a `ConfirmedDecision` rekordot.
12. Futura a `get_current_game_state` toolból megkapja a döntésazonosítót, a lencsét és az új revisiont.
13. Futura meghívja a `reveal_confirmed_consequence` toolt.
14. A domain atomi módon kiszámítja és alkalmazza az eredményt, perzisztálja a tooleredményt és az egyszeri hatás bizonylatát, majd `CONSEQUENCE_REVEALED` fázisba lép.
15. A tool strukturált trade-offot ad vissza, a UI pedig ugyanabból a perzisztált állapotból megjeleníti az Embermérleget.
16. A következő `present_dilemma` további játszható dilemma esetén új kört indít `AWAITING_HUMAN_SELECTION` fázisban; az utolsó dilemma után `GAME_COMPLETE` fázisba lép.

## 12. Perzisztencia és helyreállítás

### 12.1. Kulcs

Tervezett kulcs: `ember-maradsz:game-session:v1`.

### 12.2. Mentési szabály

Csak sikeres domaintranzakció után mentünk. A `TentativeSelection`, `PresentedReflection`, reflexiótudomásulvétel és `ConfirmedDecision` külön revisionként mentődik. Csak az indoklás szerkesztése és a megerősítő panel nyitottsága marad UI-lokális.

### 12.3. Visszatöltés

1. JSON parse.
2. Zod sémaellenőrzés.
3. `schemaVersion` ellenőrzés.
4. `contentVersion` kompatibilitás ellenőrzés.
5. Domaininvariánsok ellenőrzése.
6. Hibás adat esetén karantén vagy törlés, majd érthető helyreállítási üzenet.

Helyreállítási invariánsok:

- `AWAITING_HUMAN_SELECTION`: nincs kijelölés, reflexió vagy döntés;
- `TENTATIVE_SELECTION_RECORDED`: van aktuális kijelölés, de nincs hozzá érvényes bemutatott reflexió;
- `REFLECTION_PRESENTED`: a reflexió ugyanarra a dilemmára, lencsére és selection ID-ra mutat, `acknowledgedAt` még null;
- `READY_FOR_CONFIRMATION`: ugyanez a kapcsolat érvényes, és a tudomásulvételt Player-port rögzítette;
- `DECISION_CONFIRMED`: a döntés az aktuális kijelölésre és reflexióra hivatkozik, minden dilemma- és lencseérték egyezik, de még nincs eredmény alkalmazva;
- `CONSEQUENCE_REVEALED`: a mentett következmény, mérlegváltozás, tooleredmény és egyedi `effectApplicationKey` ugyanahhoz a döntéshez tartozik, és a rekord egyszer szerepel a historyban;
- `GAME_COMPLETE`: nincs további játszható dilemma, és az utolsó dilemma érvényes `RevealedOutcome` rekorddal lezárt.

Oldalfrissítés az ellenőrzött fázist állítja vissza, automatikus továbblépés nélkül. A részben vagy ellentmondásosan összekapcsolt rekord karanténba kerül; a helyreállítás soha nem értelmez reflexiót megerősítésként. Régi selection ID és reflexió módosítás után archiválható bizonyítékként, de aktív kapcsolatként nem tölthető vissza.

## 13. Feature detection és fallback

### 13.1. WebMCP mód

Aktív, ha a biztonságos kontextusban a `document.modelContext?.registerTool` függvény elérhető, és mind az öt regisztráció sikeres.

### 13.2. Manuális mód

Ha a WebMCP nem elérhető vagy a regisztráció hibázik:

- a játék marad végigjátszható;
- megjelenik egy „WebMCP nem érhető el - manuális demómód” jelzés;
- az öt agentművelethez külön fejlesztői/demó vezérlők jelennek meg;
- ezek az AgentCommandPort ugyanazon műveleteit hívják, nem duplikált játékszabályt;
- az emberi döntés továbbra is kizárólag a normál játékos UI-ban történik.

## 14. Mappastruktúra

```text
ember-maradsz-webmcp/
├── README.md                         # indítás, WebMCP-teszt és demóleírás
├── package.json                      # scriptek és függőségek
├── pnpm-lock.yaml                    # reprodukálható telepítés
├── tsconfig.json                     # TypeScript alapbeállítás
├── vite.config.ts                    # Vite és tesztkonfiguráció
├── index.html                        # SPA belépési pont
├── public/
│   └── assets/                       # későbbi saját statikus vizuális elemek
├── src/
│   ├── main.tsx                      # React indulás
│   ├── app/
│   │   ├── App.tsx                   # alkalmazás-kompozíció
│   │   └── bootstrap.ts              # repository, engine, portok összekötése
│   ├── domain/
│   │   ├── gameTypes.ts              # session, fázisok, balance, döntéstípusok
│   │   ├── gameErrors.ts             # stabil domainhibák
│   │   ├── gameEngine.ts             # állapotátmenetek és invariánsok
│   │   ├── balance.ts                # delta és clamp számítás
│   │   └── invariants.ts             # állapotkonzisztencia-ellenőrzés
│   ├── application/
│   │   ├── playerCommandPort.ts      # csak UI: kijelölés, megtartás, megerősítés
│   │   ├── agentCommandPort.ts       # csak agent: belépés, dilemma, reflexió, feltárás
│   │   ├── agentQueryPort.ts         # szűrt agentállapot
│   │   ├── uiQueryPort.ts            # teljes, UI-nak szánt read model
│   │   └── transactionService.ts     # módosítás + validálás + mentés atomikusan
│   ├── content/
│   │   ├── dilemmaTypes.ts           # tartalommodell
│   │   ├── dilemmaSchema.ts          # Zod validáció
│   │   ├── dilemmaCatalog.hu.ts      # katalógus és sorrend
│   │   └── dilemmas/
│   │       ├── apology.hu.ts         # az első teljes dilemma
│   │       ├── birthday.hu.ts        # későbbi draft helye
│   │       └── shadow-call.hu.ts     # későbbi draft helye
│   ├── infrastructure/
│   │   ├── storage/
│   │   │   ├── gameRepository.ts     # repository interfész
│   │   │   └── localStorageRepo.ts   # verziózott böngészős tárolás
│   │   └── webmcp/
│   │       ├── webmcpTypes.d.ts      # kísérleti Document API típusai
│   │       ├── contracts.ts          # az öt input/output séma
│   │       ├── registerTools.ts      # imperative regisztráció
│   │       ├── toolHandlers.ts       # Agent-port adapterek
│   │       └── featureDetection.ts   # támogatás és regisztrációs státusz
│   ├── ui/
│   │   ├── hooks/
│   │   │   ├── useGameView.ts        # UI read model feliratkozás
│   │   │   └── usePendingReasoning.ts # nem perzisztált emberi indoklás
│   │   ├── components/
│   │   │   ├── MachineCity.tsx
│   │   │   ├── FuturaCall.tsx
│   │   │   ├── DilemmaCard.tsx
│   │   │   ├── LensChoices.tsx
│   │   │   ├── ChoiceReflection.tsx
│   │   │   ├── DecisionConfirmation.tsx
│   │   │   ├── HumanBalance.tsx
│   │   │   └── ManualAgentControls.tsx
│   │   └── styles/
│   │       └── app.css
│   └── test/
│       ├── fixtures.ts               # teszt sessionök és dilemmák
│       └── setup.ts                  # DOM és modelContext mock
└── tests/
    ├── unit/
    │   ├── gameEngine.test.ts
    │   ├── balance.test.ts
    │   ├── dilemmaSchema.test.ts
    │   └── invariants.test.ts
    ├── application/
    │   ├── playerAgentBoundary.test.ts
    │   ├── idempotency.test.ts
    │   └── persistence.test.ts
    ├── webmcp/
    │   ├── contracts.test.ts
    │   ├── handlers.test.ts
    │   └── registration.test.ts
    └── ui/
        ├── decisionFlow.test.tsx
        └── accessibility.test.tsx
```

A `birthday.hu.ts` és `shadow-call.hu.ts` fájlokat csak akkor kell létrehozni, amikor legalább minimális draft metaadatot is rögzítünk. Az első kódolási feladatban nem szükséges üres placeholder fájlokat gyártani.

## 15. Tesztstratégia

### 15.1. Domain- és állapotgép-tesztek

1. Új session nullás mérleggel és `MACHINE_CITY_READY` fázissal indul.
2. Dilemma csak `MACHINE_CITY_READY` állapotból indítható.
3. Minden tiltott fázisátmenet `INVALID_PHASE` eredményt ad és nem módosít revisiont.
4. Mindhárom lencse létrehozhat érvényes, de nem végleges játékosi kijelölést.
5. Reflexió csak az aktuális, `PLAYER_UI` eredetű kijelöléshez indítható.
6. Reflexió bemutatása nem hoz létre döntést és nem léphet `READY_FOR_CONFIRMATION` fázisba.
7. Döntés csak aktív dilemmához, játékos által tudomásul vett aktuális reflexió után rögzíthető.
8. Kijelölésmódosítás új ID-t hoz létre, érvényteleníti a régi reflexiót, és új reflexiót követel.
9. Következmény csak `DECISION_CONFIRMED` után alkalmazható.
10. A delta és a `[-2, 2]` clamp helyesen működik; `rawDelta` és `appliedDelta` megmarad.
11. A feltárás atomi: hiba esetén sem balance, sem `consumedAt` nem változik.
12. A sikeres feltárás `DECISION_CONFIRMED` állapotból `CONSEQUENCE_REVEALED` állapotba lép, soha nem közvetlenül `GAME_COMPLETE` állapotba.
13. `CONSEQUENCE_REVEALED` állapotban a következmény, mérlegváltozás, tooleredmény és egyszeri hatáskulcs együtt perzisztált.
14. További dilemma esetén a következő hívás új kört indít; az utolsó feltárt dilemma után `GAME_COMPLETE` következik.

### 15.2. Ember-agent határ tesztjei

1. Az öt regisztrált tool input sémájában nincs `lens`.
2. A sémákban nincs `choice`, `reasoning` vagy `humanConfirmed`.
3. A WebMCP adapter konstruktorának nincs Player-port paramétere.
4. Agentparancsból nem hozható létre `ConfirmedDecision`.
5. UI-kijelölés után van perzisztált `TentativeSelection`, de nincs `ConfirmedDecision`.
6. Futura nem indíthat reflexiót kijelölés nélkül, kitalált ID-val vagy lecserélt kijelölés ID-jával.
7. A reflexiós toolhoz adott extra `lens`, `acknowledged` vagy `confirmed` mezőt a zárt séma elutasítja.
8. Reflexió után `acknowledgedAt` null marad; Futura nem kezelheti a szakaszt megerősítésként.
9. Csak Player-portos tudomásulvétel teheti elérhetővé a megerősítést, és csak UI-megerősítés hoz létre döntést.
10. `reflectionId` nem használható `confirmedDecisionId` értékként.
11. Hamis döntésazonosító `DECISION_ID_MISMATCH` hibát ad; helyes ID hibás fázissal vagy revisionnel sem elég.
12. A tool handler soha nem kérdez le vagy kattint DOM-elemet.

### 15.3. Tool-szerződési tesztek

1. Mind az öt séma zárt: `additionalProperties: false`.
2. Minden kötelező mező és hosszkorlát érvényesül.
3. A read tool `readOnlyHint: true` annotációt kap.
4. A mutáló toolok nem kapnak téves read-only annotációt.
5. Minden sikeres kimenet JSON-szerializálható.
6. Minden üzleti hiba stabil kódot és aktuális fázist ad.
7. Stale revision esetén nincs állapotmódosítás.
8. Abortált végrehajtás nem hagy félkész tranzakciót.
9. Ismételt `enter_machine_city` nem nulláz aktív játékot.
10. Ismételt `reveal_confirmed_consequence` nem alkalmazza kétszer a deltát.
11. A `present_dilemma` nem ad vissza következményt vagy mérleg-deltát.
12. Az idempotens reveal-retry a korábbi revisionnel is ugyanazt a mentett eredményt adja vissza.
13. A `present_choice_reflection` az aktuális selection ID-ra idempotens.
14. Kijelölésmódosítás után a régi selection ID `SELECTION_ID_MISMATCH` hibát ad.
15. A reflexiós output pontosan a domainben kijelölt lencséből származik, nem agentbemenetből.
16. A `reveal_confirmed_consequence` minden `DECISION_CONFIRMED` előtti fázisból hibázik és nem módosít állapotot.
17. Az első sikeres reveal után a perzisztált tooleredmény kerül visszaadásra retry esetén.

### 15.4. Tartalomtesztek

1. Minden `playable` dilemmának pontosan három lencséje van.
2. A lencsék mindhárom enumértéket egyszer tartalmazzák.
3. Minden következménynek van nyeresége és ára.
4. Minden delta egész és a megengedett tartományban van.
5. A tiltott moralizáló szavak egyszerű tartalmi linten fennakadnak.
6. A runtime nem választ `draft` vagy `disabled` dilemmát.
7. Az `apology-delegation` minden ága teljes és valid.
8. A katalógus legalább három dilemma rögzítésére alkalmas módosítás nélkül.
9. Minden játszható lencsének teljes reflexiós tartalma van.
10. A reflexió nem szivárogtat végleges következményt vagy mérleg-deltát.

### 15.5. Perzisztenciatesztek

1. Minden sikeres tranzakció után a legújabb revision mentődik.
2. A kijelölés, a bemutatott reflexió és annak játékosi tudomásulvétele külön-külön visszaáll.
3. Újratöltés egyik köztes fázisból sem eredményez automatikus tudomásulvételt vagy megerősítést.
4. Módosított kijelölés után a régi reflexió nem válik újra aktívvá.
5. Megerősített döntés oldalfrissítés után visszaáll.
6. `CONSEQUENCE_REVEALED` oldalfrissítés után a teljes eredménnyel és az alkalmazott hatás bizonylatával áll vissza.
7. Következményfeltárás oldalfrissítés után nem ismétlődik meg.
8. Hibás JSON, ismeretlen verzió vagy fázis–rekord ellentmondás biztonságos helyreállítási állapotot eredményez.

### 15.6. UI-tesztek

1. Három választási kártya jelenik meg, azonos vizuális súllyal.
2. Nincs előre kiválasztott vagy ajánlott irány.
3. A kiválasztás módosítható a végső megerősítésig.
4. Reflexió nem jelenik meg kijelölés előtt.
5. A végleges megerősítő gomb reflexió és játékosi megtartás előtt tiltott.
6. A reflexiós panel a kijelölt irányt nevezi meg, és külön megtartás/módosítás műveletet ad.
7. A megerősítő panel a reflexió után megtartott irányt nevezi meg.
8. Megerősítés után a választási UI zárolódik; következmény előtte nem látható.
9. A teljes folyamat billentyűzettel járható, a fókusz mindkét panelen helyesen mozog.
10. A mérlegsávoknak szöveges, képernyőolvasó számára érthető értékük van.

### 15.7. Manuális WebMCP elfogadási tesztek

1. A támogatott Codex/ChatGPT desktop böngésző felismeri mind az öt toolt.
2. A toolnevek, magyar címek és leírások helyesen jelennek meg.
3. `enter_machine_city` láthatóan módosítja a közös oldalt.
4. `present_dilemma` megjeleníti a bocsánatkérési dilemmát.
5. Futura reflexiós próbája kijelölés nélkül és nem aktuális selection ID-val elutasítódik.
6. A játékos kijelöl; `present_choice_reflection` csak ehhez az irányhoz mutat reflexiót.
7. Reflexió után a megerősítés még tiltott; a játékos megtart vagy módosít, szükség esetén új reflexió történik.
8. A játékos külön véglegesít; az állapotleolvasó csak ezután közli az opaque döntésazonosítót.
9. `reveal_confirmed_consequence` `DECISION_CONFIRMED` előtt hibázik, utána `CONSEQUENCE_REVEALED` állapotot hoz létre és egyszer módosítja az Embermérleget; retry nem módosít újra.
10. WebMCP kikapcsolásakor a manuális mód ugyanazokat a reflexiós és emberi kontrollkapukat használja.

## 16. Kritikus invariánsok

Ezek megsértése blokkolja a prototípus elfogadását:

1. Tool input nem tartalmazhat döntési értéket.
2. Agentparancs nem hozhat létre `ConfirmedDecision` rekordot.
3. Futura csak aktuális, játékos által létrehozott kijelöléshez indíthat reflexiót.
4. Reflexió bemutatása sem tudomásulvételnek, sem megerősítésnek nem számíthat.
5. Végleges megerősítés előtt következmény nem kerülhet agent outputba.
6. A következmény kizárólag a statikus, verziózott dilemmaadatból származhat.
7. Egy döntés következménye legfeljebb egyszer alkalmazható.
8. `DECISION_CONFIRMED` nem ugorhatja át a perzisztált `CONSEQUENCE_REVEALED` állapotot.
9. `CONSEQUENCE_REVEALED` csak teljes, atomi eredmény- és hatásbizonyítékkal érvényes.
10. Az aktív sessiont agent tool nem nullázhatja.
9. A három döntési irány UI-ja és szövegezése nem sugallhat erkölcsi rangsort.
10. A UI és az agent ugyanazt a domainállapotot és ugyanazt a következményszámítást használja.

## 17. Első implementációs sorrend - későbbi kódolási fázis

Ez a dokumentum nem indítja el a megvalósítást. A jóváhagyás után ajánlott sorrend:

1. Domain típusok, fázisok és invariánsok.
2. A bocsánatkérési dilemma adatmodellje és validációja.
3. Tiszta játékmotor és unit tesztek.
4. Player- és Agent-portok szétválasztása.
5. `localStorage` repository és helyreállítás.
6. Minimális magyar UI, választásspecifikus reflexió és emberi megerősítő panel.
7. WebMCP adapter és öt tool-szerződés.
8. Manuális fallback mód.
9. Codex desktop integrációs próba.
10. Csak a technikai kapu teljesülése után vizuális finomítás és további tartalom.

## 18. Definition of Done az első spike-hoz

- [ ] Egyetlen magyar bocsánatkérési kör elejétől végéig lejátszható.
- [ ] Az AGY, KÉZ és SZÍV három választható, egyenrangú döntési irány.
- [ ] Mindhárom ágnak van nyeresége, ára, magyarázata és következményvektora.
- [ ] Az öt WebMCP-tool felfedezhető és meghívható.
- [ ] Egyik tool sem fogad döntést vagy megerősítő booleant.
- [ ] A kijelölés, reflexió utáni megtartás/módosítás és megerősítés kizárólag a Player UI-porton történik.
- [ ] Futura kizárólag az aktuálisan kijelölt lencse reflexióját indíthatja el.
- [ ] A reflexiós fázis technikailag nem értelmezhető megerősítésként.
- [ ] Az agent megerősítés előtt nem tárhat fel következményt.
- [ ] A feltárás külön, teljesen perzisztált `CONSEQUENCE_REVEALED` állapotot hoz létre.
- [ ] Innen további dilemma esetén új kör, az utolsó dilemma után `GAME_COMPLETE` következik.
- [ ] Az öt Embermérleg-érték helyesen és legfeljebb egyszer módosul.
- [ ] A session újratöltés után konzisztensen helyreáll.
- [ ] WebMCP nélkül működik a manuális fallback.
- [ ] Az automata tesztek és a manuális Codex desktop próba sikeresek.
- [ ] Nincs backend, külső AI-függőség vagy személyesadat-kezelés.

## 19. Nyitott, de a kódolást nem blokkoló tartalmi döntések

- A bocsánatkérési dilemma három konkrét választási mondatának végleges szövege.
- A három következményvektor playtest utáni finomhangolása.
- Az indoklás kötelező vagy opcionális volta.

---

## 20. Tervezési döntés összefoglaló

Az emberi kontroll nem egy agent által kitölthető `humanConfirmed` mező, hanem architekturális határ:

- a játékos kijelölése perzisztált, `PLAYER_UI` eredetű, de nem végleges döntés;
- Futura csak az aktuális kijelöléshez mutathat reflexiót, amely nem számít tudomásulvételnek vagy megerősítésnek;
- kizárólag a Player-port módosíthat kijelölést, ismerhet el reflexiót és hozhat létre megerősített döntést;
- a WebMCP adapter csak az Agent-portot ismeri;
- Futura egy kijelölésazonosítóval reflexiót, majd csak egy külön, már létező döntésazonosítóval következményt tárhat fel;
- a játékmotor minden hívásnál ellenőrzi a fázist, a revisiont, az eredetet és az idempotenciát.

Ez őrzi meg a projekt központi állítását: a Gépváros kezelheti a rendszert és feltárhatja a következményt, de az AGY, a KÉZ vagy a SZÍV irányának kiválasztása a játékosé marad.

---

## 21. Hivatalos versenyforrások és elsőbbségi szabály

### 21.1. Elsődleges források

| Forrás | URL | Mire irányadó | Utolsó ellenőrzés |
|---|---|---|---|
| Challenge oldal | <https://webmcp.devpost.com/> | téma, mit kell építeni, mit kell beadni, aktuális státusz | 2026. augusztus 27. |
| Official Rules | <https://webmcp.devpost.com/rules> | jogi feltételek, jogosultság, időszakok, eredetiség, IP, módosítási korlátok | 2026. augusztus 27. |
| Resources és FAQ | <https://webmcp.devpost.com/resources> | támogatott tesztkörnyezet, szervezői útmutatás, FAQ és ajánlott források | 2026. augusztus 27. |

Az ellenőrzés a Devpost élő MCP-adatain keresztül történt. A lekérés szerint a Challenge státusza `submissions_open`, az adatok teljessége `complete`, és 2026. augusztus 27-én nem volt közzétett announcement.

Ha a koncepció, ez a technikai terv, a README, bármely más projektfájl vagy korábbi összefoglalás eltér az aktuális Devpost-tartalomtól, a hivatalos Devpost-oldal és Official Rules az irányadó.

### 21.2. Forrásellenőrzési napló elve

Minden pályázati követelményhez rögzíteni kell:

- a pontos forrás URL-jét;
- az ellenőrzés dátumát és helyi időzónáját;
- ha elérhető, a Devpost MCP `fetched_at` időpontját;
- a követelmény rövid, saját szavas összefoglalását;
- azt, hogy melyik projektbizonyíték teljesíti;
- a bizonyíték commit SHA-ját vagy URL-jét;
- a legutóbbi ellenőrzés eredményét: `pending`, `pass`, `fail`, `not_applicable`.

Kötelező újraellenőrzési pontok:

1. a repository inicializálásakor;
2. az első publikus deployment előtt;
3. a videó végleges forgatókönyve előtt;
4. legkésőbb 48 órával a beadási határidő előtt;
5. a végső beadási dry run kezdetén;
6. közvetlenül a Devpost `Submit` művelet előtt.

Az újraellenőrzés nem írja felül a korábbi bejegyzést. Új dátumozott sort ad a követelmény- vagy build loghoz, így az esetleges szabályváltozás is visszakövethető.

### 21.3. Aktuális hivatalos dátumok

| Esemény | Hivatalos időpont | Budapest idő szerint | Forrás | Ellenőrzés |
|---|---|---|---|---|
| Submission Period kezdete | 2026-08-25 11:00 PT / `2026-08-25T19:00:00Z` | 2026-08-25 21:00 CEST | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Submission Period vége | 2026-09-03 13:00 PT / `2026-09-03T20:00:00Z` | 2026-09-03 22:00 CEST | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Judging Period kezdete | 2026-09-04 10:00 PT / `2026-09-04T17:00:00Z` | 2026-09-04 19:00 CEST | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Judging Period vége | `2026-09-22T00:00:00Z` | 2026-09-22 02:00 CEST | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Eredményhirdetés | `2026-09-23T21:00:00Z` | 2026-09-23 23:00 CEST | <https://webmcp.devpost.com/rules> | 2026-08-27 |

A belső kész határidő továbbra is 2026. szeptember 2. este. A Devpost szerinti végső határidő 2026. szeptember 3. 22:00 budapesti idő.

## 22. Kötelező beadandók és Devpost-mezők

### 22.1. Beadandó-ellenőrző tábla

| Követelmény | Hivatalos elvárás | Tervezett bizonyíték | Forrás | Ellenőrzés |
|---|---|---|---|---|
| Működő live URL | Bírók által elérhető URL ChatGPT in-app browserben vagy WebMCP-képes Chrome-ban | incognito elérés, kliensmátrix, dátumozott screenshot, smoke test | <https://webmcp.devpost.com/> és <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Publikus repository | GitHub, GitLab vagy Bitbucket; a teljes működő forrás és assetek elérhetők | incognito repository screenshot, publikus URL, release tag | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Open-source licenc | teljes licencfájl, a repository tetején/About részben felismerhető és látható | `LICENSE`, repository About screenshot, licencfelismerés ellenőrzése | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Szöveges leírás | megmagyarázza a WebMCP-illeszkedést, UX-előnyt, ember-agent együttműködést és megvalósítást | Devpost draft + README megfelelő szakaszai | <https://webmcp.devpost.com/> | 2026-08-27 |
| Demóvideó | nyilvános YouTube, kevesebb mint 3 perc, működő projekt, hangos magyarázat a projektről és WebMCP-ről | publikus videó URL, időtartam screenshot, végleges narráció | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Tesztelési útmutató | a bírók számára világos hozzáférés és WebMCP-tesztlépések; hitelesítés esetén credential | `README.md` és `docs/TESTING.md`; Devpost testing field | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Angol beadási anyag | minden beadási anyag angol, vagy angol fordítással rendelkezik | angol Devpost-szöveg, angol videó vagy felirat/narráció, angol testing guide | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Eredetiség és IP | saját munka, harmadik fél jogainak tisztelete, licencek betartása | originality doc, asset- és licencjegyzék, forrásattribúció | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| Versenyidőszaki bővítés | korábbi projekt esetén a WebMCP-bővítés a Submission Period alatt készül és bizonyított | `BEFORE_AND_DURING.md`, commitok, build log, screenshotok | <https://webmcp.devpost.com/rules> | 2026-08-27 |

Megjegyzés: a Devpost strukturált deliverable schema `website_required: false` értéket jelez, de a Challenge szövege, az Official Rules és a kötelező `Live URL` custom mező egyértelműen live URL-t követel. A projekt ezért a live URL-t kötelező beadandóként kezeli.

### 22.2. Aktuális Devpost submission mezők

| ID | Mező | Kötelező | Tervezett forrásdokumentum | Forrás | Ellenőrzés |
|---:|---|:---:|---|---|---|
| 28249 | Submitter Type | igen | beadási ellenőrzőlista | <https://webmcp.devpost.com/> | 2026-08-27 |
| 28250 | Country of residence of yourself and team members | igen | beadási ellenőrzőlista | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| 28251 | Organization name, ha releváns | nem | beadási ellenőrzőlista | <https://webmcp.devpost.com/> | 2026-08-27 |
| 28252 | App Status: New vagy Existing | igen | `docs/BEFORE_AND_DURING.md` | <https://webmcp.devpost.com/> | 2026-08-27 |
| 28253 | Existing projekt versenyidőszaki változásai | feltételesen kitöltendő | `docs/BEFORE_AND_DURING.md` | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| 28254 | Live URL | igen | `README.md`, `docs/TESTING.md` | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| 28255 | Testing instructions / credentials | formálisan nem, gyakorlatban kitöltendő | `docs/TESTING.md` | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| 28256 | Public code repository URL | igen | `README.md` | <https://webmcp.devpost.com/rules> | 2026-08-27 |
| 28257 | Tesztelt agentek vagy kliensek | igen | `docs/TESTING.md` | <https://webmcp.devpost.com/> | 2026-08-27 |
| 28258 | Használt AI-eszközök | igen | `docs/AI_USAGE.md` | <https://webmcp.devpost.com/> | 2026-08-27 |
| 28259 | A projektből származó tanulás szintje | igen | `docs/AI_USAGE.md`, `docs/BUILD_LOG.md` | <https://webmcp.devpost.com/> | 2026-08-27 |
| 28260 | Karrierben használható AI-érték | igen | `docs/AI_USAGE.md` | <https://webmcp.devpost.com/> | 2026-08-27 |

A demo video külön, kötelező deliverable; nem a fenti custom mezők egyikeként jelenik meg.

**App Status döntési szabály:** ha 2026. augusztus 25. előtt nem létezett futtatható webalkalmazás vagy korábbi projektimplementáció, az előzetes koncepció önmagában nem teszi az alkalmazást „Existing” projektté; ebben az esetben a tervezett válasz `New`, miközben a koncepció előéletét továbbra is transzparensen dokumentáljuk. Ha előkerül korábbi működő prototípus vagy forráskód, a válasz `Existing`, a 28253 mezőt pedig kötelező belső kontrollként kitöltjük a versenyidőszaki WebMCP-bővítéssel. A végső választ a beadáskor ismert tények alapján ember hozza meg.

### 22.3. Hivatalos bírálati szempontok

Mind a négy szempont azonos súlyú, 5 pontos skálán értékelhető a Devpost élő adatai szerint.

| Rövidítés | Szempont | Hivatalos fókusz | Forrás | Ellenőrzés |
|---|---|---|---|---|
| WL | WebMCP Leverage | alapos, ügyes, valóban működő és nem triviális WebMCP-használat | <https://webmcp.devpost.com/> | 2026-08-27 |
| EX | Execution | működő vagy futtatható, teljes és koherens termékélmény, nem puszta technikai proof of concept | <https://webmcp.devpost.com/> | 2026-08-27 |
| PI | Potential Impact | konkrét valós probléma, valós célközönség és hitelesen bemutatott megoldás | <https://webmcp.devpost.com/> | 2026-08-27 |
| CA | Creativity & Ambition | kreatív, újszerű koncepció és megkülönböztethetőség | <https://webmcp.devpost.com/> | 2026-08-27 |

## 23. Dokumentációs és bizonyítási stratégia

### 23.1. Alapelv

A dokumentáció nem utólagos pályázati díszlet. Minden fejlesztési mérföldkő ugyanabban a commitban frissíti a hozzá tartozó bizonyítékot, amelyben a változás elkészül vagy ellenőrzésre kerül.

Minden állításnak három szintű bizonyítéka lehet:

1. **Forrásbizonyíték:** kód, teszt vagy konfiguráció konkrét fájlban és commitban.
2. **Futási bizonyíték:** dátumozott tesztkimenet, strukturált tool-result vagy screenshot.
3. **Pályázati bizonyíték:** README-, Devpost- vagy videórész, amely érthetően megmutatja a jelentőségét.

### 23.2. Dokumentummátrix

| Dokumentum | Létrehozás időpontja | Mikor frissítendő | Elsődleges bizonyíték | Bírálati támogatás |
|---|---|---|---|---|
| `README.md` | repository inicializálásakor | minden felhasználói mérföldkő, deployment és beadási változás után | működési állapot, live URL, gyors teszt, demo, repo és licenc | WL, EX, PI, CA |
| `docs/BUILD_LOG.md` | az első versenyidőszaki commitban | minden munkamenet és mérföldkő végén; sikertelen próbánál is | dátum, commit SHA, cél, eredmény, teszt, hiba, bizonyíték | WL, EX |
| `docs/DECISIONS.md` | az első architekturális döntés commitjában | minden lényeges trade-off, scope- vagy tartalmi döntéskor | ADR-szerű döntések, alternatívák, emberi döntéshozó | WL, EX, CA |
| `docs/ARCHITECTURE.md` | a projektváz előtt vagy azzal azonos commitban | komponens-, adatfolyam- vagy state-machine változáskor | rétegek, portok, állapotok, perzisztencia, adatfolyam | WL, EX |
| `docs/WEBMCP_TOOLS.md` | az első tool implementációjával azonos commitban | schema, annotáció, handler vagy eredmény változásakor | discovery, input/output, sikeres és sikertelen hívás, side effect | WL, EX |
| `docs/HUMAN_CONTROL.md` | a Player/Agent határ implementációja előtt | minden kontrollpont-, UI-confirmation- vagy negatívteszt-változáskor | invariánsok, megkerülési próbák, fenyegetési modell | WL, EX, CA |
| `docs/TESTING.md` | az első automata teszttel azonos commitban | minden új tesztkörnyezet, kliens, modell, regresszió vagy dry run után | tesztmátrix, verziók, dátumok, pass/fail, fallback | WL, EX |
| `docs/ORIGINALITY_AND_SOURCES.md` | első publikus repository-verzióban | minden új inspiráció, forrás, csomag vagy asset felvételekor | saját elemek, források, licencek, Metropolisz-határ | PI, CA |
| `docs/BEFORE_AND_DURING.md` | első commitban | minden fő versenyidőszaki mérföldkő után | előzetes koncepció és új WebMCP-munka elkülönítése | WL, EX, CA |
| `docs/AI_USAGE.md` | az első AI-val segített munkamenet dokumentálásakor | új AI-eszköz, modell vagy érdemi AI-közreműködés után | eszköz, feladat, output felhasználása, emberi felülvizsgálat | EX, CA |

### 23.3. `README.md`

Kötelező tartalom:

- egy mondatos termékállítás és célközönség;
- „Why WebMCP?” rész konkrét ember-agent munkamegosztással;
- live URL, publikus videó és Devpost URL, amint elérhetők;
- 60-90 másodperces judge quick start;
- tesztelt kliens és minimális böngészőfeltételek;
- helyi telepítés és futtatás;
- az öt WebMCP-tool rövid listája;
- emberi kontrollpont rövid magyarázata;
- képernyőkép vagy rövid GIF csak saját/jogtiszta assetből;
- dokumentációs index;
- „Before the challenge / Built during the challenge” összefoglaló;
- licenc és harmadik fél attribúció;
- aktuális projektstátusz: mi működik ténylegesen, mi tervezett.

Bizonyítási szerep: ez lehet az egyetlen dokumentum, amelyet minden bíró biztosan lát, ezért semmilyen kulcsállítás nem maradhat csak egy mélyebb fájlban.

### 23.4. `docs/BUILD_LOG.md`

Minden bejegyzés mezői:

```text
Dátum és időzóna
Munkamenet célja
Ki dolgozott rajta
Használt AI-eszköz/modell
Kiinduló commit SHA
Létrejött commit SHA-k
Elvárt eredmény
Tényleges eredmény
Sikeres tesztek
Sikertelen próbák és hibaüzenetek röviden
Kapcsolódó evidence fájlok
Nyitott kockázat / következő lépés
```

A sikertelen WebMCP-próba nem törlendő. Rövid, reprodukálható hibaleírással és a javító commit hivatkozásával értékes Execution- és WebMCP-bizonyíték.

### 23.5. `docs/DECISIONS.md`

Rövid ADR-formátum:

```text
ID és cím
Dátum
Státusz: proposed | accepted | superseded
Kontextus
Megvizsgált alternatívák
Döntés
Indoklás
Következmények és trade-offok
Ember által meghozott érdemi döntés
Kapcsolódó commit / issue / evidence
```

Első rögzítendő döntések:

- AGY-KÉZ-SZÍV három választható irány marad;
- a WebMCP-tool nem fogad döntési értéket;
- Player- és Agent-port fizikailag különül el;
- egy dilemma a spike-ban, három dilemmára alkalmas adatmodell;
- determinisztikus, lokális játékmotor backend nélkül;
- magyar spike, később angol beadási változat.

### 23.6. `docs/ARCHITECTURE.md`

Tartalmazza:

- rendszerkontextus és rétegdiagram;
- UI, Player-port, Agent-port, domain és repository felelőssége;
- teljes állapotgép és tiltott átmenetek;
- döntés-életciklus a UI-kiválasztástól a következményig;
- session- és dilemma-adatmodell;
- revision, idempotencia és helyreállítás;
- WebMCP nélküli fallback adatfolyam;
- security és privacy határ;
- architektúra-verzió és a diagramot érvényesítő commit.

### 23.7. `docs/WEBMCP_TOOLS.md`

Minden toolhoz:

- név, cím, cél és side effect;
- teljes input schema és outputpélda;
- annotációk;
- elő- és utófeltételek;
- sikeres hívás dátumozott, redaktált JSON-ja;
- legalább egy elvárt sikertelen hívás JSON-ja;
- látható UI-változás előtte/utána;
- discovery helye és a tesztelt kliens;
- implementáció fájl- és commit-hivatkozása;
- ismert kliens- vagy specifikációs korlátok.

A tool-result fájlokból minden személyes adat, token, teljes chatüzenet és környezeti titok eltávolítandó.

### 23.8. `docs/HUMAN_CONTROL.md`

Tartalmazza:

- a védendő állítás pontos határát: WebMCP-toolon keresztül nincs emberi választás;
- Player UI-port és Agent-port capability-mátrixa;
- a pending és confirmed döntés különbsége;
- a döntésazonosító, provenance és revision szerepe;
- negatív tesztek:
  - reveal megerősítés nélkül;
  - tiltott `lens` extra mező beadása;
  - hamis decision ID;
  - stale revision;
  - másik session döntésének felhasználása;
  - kétszeri reveal;
  - oldalfrissítés kijelölés, reflexió és reflexiótudomásulvétel közben;
- a tesztkimenetek és screenshotok hivatkozása;
- őszinte korlátozás: a tool surface elleni védelem nem általános computer-use elleni kriptográfiai garancia.

### 23.9. `docs/TESTING.md`

Minden manuális környezetrekord kötelező mezői:

```text
Test ID
Dátum, idő és időzóna
Commit SHA / release tag
Live URL vagy localhost
Operációs rendszer és verzió
Kliens neve és verziója
Böngésző / in-app browser és verzió
WebMCP flag vagy site-tools állapot
Agent/modell pontos neve
Tesztelő
Előfeltételek
Lépések
Elvárt eredmény
Tényleges eredmény
Pass / Fail / Blocked
Evidence fájl vagy URL
Megjegyzés / ismert eltérés
```

Külön mátrixok:

- tool discovery;
- sikeres toolhívások;
- elvárt sikertelen toolhívások;
- emberi kontrollpont negatív tesztek;
- mobil/desktop UI;
- session restore;
- manuális fallback;
- incognito live URL és repository elérés;
- beadási dry run.

### 23.10. `docs/ORIGINALITY_AND_SOURCES.md`

Kötelező állítások:

- Thea von Harbou *Metropolis* című regénye kizárólag megjelölt inspirációs forrás az AGY-KÉZ-SZÍV közvetítő motívumának megértéséhez.
- A projekt nem adaptálja a regény cselekményét, karakterívét, jeleneteit vagy világát.
- Hosszabb szövegrész nem kerül az alkalmazásba, README-be, videóba vagy Devpost-anyagba.
- Filmkocka, filmzene, filmplakát, logó és más jogvédett vizuális elem nem kerül felhasználásra.
- Futura, Gépváros, a konkrét dilemmák, az Embermérleg és a mechanika saját alkotás.
- A rövid mottó használata csak külön jogi ellenőrzés és pontos attribúció után történhet; bizonytalanság esetén parafrázist használunk.
- A teljes helyi forrás-PDF nem kerül a publikus repositoryba.

Asset- és függőségi jegyzék mezői:

| Tétel | Típus | Forrás URL | Szerző/jogtulajdonos | Verzió | Licenc | Felhasználás | Attribúció helye | Ellenőrzés dátuma |
|---|---|---|---|---|---|---|---|---|

Ide kerül minden npm-csomag, betűtípus, kép, ikon, hang, zene, textúra, dataset, kódminta és generált asset. Saját és AI-generált assetek is külön eredetmezőt kapnak.

### 23.11. `docs/BEFORE_AND_DURING.md`

Két egyértelmű rész:

**A Submission Period előtt létezett:**

- a hibrid játék alapötlete;
- az AGY-KÉZ-SZÍV és Embermérleg termékkoncepció;
- Futura és a Gépváros világának korai elképzelése;
- a *Metropolis* inspiráció;
- esetleges korábbi koncepcióképek vagy CALL-E-terv.

**A Submission Period alatt készült:**

- a WebMCP-specifikus architektúra;
- az öt tool surface és input/output szerződés;
- az emberi kontrollpont technikai védelme;
- a böngészős játékmotor és UI;
- a digitális Embermérleg;
- minden versenyre beadott forráskód és deployment;
- WebMCP-tesztek és evidence;
- angol beadási anyag és videó.

Minden versenyidőszaki elemhez dátumozott commit vagy más egyenértékű bizonyíték tartozik. A mostani koncepciódokumentum és a helyi fájldátum önmagában nem elégséges bizonyíték; a nyilatkozatot korábbi, hiteles forrásokkal kell alátámasztani, ha rendelkezésre állnak.

### 23.12. `docs/AI_USAGE.md`

Eszközönként rögzíti:

- eszköz és szolgáltató;
- pontos modell, ha ismert;
- használat dátuma;
- feladat típusa;
- AI által előállított eredmény rövid leírása;
- mit fogadott el, módosított vagy utasított el az ember;
- mely érdemi döntést hozta meg a projektgazda;
- mely commitokban jelent meg az eredmény;
- milyen pontossági, IP- vagy biztonsági ellenőrzés történt.

Nem kerül bele teljes privát beszélgetés, API-kulcs, személyes adat vagy szükségtelen promptnapló. A cél az emberi szerzőség és felügyelet bizonyítása, nem a teljes chatarchívum publikálása.

## 24. Evidence-struktúra és bizonyítékkezelés

Az implementáció kezdetén tervezett struktúra:

```text
docs/evidence/
├── INDEX.md
├── webmcp-discovery/
├── tool-calls/
│   ├── success/
│   └── expected-failures/
├── human-control/
├── fallback/
├── tests/
├── deployments/
├── repository/
└── submission/
```

### 24.1. Fájlnév-konvenció

```text
YYYY-MM-DD_HHMM_<test-id>_<client>_<result>.<ext>
```

Példa:

```text
2026-08-28_1430_HC-01_codex-desktop_expected-fail.json
```

### 24.2. Evidence minimum

Minden jelentős bizonyítékhoz tartozik:

- rövid leírás az `INDEX.md` fájlban;
- létrehozási dátum és időzóna;
- commit SHA és teszt ID;
- környezetrekord;
- pass/fail értelmezés;
- hivatkozás arra a dokumentumra, amely az állítást használja.

### 24.3. Sikeres és sikertelen WebMCP-hívások

Minden toolhoz legalább:

- egy sikeres discovery- vagy invocation screenshot;
- egy redaktált sikeres strukturált output;
- legalább egy szándékosan kiváltott, elvárt hiba;
- az UI előtti és utáni állapot;
- a kliens, böngésző, modell, verzió és dátum.

Az evidence nem kézzel szerkesztett „szebb” eredmény. A redakció csak titkok és személyes adatok eltávolítására használható, és ezt a fájl fejlécében jelezni kell.

## 25. Verseny előtti és alatti munka bizonyítása

### 25.1. Baseline

A repository első commitja deklarált baseline legyen, például:

```text
docs: record pre-existing concept baseline before implementation
```

Ez a commit:

- tartalmazza a koncepciót vagy annak jogtisztán publikálható változatát;
- nem tartalmaz alkalmazáskódot;
- egyértelműen jelzi, hogy a koncepció korábban létezett;
- megnevezi, hogy a WebMCP-architektúra és megvalósítás a Submission Period alatt készül;
- nem állítja hamisan, hogy maga a commit a verseny előtt készült.

A helyi *Metropolis* PDF nem része a publikus baseline commitnak.

### 25.2. Első versenyidőszaki technikai commit

Külön commit rögzíti a 2026. augusztus 27-én elfogadott WebMCP technikai tervet és dokumentációs stratégiát. Ez már a Submission Period alatti munkához tartozik.

### 25.3. Bizonyítéklánc

```text
pre-existing concept statement
  -> baseline documentation commit
  -> WebMCP spec/architecture commits
  -> first tool discovery evidence
  -> first full human-confirmed round
  -> testing and deployment evidence
  -> submission release tag
```

Git commit timestamp önmagában nem megdönthetetlen bizonyíték. A hitelességet egymást erősítő adatok adják: commit SHA-k, build log, CI-időpontok, deployment log, Devpost-draft, képernyőképek és publikus release.

## 26. Commitstratégia

### 26.1. Alapelvek

- Egy commit egy érthető termék- vagy technikai állítást bizonyítson.
- A commit lehetőleg működő vagy szándékosan dokumentált köztes állapot legyen.
- A teszt ugyanabban a commitban vagy közvetlenül utána kerüljön be, mint az általa védett viselkedés.
- A dokumentáció frissítése együtt érkezzen a viselkedés változásával.
- Sikertelen kísérleteket nem kell minden esetben hibás kódként commitolni, de a build logban és evidence-ben rögzíteni kell.
- Publikálás után nincs indokolatlan `rebase`, history rewrite, force push vagy squash.
- A mérföldkövek külön commitjai megmaradnak a végső történetben.
- Titok, credential, személyes adat vagy nem publikálható forrás soha nem kerül commitba.

### 26.2. Commitüzenet-konvenció

```text
docs: ...
test: ...
feat(domain): ...
feat(ui): ...
feat(webmcp): ...
fix(webmcp): ...
fix(ui): ...
chore: ...
release: ...
```

### 26.3. Javasolt történet

1. `docs: record pre-existing concept baseline before implementation`
2. `docs: add contest-period WebMCP technical and evidence plan`
3. `chore: initialize React TypeScript project and license`
4. `test(domain): define game-state transition expectations`
5. `feat(domain): implement deterministic one-round game engine`
6. `test(control): specify player-agent boundary failures`
7. `feat(ui): add Hungarian selection, reflection and confirmation flow`
8. `feat(webmcp): register read-only state and entry tools`
9. `feat(webmcp): add selected-choice reflection and idempotent consequence reveal`
10. `test(webmcp): capture discovery and negative tool evidence`
11. `feat(fallback): add manual non-WebMCP demo path`
12. `docs: record client matrix, licenses and AI usage`
13. `feat(ui): complete coherent one-round product experience`
14. `chore: deploy public build and document live testing`
15. `docs: prepare English judge guide and submission evidence`
16. `release: freeze WebMCP Challenge submission candidate`

A sorrend iránymutató; valós technikai okból összevonható vagy tovább bontható, de a baseline, WebMCP spike, emberi kontroll, teljes kör, deployment és submission candidate külön mérföldkő marad.

### 26.4. Tagek, reprodukálhatóság és belső freeze

Tervezett tagek:

- `v0.1-webmcp-spike`;
- `v0.2-human-confirmed-round`;
- `v0.3-public-demo`;
- `submission-2026-09-03`.

A végső tag a beadott commit SHA-ra mutat. A taghez tartozó live deployment azonosítható build/deployment ID-t kap.

Az eredményhirdetésig tartó freeze **belső release- és bizonyítási szabály**, nem idézett vagy állított hivatalos versenykövetelmény. A beadás után a submission taggel jelölt branchet/commitot, a hozzá rendelt live deploymentet és a beadási evidence-csomagot nem módosítjuk. További fejlesztés csak külön ágban, forkban vagy egyértelmű másolatban történhet.

A reprodukálhatósági csomag tartalmazza a pontos commit SHA-t és annotált release taget, lockfile-t, runtime- és csomagkezelő-verziót, tiszta telepítési/build parancsokat, environment-változók mintáját titkok nélkül, build/deployment ID-t, valamint a beadott artifact vagy evidence checksumját. A taget nem mozgatjuk és a történetet nem írjuk át.

## 27. Pályázati bizonyítékok kapcsolata a bírálati szempontokkal

### 27.1. WebMCP Leverage

Kiemelt bizonyítékok:

- `docs/WEBMCP_TOOLS.md` teljes tool surface és discovery;
- `docs/HUMAN_CONTROL.md` negatív tesztek;
- tool-call JSON-ok és UI side-effect screenshotok;
- nem triviális állapottartó workflow;
- külön agent/player port és idempotens consequence reveal;
- commitok, amelyekből látszik a WebMCP-megvalósítás fejlődése.

### 27.2. Execution

Kiemelt bizonyítékok:

- működő live URL és publikus repository;
- automata tesztek és manuális kliensmátrix;
- egy teljes, koherens magyar játékkör;
- fallback mód;
- reprodukálható README;
- build log, hibajavító commitok és release tag;
- három percnél rövidebb működő demó.

### 27.3. Potential Impact

Kiemelt bizonyítékok:

- konkrét célközönség és AI-delegálási probléma;
- a játékos saját döntési lenyomata;
- rövid playtest-jegyzőkönyvek és visszajelzések;
- világos állítás arról, mit tesz lehetővé az ember-agent közös oldal;
- nem moralizáló nyereség/ár mechanika.

### 27.4. Creativity & Ambition

Kiemelt bizonyítékok:

- agent mint korlátozott játékmester, nem chatbot;
- az emberi kontrollpont egyszerre mechanika és rendszerkorlát;
- AGY-KÉZ-SZÍV saját, háromirányú döntési rendszer;
- Embermérleg és hibrid társasjáték-jövőkép;
- `ORIGINALITY_AND_SOURCES.md` által bizonyított önálló világ és jogtiszta inspiráció;
- `DECISIONS.md` emberi alkotói és technikai döntései.

## 28. Végső pályázati preflight

### 28.1. Technikai

- [ ] A live URL incognito módban elérhető.
- [ ] ChatGPT in-app browserben vagy Chrome 149+ WebMCP módban felfedezhetők a toolok.
- [ ] Mind az öt tool sikeres és elvárt hibás hívása dokumentált.
- [ ] Az emberi kontrollpont negatív tesztjei sikeresek.
- [ ] A fallback mód működik.
- [ ] A beadott live build commitja egyezik a submission taggel.

### 28.2. Repository

- [ ] Publikus és incognito ablakban látható.
- [ ] Minden szükséges forrás, asset és indítási útmutató benne van.
- [ ] A `LICENSE` teljes és a repository About részében felismerhető.
- [ ] Nincs secret, személyes adat vagy nem publikálható *Metropolis* PDF.
- [ ] A commit history megőrizte a baseline-t és a mérföldköveket.
- [ ] A dokumentációs index minden bizonyítékot elérhetővé tesz.

### 28.3. Videó

- [ ] Nyilvános YouTube URL.
- [ ] Hossza szigorúan 3:00 alatt van.
- [ ] Az első 15 másodpercben működés közben látszik a projekt.
- [ ] Van hang, amely elmondja, mi készült és hogyan használ WebMCP-t.
- [ ] Látszik tool discovery vagy tool invocation és az UI-változás.
- [ ] Látszik az emberi megerősítési kontrollpont.
- [ ] Nincs engedély nélküli zene, védjegy vagy jogvédett vizuális anyag.
- [ ] Az angol narráció/felirat megfelel a nyelvi követelménynek.

### 28.4. Devpost

- [ ] Minden kötelező custom mező kitöltve.
- [ ] Az `App Status` és a before/during leírás konzisztens.
- [ ] A live URL, repo URL és video URL működik.
- [ ] A tesztelt kliensek/modellek mezője a `TESTING.md` adataival egyezik.
- [ ] Az AI tools mező az `AI_USAGE.md` adataival egyezik.
- [ ] A szöveg pontosan megmagyarázza a WebMCP-illeszkedést, UX-előnyt, új ember-agent képességet és implementációt.
- [ ] A submission státusza nem Draft.
- [ ] A végleges oldalt másik böngészőből újraellenőriztük.
- [ ] A szabályforrásokat közvetlenül beadás előtt újraellenőriztük.

### 28.5. Beadás utáni freeze

- [ ] A beadási idő, submission URL, commit SHA, release tag és deployment ID rögzítve.
- [ ] A repository, live site és Devpost-oldal változtatási tilalma feljegyezve.
- [ ] A beadott evidence másolata helyben archiválva.
- [ ] További munka csak elkülönített forkban vagy másolatban történik az eredményhirdetésig.

---

## 29. Hivatalos ellenőrzés során feltárt eltérések

1. A koncepcióban szereplő 2026. szeptember 3. 22:00 GMT+2 határidő összhangban van a hivatalos `2026-09-03T20:00:00Z` időponttal.
2. Az első spike lehet magyar, de a végső beadási anyagnak angolnak kell lennie, vagy teljes angol fordítást kell mellékelni. Forrás: <https://webmcp.devpost.com/rules>, ellenőrizve 2026. augusztus 27-én.
3. A videó kötelező. A Resources/FAQ egyik, videó hiányára utaló mondata ellentmond az Official Rulesnak, a submission requirements leírásának és a `video_required: true` mezőnek. A kötelező, hangos, 3 percnél rövidebb nyilvános YouTube-videó az irányadó.
4. A live URL kötelező annak ellenére, hogy a strukturált deliverable objektum `website_required: false` értéket jelez; ezt külön kötelező custom mező és a szabályszöveg írja elő.
5. A korábban létező koncepció nem kizáró ok. A WebMCP-bővítést a Submission Period kezdete után kell létrehozni és egyértelműen bizonyítani.
6. A beadás utáni, eredményhirdetésig tartó freeze saját release- és bizonyítási szabályunk; nem hivatalos Devpost-követelményként dokumentáljuk.

Ezeket az eltéréseket minden új szabályellenőrzéskor felül kell vizsgálni.
