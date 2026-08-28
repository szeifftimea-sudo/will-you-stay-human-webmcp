# Build log

## 2026. augusztus 27. — technikai spike indulása

- Munkakönyvtár: `/Users/szeifftimea/Documents/Ember_Maradsz_WebMCP_Koncepcio`
- Operációs környezet: macOS, Europe/Budapest időzóna.
- Codex csomagolt Node.js: `v24.19.0`.
- Codex csomagolt pnpm: `11.19.0`.
- Codex csomagolt Git: `2.53.0`.
- Induló fájlok: koncepció (`.md`), elfogadott technikai terv 0.3 (`.md`), helyi inspirációs PDF.
- Az induláskor nem volt Git-repository, alkalmazáskód, `package.json` vagy lockfile.
- A helyi *Metropolis* PDF a `.gitignore` része; nem publikálható projektasset.
- Első baseline commit: a megvalósítás előtt létező koncepció külön rögzítve.

### Ellenőrzési forrás

- WebMCP Community Group Draft: <https://webmachinelearning.github.io/webmcp/>, ellenőrizve 2026. augusztus 27-én.
- Chrome Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 27-én.

## Spike-eredmények

### Függőségek és build

- `pnpm install --prefer-offline --ignore-scripts`: sikeres; 213 csomag feloldva, 163 csomag telepítve.
- Első `pnpm build`: környezeti hiba, mert a csomagolt pnpm gyermekfolyamata nem találta a `node` binárist a PATH-on.
- Javítás: a csomagolt Node könyvtára explicit bekerült a build/test PATH-ba; az indításnál közvetlenül a csomagolt Node futtatja a Vite entrypointot.
- Production build: sikeres; 58 modul transzformálva, JS bundle 274,41 kB (gzip 81,89 kB), CSS 3,85 kB (gzip 1,50 kB).
- A `pnpm licenses list --prod --json` a helyi pnpm store hiányzó package-indexére hibázott (`ERR_PNPM_MISSING_PACKAGE_INDEX_FILE`). A közvetlen függőségek licenceit ezért a telepített csomagok saját `package.json` fájljaiból ellenőriztük; eredmény: React/React DOM/Zod/Vite/Vitest/Testing Library MIT, TypeScript Apache-2.0.

### Automatizált tesztek

- Futás: 2026. augusztus 27.
- Vitest: `v3.2.4`, jsdom környezet.
- Legutóbbi eredmény: 4 tesztfájl, 15 teszt, 15 sikeres, 0 sikertelen.
- Lefedett kapuk: állapotgép, többdilemmás `present_dilemma` atomi bemutatás, reflexiós kontroll, egyszeri reveal, zárt tool-sémák, külön portok, öt tool regisztráció/discovery mockban és tool által kiváltott React UI-változás.

### Helyi böngészős fallback próba

- Környezet: Codex in-app browser, `http://127.0.0.1:4173/`, 2026. augusztus 27.
- A WebMCP API ebben a környezetben nem volt elérhető; a UI helyesen manuális fallbackre váltott.
- Ellenőrzött fázisok: `NO_SESSION → MACHINE_CITY_READY → AWAITING_HUMAN_SELECTION → TENTATIVE_SELECTION_RECORDED → REFLECTION_PRESENTED → READY_FOR_CONFIRMATION → DECISION_CONFIRMED → CONSEQUENCE_REVEALED`.
- Megerősítő gomb kijelölés és reflexió közben nem volt jelen; csak játékosi megtartás után jelent meg.
- A reveal után a következmény láthatóvá vált, az AGY tesztágban a Kényelem `+1` értékre módosult.
- Böngészőkonzol: 0 error, 0 warning.

### Projektgazdai manuális UAT és tartalmi korrekció

