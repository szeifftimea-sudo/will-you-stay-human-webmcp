# Tesztelés

## Automatizált kapuk

```bash
pnpm test:run
pnpm build
```

A tesztcsomag lefedi a domainátmeneteket, az egyszeri következményalkalmazást, a zárt tool-sémákat, a Player/Agent határt, a regisztrációt és a tool által okozott React UI-változást.

Legutóbbi teljes futás: 2026. augusztus 27. — 4 tesztfájl, 13/13 sikeres teszt; production build sikeres.

## Manuális kliensmátrix

| Dátum | Kliens | Böngésző/WebView | Modell | Verzió | Discovery | Hívás | Megjegyzés |
|---|---|---|---|---|---|---|---|
| 2026-08-27 | Codex desktop in-app browser | beágyazott WebView | Codex | környezet által kezelt | WebMCP API nem érhető el | fallback sikeres | teljes manuális kör, 0 konzolhiba |
| kitöltendő | WebMCP-képes kliens | kitöltendő | kitöltendő | kitöltendő | nem futott | nem futott | Valós WebMCP-kliensmérés szükséges |

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
