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
- A ChatGPT-oldalsáv próbájában az `enter_machine_city` nem futott le, a fázis `NO_SESSION` maradt. Ez a korábbi eredmény nem tool-execution: invocation nem történt.
- A Chrome DevTools `Application → WebMCP` panel később elérte az `enter_machine_city` `execute` callbackjét, de a javítás előtti adapter `Error` státuszt adott, mert kötelezően destrukturálta a runtime által el nem küldött második context argumentumot. Ez valós invocation-kísérlet, nem sikeres end-to-end hívás.
- A javítás utáni Chrome DevTools-reteszt ugyanazt a toolt `{}` inputtal `Completed`, `ok: true` eredménnyel futtatta; a UI `MACHINE_CITY_READY`, revision 0 állapotba váltott. A korábbi hiba ettől nem törlődik, a két esemény együtt bizonyítja a javítás eredményét.
- Részletes evidence: [`evidence/CHROME_RUNTIME_2026-08-28.md`](evidence/CHROME_RUNTIME_2026-08-28.md).

## Hívási bizonyítékok

| Eset | Eredmény | Bizonyíték |
|---|---|---|
| `enter_machine_city {}` | siker; `MACHINE_CITY_READY` | UI integrációs teszt és helyi fallback próba |
| `enter_machine_city {}` Chrome DevToolsból, javítás előtt | `Error`; hiányzó második execution context; állapot maradt `NO_SESSION` | valós Chrome 152 invocation-kísérlet, felhasználó által rögzített pontos output |
| `enter_machine_city.execute({})` második argumentum nélkül | siker; `MACHINE_CITY_READY` | `registration.test.ts` Chrome-forma regressziós teszt |
| `enter_machine_city {}` Chrome DevToolsból, javítás után | `Completed`; `ok: true`; `MACHINE_CITY_READY`; revision 0 | valós Chrome 152 runtime evidence; 1 total call, 0 failed |
| `present_dilemma` üresen átadott sessionmezővel | Chrome `Completed`, alkalmazás `ok: false`; változatlan `MACHINE_CITY_READY` | valós negatív inputpróba; a Run Tool panel `<empty_string>` értéket mutatott |
| `present_dilemma` helyes sessionnel és revision 0-val Chrome DevToolsból | `Completed`; `ok: true`; `AWAITING_HUMAN_SELECTION`; dilemma látható | valós Chrome 152 runtime evidence; 3 total call, 0 failed |
| `get_current_game_state` helyes sessionnel Chrome DevToolsból | `Completed`; `ok: true`; `AWAITING_HUMAN_SELECTION`; UI változatlan | valós Chrome 152 read-only evidence; `readOnly` flag; 4 total call, 0 failed |
| `present_choice_reflection` kitalált selection ID-val, Player UI-kijelölés nélkül | Chrome `Completed`, alkalmazás `ok: false`; változatlan `AWAITING_HUMAN_SELECTION` | valós emberikontroll-negatív próba; 5 total call, 0 failed |
| `reveal_confirmed_consequence` hamis decision ID-val, megerősítés előtt, kétszer | mindkettő Chrome `Completed`, alkalmazás `ok: false`, `HUMAN_DECISION_REQUIRED`; állapot változatlan | két valós negatív invocation; 7 total call, 0 failed; reveal számláló 2 |
| AGY kijelölése | `TENTATIVE_SELECTION_RECORDED`, revision 2; mérleg változatlan | kizárólag Player UI; nincs hozzá WebMCP-tool és nem nőtt az invocation history |
| `get_current_game_state` az AGY kijelölés után | `ok: true`; aktuális opaque selection ID, `brain`, revision 2; reflexió és döntés null | valós read-only ágkapcsolati evidence |
| `present_choice_reflection` az aktuális AGY selection ID-val | `Completed`; `ok: true`; `REFLECTION_PRESENTED`; revision 3; AGY-reflexió látható; mérleg változatlan | valós pozitív reflexió evidence; 9 total call, 0 failed |
| AGY-reflexió megtartása | végleges megerősítési kontroll megjelenik; history változatlan 9 | kizárólag Player UI; nincs megtartási vagy megerősítési WebMCP-tool |
| `get_current_game_state` a megtartás után | `READY_FOR_CONFIRMATION`, revision 4, acknowledged reflexió; confirmed decision null; mérleg nulla | valós read-only elválasztási evidence |
| AGY végleges megerősítése üres indoklással | emberi döntés rögzítve; következmény rejtett; mérleg nulla; history változatlan 10 | kizárólag Player UI; nincs megerősítési WebMCP-tool |
| `get_current_game_state` a megerősítés után | `DECISION_CONFIRMED`, revision 5, valós AGY decision ID; mérleg nulla; completed lista üres | valós reveal előtti read-only baseline |
| `reveal_confirmed_consequence` valós AGY decision ID-val, revision 5-ről | Chrome `Completed`; `ok: true`; `CONSEQUENCE_REVEALED`; revision 6; következmény látható és egyszer alkalmazva | első sikeres valós reveal; 12 total call, 0 failed; a retry bizonyítéka a következő sorban |
| ugyanazon valós reveal request két retryja | mindkettő `Completed` és `ok: true`; változatlan `CONSEQUENCE_REVEALED`, revision 6, UI és teljes Embermérleg | valós idempotencia-evidence; 14 total call, 0 failed; reveal számláló 5 = 2 negatív + 1 első siker + 2 retry |
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
| Real runtime invocation | kész localhoston | az öt tool discoveryje, pozitív és negatív invocationök, Player UI-kontrollpont, első reveal és két idempotens retry bizonyított |

A „Hívási bizonyítékok” táblázat első és további sikersorai mock-, domain-, UI-integrációs vagy fallback-bizonyítékok; kizárólag a külön „Chrome DevToolsból, javítás után” sor címkézhető jelenleg sikeres valós Chrome invocationként.

A localhost DevTools invocation-kapu lezárult; további reveal-hívás nem szükséges. A valós képen összecsukott `data.alreadyRevealed` és a teljes belső outcome history mezőszintű invariánsát a táblázatban jelzett automatizált regressziós teszt támasztja alá.

### `execute` runtime-kompatibilitás

A definíciók az `execute(input)` és az `execute(input, { signal })` formát egyaránt elfogadják. A második context argumentum és a `signal` opcionális; ha az abortjel jelen van és megszakított, a tool továbbra is állapotváltozás nélkül hibát ad. Ez adapter-kompatibilitási részlet, nem változtatja meg a tool input/output szerződését és nem nyit játékosi parancsot az agent számára.

## Hivatalos források

- OpenAI Site tools: <https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app>, ellenőrizve 2026. augusztus 28-án.
- Chrome WebMCP: <https://developer.chrome.com/docs/ai/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome Imperative API: <https://developer.chrome.com/docs/ai/webmcp/imperative-api>, ellenőrizve 2026. augusztus 28-án.
- Chrome DevTools WebMCP panel: <https://developer.chrome.com/docs/devtools/application/webmcp>, ellenőrizve 2026. augusztus 28-án.
- Chrome 149 DevTools WebMCP flag: <https://developer.chrome.com/blog/new-in-devtools-149>, ellenőrizve 2026. augusztus 28-án.