- Futás: 2026. augusztus 27., WebMCP nélküli fallback felület.
- Eredmény: a teljes egyszemélyes játékkör sikeres volt a munkamenet létrehozásától a `GAME_COMPLETE` állapotig.
- Ellenőrizve: dilemma bemutatása; emberi kijelölés; reflexió előtti megerősítés tiltása; SZÍV-specifikus reflexió; SZÍV → AGY módosítás; a régi reflexió érvénytelenítése; új AGY-reflexió kikényszerítése; külön megtartási lépés; üres opcionális indoklással végzett megerősítés; változatlan mérleg `DECISION_CONFIRMED` állapotban; külön agentművelettel végzett feltárás; egyszeri mérlegmódosítás; `GAME_COMPLETE`; valamint frissítés utáni állapot- és mérleghelyreállítás.
- Megfigyelés: az AGY következménye megnevezte a saját és a generált hang közötti határ elmosódását, de ezt a mérleg korábban nem jelenítette meg negatív változásként.
- Döntés: az AGY nyers hatása `connection: -1` értékkel egészült ki. Ez a Kapcsolódás tengely definíciójával konzisztens, mert az az emberi kapcsolat valódiságára gyakorolt hatást vizsgálja; a módosítás nem teszi az AGY irányt automatikusan helytelenné, a Kényelem `+1` és Kontroll `+1` nyeresége megmarad.
- Regressziós bizonyíték: célzott domainteszt ellenőrzi a teljes nyers és alkalmazott deltát, a mentett mérleget és a hozzá tartozó narratív árat.
- Újraellenőrzés: a teljes Vitest-csomag 4 tesztfájlban 13/13 sikeres teszttel zárult; a production build 58 modul transzformálásával sikeresen elkészült.

### Háromágú tartalmi–egyensúlyi korrekció

- Futás: 2026. augusztus 27.
- Az AGY számai változatlanok; a másodlagos következmény konkrétabban nevezi meg a saját és generált mondatok későbbi megkülönböztetésének nehézségét.
- A KÉZ számai változatlanok; a Szabadság `+1` értéket most a felszabaduló idő és mentális kapacitás, valamint az eszkalációt csökkentő gyors, higgadt üzenet támasztja alá. A reflexió nem feltételez eltitkolt automatizálást.
- A SZÍV új deltája: Kényelem `−1`, Kontroll `+1`, Kapcsolódás `+1`, Szabadság `−1`, Felelősség `+1`. A Kapcsolódás a gesztus közvetlenségét jelenti; a szöveg külön rögzíti, hogy ez nem garantál helyreállított kapcsolatot.
- Az alkalmazás nem számol és nem jelenít meg összpontszámot; a három vektor nem erkölcsi rangsor.
- Tartalomverzió: dilemma `spike-2`, katalógus `hu-spike-2`. A korábbi verziójú perzisztált sessiont a meglévő kompatibilitási ellenőrzés nem folytatja az új következményekkel.
- Regresszió: táblavezérelt AGY–KÉZ–SZÍV teljes folyamat, pontos delták, strukturált tartalomkapcsolat, emberi kontroll és idempotens reveal; külön SZÍV → AGY reflexióérvénytelenítési teszt.
- Teljes ellenőrzés: 4 tesztfájl, 15/15 sikeres teszt; production build sikeres, 58 modul, JS bundle 274,79 kB (gzip 82,01 kB), CSS 3,85 kB (gzip 1,50 kB).

## 2026. augusztus 27–28. — Vercel deployment és valódi klienspróba

### Környezet és verziók

- Tesztelt alkalmazáskód-baseline: `38f007dce7a2464266b3181d66f27364003aee12` (`fix(content): balance all apology dilemma branches`).
- Vercel account: `szeifftimea-sudo`; scope: `szeifftimea-projects`; projekt: `will-you-stay-human`.
- Helyi Vercel CLI: `59.6.2`, Node.js `24.19.0`; távoli build CLI: `59.3.0`; távoli pnpm: `11.19.0`.
- Klienspróba: Codex desktop in-app browser `26.818.21641` (`6849`), macOS `26.6.2` (`25G83`), Europe/Budapest.
- Modellazonosító: a kliens nem teszi elérhetővé; a mérésben `Codex / környezet által kezelt` értékkel szerepel.

### Verziózott hostingkonfiguráció

