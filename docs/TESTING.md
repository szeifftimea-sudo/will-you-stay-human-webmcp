# Tesztelés

## Automatizált kapuk

```bash
pnpm test:run
pnpm build
```

A tesztcsomag lefedi a domainátmeneteket, az egyszeri következményalkalmazást, a zárt tool-sémákat, a Player/Agent határt, a regisztrációt és a tool által okozott React UI-változást.

Legutóbbi teljes futás: 2026. szeptember 17. — 25 tesztfájl, 209/209 sikeres teszt; production build **PASS**; `git diff --check` **PASS**. A build ismert, nem blokkoló Three.js chunk-warningot jelez.

## Manuális kliensmátrix

| Dátum | Kliens | Böngésző/WebView | Modell | Verzió | Discovery | Hívás | Megjegyzés |
|---|---|---|---|---|---|---|---|
| 2026-08-27 | Codex desktop in-app browser | beágyazott WebView | Codex | környezet által kezelt | WebMCP API nem érhető el | fallback sikeres | teljes manuális kör, 0 konzolhiba |
| 2026-08-28 | Vercel production + `curl` | HTTPS / HTTP/2 | n/a | Vercel CLI 59.6.2 | n/a | n/a | HTTP 200; mindkét előírt header ténylegesen jelen van |
| 2026-08-28 | Codex desktop in-app browser | publikus top-level HTTPS WebView | Codex, pontos modell-ID nem elérhető | 26.818.21641 (6849) | blokkolt: nincs `document.modelContext`, 0 felfedezett Site tool | nem indítható | oldal betölt, fallback aktív, 0 error és 0 warning |
| 2026-08-28 | Google Chrome | localhost top-level dokumentum, explicit testing flagek | n/a, producer-runtime próba | 152.0.7977.65 | sikeres producer-discovery: 5/5 tool | nem történt | a ChatGPT Chrome-oldalsáv hivatalosan nem Site tools kliens; `NO_SESSION` maradt |
| 2026-08-28 | Chrome DevTools `Application → WebMCP`, javítás előtt | ugyanaz a flages Chrome-runtime | n/a | 152.0.7977.65 | sikeres: Available Tools 5/5 | `enter_machine_city {}`: `Error` | hiányzó második callback-context; `NO_SESSION` maradt |
| 2026-08-28 | Chrome DevTools `Application → WebMCP`, javítás után | localhost top-level dokumentum, explicit testing flagek | n/a | 152.0.7977.65 | sikeres: Available Tools 5/5 | `enter_machine_city {}`: `Completed`, `ok: true` | látható `MACHINE_CITY_READY`, revision 0; 1 total call, 0 failed |

## Manuális fallback

WebMCP nélküli böngészőben a fallback agentgombokkal ugyanazt a teljes kört kell végigjárni. A játékosi kijelölés, tudomásulvétel és megerősítés továbbra sem agentgomb.

2026. augusztus 27-én ez a próba sikeresen lefutott az AGY ágon `CONSEQUENCE_REVEALED` fázisig. A közvetlen `file://.../index.html` megnyitás nem támogatott; a teszt Vite dev serveren, `http://127.0.0.1:4173/` címen történt.

## Projektgazdai manuális UAT — 2026. augusztus 27.

A WebMCP nélküli fallback felületen végrehajtott teljes manuális elfogadási teszt sikeres volt. A projektgazda az alábbiakat ellenőrizte:

- `NO_SESSION → MACHINE_CITY_READY`, majd a dilemma bemutatása;
- emberi kijelölés és a reflexió előtti megerősítés tiltása;
- SZÍV-specifikus reflexió, majd SZÍV → AGY választásmódosítás;
- a korábbi reflexió érvénytelenítése és az AGY-hoz tartozó új reflexió kötelező bemutatása;
- külön játékosi megtartási lépés és megerősítés üres opcionális indoklással;
- változatlan Embermérleg `DECISION_CONFIRMED` állapotban;
- következményfeltárás külön agentművelettel, pontosan egyszeri mérlegmódosítás és `GAME_COMPLETE`;
- oldalfrissítés utáni állapot- és mérleghelyreállítás.

### UAT-megfigyelés és regressziós elvárás

