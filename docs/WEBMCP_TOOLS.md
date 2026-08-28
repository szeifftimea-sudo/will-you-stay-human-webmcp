# WebMCP toolok és bizonyítékok

## Tool surface

| Tool | Mutat állapotot? | Fogad döntési értéket? |
|---|---:|---:|
| `enter_machine_city` | igen | nem |
| `present_dilemma` | igen | nem |
| `get_current_game_state` | nem, read-only | nem |
| `present_choice_reflection` | igen | nem; csak opaque selection ID-t |
| `reveal_confirmed_consequence` | igen | nem; csak opaque confirmed decision ID-t |

Minden JSON Schema zárt (`additionalProperties: false`). Egyik inputban sincs `lens`, `choice`, `reasoning` vagy `humanConfirmed`.

## Discovery környezet

- Implementáció: `document.modelContext.registerTool()` imperatív API.
- Az oldal saját státuszmezőben jelzi az öt regisztráció sikerét vagy a fallback módot.
- Automatizált discovery-bizonyíték: a regisztrációs teszt mock `ModelContext` mellett mind az öt definíciót és nevét ellenőrzi.
- Publikus teszt-URL: <https://will-you-stay-human.vercel.app/>.
- Hostingbizonyíték: `HTTP/2 200`, `Origin-Agent-Cluster: ?1`, `Permissions-Policy: tools=(self)` a gyökér HTML-en és a verziózott JS asseten is.
- Publikus Codex WebView-próba: in-app browser `26.818.21641` (`6849`), 2026. augusztus 28.; a kliens nem injektálta a `document.modelContext` API-t, 0/5 discovery, 0 konzolhiba. Ez külön klienskörnyezeti eredmény.
- Valós Chrome producer-próba: Google Chrome `152.0.7977.65`, explicit `WebMCPTesting` és `DevToolsWebMCPSupport` feature-kapcsolók, `http://127.0.0.1:4173/localhost` top-level dokumentum.
- Chrome-eredmény: a fő runtime 5/5 toolt regisztrált és felfedezhetőként felsorolt a pontos stabil nevekkel.
- Playwright-korlát: az izolált read-only világ nem látta a kísérleti `document.modelContext` felületet. Ezt nem használjuk a fő runtime ellenbizonyítékaként, mert ugyanazon dokumentum producer-regisztrációja 5/5 sikeres volt.
- ChatGPT Chrome-oldalsáv: az aktív tabhoz kapcsolódott, de 0 Site toolt jelzett. Az OpenAI termékdokumentációja szerint a Site tools jelenleg nem Chrome-ban, hanem a ChatGPT desktop beépített böngészőjében érhető el.
- Az `enter_machine_city` nem futott le, a fázis `NO_SESSION` maradt. Ez nem alkalmazáshiba és nem sikertelen tool-execution: invocation nem történt.
- Részletes evidence: [`evidence/CHROME_RUNTIME_2026-08-28.md`](evidence/CHROME_RUNTIME_2026-08-28.md).

## Hívási bizonyítékok

| Eset | Eredmény | Bizonyíték |
|---|---|---|
| `enter_machine_city {}` | siker; `MACHINE_CITY_READY` | UI integrációs teszt és helyi fallback próba |
| `present_dilemma` helyes session/revision | siker; aktív dilemma és `AWAITING_HUMAN_SELECTION` együtt | `gameEngine.test.ts`, UI integrációs teszt |
| bármely tool extra `lens` mezővel | `INVALID_INPUT`, állapotváltozás nélkül | `playerAgentBoundary.test.ts` |
| reflexió nem aktuális selection ID-val | `SELECTION_ID_MISMATCH` | `gameEngine.test.ts` |
| reveal megerősítés előtt | `HUMAN_DECISION_REQUIRED` | `gameEngine.test.ts` |
| reveal megerősítés után | siker; `CONSEQUENCE_REVEALED` | domain- és fallback próba |
| ugyanazon reveal retry | `alreadyRevealed: true`; változatlan balance; history hossza 1 | `gameEngine.test.ts` |
| következő `present_dilemma` két elemű tesztkatalógussal | új dilemma ID és `AWAITING_HUMAN_SELECTION` egy commitban | `gameEngine.test.ts` |

Az automatizált ModelContext mock `getTools()` eredménye pontosan az öt stabil toolnevet tartalmazta. Ez regisztrációs/discovery integrációs bizonyíték, nem helyettesíti a valós WebMCP-klienspróbát.

### Bizonyítottsági szintek

| Szint | Státusz | Bizonyított állítás |
|---|---|---|
| Mock integration | kész | 5/5 tool regisztráció és `getTools()`-lista; zárt sémák; állapot-, UI- és emberikontroll-tesztek |
| Real Chrome runtime discovery | kész | Chrome 152 fő runtime: 5/5 regisztrált és felsorolt tool |
| Real runtime invocation | nyitott | még nincs valós WebMCP-hívás, input/output/státusz vagy invocation history |

A „Hívási bizonyítékok” táblázat jelenlegi sikerei mock-, domain-, UI-integrációs vagy fallback-bizonyítékok; egyik sem címkézhető valós Chrome invocationként.

Következő nyitott kapu: Chrome DevTools `Application → WebMCP` panel. Itt kell rögzíteni az Available Tools listát, a sikeres és elvárt sikertelen hívásokat, az invocation historyt, az emberi kontrollpontot és az idempotens második reveal változatlan mérlegét.

## Hivatalos források

- OpenAI Site tools: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.
