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

## Képernyőképes bizonyíték azonosítója

- Eredeti fájlnév: `codex-clipboard-cc71a468-f6ca-4b27-b3e8-bd4b0eec3ed2.png`.
- Felbontás: `2624 × 2136`.
- SHA-256: `02e73add253cd9ced5db63b25f0da5b8ab66429ed0b347c574b1b4631f78a37d`.
- Látható rajta: az alkalmazás 5/5 regisztrált tool státusza, a pontos toolnevek, `NO_SESSION`, valamint a Chrome-oldalsáv „nincs ilyen tool regisztrálva” válasza.

## Háromszintű státusz

| Bizonyítási szint | Státusz | Mit bizonyít? |
|---|---|---|
| Mock integration | kész | 5/5 regisztráció, `getTools()`-lista, szerződések, állapot- és emberikontroll-invariánsok automatizált környezetben |
| Real Chrome runtime discovery | kész | a valódi Chrome 152 fő dokumentum-runtime-ja 5/5 toolt regisztrál és felsorol |
| Real runtime invocation | nyitott | még nincs Chrome DevTools WebMCP-panelből vagy támogatott Site tools kliensből végrehajtott hívás és invocation history |

## Következő technikai kapu

Chrome DevTools: `Application → WebMCP`. Itt kell rögzíteni az Available Tools listát, a manuális hívások inputját, outputját és státuszát, az invocation historyt, az emberi kontroll negatív próbáit és az idempotens második revealt.

## Hivatalos források

- OpenAI, Site tools: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome, WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome, Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools, WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.