Az AGY ág költségszövege — „A saját hangod és a generált hang közötti határ elmosódhat.” — kapcsolatbeli hitelességi árat nevez meg, miközben a korábbi delta nem tartalmazott negatív komponenst. A Kapcsolódás tengely azt vizsgálja, mit tett a döntés az emberi kapcsolat valódiságával, ezért a helyesbített AGY-delta:

```text
Kényelem +1, Kontroll +1, Kapcsolódás -1, Szabadság 0, Felelősség 0
```

Az automatizált regressziós teszt ellenőrzi a nyers deltát, az alkalmazott deltát, a mentett mérleget és a narratív költséget; a teljes csomag 13/13 sikeres teszttel futott le. Ennél a korábbi checkpointnál a valós runtime invocation még nyitott kapu volt; ezt a későbbi localhost teljes flow és production smoke lezárta.

## Háromágú tartalmi–egyensúlyi regresszió

A táblavezérelt domainteszt ugyanazt a teljes állapotfolyamot futtatja le AGY, KÉZ és SZÍV választással:

```text
NO_SESSION
→ MACHINE_CITY_READY
→ AWAITING_HUMAN_SELECTION
→ TENTATIVE_SELECTION_RECORDED
→ REFLECTION_PRESENTED
→ READY_FOR_CONFIRMATION
→ DECISION_CONFIRMED
→ CONSEQUENCE_REVEALED
→ GAME_COMPLETE
```

Áganként ellenőrzi:

- a játékosi kijelölés és megerősítés `PLAYER_UI` eredetét, valamint azt, hogy a reflexió megtartása kizárólag a PlayerCommandPorton történik;
- az aktuális `lens`, `selectionId`, `reflectionId` és dilemmaazonosító kapcsolatát;
- a reflexió megtartása előtti megerősítés elutasítását;
- a változatlan nullamérleget `DECISION_CONFIRMED` állapotban;
- a jóváhagyott pontos nyers és alkalmazott deltát;
- a strukturált reflexiós és következménymezők meglétét és a helyes ághoz tartozását, a teljes magyar próza tesztbe másolása nélkül;
- a második reveal-hívás idempotenciáját és az egyszeres outcome-rekordot.

Külön teszt bizonyítja, hogy SZÍV-reflexió után az AGY kijelölése törli a korábbi reflexiót, elutasítja annak megtartását és selection-ID-ját, majd új AGY-reflexiót és új játékosi megtartást követel.

Eredmény: 4 tesztfájl, 15/15 sikeres teszt; a production build 58 modul transzformálásával sikeresen elkészült.

## Publikus deployment ellenőrzése — 2026. augusztus 28.

Kanonikus URL: <https://will-you-stay-human.vercel.app/>

```text
$ curl -I https://will-you-stay-human.vercel.app/
HTTP/2 200
origin-agent-cluster: ?1
permissions-policy: tools=(self)
```

A `dist/assets/index-W3Abx7DZ.js` megfelelő publikus assetútvonalának külön HEAD-próbája szintén `HTTP/2 200` választ és ugyanezt a két headert adta. A Vercel deployment állapota `Ready`, targetje `production`, deployment ID-ja `dpl_8grXnUZ4zYv3C7SocCMmzLvbmKzK`.

### Konzol- és Site tools próba

A publikus URL top-level dokumentumként, HTTPS-en töltődött be a Codex desktop `26.818.21641` (`6849`) beépített böngészőjében. A címsor és az alkalmazás DOM-ja helyes volt; a konzol 0 errort és 0 warningot tartalmazott.

Read-only probe:

```text
protocol: https:
topLevel: true
"modelContext" in document: false
typeof document.modelContext?.registerTool: undefined
typeof document.modelContext?.getTools: undefined
felfedezett várt Site toolok: 0/5
```

Az invocationt nem jelöljük sikertelen toolhívásnak, mert discovery hiányában toolhívás nem volt lehetséges. Ez a jelenlegi kliens/modell/workspace környezet blokkolója; az alkalmazás fallbackje rendben működik, és nem készült kódszintű megkerülés.