- `vercel.json`: Vite framework, `pnpm build`, `dist` output.
- Minden útvonalra explicit `Origin-Agent-Cluster: ?1` és `Permissions-Policy: tools=(self)` fejléc.
- SPA rewrite nincs: a jelenlegi alkalmazás nem használ kliensoldali routert vagy mélylinkelt route-ot.
- `.vercel/` és a Vercel által létrehozott helyi `.env.local` nincs verziózva.

### Első, sikertelen production deployment

- Időpont: 2026. augusztus 27. 23:56 CEST.
- Inspector: <https://vercel.com/szeifftimea-projects/will-you-stay-human/WBLs2rLPAwjuc3jXDLJ4j8Kfd3ty>.
- Deployment URL: `https://will-you-stay-human-fukcohz3a-szeifftimea-projects.vercel.app`.
- Eredmény: sikertelen; a távoli `pnpm install` `ERR_PNPM_IGNORED_BUILDS` hibával állt meg az `esbuild@0.25.12` nem jóváhagyott postinstall scriptjénél. Az alkalmazás buildje nem indult el.
- A hiba nem lett elrejtve vagy sikeres deploymentként dokumentálva.

### Célzott javítás és helyi ellenőrzés

A jóváhagyott, teljes allowlist:

```yaml
allowBuilds:
  esbuild: true
```

- Más dependency build script nincs engedélyezve; `dangerouslyAllowAllBuilds` nincs használva.
- `CI=true pnpm install --frozen-lockfile --prefer-offline`: sikeres; a lockfile megfelelt a supply-chain szabályoknak.
- Teljes Vitest-futás: 4 tesztfájl, 15/15 sikeres teszt, 0 sikertelen.
- Production build: sikeres; 58 modul, JS `274,79 kB` (gzip `82,01 kB`), CSS `3,85 kB` (gzip `1,50 kB`).

### Javított production deployment

- Időpont: 2026. augusztus 28. 00:02 CEST.
- Deployment ID: `dpl_8grXnUZ4zYv3C7SocCMmzLvbmKzK`; target: `production`; állapot: `Ready`.
- Inspector: <https://vercel.com/szeifftimea-projects/will-you-stay-human/8grXnUZ4zYv3C7SocCMmzLvbmKzK>.
- Egyedi deployment URL: <https://will-you-stay-human-kzky2xqgf-szeifftimea-projects.vercel.app/>.
- Kanonikus publikus URL: <https://will-you-stay-human.vercel.app/>.
- A távoli log igazolja, hogy kizárólag az `esbuild@0.25.12` postinstall futott le, majd a `tsc -b && vite build` sikeresen befejeződött.

### HTTP- és fejlécbizonyíték

```text
$ curl -I https://will-you-stay-human.vercel.app/
HTTP/2 200
origin-agent-cluster: ?1
permissions-policy: tools=(self)
```

A verziózott JS asset külön `curl -I` próbája szintén `HTTP/2 200`, `Origin-Agent-Cluster: ?1` és `Permissions-Policy: tools=(self)` eredményt adott. Ez bizonyítja, hogy a wildcard fejlécszabály nem csak a gyökér HTML-re érvényes.

### Publikus top-level Site tools discovery

- URL: <https://will-you-stay-human.vercel.app/>; protokoll: `https:`; origin: `https://will-you-stay-human.vercel.app`; top-level dokumentum: igen.
- Az oldal címe helyesen betöltött; konzol: 0 error, 0 warning.
- `"modelContext" in document`: `false`; `registerTool`: `undefined`; `getTools`: `undefined`.
- Az UI helyesen ezt jelezte: „A WebMCP API nem érhető el; manuális agentmód aktív.”
- Az öt várt Site tool közül egy sem jelent meg a kliens tool-metadatái között, ezért valódi invocation nem volt indítható.
- Minősítés: környezeti/kliensoldali blokkoló, nem alkalmazáshiba. Alkalmazáskódos kerülőmegoldás nem készült.
- Ez a mérés továbbra is a Codex desktop beépített böngészőjének eredménye; a későbbi Chrome 152 producer-runtime discovery ettől elkülönített bizonyíték.

### Chrome 152 valós producer-runtime discovery

