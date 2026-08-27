# Tesztelés

## Automatizált kapuk

```bash
pnpm test:run
pnpm build
```

A tesztcsomag lefedi a domainátmeneteket, az egyszeri következményalkalmazást, a zárt tool-sémákat, a Player/Agent határt, a regisztrációt és a tool által okozott React UI-változást.

## Manuális kliensmátrix

| Dátum | Kliens | Böngésző/WebView | Modell | Verzió | Discovery | Hívás | Megjegyzés |
|---|---|---|---|---|---|---|---|
| 2026-08-27 | Codex desktop in-app browser | beágyazott WebView | Codex | környezet által kezelt | WebMCP API nem érhető el | fallback sikeres | teljes manuális kör, 0 konzolhiba |
| kitöltendő | WebMCP-képes kliens | kitöltendő | kitöltendő | kitöltendő | nem futott | nem futott | Valós WebMCP-kliensmérés szükséges |

## Manuális fallback

WebMCP nélküli böngészőben a fallback agentgombokkal ugyanazt a teljes kört kell végigjárni. A játékosi kijelölés, tudomásulvétel és megerősítés továbbra sem agentgomb.

2026. augusztus 27-én ez a próba sikeresen lefutott az AGY ágon `CONSEQUENCE_REVEALED` fázisig. A közvetlen `file://.../index.html` megnyitás nem támogatott; a teszt Vite dev serveren, `http://127.0.0.1:4173/` címen történt.
