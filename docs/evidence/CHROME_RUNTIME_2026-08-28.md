# Chrome WebMCP producer-runtime evidence — 2026. augusztus 28.

## Vizsgált környezet

- Google Chrome: `152.0.7977.65` (`arm64`-képes universal macOS alkalmazás).
- Indítási kapcsolók: `--enable-features=WebMCPTesting,DevToolsWebMCPSupport`.
- Dokumentum: `http://127.0.0.1:4173/localhost`, top-level localhost oldal.
- Az alkalmazás fázisa a próbán: `NO_SESSION`.

## Bizonyított eredmény

Az alkalmazás fő JavaScript-runtime-ja öt WebMCP-toolt regisztrált, és a saját runtime-státuszában mind az öt nevet felfedezhetőként jelezte:

1. `enter_machine_city`
2. `present_dilemma`
3. `get_current_game_state`
4. `present_choice_reflection`
5. `reveal_confirmed_consequence`

Ez **real Chrome producer-runtime discovery** bizonyíték. Nem mock, és nem sikeres end-to-end invocation.

## Elkülönített negatív eredmény

A Playwright read-only probe izolált végrehajtási világa `document.modelContext`, `registerTool` és `getTools` esetén `undefined` értéket látott, miközben ugyanazon dokumentum fő runtime-ja sikeresen regisztrálta és felsorolta az öt toolt. Emiatt az izolált probe ebben a környezetben nem használható a fő dokumentum WebMCP API-jának elérhetőségi döntőbizonyítékaként.

A rögzített ChatGPT Chrome-oldalsáv az aktuális tabhoz kapcsolódott, de nem talált Site toolt. Az OpenAI aktuális termékdokumentációja szerint a Site tools kliens jelenleg a ChatGPT desktop beépített böngészőjében érhető el, Chrome-ban nem. Következésképpen:

- az `enter_machine_city` nem kapott invocationt;
- az alkalmazás `NO_SESSION` állapotban maradt;
- ez nem alkalmazáshiba és nem sikertelen tool-execution, mert toolhívás nem történt;
- a `/localhost` útvonal nem magyarázza az eltérést: ugyanazon a top-level dokumentumon a producer-regisztráció 5/5 sikeres volt.

## Képernyőképes bizonyítékok azonosítói