Ez a publikus Codex WebView-próba nem írja felül a külön Chrome 152 eredményt. A két kliens képességeit és következtetéseit elkülönítve kell kezelni.

A valós Chrome producer-discovery és a valós runtime invocation két külön kapu volt. Ez a szakasz a korábbi köztes állapotot rögzíti; a későbbi DevTools-próbák mindkettőt lezárták localhoston, majd a production originen külön minimális smoke is sikeres lett.

## Chrome 152 producer-runtime discovery — 2026. augusztus 28.

### Környezet

```text
Google Chrome: 152.0.7977.65
feature flags: WebMCPTesting, DevToolsWebMCPSupport
URL: http://127.0.0.1:4173/localhost
browsing context: top-level localhost document
```

### Eredmény

- A fő dokumentum-runtime 5/5 toolt regisztrált és felfedezhetőként felsorolt, a pontos nevekkel: `enter_machine_city`, `present_dilemma`, `get_current_game_state`, `present_choice_reflection`, `reveal_confirmed_consequence`.
- A UI `NO_SESSION` állapotban volt; a producer-discovery nem módosította a játékállapotot.
- A Playwright izolált végrehajtási világa `document.modelContext`, `registerTool` és `getTools` esetén `undefined` értéket látott. Ez a probe-korlát nem írja felül a fő runtime 5/5 regisztrációs bizonyítékát.
- A ChatGPT Chrome-oldalsáv ugyanazon aktív tab mellett 0 Site toolt jelzett. Az OpenAI dokumentációja szerint a Site tools kliens jelenleg a ChatGPT desktop beépített böngészőjében használható, Chrome-ban nem.
- A ChatGPT-oldalsáv próbájában az `enter_machine_city` nem kapott valós invocationt; a fázis `NO_SESSION` maradt. Ebben a korábbi próbában nem volt tool-execution státusz, mert hívás nem történt.

## Chrome 152 első DevTools-invocation és kompatibilitási regresszió — 2026. augusztus 28.

### Valós runtime-eredmény a javítás előtt

- Kliens: Chrome `152.0.7977.65`, `WebMCPTesting` és `DevToolsWebMCPSupport`, DevTools `Application → WebMCP` panel.
- Az Available Tools lista megjelent az öt stabil toolnévvel.
- Hívás: `enter_machine_city`, input: `{}`.
- Státusz: `Error`.
- Output: `TypeError: Cannot destructure property 'signal' of 'undefined' as it is undefined.`
- Állapot: `NO_SESSION`, változatlan. Más tool nem futott.

Ez valódi Chrome runtime invocation-kísérlet, de nem sikeres end-to-end invocation. A kivétel az adapter callback belépésekor, a domainparancs előtt keletkezett.

### Javítás és automatizált bizonyíték

Az adapter az opcionális második execution-contextet `options?.signal?.aborted` alakban kezeli. A regressziós teszt az `execute({})` egyargumentumos Chrome-formát használja, és igazolja a sikeres `MACHINE_CITY_READY` átmenetet. A már támogatott `AbortSignal`-ellenőrzés megmaradt, a JSON tool-szerződések és az emberi parancshatár nem változtak.

```text
pnpm test:run
Test Files  4 passed (4)
Tests       16 passed (16)

pnpm build
tsc -b && vite build
58 modules transformed
build successful
```

Az adapterfix automatizált checkpointjában még nem történt kézi DevTools-újrapróba; a következő, külön rögzített próbában ez sikeresen lezárult.

### Javítás utáni valós Chrome-reteszt

- Tool/input: `enter_machine_city`, `{}`.
- Státusz/output: `Completed`, `ok: true`.
- Session: `11cd1208-a922-49b6-8b31-1018e701d12c`; `stateRevision: 0`.
- Látható UI-hatás: `NO_SESSION → MACHINE_CITY_READY`.
- Panelösszesítő: 1 total call, 0 failed, 0 canceled, 0 in progress.
- Az Available Tools listában mind az öt stabil toolnév szerepel.
- Más tool és Player UI-művelet nem történt.

Ez sikeres valós Chrome invocation- és UI-hatásbizonyíték az első toolra. A teljes runtime invocation kapu még nem lezárt: a dilemma bemutatása, a negatív kontrolltesztek, a kézi játékosi kontrollpont és az idempotens reveal még hátravan.