- Dátum: 2026. augusztus 28.
- Google Chrome: `152.0.7977.65`; a futó főfolyamat parancssorában igazolt feature-kapcsolók: `WebMCPTesting`, `DevToolsWebMCPSupport`.
- Tesztoldal: `http://127.0.0.1:4173/localhost`, top-level localhost dokumentum.
- Az alkalmazás fő runtime-ja 5/5 WebMCP-toolt regisztrált és felfedezhetőként felsorolt:
  - `enter_machine_city`;
  - `present_dilemma`;
  - `get_current_game_state`;
  - `present_choice_reflection`;
  - `reveal_confirmed_consequence`.
- Ez valós Chrome producer-discovery, nem mock és nem end-to-end invocation.
- A Playwright read-only probe izolált világa ugyanakkor nem látta a kísérleti `document.modelContext` felületet. Mivel a fő runtime ugyanazon a dokumentumon bizonyítottan regisztrálta az öt toolt, az izolált probe `undefined` eredménye nem minősíthető a fő dokumentum API-hiányának vagy alkalmazáshibának.
- A ChatGPT Chrome-oldalsáv az aktív tab mellett nyitva volt, de 0 Site toolt jelzett. Az OpenAI aktuális dokumentációja szerint a Site tools jelenleg a desktop alkalmazás beépített böngészőjében érhető el, Chrome-ban nem; ezért az oldalsáv nem megfelelő invocation-kliens ehhez a teszthez.
- A ChatGPT-oldalsáv próbájában az `enter_machine_city` nem futott le, a fázis `NO_SESSION` maradt. Ezt a korábbi oldalsáv-próbát nem jelöljük tool-executionnek, mert invocation nem történt.
- Részletes evidence-rekord és képhash: [`evidence/CHROME_RUNTIME_2026-08-28.md`](evidence/CHROME_RUNTIME_2026-08-28.md).

### Chrome DevTools első valós invocation és adapterjavítás

- A Chrome DevTools `Application → WebMCP` panel Available Tools listája megjelent, és az öt regisztrált toolt felsorolta. A képernyőkép azonosítója és SHA-256 értéke az evidence-rekordban szerepel.
- Az első valós DevTools-hívás az `enter_machine_city` toolt üres `{}` inputtal elérte, de `Error` státusszal zárult. Pontos output: `TypeError: Cannot destructure property 'signal' of 'undefined' as it is undefined.`
- A hiba a domainhandler előtt keletkezett, ezért az alkalmazás helyesen `NO_SESSION` állapotban maradt; más tool nem futott.
- Ok: az adapter `execute(input, { signal })` alakban kötelezően destrukturálta a második execution-context argumentumot, a Chrome 152 DevTools runtime viszont ennél a hívásnál csak az inputot adta át.
- Minimális javítás: az execution context és azon belül a `signal` opcionális. Ha a runtime ad `AbortSignal`-t, az abort-ellenőrzés változatlanul érvényes; az input JSON Schema, a toolnevek, a portok és az emberi kontroll nem változott.
- Új regressziós teszt közvetlenül `execute({})` formában hívja az `enter_machine_city` definíciót, és `MACHINE_CITY_READY` eredményt vár.
- Teljes ellenőrzés: 4 tesztfájl, 16/16 sikeres teszt; production build: 58 modul, sikeres.
- Az adapterfix commitjának lezárásakor a kézi DevTools-újrapróba még szándékosan nem történt meg; a következő, külön rögzített próbában ez sikeresen lezárult.

### Chrome DevTools sikeres újrapróba a javítás után

- Környezet: Chrome `152.0.7977.65`, explicit `WebMCPTesting` és `DevToolsWebMCPSupport`, `http://127.0.0.1:4173/` top-level dokumentum.
- Az Available Tools lista mind az öt stabil toolnevet tartalmazta.
- Hívás: `enter_machine_city`, input: `{}`; státusz: `Completed`; output: `ok: true`.
- Eredmény: látható `NO_SESSION → MACHINE_CITY_READY` UI-átmenet, `stateRevision: 0`, session ID: `11cd1208-a922-49b6-8b31-1018e701d12c`.
- Invocation history: `1 Total calls`, `0 Failed`, `0 Canceled`, `0 In Progress`.
- Ez lezárja a hiányzó execution-contextre készült adapterfix kézi Chrome-retesztjét. Más tool és Player UI-művelet nem futott.
- Evidence-kép fájlneve, mérete és SHA-256 értéke a részletes Chrome-rekordban szerepel.