1. `codex-clipboard-cc71a468-f6ca-4b27-b3e8-bd4b0eec3ed2.png`; `2624 × 2136`; SHA-256: `02e73add253cd9ced5db63b25f0da5b8ab66429ed0b347c574b1b4631f78a37d`. Látható rajta az alkalmazás 5/5 regisztrált tool státusza, a pontos toolnevek, `NO_SESSION`, valamint a Chrome-oldalsáv „nincs ilyen tool regisztrálva” válasza.
2. `codex-clipboard-ec8dcb94-e6a9-4ff8-b219-7af91d733ebe.png`; `1936 × 2220`; SHA-256: `8d69aadd009b86c6f69734c9af3e9a52e24fc6b0a57ca2aa82af8532495df07b`. Látható rajta a Chrome DevTools `Application → WebMCP` panel és az Available Tools lista; a kép készítésekor még egy tool sem futott.
3. `codex-clipboard-7b615eda-7ec7-4962-9209-3217741d8b6e.png`; `3420 × 2146`; SHA-256: `000d86393e10b1df7e448b94d882b4e163a220d34399294c4a7ab450414c2973`. Látható rajta az öt Available Tool, a `Completed` `enter_machine_city` hívás `ok: true` outputja, a `MACHINE_CITY_READY` UI, revision 0, valamint az 1 total call / 0 failed panelösszesítő.
4. `codex-clipboard-5de96abf-05cb-42f8-818e-23656ab1078d.png`; `3644 × 2220`; SHA-256: `c6f19aee95358b8a11618bff2932ca90f985333aa3fba8f9b95fb3e6378ee022`. Látható rajta az első `present_dilemma` hívás Chrome `Completed`, alkalmazás `ok: false` eredménye, a Run Tool panel üres sessionmezője, a változatlan `MACHINE_CITY_READY` állapot és a 2 total call / 0 failed összesítő.
5. `codex-clipboard-c30c0503-d7a6-4d59-be53-a125bed605e7.png`; `1936 × 2224`; SHA-256: `448d86ae247cb12e65b5d1b74b9bec83e5d4c87d63122006034c902e28708a43`. Látható rajta a szerződéshelyes `present_dilemma` input, az `ok: true` output, az `AWAITING_HUMAN_SELECTION` UI, a látható dilemma és a 3 total call / 0 failed összesítő.
6. `codex-clipboard-44acdd4a-6742-4617-b0db-9e6182287b01.png`; `1936 × 2220`; SHA-256: `ac26adcc6c8e1c5c13f8929d9ef8809ce958f3a136f5cda608382f7d367c60c4`. A read-only `get_current_game_state` `ok: true` outputját, a `readOnly` flaget, a változatlan UI-t és a 4 total call / 0 failed összesítőt mutatja.
7. `codex-clipboard-9fe575ce-70b7-42d0-aa88-57f72e722769.png`; `3644 × 2220`; SHA-256: `cd1b29abc28463991f1ab4367c520d0e7b181d5d268b6e64e1e726520616edfb`. Ugyanennek az egy read-only invocationnek a szélesebb nézete, a négy history-sorral, `ok: true` outputtal és változatlan `AWAITING_HUMAN_SELECTION` UI-val.
8. `codex-clipboard-7dc0c802-130b-47a9-b701-5656b1acac43.png`; `3644 × 2220`; SHA-256: `d8d284891ccfbebfaa40a3880f0975076595af92a79aa41c925473cc0577f4fb`. Látható rajta a `present_choice_reflection` kitalált selection ID-s inputja, az alkalmazás `ok: false` outputja, a változatlan `AWAITING_HUMAN_SELECTION` UI és az 5 total call / 0 failed összesítő.
9. `codex-clipboard-711deda5-23fd-4925-a0ba-bf99b02816b2.png`; `3644 × 2220`; SHA-256: `61bb1b8f43e97bebbe2307fad134d177fb7100494ce3fa5c661338c942b31b6b`. Látható rajta a kétszer lefutott `reveal_confirmed_consequence` két history-sora, a hamis decision ID-s input, az alkalmazás `ok: false` outputja, a változatlan `AWAITING_HUMAN_SELECTION` UI, a 7 total call / 0 failed összesítő és a reveal toolszámláló 2.
10. `codex-clipboard-8d37f4f5-a571-4f7f-a7d9-6f0fb89059c3.png`; `3420 × 2146`; SHA-256: `a604ee2dd4629bd47f846fa6096bb7a90d86c69d8d27fceeb0e8040ccf3bcbb4`. Látható rajta az AGY kizárólagos Player UI-kijelölése, a `TENTATIVE_SELECTION_RECORDED` fázis, revision 2, a változatlan öttengelyes Embermérleg és a 7 total call értéken maradt DevTools history.
11. `codex-clipboard-dc194eef-73b6-4606-b2a2-4a68db4c1441.png`; `3644 × 2220`; SHA-256: `213eb7f1fef06e58179a6bcc87720c9a33b3130f415a0ba54fda52460f94497d`. Látható rajta a sikeres `present_choice_reflection` input és `ok: true` output, `REFLECTION_PRESENTED`, revision 3, az AGY-specifikus reflexiós UI, a változatlan mérleg és a 9 total call / 0 failed összesítő.
12. `codex-clipboard-11c4c651-db9e-4199-b4c8-b8ab46ce7e7a.png`; `3644 × 2220`; SHA-256: `7f9db26a4fe3a51077737189af36bb1d7dcd550ede696ad84d1183bca9d8873e`. Látható rajta az AGY-reflexió részletes UI-ja, a kizárólagos emberi kontrollpanel, az üres opcionális indoklás és a megjelent végleges megerősítő gomb; a DevTools history változatlanul 9 total call.
13. `codex-clipboard-71ce1ffe-5a91-4a88-8eb0-90e6f5aedc34.png`; `3644 × 2220`; SHA-256: `06d686958c0aae5b4af3a434b83e1fa47c2df5c91495e1398f8b75dbd2000962`. Látható rajta az „Emberi döntés rögzítve” és „A következmény még rejtve van” UI, a változatlan nullamérleg és a 10 total call / 0 failed DevTools history.
14. `codex-clipboard-8735d54f-9fcd-4ae7-b3c5-9afcdb4693cf.png`; `3644 × 2220`; SHA-256: `3b46ccdf5fe64545aa2b1ecd27ad8f0634c452fd9ea743b4948afed475f19d01`. Látható rajta az első sikeres `reveal_confirmed_consequence` inputja és `ok: true` outputja, `CONSEQUENCE_REVEALED`, revision 6, a feltárt következmény „egyszer alkalmazva” UI-ja, a képkivágáson közvetlenül látható Kényelem `+1` és Kontroll `+1`, valamint a 12 total call / 0 failed history. A teljes mérlegvektor alsó tengelyei nem férnek rá a képkivágásra.
15. `codex-clipboard-f8592a3e-b5fa-43c4-8269-796fa68715fc.png`; `3644 × 2220`; SHA-256: `06974c5191604da8f119ab15625276920f7888a8261544157355f089154931fd`. Két további azonos reveal-retry utáni állapot: 14 total call / 0 failed, reveal toolszámláló 5. Mindkét hívás `Completed` és `ok: true`; mindkettő után `CONSEQUENCE_REVEALED`, revision 6, változatlan UI és teljes Embermérleg maradt. A képen közvetlenül a legutóbbi output, az „egyszer alkalmazva” UI, valamint a Kényelem `+1` és Kontroll `+1` látható. A `data` objektum összecsukott, ezért az `alreadyRevealed` mező nem olvasható közvetlenül a képen.

