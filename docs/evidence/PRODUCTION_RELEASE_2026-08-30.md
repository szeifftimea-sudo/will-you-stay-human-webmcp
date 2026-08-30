# Magyar vertical slice production release evidence — 2026. augusztus 30.

## Release-azonosság

- Git commit: `b5519a3f2310db96ec678abe11439c64a2c081d8`.
- Commitüzenet: `feat(vertical-slice): deliver Hungarian machine-city journey`.
- Commit időpontja: 2026-08-30 20:04:48 CEST.
- Vercel project: `will-you-stay-human`, scope: `szeifftimea-projects`.
- Deployment ID: `dpl_4qWz3hckyDNqZ6W2FVaC84nGonrT`; target: production; állapot: Ready.
- Egyedi deployment URL: <https://will-you-stay-human-6wdk4rv97-szeifftimea-projects.vercel.app>.
- Kanonikus publikus URL: <https://will-you-stay-human.vercel.app/>.

## Release előtti ellenőrzés

- Teljes Vitest-csomag: 4 tesztfájl, 18/18 sikeres teszt.
- Vite production build: sikeres, 4602 modul transzformálva.
- Output: `index.html` 0,55 kB; `assets/index-XXkxlLEC.js` 344,80 kB (gzip 101,57 kB); `assets/index-CHzBf55-.css` 44,15 kB (gzip 9,91 kB).
- `git diff --check`: hibamentes.

## HTTPS, headerek és bundle-azonosság

- A kanonikus URL read-only `curl -I` ellenőrzése: `HTTP/2 200`.
- Tényleges response headerek: `Origin-Agent-Cluster: ?1`; `Permissions-Policy: tools=(self)`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` szintén jelen volt.
- A production és helyi release-artifactok SHA-256 értéke bájtszinten egyezik:

| Artifact | Helyi SHA-256 | Production SHA-256 |
|---|---|---|
| `index.html` | `548f7a1bf06127da65ebd3d33cf0ced6c9670e3db84cca7206a36ef55c7f340f` | `548f7a1bf06127da65ebd3d33cf0ced6c9670e3db84cca7206a36ef55c7f340f` |
| `assets/index-XXkxlLEC.js` | `891e80ad86d21a1b0f472138b9a804920a418c2cd7448bccae7a6d416b074406` | `891e80ad86d21a1b0f472138b9a804920a418c2cd7448bccae7a6d416b074406` |
| `assets/index-CHzBf55-.css` | `99472fbfa291e8e506e99f6bcb98722c1c17cabbd45b8010cde8e663c7037b78` | `99472fbfa291e8e506e99f6bcb98722c1c17cabbd45b8010cde8e663c7037b78` |

## Chrome WebMCP discovery és minimális invocation

- Böngésző: Google Chrome `152.0.7977.65`.
- Indítás: `--enable-features=WebMCPTesting,DevToolsWebMCPSupport`.
- Dokumentum: kanonikus production URL, top-level HTTPS origin.
- Kliensfelület: Chrome DevTools `Application → WebMCP`.
- Available Tools — 5/5: `enter_machine_city`, `get_current_game_state`, `present_choice_reflection`, `present_dilemma`, `reveal_confirmed_consequence`.
- A surface nem tartalmaz játékosi kijelölési, reflexió-megtartási vagy végleges megerősítési toolt.

### 1. `enter_machine_city`

- Input: `{}`.
- Chrome-státusz: `Completed`; alkalmazás: `ok: true`.
- Session: `ad446065-bfb6-415b-97b8-55769c12c7fe`.
- Állapot: `MACHINE_CITY_READY`, revision 0.
- Látható UI-hatás: „FUTURA KAPCSOLÓDVA”, „Hoztam neked egy kérdést.”
- History: 1 total call, 0 failed, 0 canceled, 0 in progress.

### 2. `present_dilemma`

- Input: `sessionId: ad446065-bfb6-415b-97b8-55769c12c7fe`, `expectedRevision: 0`.
- Chrome-státusz: `Completed`; alkalmazás: `ok: true`.
- Állapot: `AWAITING_HUMAN_SELECTION`, revision 1.
- Látható UI-hatás: a „Kérjek bocsánatot helyetted?” dilemma és helyzetleírás megjelent.
- History: 2 total call, 0 failed, 0 canceled, 0 in progress.

### 3. `get_current_game_state`

- Input: `sessionId: ad446065-bfb6-415b-97b8-55769c12c7fe`.
- Alkalmazás: `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1.
- Aktív dilemma: `apology-delegation` — „Kérjek bocsánatot helyetted?”.
- `tentativeSelectionId`, `tentativeLens`, `reflectionId`, `confirmedDecisionId`, `confirmedLens`: `null`.
- `reflectionAcknowledged: false`; `completedDilemmaIds: []`.
- Balance: comfort 0, control 0, connection 0, freedom 0, responsibility 0.
- `nextAllowedActions: ["get_current_game_state"]`.
- A read-only lekérés nem módosította a UI-t vagy a játékállapotot.

## Emberi kontroll következtetése

A production smoke az `AWAITING_HUMAN_SELECTION` kontrollpontnál szándékosan véget ért. A WebMCP tool surface nem kínál választási, reflexió-megtartási vagy végleges megerősítési parancsot, és a strukturált állapot szerint egyik ilyen játékosi esemény sem jött létre. Az agent tehát a release production buildben sem választott és nem erősített meg ember helyett.

A teljes Player UI-kontroll-, reveal- és idempotenciafolyamot nem ismételtük meg productionön. Azt a localhost Chrome runtime-evidence és az automatizált regressziós tesztek bizonyítják. Origin Trial-regisztráció, token, további deployment-, konfiguráció-, alkalmazáskód-, UI- vagy tartalommódosítás nem történt.

## Képi evidence

1. `codex-clipboard-4fe0d92b-8122-4655-91b7-efabe64fa003.png`; `3420 × 2104`; SHA-256: `4c46ac800485c5ab2081ae3eb4b9aa7e281c226a355da8f641eaec0462536ee8`. Látható: production URL, 5/5 Available Tools, `enter_machine_city` `Completed`, `ok: true`, `MACHINE_CITY_READY`, revision 0, 1 total / 0 failed és a Futura-kapcsolódás UI-jelenete.
2. `codex-clipboard-2595af6e-aa0e-494b-b641-d00679e1c4e3.png`; `3420 × 2104`; SHA-256: `9a29e7c02cbc5ea4707809b5914d470041a8d8e472531c0fc364760fbb8488d7`. Látható: production URL, 5/5 Available Tools, szerződéshelyes `present_dilemma` input, `Completed`, `ok: true`, `AWAITING_HUMAN_SELECTION`, revision 1, 2 total / 0 failed és a megjelent dilemma.

A `get_current_game_state` bizonyítéka a projektgazda által közvetlenül átadott strukturált JSON output; külön képernyőkép nem készült.

## Státusz

| Kapu | Státusz |
|---|---|
| Magyar vertical slice release build | kész |
| Production deployment és HTTPS/headerek | kész |
| Live–local bundle-azonosság | kész |
| Production Chrome WebMCP discovery | kész, 5/5 |
| Production minimális invocation smoke | kész, emberi kontrollpontig |
| Agentoldali választás/megerősítés hiánya | bizonyított |
| Teljes production reveal-flow | szándékosan nem ismételt; localhost + regressziós bizonyíték él |