### Valós dilemmabemutatás

- Az első `present_dilemma` próbát a Chrome callback `Completed` státusszal lezárta, de az alkalmazás `ok: false` eredményt adott: a Run Tool paraméterképe szerint a `sessionId` üres stringként jutott a zárt bemeneti sémához. A fázis helyesen `MACHINE_CITY_READY` maradt.
- A szerződéshelyes, megismételt hívás tényleges inputja: `sessionId: 11cd1208-a922-49b6-8b31-1018e701d12c`, `expectedRevision: 0`.
- Eredmény: `Completed`, `ok: true`, `AWAITING_HUMAN_SELECTION`; a „Kérjek bocsánatot helyetted?” dilemma ugyanabban az állapotváltásban láthatóvá vált.
- A panel ezután `3 Total calls`, `0 Failed`, `0 Canceled`, `0 In Progress` értéket mutatott. A `0 Failed` Chrome-callback státusz, ezért nem törli a korábbi alkalmazásszintű `ok: false` rekordot.
- Más tool és Player UI-művelet nem történt.

### Valós read-only állapotlekérdezés

- Tool/input: `get_current_game_state`, `sessionId: 11cd1208-a922-49b6-8b31-1018e701d12c`.
- Eredmény: `Completed`, `ok: true`, fázis `AWAITING_HUMAN_SELECTION`.
- A DevTools a toolt `readOnly` flaggel jelölte; az aktív dilemma és a UI változatlan maradt.
- Invocation history: `4 Total calls`, `0 Failed`, `0 Canceled`, `0 In Progress`.
- Ugyanerről az egy hívásról két, eltérő kivágású evidence-kép készült; ezek nem jelentenek két invocationt.
- Más tool és Player UI-művelet nem történt.

### Negatív reflexiópróba Player UI-kijelölés nélkül