## Első valós DevTools-invocation

- Tool: `enter_machine_city`.
- Input: `{}`.
- Chrome-státusz: `Error`.
- Pontos output: `TypeError: Cannot destructure property 'signal' of 'undefined' as it is undefined.`
- UI/domainállapot utána: `NO_SESSION`, változatlan.
- Más toolhívás: nem történt.

A hívás bizonyítja, hogy a DevTools panel elérte a regisztrált producer callbacket, de nem bizonyít sikeres end-to-end invocationt. A kivétel még a domainhandler előtt keletkezett: az adapter `execute(input, { signal })` alakja kötelezően destrukturálta a hiányzó második argumentumot.

## Minimális kompatibilitási javítás

- Az `execute` második execution-context argumentuma és azon belül a `signal` opcionális lett.
- Az adapter mind az `execute(input)`, mind az `execute(input, { signal })` hívásformát kezeli.
- A regressziós teszt az egyargumentumos Chrome-formával sikeres `MACHINE_CITY_READY` eredményt igazol.
- Teljes automatizált eredmény: 4/4 tesztfájl, 16/16 teszt sikeres; production build sikeres, 58 modul transzformálva.
- Nem változott a toolnév, az inputséma, az outputstruktúra, a domain, a UI, a tartalom vagy az emberi kontrollpont.
- Az adapterfix commitjának automatizált checkpointjában még nem történt kézi DevTools-újrapróba; a következő, külön rögzített próbában ez sikeresen lezárult.

## Javítás utáni sikeres valós invocation

- Tool: `enter_machine_city`.
- Input: `{}`.
- Chrome-státusz: `Completed`.
- Output: `ok: true`, `phase: MACHINE_CITY_READY`, `stateRevision: 0`.
- Session ID: `11cd1208-a922-49b6-8b31-1018e701d12c`.
- Látható UI-átmenet: `NO_SESSION → MACHINE_CITY_READY`.
- Invocation history összesítő: 1 total call, 0 failed, 0 canceled, 0 in progress.
- Available Tools: 5/5, a korábban rögzített stabil nevekkel.
- Más toolhívás és Player UI-művelet nem történt.

Az eredmény sikeres valós Chrome invocationt és tool által okozott látható UI-állapotváltozást bizonyít. A korábbi `Error` rekord megmarad: a hibás első próba, a célzott adapterfix és a sikeres reteszt együtt alkotja a kompatibilitási bizonyítási láncot.

## Valós `present_dilemma` bizonyítás

Az első próbában a Chrome callback `Completed` státusszal tért vissza, de az alkalmazás `ok: false` eredményt adott, mert a Run Tool paraméterképe szerint a `sessionId` üres stringként érkezett. A zárt bemeneti séma állapotváltozás nélkül utasította el; a UI `MACHINE_CITY_READY` maradt.

A megismételt hívás tényleges inputja:

```json
{"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","expectedRevision":0}
```

Eredmény: Chrome `Completed`, alkalmazás `ok: true`, fázis `AWAITING_HUMAN_SELECTION`, a dilemma látható. A panel 3 total call / 0 failed értéket mutatott. Más tool és Player UI-művelet nem történt.

## Valós read-only állapotlekérdezés

- Tool: `get_current_game_state` (`readOnly`).
- Input: `{"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c"}`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: true`, fázis `AWAITING_HUMAN_SELECTION`.
- UI-hatás: nincs; az aktív dilemma látható maradt.
- Invocation history: 4 total call, 0 failed, 0 canceled, 0 in progress.
- A két evidence-kép ugyanazt az egy hívást mutatja; más tool és Player UI-művelet nem történt.

## Negatív reflexiópróba Player UI-kijelölés nélkül

- Tool: `present_choice_reflection`.
- Input: `{"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","tentativeSelectionId":"fabricated-selection-without-player-ui","expectedRevision":1}`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: false`; a domain nem talált Player UI által létrehozott aktuális kijelölést (`TENTATIVE_SELECTION_REQUIRED`).
- Fázis/UI: változatlan `AWAITING_HUMAN_SELECTION`; reflexiós állapot nem jött létre.
- Invocation history: 5 total call, 0 failed, 0 canceled, 0 in progress.

## Negatív reveal emberi megerősítés előtt — kétszer futott

- Tool: `reveal_confirmed_consequence`.
- Azonos input mindkét hívásnál: `{"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","confirmedDecisionId":"fabricated-decision-without-player-confirmation","expectedRevision":1}`.
- A hívás véletlenül kétszer futott; mindkét invocation külön history-sor.
- Mindkettő: Chrome `Completed`, alkalmazás `ok: false`, `HUMAN_DECISION_REQUIRED`.
- Fázis/UI: változatlan `AWAITING_HUMAN_SELECTION`; Player UI-művelet nem történt.
- Hatás: nincs megerősített döntés, nincs mérlegváltozás, nincs consequence vagy outcome history.
- Invocation history: 7 total call, 0 failed, 0 canceled, 0 in progress; reveal tool számláló 2.
- Minősítés: két konzisztens negatív előfeltétel-próba, nem idempotens sikeres reveal.

## Kizárólagos Player UI-kijelölés

- Esemény: a játékos pontosan egyszer az AGY irányt jelölte ki a webes UI-ban.
- Provenance: Player UI; WebMCP-tool és fallback agentművelet nem történt.
- Átmenet: `AWAITING_HUMAN_SELECTION → TENTATIVE_SELECTION_RECORDED`.
- Revision: 2.
- Embermérleg: mind az öt tengely változatlan 0.
- Invocation history: változatlanul 7 total call.
- Reflexió, megtartás és végleges megerősítés nem történt.

## Player UI-kijelölés read-only runtime-outputja

Forrás: a projektgazda által a DevTools outputból változtatás nélkül átadott strukturált eredmény.

```json
{"ok":true,"tool":"get_current_game_state","schemaVersion":1,"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","phase":"TENTATIVE_SELECTION_RECORDED","stateRevision":2,"data":{"activeDilemma":{"id":"apology-delegation","title":"Kérjek bocsánatot helyetted?"},"tentativeSelectionId":"3020f571-9e00-4729-8416-dedbbb0b095b","tentativeLens":"brain","reflectionId":null,"reflectionAcknowledged":false,"confirmedDecisionId":null,"confirmedLens":null,"balance":{"comfort":0,"control":0,"connection":0,"freedom":0,"responsibility":0},"completedDilemmaIds":[]},"nextAllowedActions":["present_choice_reflection","get_current_game_state"]}
```

Következtetés: az aktuális opaque ID revision 2-höz, az `apology-delegation` dilemmához és az AGY ághoz tartozik. Még nincs reflexió vagy megerősített döntés, és a mérleg változatlan. Más tool és UI-művelet nem történt.

## Valódi AGY-reflexió