### Valós `present_dilemma` hívások

1. Első próba: Chrome-státusz `Completed`, alkalmazásoutput `ok: false`; a Run Tool paraméterképe `sessionId: <empty_string>` értéket mutatott. Az inputot a zárt séma elutasította, a fázis `MACHINE_CITY_READY` maradt.
2. Megismételt, szerződéshelyes próba: `sessionId: 11cd1208-a922-49b6-8b31-1018e701d12c`, `expectedRevision: 0`; `Completed`, `ok: true`, `AWAITING_HUMAN_SELECTION`.

A második próba ugyanabban az átmenetben megjelenítette a „Kérjek bocsánatot helyetted?” dilemmát. A panelösszesítő 3 total call, 0 failed, 0 canceled, 0 in progress lett. Más tool és Player UI-művelet nem történt. A következő read-only állapotlekérdezés fogja külön rögzíteni az aktuális revisiont és publikus állapotot.

### Valós read-only `get_current_game_state`

- Input: `sessionId: 11cd1208-a922-49b6-8b31-1018e701d12c`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: true`, fázis `AWAITING_HUMAN_SELECTION`.
- A DevTools Details nézetben `Flags: readOnly` látható.
- A dilemma és a UI változatlan maradt; az állapotlekérdezés nem hozott létre játékosi eseményt.
- Panelösszesítő: 4 total call, 0 failed, 0 canceled, 0 in progress.
- Két csatolt kép ugyanazt az egy invocationt mutatja eltérő kivágásban.

### Negatív reflexiópróba kijelölés nélkül

- Tool/input: `present_choice_reflection`, helyes session ID, `tentativeSelectionId: fabricated-selection-without-player-ui`, `expectedRevision: 1`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: false`; elvárt domainok: `TENTATIVE_SELECTION_REQUIRED`.
- A fázis `AWAITING_HUMAN_SELECTION` maradt, a UI és a revision nem változott.
- Ez bizonyítja, hogy a tool nem tud kitalált azonosítóval játékosi kijelölést vagy reflexiós szakaszt létrehozni.
- Panelösszesítő: 5 total call, 0 failed, 0 canceled, 0 in progress.

### Reveal emberi megerősítés előtt — két azonos negatív hívás

- Tool/input: `reveal_confirmed_consequence`, helyes session ID, `confirmedDecisionId: fabricated-decision-without-player-confirmation`, `expectedRevision: 1`.
- A hívás felhasználói véletlenből kétszer futott le; ezt két külön invocationként tartjuk nyilván.
- Mindkettő: Chrome `Completed`, alkalmazás `ok: false`, `HUMAN_DECISION_REQUIRED`, változatlan `AWAITING_HUMAN_SELECTION`.
- Nem jött létre megerősített döntés, következmény, mérlegdeltát alkalmazó esemény vagy outcome history-bejegyzés.
- Ez két konzisztens előfeltétel-elutasítás, nem a sikeres reveal idempotenciatesztje.
- Panelösszesítő: 7 total call, 0 failed, 0 canceled, 0 in progress; reveal toolszámláló: 2.

### Pozitív emberi kijelölés a Player UI-ban

- A játékos pontosan egyszer az AGY kártyára kattintott a webes játékfelületen.
- Eredmény: `TENTATIVE_SELECTION_RECORDED`, revision 2, AGY kijelölve.
- Az Embermérleg változatlan; reflexió, megtartás vagy megerősítés nem történt.
- Toolhívás és fallback agentművelet nem történt; a history 7 total call értéken maradt.
- Ez a PlayerCommandPort eredetű kijelölés a következő valódi reflexió szükséges előfeltétele.

### Kijelölés read-only azonosító-ellenőrzése

A `get_current_game_state` valós outputja:

- `phase: TENTATIVE_SELECTION_RECORDED`, `stateRevision: 2`;
- `activeDilemma.id: apology-delegation`;
- `tentativeSelectionId: 3020f571-9e00-4729-8416-dedbbb0b095b`;
- `tentativeLens: brain`;
- `reflectionId: null`, `reflectionAcknowledged: false`;
- `confirmedDecisionId: null`, `confirmedLens: null`;
- minden mérlegtengely 0.

