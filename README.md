# Ember maradsz? — Szív a gépben

Magyar nyelvű, egyszemélyes döntési játék vertical slice-a. Futura WebMCP-toolokkal mutatja be a dilemmát és tárja fel a következményt, miközben az AGY–KÉZ–SZÍV kijelölés, a reflexió utáni megtartás és a végleges megerősítés kizárólag a játékos webes UI-jában történhet.

## Élő technikai prototípus

Publikus HTTPS URL: <https://will-you-stay-human.vercel.app/>

A Vercel deployment a WebMCP klienspróbához szükséges `Origin-Agent-Cluster: ?1` és `Permissions-Policy: tools=(self)` válaszfejléceket adja. Ha a kliens nem biztosít `document.modelContext` API-t, az oldal automatikusan a manuális agent-fallbacket mutatja; ez nem teszi lehetővé az agent számára a játékosi kijelölést vagy megerősítést.

## Ebben a hackathonverzióban megvalósított scope

- egy végleges magyar „Kérjek bocsánatot helyetted?” vertical-slice dilemma;
- filmszerű, hétállomásos Döntési út, ahol a Gépváros maga az interfész, nem egy dashboard háttere;
- AGY, KÉZ és SZÍV mint három egyenrangú választási irány;
- kötelező, választásspecifikus reflexiós szakasz;
- külön `PlayerCommandPort` és `AgentCommandPort`;
- öt imperatív WebMCP-tool és azonos domainmagot használó manuális fallback;
- perzisztált állapotgép és Embermérleg;
- egyszer alkalmazható, idempotens következményfeltárás;
- automatizált domain-, szerződés-, emberikontroll- és UI-spike tesztek.

Ez működő egyszemélyes technikai prototípus. A multiplayer nem elkészült funkció.

## Indítás a Codex csomagolt runtime-jával

```bash
/Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm install
/Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173
```

Ezután nyisd meg a <http://127.0.0.1:4173/> címet. Az `index.html` közvetlen `file://` megnyitása nem támogatott, mert a Vite modul- és dev-server környezetére szükség van.

Automatizált ellenőrzés:

```bash
env PATH="/Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:/usr/bin:/bin" /Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm test:run
env PATH="/Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:/usr/bin:/bin" /Users/szeifftimea/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm build
```

## WebMCP tesztelés

1. Nyisd meg a futó oldalt biztonságos, WebMCP-t támogató böngészőkörnyezetben.
2. Ellenőrizd, hogy az oldal öt toolt regisztrál.
3. Hívd az `enter_machine_city`, majd a `present_dilemma` toolt: a közös UI fázisa és tartalma azonnal változik.
4. A játékos az UI-ban jelöl; ezután hívható a `present_choice_reflection`.
5. A játékos az UI-ban tartja meg és erősíti meg a választását.
6. A `reveal_confirmed_consequence` csak ezután sikeres, és retry esetén nem alkalmazza újra a mérlegváltozást.

WebMCP nélkül a Journey agentlépései ugyanazt az `AgentCommandPort`-ot hívják. A technikai Inspector a normál játékosnézetből rejtve marad, és csak az `?inspector=1` queryvel jelenik meg. Részletes szerződések: [`docs/WEBMCP_TOOLS.md`](docs/WEBMCP_TOOLS.md). Emberi kontroll: [`docs/HUMAN_CONTROL.md`](docs/HUMAN_CONTROL.md).

## Későbbi termékvízió — nem megvalósított funkciók

> The board makes consequences tangible. The online game keeps dilemmas alive.

A lehetséges jövőbeli termék minimális fizikai Embermérleg-táblákat és mozgatható jelölőket kapcsolna össze a Futurával játszható online játékkal. Kurált dilemmacsomagok bővülhetnének életkor, téma és felhasználási helyzet szerint. Egy későbbi csoportos mód egyéni Embermérlegeket és közös Gépváros-profilt használhatna.

Ezek irányok, nem a hackathonverzió kész képességei. A játék később sem rangsorolná, hogy ki „emberibb”; az Embermérleg trade-offokat tesz láthatóvá, nem morális pontszámot ad.

## Eredetiség és licenc

A *Metropolisz* megjelölt inspirációs forrás az AGY–KÉZ–SZÍV eredeti jelentésének megértéséhez. A projekt nem adaptálja a regény történetét, nem vesz át hosszabb szöveget vagy jogvédett vizuális elemet. Részletek: [`docs/ORIGINALITY_AND_SOURCES.md`](docs/ORIGINALITY_AND_SOURCES.md).

A forráskód MIT licenc alatt érhető el; lásd [`LICENSE`](LICENSE).