- Tool/input: `present_choice_reflection`, a bizonyított aktuális AGY selection ID és `expectedRevision: 2`.
- Eredmény: Chrome `Completed`, alkalmazás `ok: true`, `REFLECTION_PRESENTED`, revision 3.
- UI: az AGY választáshoz tartozó ellenpont/reflexió láthatóvá vált; a kijelölés nem változott.
- Embermérleg: mind az öt tengely 0.
- Invocation history: 9 total call, 0 failed, 0 canceled, 0 in progress; reflection toolszámláló 2.
- Más tool és UI-művelet nem történt.

Ez a korábbi kitalált ID-s `ok: false` próbával együtt bizonyítja, hogy Futura nem indíthat reflexiót nem létező kijelölésre, de az aktuális Player UI-selection ID-hoz bemutathatja a helyes AGY-reflexiót.

## Reflexió megtartása a Player UI-ban

- A játékos a bemutatott AGY-reflexió után a webes UI megtartási műveletét használta.
- A képen megjelent a „Kizárólag emberi kontrollpont” véglegesítési panel és a végleges megerősítő gomb.
- A DevTools invocation history 9 total call értéken maradt; tool nem tartotta meg a reflexiót.
- Az opcionális indoklás üres, végleges megerősítés még nem történt.
- A képkivágás a fázis/revision fejlécet nem tartalmazza; a következő read-only output fogja ezeket és a `reflectionAcknowledged` értéket rögzíteni.

## Megtartott reflexió strukturált read-only outputja

Forrás: a projektgazda által a DevTools outputból változtatás nélkül átadott strukturált eredmény.

```json
{"ok":true,"tool":"get_current_game_state","schemaVersion":1,"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","phase":"READY_FOR_CONFIRMATION","stateRevision":4,"data":{"activeDilemma":{"id":"apology-delegation","title":"Kérjek bocsánatot helyetted?"},"tentativeSelectionId":"3020f571-9e00-4729-8416-dedbbb0b095b","tentativeLens":"brain","reflectionId":"5d6a9d7b-d1b9-4a5b-bdfa-6e8bad6695ff","reflectionAcknowledged":true,"confirmedDecisionId":null,"confirmedLens":null,"balance":{"comfort":0,"control":0,"connection":0,"freedom":0,"responsibility":0},"completedDilemmaIds":[]},"nextAllowedActions":["get_current_game_state"]}
```

Következtetés: a Player UI-ban megtartott AGY-reflexió revision 4 állapotban van, de végleges döntés még nincs. A mérleg és a completed dilemma lista változatlan; a read-only tool nem erősített meg döntést.

## Végleges Player UI-megerősítés, reveal előtt

- A játékos pontosan egyszer, kizárólag a webes UI-ban véglegesen megerősítette az AGY döntést.
- Opcionális indoklás: üres.
- UI: „Emberi döntés rögzítve”; „A következmény még rejtve van”.
- Embermérleg: minden tengely 0.
- DevTools history: változatlan 10 total call / 0 failed; tool nem erősítette meg a döntést.
- Reveal, következményalkalmazás és más UI-művelet nem történt.
- A képkivágás nem mutatja a fázis/revision fejlécet; a következő read-only output ellenőrzi a `DECISION_CONFIRMED`, revision 5 és a valós `confirmedDecisionId` mezőket.

## `DECISION_CONFIRMED` strukturált baseline reveal előtt

Forrás: a projektgazda által a DevTools outputból változtatás nélkül átadott strukturált eredmény.

```json
{"ok":true,"tool":"get_current_game_state","schemaVersion":1,"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","phase":"DECISION_CONFIRMED","stateRevision":5,"data":{"activeDilemma":{"id":"apology-delegation","title":"Kérjek bocsánatot helyetted?"},"tentativeSelectionId":"3020f571-9e00-4729-8416-dedbbb0b095b","tentativeLens":"brain","reflectionId":"5d6a9d7b-d1b9-4a5b-bdfa-6e8bad6695ff","reflectionAcknowledged":true,"confirmedDecisionId":"59ac1c7e-b958-440a-9b5e-356085c3d5ec","confirmedLens":"brain","balance":{"comfort":0,"control":0,"connection":0,"freedom":0,"responsibility":0},"completedDilemmaIds":[]},"nextAllowedActions":["reveal_confirmed_consequence","get_current_game_state"]}
```

Következtetés: a végleges AGY döntést kizárólag a Player UI hozta létre, és a reveal előtt sem mérlegváltozás, sem completed dilemma nincs. A valós decision ID most már biztonságosan használható a reveal toolban.