Az output `nextAllowedActions` mezője a `present_choice_reflection` és `get_current_game_state` toolokat jelöli. Más tool és UI-művelet nem történt.

### Valós választásspecifikus reflexió

- `present_choice_reflection` input: helyes session ID, `tentativeSelectionId: 3020f571-9e00-4729-8416-dedbbb0b095b`, `expectedRevision: 2`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: true`, `REFLECTION_PRESENTED`, revision 3.
- Az AGY-specifikus reflexió megjelent a webes UI-ban; a kijelölt ág AGY maradt.
- Az Embermérleg mind az öt tengelyen 0 maradt.
- A history 9 total call / 0 failed; a `present_choice_reflection` toolszámláló 2 a korábbi negatív és a jelen sikeres hívással.
- Más tool és UI-művelet nem történt.

Ez pozitívan bizonyítja, hogy a tool csak a Player UI által létrehozott aktuális selection ID-hoz tudott reflexiót bemutatni. A reflexió megtartása továbbra is külön Player UI-művelet.

### Reflexió megtartása kizárólag Player UI-ban

- A játékos a bemutatott AGY-reflexió után a Player UI megtartási műveletét használta.
- A kizárólagos emberi kontrollpanel és a végleges megerősítő gomb megjelent; tool nem végezte el a megtartást.
- A DevTools history változatlanul 9 total call / 0 failed.
- Végleges döntésmegerősítés nem történt, az opcionális indoklás üres.
- A képi evidence alapján a megtartási kapu teljesült; a következő read-only query rögzíti a `READY_FOR_CONFIRMATION`, revision 4, `reflectionAcknowledged: true` és `confirmedDecisionId: null` mezőket.

### Megtartási állapot read-only igazolása

A valós `get_current_game_state` output rögzíti:

- `READY_FOR_CONFIRMATION`, revision 4;
- aktuális AGY selection ID: `3020f571-9e00-4729-8416-dedbbb0b095b`;
- reflection ID: `5d6a9d7b-d1b9-4a5b-bdfa-6e8bad6695ff`;
- `reflectionAcknowledged: true`;
- `confirmedDecisionId: null`, `confirmedLens: null`;
- minden mérlegtengely 0, completed dilemma nincs.

Ez külön bizonyítja a megtartott reflexiót a végleges megerősítés előtt. A query read-only, ezért nem helyettesítheti a következő emberi döntési eseményt.

### Végleges megerősítés kizárólag Player UI-ban

- A játékos pontosan egyszer kattintott a végleges megerősítő gombra, üres opcionális indoklással.
- A UI szerint az emberi döntés rögzítve van, a következmény még rejtett.
- Az Embermérleg minden tengelyen 0 maradt; reveal nem történt.
- A DevTools history változatlanul 10 total call / 0 failed; tool vagy más UI-művelet nem történt.
- Ez vizuálisan bizonyítja a külön Player UI-megerősítést. A pontos `DECISION_CONFIRMED`, revision 5, `confirmedDecisionId` és `confirmedLens` mezőket a következő read-only query rögzíti.

### `DECISION_CONFIRMED` read-only igazolása

A valós állapotoutput rögzíti:

- `DECISION_CONFIRMED`, revision 5;
- `confirmedDecisionId: 59ac1c7e-b958-440a-9b5e-356085c3d5ec`;
- `confirmedLens: brain`;
- aktuális selection ID és acknowledged reflection ID változatlanul kapcsolódik az AGY ághoz;
- minden mérlegtengely 0;
- `completedDilemmaIds: []`;
- következő engedélyezett tool: `reveal_confirmed_consequence` vagy read-only state query.

Ez a reveal előtti mérlegbaseline és az ember által létrehozott valós decision ID bizonyítéka.

### Első pozitív reveal valós Chrome-runtime-ban

- Input: `sessionId: 11cd1208-a922-49b6-8b31-1018e701d12c`, `confirmedDecisionId: 59ac1c7e-b958-440a-9b5e-356085c3d5ec`, `expectedRevision: 5`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: true`, `CONSEQUENCE_REVEALED`, revision 6.
- A következmény UI-ja megjelent az „egyszer alkalmazva” jelzéssel. A képi bizonyíték a Kényelem `+1` és Kontroll `+1` értéket közvetlenül mutatja; a teljes mérlegvektort és az `alreadyRevealed` mezőt az automatizált regressziós teszt ellenőrzi.
- History: 12 total call, 0 failed, 0 canceled, 0 in progress; reveal toolszámláló 3 = két korábbi negatív próba + egy sikeres alkalmazás.
- A fázis nem ugrott közvetlenül `GAME_COMPLETE` állapotba. Az első sikeres alkalmazás bizonyított; a későbbi két azonos retry változatlan revisiont és UI-t hagyott hátra, az outcome history pontos egyszeriségét az automatizált regressziós teszt bizonyítja.

