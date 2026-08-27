# Tesztelés

## Automatizált kapuk

```bash
pnpm test:run
pnpm build
```

A tesztcsomag lefedi a domainátmeneteket, az egyszeri következményalkalmazást, a zárt tool-sémákat, a Player/Agent határt, a regisztrációt és a tool által okozott React UI-változást.

Legutóbbi teljes futás: 2026. augusztus 28. — dependency install sikeres; 4 tesztfájl, 15/15 sikeres teszt; production build sikeres, 58 modul transzformálva.

## Manuális kliensmátrix

| Dátum | Kliens | Böngésző/WebView | Modell | Verzió | Discovery | Hívás | Megjegyzés |
|---|---|---|---|---|---|---|---|
| 2026-08-27 | Codex desktop in-app browser | beágyazott WebView | Codex | környezet által kezelt | WebMCP API nem érhető el | fallback sikeres | teljes manuális kör, 0 konzolhiba |
| 2026-08-28 | Vercel production + `curl` | HTTPS / HTTP/2 | n/a | Vercel CLI 59.6.2 | n/a | n/a | HTTP 200; mindkét előírt header ténylegesen jelen van |
| 2026-08-28 | Codex desktop in-app browser | publikus top-level HTTPS WebView | Codex, pontos modell-ID nem elérhető | 26.818.21641 (6849) | blokkolt: nincs `document.modelContext`, 0 felfedezett Site tool | nem indítható | oldal betölt, fallback aktív, 0 error és 0 warning |
| kitöltendő | jogosult WebMCP-képes kliens | top-level HTTPS vagy Chrome testing flag | támogatott modell | kitöltendő | nem futott | nem futott | Site tools engedélyezése után szükséges |

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

Az automatizált regressziós teszt ellenőrzi a nyers deltát, az alkalmazott deltát, a mentett mérleget és a narratív költséget; a teljes csomag 13/13 sikeres teszttel futott le. A valós WebMCP-kliensben végzett discovery és invocation ettől függetlenül továbbra is nyitott technikai kapu.

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

Még szükséges manuális felhasználói lépés: jogosult Codex/ChatGPT desktop környezetben a Site tools engedély bekapcsolása és támogatott modell kiválasztása, majd a publikus URL újranyitása. Alternatív klienspróba Chrome-ban, a hivatalos WebMCP testing flag engedélyezése után végezhető.

A valódi Site tools discovery és invocation ezért továbbra is külön, nyitott technikai kapu.