## Első sikeres valós következményfeltárás

- Tool: `reveal_confirmed_consequence`.
- Input: `{"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","confirmedDecisionId":"59ac1c7e-b958-440a-9b5e-356085c3d5ec","expectedRevision":5}`.
- Eredmény: Chrome `Completed`; alkalmazás `ok: true`; `CONSEQUENCE_REVEALED`; revision 6.
- UI: a következmény, nyereség és ár megjelent; a státusz „Következmény feltárva · egyszer alkalmazva”. A képkivágáson a Kényelem `+1` és Kontroll `+1` közvetlenül látható. A teljes AGY-vektor alsó tengelyeit és változatlanságát az idempotens retry outputja fogja lezárni.
- Invocation history: 12 total call, 0 failed, 0 canceled, 0 in progress. Reveal toolszámláló: 3; ebből két korábbi `ok: false` előfeltétel-próba és ez az egyetlen sikeres alkalmazás.
- `nextAllowedActions`: `present_dilemma`, `get_current_game_state`; az állapotgép külön `CONSEQUENCE_REVEALED` állapotban maradt, nem lépett közvetlenül `GAME_COMPLETE` állapotba.

Ez bizonyítja a valós Chrome invocation sikerét, a tool látható UI-hatását és a mérleghatás első alkalmazását. A következő szakasz rögzíti a két idempotens retryt; a teljes mérleg és az outcome history pontos mezőszintű invariánsát az automatizált teszt bizonyítja.

## Idempotens valós reveal-retry

Az első sikeres requestet változatlanul kétszer hívták meg újra:

```json
{"sessionId":"11cd1208-a922-49b6-8b31-1018e701d12c","confirmedDecisionId":"59ac1c7e-b958-440a-9b5e-356085c3d5ec","expectedRevision":5}
```

- A total history 12-ről 14-re, a reveal toolszámláló 3-ról 5-re nőtt: ez két retryt bizonyít. Mindkét új Chrome-callback `Completed`, mindkét alkalmazásoutput `ok: true`; a panel továbbra is 0 failed, 0 canceled, 0 in progress.
- Mindkét retry `phase: CONSEQUENCE_REVEALED`, `stateRevision: 6` állapotot hagyott hátra. Az eredeti expected revision 5 ellenére nem történt revision-emelés.
- A consequence UI, az „egyszer alkalmazva” jelzés és a teljes Embermérleg változatlan maradt; a képen közvetlenül a Kényelem `+1` és Kontroll `+1` érték látható.
- Következtetés: a két azonos retry nem hozott létre új állapotmutációt és nem alkalmazott második látható hatást.
- Korlát: a képen a `data` objektum összecsukott, ezért az `alreadyRevealed` mező, a teljes öttengelyes balance és az outcome history hossza nem olvasható közvetlenül. Ezeket nem állítjuk képi bizonyítéknak; a meglévő automatizált regressziós teszt külön igazolja az `alreadyRevealed: true`, változatlan teljes balance és history-hossz 1 invariánst.

A kézi próba véletlenül két retryt tartalmazott. A rekord ezt változtatás nélkül megőrzi; mindkettő ugyanabban a revision 6 állapotban hagyta a játékot.

## Háromszintű státusz

| Bizonyítási szint | Státusz | Mit bizonyít? |
|---|---|---|
| Mock integration | kész | 5/5 regisztráció, `getTools()`-lista, szerződések, állapot- és emberikontroll-invariánsok automatizált környezetben |
| Real Chrome runtime discovery | kész | a valódi Chrome 152 fő dokumentum-runtime-ja 5/5 toolt regisztrál és felsorol |
| Real runtime invocation | kész localhoston | teljes agent–Player UI-folyam, negatív kontrolltesztek, pozitív reveal és két változatlan idempotens retry |
| Production Chrome smoke | kész | publikus HTTPS originen 5/5 discovery és három sikeres hívás `AWAITING_HUMAN_SELECTION` állapotig |

## Production redeployment és smoke evidence

### Deployment-azonosság