### Idempotens reveal valós Chrome-runtime-ban

- Az első sikeres reveal azonos inputját két alkalommal ismételték meg: ugyanaz a session ID, confirmed decision ID és `expectedRevision: 5`. A két új invocationt külön history-sor és a reveal toolszámláló `3 → 5` változása igazolja.
- Mindkét Chrome-callback `Completed`, és mindkét alkalmazásoutput `ok: true`; mindkettő `CONSEQUENCE_REVEALED`, revision 6 állapotot hagyott hátra. A total history `12 → 14`, miközben `0 Failed`, `0 Canceled`, `0 In Progress` maradt.
- A következmény UI-ja és a teljes Embermérleg változatlan maradt; a felület továbbra is „egyszer alkalmazva” állapotot jelzett. Ez valós runtime-szinten igazolja, hogy a retryk nem hoztak létre új állapotmutációt vagy második mérleghatást.
- A csatolt képen a `data` objektum összecsukott, ezért az `alreadyRevealed` mező és a képkivágásból kimaradó teljes mérlegvektor nem állítható közvetlen képi bizonyítékként. Ezek pontos mezőszintű invariánsát a meglévő automatizált teszt bizonyítja: `alreadyRevealed: true`, változatlan teljes balance és outcome history hossza 1.
- A véletlen két retryt nem rejtjük el és nem számítjuk egy hívásnak; mindkettő ugyanazt az idempotens eredményt hagyta hátra.

### Bizonyítottsági státusz

| Réteg | Státusz | Következtetés |
|---|---|---|
| Mock integration | kész | automatizált 5/5 registration/discovery, tool-szerződés, UI-hatás és emberikontroll-invariánsok |
| Real Chrome runtime discovery | kész | a valódi Chrome producer-runtime 5/5 toolt regisztrál és felsorol |
| Real runtime invocation | kész localhoston | a teljes invocation-folyam, a Player UI-kontrollpont, az első reveal és két változatlan idempotens retry bizonyított |
| Production Chrome smoke | kész | HTTPS originen 5/5 discovery és három sikeres, szerződéshelyes toolhívás `AWAITING_HUMAN_SELECTION` állapotig |

A localhost valós runtime-kapu lezárult; további kézi hívás nem szükséges. Részletes evidence: [`evidence/CHROME_RUNTIME_2026-08-28.md`](evidence/CHROME_RUNTIME_2026-08-28.md).

## Production Chrome WebMCP smoke — 2026. augusztus 28.

