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
- A javítás utáni kézi DevTools-újrapróba ebben a checkpointban nem történt meg.

## Háromszintű státusz

| Bizonyítási szint | Státusz | Mit bizonyít? |
|---|---|---|
| Mock integration | kész | 5/5 regisztráció, `getTools()`-lista, szerződések, állapot- és emberikontroll-invariánsok automatizált környezetben |
| Real Chrome runtime discovery | kész | a valódi Chrome 152 fő dokumentum-runtime-ja 5/5 toolt regisztrál és felsorol |
| Real runtime invocation | nyitott | első DevTools-hívás dokumentálva, de adapterhibával zárult; automatizált fix kész, kézi reteszt és invocation history még nincs |

## Következő technikai kapu

Chrome DevTools: `Application → WebMCP`. Először az `enter_machine_city {}` javítás utáni újrapróbáját kell rögzíteni. Csak siker után következhet a további input/output/status history, az emberi kontroll negatív próbái és az idempotens második reveal.

## Hivatalos források

- OpenAI, Site tools: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome, WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome, Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools, WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.
