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
- Eredmény: 4 tesztfájl, 13 teszt, 13 sikeres, 0 sikertelen.
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

### Nyitott külső ellenőrzés

A valós, WebMCP-képes kliensben történő discovery és invocation még nem futott le. Ezt nem jelöljük sikeresnek; a pontos kliens-, böngésző-, modell- és verzióadat a későbbi manuális mátrixba kerül.