- Forráscommit: `f703e75d6aa71363e1da17a73b44ae5d7438993f`, benne a `913fc1d` adapterjavítással.
- URL: <https://will-you-stay-human.vercel.app/>; HTTPS `HTTP/2 200`.
- Headerek: `Origin-Agent-Cluster: ?1`; `Permissions-Policy: tools=(self)`.
- Live bundle: `assets/index-DZlbAWle.js`; remote és helyi SHA-256: `a88a43ab3827beab26164b9ff71fe45f0c712f12110083327b3d498fad52caa4`.
- Kliens: Chrome `152.0.7977.65`, explicit `WebMCPTesting,DevToolsWebMCPSupport`, DevTools `Application → WebMCP`, production top-level HTTPS origin.
- Discovery: mind az öt tool pontos névvel megjelent; a felsorolásban nincs kijelölési, reflexió-megtartási vagy megerősítési tool.
- `enter_machine_city`: `Completed`, `ok: true`, `MACHINE_CITY_READY`, revision 0; látható UI-változás; 1 total / 0 failed.
- `present_dilemma`: `Completed`, `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1; a dilemma látható; 2 total / 0 failed.
- `get_current_game_state`: `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1; aktív dilemma `apology-delegation`; minden selection/reflection/confirmation mező üres vagy `null`; mérleg 0/0/0/0/0.
- Következtetés: a production producer-regisztráció és a minimális invocation-flow működik. Az agent a smoke végén sem hozott létre választást vagy megerősítést. A teljes localhost flow-t a scope szerint nem ismételtük meg.
- Origin Trial-, token-, alkalmazáskód-, UI-, tartalmi vagy tool-szerződés-módosítás nem történt. A testing flaggel futó production discovery sikeres volt, ezért Origin Trial javaslatára sem volt szükség.
- Ebben a dokumentációs checkpointban automatizált tesztet és buildet nem futtattunk újra: a deployment a tiszta, korábban ellenőrzött commitból készült, a feladat pedig kizárólag a production smoke és annak evidence-rögzítése volt.

### Hivatalos források

- OpenAI Site tools: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.

## Magyar vertical slice P0 regresszió — 2026. augusztus 30.

- A Journey nyitóflow-ja, a dilemma külön bemutatása, az AGY–KÉZ–SZÍV választás, az Ellenpont utáni megtartás vagy visszaválasztás, a végleges emberi megerősítés, a külön következmény és a külön Embermérleg automatizált UI-folyama lefedett.
- A Player UI-visszalépés ugyanazt a meglévő `selectLens` parancsutat használja; nem hoz létre párhuzamos állapotlogikát.
- A végleges megerősítés előtt a visszalépés fókuszolható és látható, utána nem renderelődik.
- A SZÍV consequence külön regressziója mind az öt, domainből érkező értéket ellenőrzi: Kényelem `−1`, Kontroll `+1`, Kapcsolódás `+1`, Szabadság `0`, Felelősség `+2`.
- Az Embermérleg tesztje a hozzáférhető tengelycímkéket olvassa, nem törékeny CSS-pozíciót vagy teljes prózaszöveget rögzít.

## Magyar vertical slice production smoke — 2026. augusztus 30.

- Tesztelt release commit: `b5519a3f2310db96ec678abe11439c64a2c081d8`.
- Production deployment: `dpl_4qWz3hckyDNqZ6W2FVaC84nGonrT`; kanonikus URL: <https://will-you-stay-human.vercel.app/>.
- HTTPS: `HTTP/2 200`; tényleges WebMCP-headerek: `Origin-Agent-Cluster: ?1`, `Permissions-Policy: tools=(self)`.
- Live–local buildazonosság: HTML, `assets/index-XXkxlLEC.js` és `assets/index-CHzBf55-.css` SHA-256 értéke rendre azonos (`548f7a…340f`, `891e80…4406`, `99472f…7b78`).
- Kliens: Chrome `152.0.7977.65`, explicit `WebMCPTesting,DevToolsWebMCPSupport`, DevTools `Application → WebMCP`, top-level production HTTPS dokumentum.
- Discovery: 5/5 stabil toolnév. A surface nem tartalmaz választási, reflexió-megtartási vagy megerősítési toolt.
- `enter_machine_city {}`: `Completed`, `ok: true`, `MACHINE_CITY_READY`, revision 0; látható UI-állapotváltás.
- `present_dilemma` valós sessionnel és `expectedRevision: 0` értékkel: `Completed`, `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1; látható dilemma.
- `get_current_game_state`: `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1; `tentativeSelectionId`, `tentativeLens`, `reflectionId`, `confirmedDecisionId` és `confirmedLens` null; `reflectionAcknowledged: false`; balance 0/0/0/0/0.
- A read-only lekérés után a UI változatlan maradt. Az agent nem hozott létre játékosi kijelölést vagy megerősítést; a smoke az emberi kontrollpontnál véget ért.
- A teljes reveal-flow nem része ennek a production smoke-nak; azt a localhost Chrome-evidence és az automatizált regresszió bizonyítja.
- Részletes környezet, hívások és képi hashlista: [`evidence/PRODUCTION_RELEASE_2026-08-30.md`](evidence/PRODUCTION_RELEASE_2026-08-30.md).

