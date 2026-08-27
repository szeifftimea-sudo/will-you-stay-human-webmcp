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
- Még szükséges manuális beállítás/próba: jogosult Codex/ChatGPT desktop környezetben a Site tools engedély bekapcsolása, támogatott modell kiválasztása, majd a publikus top-level URL újbóli megnyitása. Alternatív interoperabilitási próba Chrome-ban a hivatalos WebMCP testing flaggel végezhető.

### Ellenőrzött források

- Vercel `vercel.json` és headers: <https://vercel.com/docs/project-configuration/vercel-json>, ellenőrizve 2026. augusztus 28-án.
- pnpm `strictDepBuilds` és `allowBuilds`: <https://pnpm.io/settings/build>, ellenőrizve 2026. augusztus 28-án.
- OpenAI WebMCP/Site tools útmutató: <https://learn.chatgpt.com/docs/webmcp>, ellenőrizve 2026. augusztus 28-án.