- Tool: `present_choice_reflection`.
- Input: a helyes session ID, `fabricated-selection-without-player-ui` kitalált `tentativeSelectionId`, `expectedRevision: 1`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: false`; a domain elutasította a reflexiót, mert nincs Player UI által létrehozott aktuális kijelölés.
- A fázis változatlanul `AWAITING_HUMAN_SELECTION`; az agent nem hozott létre kijelölést vagy reflexiós állapotot.
- Invocation history: `5 Total calls`, `0 Failed`, `0 Canceled`, `0 In Progress`. A Chrome `0 Failed` számláló nem írja felül az alkalmazás strukturált negatív eredményét.
- Más tool és Player UI-művelet nem történt.

### Megerősítés előtti reveal-negatív próba — véletlenül kétszer

- Tool: `reveal_confirmed_consequence`.
- Mindkét hívás azonos inputot kapott: helyes session ID, `fabricated-decision-without-player-confirmation` kitalált `confirmedDecisionId`, `expectedRevision: 1`.
- Mindkét Chrome-hívás `Completed`, mindkét alkalmazásoutput `ok: false`; a domain emberileg megerősített döntés hiányában elutasította a feltárást (`HUMAN_DECISION_REQUIRED`).
- A fázis és UI mindkét alkalommal változatlan `AWAITING_HUMAN_SELECTION`; mérleghatás és outcome history nem jött létre.
- A véletlen duplázást nem idempotens sikerpróbaként minősítjük: egyik hívás sem teljesítette a reveal előfeltételeit és egyik sem alkalmazott hatást.
- Invocation history: `7 Total calls`, `0 Failed`, `0 Canceled`, `0 In Progress`; a reveal tool számlálója 2.
- Játékosi UI-művelet nem történt.

### Első pozitív Player UI-kontrollpont

- A játékos pontosan egyszer, kizárólag a webes UI-ban kijelölte az AGY irányt.
- Átmenet: `AWAITING_HUMAN_SELECTION → TENTATIVE_SELECTION_RECORDED`; revision: `1 → 2`.
- Az Embermérleg mind az öt tengelye változatlan 0 maradt.
- A kijelölést nem WebMCP-tool, fallback agentgomb vagy automatizálás hozta létre; a DevTools invocation history 7 total call értéken maradt.
- Más UI-elemre nem történt kattintás, reflexió még nem jelent meg.

### Player UI-kijelölés read-only visszaolvasása

- A következő `get_current_game_state` hívás `Completed`, `ok: true` eredményt adott.
- Fázis/revision: `TENTATIVE_SELECTION_RECORDED`, revision 2.
- Aktív dilemma: `apology-delegation`; `tentativeLens: brain`; aktuális `tentativeSelectionId: 3020f571-9e00-4729-8416-dedbbb0b095b`.
- `reflectionId: null`, `reflectionAcknowledged: false`, `confirmedDecisionId: null`, `confirmedLens: null`.
- Az Embermérleg mind az öt tengelye 0; `completedDilemmaIds` üres.
- Ez bizonyítja, hogy a reflexió tool következő inputja egy tényleges, kizárólag Player UI által létrehozott aktuális kijelöléshez kapcsolható.
- Más tool és UI-művelet nem történt.

### Valódi AGY-specifikus reflexió

- Tool: `present_choice_reflection`; input: a helyes session ID, az aktuális `3020f571-9e00-4729-8416-dedbbb0b095b` selection ID és `expectedRevision: 2`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: true`, `REFLECTION_PRESENTED`, revision 3.
- A webes UI-ban az AGY választáshoz tartozó reflexiós tartalom jelent meg; a tool nem módosította a játékos kijelölését.
- Az Embermérleg változatlanul mind az öt tengelyen 0.
- Invocation history: `9 Total calls`, `0 Failed`, `0 Canceled`, `0 In Progress`; a reflection tool számlálója 2, amelyből egy korábbi negatív és ez az egy sikeres hívás.
- Más tool és UI-művelet nem történt.

### Reflexió emberi megtartása

- A játékos a bemutatott AGY-reflexió után kizárólag a webes Player UI megtartási műveletét használta.
- A UI-ban megjelent a „Kizárólag emberi kontrollpont” végleges megerősítési panel és a „Döntésem végleges megerősítése” gomb.
- A DevTools invocation history változatlanul 9 total call; agenttool nem tartotta meg a reflexiót.
- A képkivágás nem mutatja a fejléc fázis/revision mezőit, ezért a `READY_FOR_CONFIRMATION` és revision 4 pontos runtime-rögzítése a következő read-only állapotlekérés feladata.
- Végleges megerősítés még nem történt; az opcionális indoklás üres.

### Megtartott reflexió read-only igazolása

- A `get_current_game_state` valós outputja `READY_FOR_CONFIRMATION`, revision 4 állapotot adott.
- Aktuális selection: `3020f571-9e00-4729-8416-dedbbb0b095b`, AGY; reflexió: `5d6a9d7b-d1b9-4a5b-bdfa-6e8bad6695ff`.
- `reflectionAcknowledged: true`, miközben `confirmedDecisionId: null` és `confirmedLens: null`.
- Az Embermérleg mind az öt tengelyen 0, a completed dilemma lista üres.
- Ez bizonyítja, hogy a reflexió megtartása és a végleges döntés két külön Player UI-esemény; a read-only tool egyik eseményt sem hozta létre.

### Végleges döntés kizárólag Player UI-ban

- A játékos pontosan egyszer, kizárólag a webes Player UI-ban kattintott a „Döntésem végleges megerősítése” gombra; az opcionális indoklás üres maradt.
- A UI „Emberi döntés rögzítve” és „A következmény még rejtve van” állapotot mutatott.
- Az Embermérleg mind az öt tengelyen 0; reveal és következményalkalmazás még nem történt.
- A DevTools history 10 total call / 0 failed értéken maradt; nincs választási, reflexió-megtartási vagy megerősítési WebMCP-tool.
- Más UI-elemet és toolt nem használtak.
- A képkivágás a fázis/revision fejlécet nem tartalmazza; a következő read-only query feladata a `DECISION_CONFIRMED`, revision 5 és az új `confirmedDecisionId` pontos ellenőrzése.