## Aktuális dokumentációs release és production smoke — 2026. szeptember 17.

- Release commit: `c748e973f35ef95871c92723ed2d47bc0c1c7412`.
- Teljes automatizált futás: **25 tesztfájl, 209/209 sikeres teszt**.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- Vercel production deployment: **READY**; kanonikus URL: <https://will-you-stay-human.vercel.app>.
- `/play` és `/product`: `HTTP/2 200`.
- Production headerek: `Origin-Agent-Cluster: ?1`, `Permissions-Policy: tools=(self)`.
- A `machine-city-landing.glb`, `human-balance.glb` és `product-reveal-animated.glb` production útvonalai `HTTP/2 200` választ adtak.
- A live `assets/index-CWDlUfBX.js` bundle SHA-256 értéke megegyezik a lokális `dist/assets/index-CWDlUfBX.js` SHA-256 értékével: `39c958dddb17bf73ed4e432eb0f3463aef68c2395b94342f29a3af85355f1b58`.
- Ez a dokumentációs release nem módosította az alkalmazáslogikát vagy az UI-bundle-t.
- A build ismert, **nem blokkoló** Three.js chunk-warningot jelez: a külön `three.module` chunk körülbelül 631 kB minifikált méretű.

### WebMCP production státusz

- A meglévő Chrome 152 evidence a `WebMCPTesting` és `DevToolsWebMCPSupport` flagekkel 5/5 regisztrált tool discoveryjét igazolja.
- A meglévő production Chrome smoke a publikus HTTPS originen a discoveryt és három, szerződéshelyes toolhívást igazolja: `enter_machine_city`, `present_dilemma`, `get_current_game_state`.
- A teljes ChatGPT in-app browseres agent invocation továbbra sincs teljesen végigbizonyítva: az elérhető Site-tools capability hiánya miatt ugyanabban az in-app browser sessionben a teljes agent → tool → UI folyamat nem zárható le. Ez nyitott bizonyítási korlát, nem sikeres end-to-end állítás.

### Aktuális dokumentációs ellenőrzés

- A `README.md` nem tartalmaz pending deployment/pre-production állítást, `YOUTUBE_DEMO_URL` helyőrzőt vagy elavult hackathon-only pozicionálást.
- A README a lifestyle closure / bedside kísérletet kizárja a launch scope-ból; az nem jelenik meg jóváhagyott launch assetként.

## Production routing és Human Balance CTA-regresszió QA — 2026. szeptember 18.

- Ellenőrzött routing-fix commit: `7ffb58261a046b115a08b921e0ab5edbec10e5d5`.
- A kanonikus játékpresentation a `/play`; a publikus root `/` kliensoldali `history.replaceState` átirányítással `/play`-re kanonikalizál. A `/product` külön product-reveal route marad.
- Friss production-tab QA: a `https://will-you-stay-human.vercel.app/` megnyitása után az URL `/play`-re váltott, és a V2 spatial presentation töltődött be.
- Intermediate Human Balance állapotban a várt CTA-k megjelentek: **`Bring on the next question`** (primary) és **`Explore the tabletop concept`** (secondary).
- A negyedik dilemma utáni, még lezárás előtti mérlegállapotban a várt CTA-k megjelentek: **`End the game`** (primary) és **`Explore the tabletop concept`** (secondary).
- A `GAME_COMPLETE` Human Balance állapotban a várt CTA-k megjelentek: **`Start a new game`** (primary) és **`Explore the tabletop concept`** (secondary).
- Az intermediate Human Balance → `/product?from=human-balance` → `/play?view=human-balance` roundtrip productionben ellenőrizve lett; a session, revision és balance változatlanul megmaradt. A final return útvonal ugyanazt a presentation/state-preservation szerződést használja.
- A közvetlen `/product` route továbbra is elérhető és `HTTP/2 200` választ ad. A routing- és CTA-javítás presentation/navigation szintű volt; domainlogikát, balance-számítást vagy WebMCP-szerződést nem módosított.
