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
- Eredmény: 4 tesztfájl, 12 teszt, 12 sikeres, 0 sikertelen.
- Lefedett kapuk: állapotgép, többdilemmás `present_dilemma` atomi bemutatás, reflexiós kontroll, egyszeri reveal, zárt tool-sémák, külön portok, öt tool regisztráció/discovery mockban és tool által kiváltott React UI-változás.

### Helyi böngészős fallback próba

- Környezet: Codex in-app browser, `http://127.0.0.1:4173/`, 2026. augusztus 27.
- A WebMCP API ebben a környezetben nem volt elérhető; a UI helyesen manuális fallbackre váltott.
- Ellenőrzött fázisok: `NO_SESSION → MACHINE_CITY_READY → AWAITING_HUMAN_SELECTION → TENTATIVE_SELECTION_RECORDED → REFLECTION_PRESENTED → READY_FOR_CONFIRMATION → DECISION_CONFIRMED → CONSEQUENCE_REVEALED`.
- Megerősítő gomb kijelölés és reflexió közben nem volt jelen; csak játékosi megtartás után jelent meg.
- A reveal után a következmény láthatóvá vált, az AGY tesztágban a Kényelem `+1` értékre módosult.
- Böngészőkonzol: 0 error, 0 warning.

### Nyitott külső ellenőrzés

A valós, WebMCP-képes kliensben történő discovery és invocation még nem futott le. Ezt nem jelöljük sikeresnek; a pontos kliens-, böngésző-, modell- és verzióadat a későbbi manuális mátrixba kerül.