### Megerősített döntés read-only igazolása reveal előtt

- A `get_current_game_state` valós outputja: `DECISION_CONFIRMED`, revision 5.
- `confirmedDecisionId: 59ac1c7e-b958-440a-9b5e-356085c3d5ec`, `confirmedLens: brain`.
- A döntés ugyanahhoz az AGY selection ID-hoz és acknowledged reflection ID-hoz kapcsolódik; `reflectionAcknowledged: true`.
- Az Embermérleg mind az öt tengelyen 0, `completedDilemmaIds` üres; a következmény még nem került alkalmazásra.
- `nextAllowedActions`: `reveal_confirmed_consequence`, `get_current_game_state`.
- Ez bizonyítja, hogy a megerősítés önmagában nem változtat mérleget, és a reveal csak a Player UI által létrehozott valós döntésazonosítóval folytatható.

### Első sikeres következményfeltárás

- A `reveal_confirmed_consequence` valós Chrome DevTools-hívása az ember által létrehozott `59ac1c7e-b958-440a-9b5e-356085c3d5ec` decision ID-val és `expectedRevision: 5` értékkel `Completed`, alkalmazásszinten `ok: true` eredményt adott.
- Átmenet: `DECISION_CONFIRMED → CONSEQUENCE_REVEALED`; revision: `5 → 6`.
- A UI láthatóvá tette a következményt és a „Következmény feltárva · egyszer alkalmazva” jelzést. A képen a Kényelem `+1` és Kontroll `+1` tengely látható; a későbbi idempotens retryk változatlan revisiont és látható UI-t igazoltak, a teljes AGY-deltavektort pedig az automatizált regressziós teszt ellenőrzi.
- A panel `12 Total calls`, `0 Failed`, `0 Canceled`, `0 In Progress` értéket mutatott; a reveal toolszámláló 3, amelyből kettő korábbi negatív előfeltétel-próba, egy pedig ez az első sikeres reveal.
- `nextAllowedActions`: `present_dilemma`, `get_current_game_state`. A külön `CONSEQUENCE_REVEALED` állapot bizonyított; `GAME_COMPLETE` átmenet nem történt.
- Evidence: `codex-clipboard-8735d54f-9fcd-4ae7-b3c5-9afcdb4693cf.png`, `3644 × 2220`, SHA-256: `3b46ccdf5fe64545aa2b1ecd27ad8f0634c452fd9ea743b4948afed475f19d01`.

### Idempotens reveal-retry — két változatlan újrahívás

- Az eredeti sikeres requestet változatlan `sessionId`, `confirmedDecisionId` és `expectedRevision: 5` bemenettel a kézi DevTools-próba során kétszer hívták meg újra. Ezt transzparensen két retryként tartjuk nyilván, nem egyként.
- A history 12-ről 14 total callra, a reveal toolszámláló 3-ról 5-re nőtt; mindkét új Chrome-callback `Completed`, mindkét alkalmazásoutput `ok: true`, a panel pedig továbbra is `0 Failed`, `0 Canceled`, `0 In Progress` értéket mutatott.
- Mindkét retry után `CONSEQUENCE_REVEALED`, revision 6 maradt. A revision nem nőtt, a UI és a teljes Embermérleg változatlan maradt; a csatolt képen közvetlenül a Kényelem `+1` és Kontroll `+1` tengely látható.
- A képi runtime-evidence ezzel igazolja, hogy a két retry nem alkalmazott új hatást. A teljes AGY-vektor és az outcome history pontos egyszerisége az automatizált regressziós tesztben továbbra is külön, teljes mezőszintű invariánsként bizonyított.
- Evidence: `codex-clipboard-f8592a3e-b5fa-43c4-8269-796fa68715fc.png`, `3644 × 2220`, SHA-256: `06974c5191604da8f119ab15625276920f7888a8261544157355f089154931fd`.

### Bizonyítási checkpoint

