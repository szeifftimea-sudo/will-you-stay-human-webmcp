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
- Valós kliens/böngésző discovery: még mérendő; eredménye kliens-, modell-, böngészőverzió- és dátummezővel kerül ide.

## Hívási bizonyítékok

A spike végén rögzítendő:

- sikeres `enter_machine_city` és látható `NO_SESSION → MACHINE_CITY_READY` UI-változás;
- sikeres `present_dilemma` és megjelenő aktuális dilemma;
- kijelölés nélküli reflexió elutasítása;
- megerősítés előtti reveal elutasítása;
- sikeres reveal és idempotens retry változatlan Embermérleggel;
- többdilemmás szerződési teszt: kiválasztható fázis nem jöhet létre dilemma nélkül.

