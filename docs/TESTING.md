# Tesztelés

## Automatizált kapuk

```bash
pnpm test:run
pnpm build
```

A tesztcsomag lefedi a domainátmeneteket, az egyszeri következményalkalmazást, a zárt tool-sémákat, a Player/Agent határt, a regisztrációt és a tool által okozott React UI-változást.

Legutóbbi teljes futás: 2026. augusztus 28. — 4 tesztfájl, 16/16 sikeres teszt; production build sikeres, 58 modul transzformálva.

## Manuális kliensmátrix

| Dátum | Kliens | Böngésző/WebView | Modell | Verzió | Discovery | Hívás | Megjegyzés |
|---|---|---|---|---|---|---|---|
| 2026-08-27 | Codex desktop in-app browser | beágyazott WebView | Codex | környezet által kezelt | WebMCP API nem érhető el | fallback sikeres | teljes manuális kör, 0 konzolhiba |
| 2026-08-28 | Vercel production + `curl` | HTTPS / HTTP/2 | n/a | Vercel CLI 59.6.2 | n/a | n/a | HTTP 200; mindkét előírt header ténylegesen jelen van |
| 2026-08-28 | Codex desktop in-app browser | publikus top-level HTTPS WebView | Codex, pontos modell-ID nem elérhető | 26.818.21641 (6849) | blokkolt: nincs `document.modelContext`, 0 felfedezett Site tool | nem indítható | oldal betölt, fallback aktív, 0 error és 0 warning |
| 2026-08-28 | Google Chrome | localhost top-level dokumentum, explicit testing flagek | n/a, producer-runtime próba | 152.0.7977.65 | sikeres producer-discovery: 5/5 tool | nem történt | a ChatGPT Chrome-oldalsáv hivatalosan nem Site tools kliens; `NO_SESSION` maradt |
| 2026-08-28 | Chrome DevTools `Application → WebMCP` | ugyanaz a flages Chrome-runtime | n/a | 152.0.7977.65 | sikeres: Available Tools 5/5 | `enter_machine_city {}`: `Error` | callback context-kompatibilitási fix automatizáltan igazolt; kézi reteszt és invocation history még szükséges |

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

Az automatizált regressziós teszt ellenőrzi a nyers deltát, az alkalmazott deltát, a mentett mérleget és a narratív költséget; a teljes csomag 13/13 sikeres teszttel futott le. A valós Chrome producer-discovery később 5/5 sikerrel lezárult, a valós runtime invocation ettől függetlenül továbbra is nyitott technikai kapu.

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

A valós Chrome producer-discovery és a valós runtime invocation ezért két külön kapu: az előbbi lezárt, az utóbbi nyitott.

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

A javítás utáni kézi DevTools-újrapróba nincs ebben a checkpointban; ez a következő nyitott tesztlépés.

### Bizonyítottsági státusz

| Réteg | Státusz | Következtetés |
|---|---|---|
| Mock integration | kész | automatizált 5/5 registration/discovery, tool-szerződés, UI-hatás és emberikontroll-invariánsok |
| Real Chrome runtime discovery | kész | a valódi Chrome producer-runtime 5/5 toolt regisztrál és felsorol |
| Real runtime invocation | nyitott | első DevTools-hívás: `Error` a hiányzó második callback-argumentum miatt; minimális javítás és regressziós teszt kész, kézi újrapróba még nincs |

Következő teszt: Chrome DevTools `Application → WebMCP`, az `enter_machine_city {}` javítás utáni kézi újrahívása; csak annak sikere után folytatható az invocation history, az emberi UI-kontrollpont és az idempotens reveal bizonyítása. Részletes evidence: [`evidence/CHROME_RUNTIME_2026-08-28.md`](evidence/CHROME_RUNTIME_2026-08-28.md).

### Hivatalos források

- OpenAI Site tools: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.