| Szint | Státusz |
|---|---|
| Mock integration | kész: 5/5 tool, szerződés-, állapot- és emberikontroll-tesztek |
| Real Chrome runtime discovery | kész: 5/5 producer-regisztráció és névlista Chrome 152-ben |
| Real runtime invocation | kész localhoston: teljes agent–Player UI-folyam, negatív kontrollpróbák, pozitív reveal és két változatlan idempotens retry bizonyított |
| Production Chrome smoke | kész: publikus HTTPS originen 5/5 discovery és `enter_machine_city → present_dilemma → get_current_game_state` sikeres |

A localhost Chrome DevTools invocation-kapu lezárult. További toolhívás nem szükséges; Origin Trial-, alkalmazáskód-, tartalmi vagy tool-szerződés-módosítás nem történt.

### Production redeployment és minimális Chrome WebMCP smoke

- Tesztelt forráscommit: `f703e75d6aa71363e1da17a73b44ae5d7438993f`; ez tartalmazza a `913fc1d` Chrome-kompatibilitási javítást.
- Vercel production deployment: `dpl_9PhN9iuQVJNpxgh11KAWTD6Ff138`; állapot `Ready`; létrehozva 2026. augusztus 28-án 22:47:30 CEST.
- Nyilvános, zsűri által használható URL: <https://will-you-stay-human.vercel.app/>. A deployment egyedi, Vercel-védelemmel ellátott URL-je nem a publikus tesztcím.
- A kanonikus URL `HTTP/2 200` választ adott. Tényleges headerek: `Origin-Agent-Cluster: ?1`, `Permissions-Policy: tools=(self)`.
- A live HTML az `assets/index-DZlbAWle.js` bundle-t szolgálta ki. A helyi, commitból épített és a publikus bundle SHA-256 értéke azonos: `a88a43ab3827beab26164b9ff71fe45f0c712f12110083327b3d498fad52caa4`. A bundle az opcionális második execution-contextet kezelő `execute(input, options)` adapterjavítást tartalmazza.
- Böngésző: Google Chrome `152.0.7977.65`; a főfolyamatban explicit `WebMCPTesting,DevToolsWebMCPSupport` feature-kapcsolók; top-level production HTTPS dokumentum.
- A DevTools `Application → WebMCP` panel a production originen mind az öt pontos toolnevet felsorolta. Origin Trial-regisztráció, token vagy további konfigurációmódosítás nem kellett ehhez a flages teszthez.
- `enter_machine_city`: Chrome `Completed`, alkalmazás `ok: true`; látható `NO_SESSION → MACHINE_CITY_READY`, revision 0; 1 total call / 0 failed.
- `present_dilemma`: Chrome `Completed`, alkalmazás `ok: true`; látható dilemma és `AWAITING_HUMAN_SELECTION`, revision 1; 2 total call / 0 failed.
- `get_current_game_state`: alkalmazás `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1. `tentativeSelectionId`, `tentativeLens`, `reflectionId`, `confirmedDecisionId` és `confirmedLens` mind `null`; a mérleg mind az öt tengelye 0. A read-only hívás nem hozott létre játékosi választást.
- A production smoke itt szándékosan megállt. A tool surface továbbra sem tartalmaz kijelölési, reflexió-megtartási vagy végleges megerősítési toolt; az agent nem választhat a játékos helyett. A teljes emberikontroll- és idempotenciafolyamot a korábbi localhost Chrome-evidence és az automatizált regresszió bizonyítja, azt productionön nem ismételtük meg.
- Részletes fájlnevek, képméretek és SHA-256 értékek: [`evidence/CHROME_RUNTIME_2026-08-28.md`](evidence/CHROME_RUNTIME_2026-08-28.md).

### Ellenőrzött források

- Vercel `vercel.json` és headers: <https://vercel.com/docs/project-configuration/vercel-json>, ellenőrizve 2026. augusztus 28-án.
- pnpm `strictDepBuilds` és `allowBuilds`: <https://pnpm.io/settings/build>, ellenőrizve 2026. augusztus 28-án.
- OpenAI Site tools útmutató: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome WebMCP Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.