- Tesztelt forráscommit: `f703e75d6aa71363e1da17a73b44ae5d7438993f`; tartalmazott kompatibilitási fix: `913fc1d`.
- Vercel deployment ID: `dpl_9PhN9iuQVJNpxgh11KAWTD6Ff138`; target `production`; állapot `Ready`; időpont 2026. augusztus 28. 22:47:30 CEST.
- Kanonikus publikus URL: <https://will-you-stay-human.vercel.app/>; `HTTP/2 200`.
- Tényleges response headerek: `Origin-Agent-Cluster: ?1`; `Permissions-Policy: tools=(self)`.
- Live asset: `assets/index-DZlbAWle.js`. A helyi és letöltött asset SHA-256 értéke egyaránt `a88a43ab3827beab26164b9ff71fe45f0c712f12110083327b3d498fad52caa4`. A bundle-ben jelen van az opcionális második contexttel kompatibilis callbackalak.

### Production discovery és invocation

- Google Chrome `152.0.7977.65`; igazolt főfolyamat-kapcsolók: `--enable-features=WebMCPTesting,DevToolsWebMCPSupport`.
- Top-level production HTTPS dokumentum; Chrome DevTools `Application → WebMCP` panel.
- Available Tools: `enter_machine_city`, `get_current_game_state`, `present_choice_reflection`, `present_dilemma`, `reveal_confirmed_consequence` — 5/5.
- A listában nincs játékosi kijelölési, reflexió-megtartási vagy végleges megerősítési tool.
- `enter_machine_city {}`: `Completed`, `ok: true`, `MACHINE_CITY_READY`, revision 0, session `010cd149-86f5-459b-a6e3-3188e4de6e9b`; látható UI-váltás; 1 total / 0 failed.
- `present_dilemma` ugyanezzel a sessionnel és `expectedRevision: 0` bemenettel: `Completed`, `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1; a dilemma látható; 2 total / 0 failed.
- `get_current_game_state` ugyanezzel a sessionnel: `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1; aktív dilemma `apology-delegation`; `tentativeSelectionId`, `tentativeLens`, `reflectionId`, `confirmedDecisionId` és `confirmedLens` null; `reflectionAcknowledged: false`; balance 0/0/0/0/0.
- A read-only output közvetlen strukturált evidence-ként került átadásra; ehhez külön képernyőkép nem készült. A hívás nem módosította a UI-t és nem hozott létre játékosi döntést.
- A smoke scope itt véget ért. A teljes emberikontroll- és idempotenciafolyamot nem ismételtük meg productionön; azt a fenti localhost Chrome-flow és a regressziós tesztek bizonyítják.

### Production képi evidence

1. `codex-clipboard-02295da9-44ff-498f-9754-5e77e40017c3.png`; `3644 × 2218`; SHA-256: `4db8b24dd3fd44326b9cc58d6e9bef9c65077bc31596bc55b389926674d4ce8f`. Production URL, `NO_SESSION`, 5/5 Available Tools, még üres Tool Activity.
2. `codex-clipboard-1e663fc8-a5f8-4520-99b4-dc6e9fcfea04.png`; `3644 × 2218`; SHA-256: `02fef4e8907fd1bbf6378eedf084e41591ba647928baed9cff3cef9df2c4c87b`. `enter_machine_city` `Completed`, `ok: true`, `MACHINE_CITY_READY`, revision 0, 1 total / 0 failed és látható UI-váltás.
3. `codex-clipboard-f9a6ad59-6747-4100-a69e-f0f1210b5b3f.png`; `3644 × 2218`; SHA-256: `2b1626c04e3ee0c92b151ce55d0ca7139d4215db86d363b4f56a1dd22ba6885c`. `present_dilemma` `Completed`, `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1, 2 total / 0 failed és látható dilemma.

Origin Trial-regisztráció, token, további hostingkonfiguráció vagy alkalmazáskód-módosítás nem történt. A testing flaggel futó production-origin discovery sikeres volt, ezért Origin Trial nem vált szükségessé ehhez a bizonyításhoz.

## Technikai kapu eredménye

A localhost teljes Chrome DevTools WebMCP discovery- és invocation-kapu, valamint a production 5/5 discovery és minimális smoke-kapu lezárult. A Codex/ChatGPT desktop Site tools kliensoldali elérhetősége továbbra is külön környezeti kérdés; nem írja felül a Chrome producer- és invocation-bizonyítékot.

## Hivatalos források

- OpenAI, Site tools: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome, WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome, Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools, WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.
