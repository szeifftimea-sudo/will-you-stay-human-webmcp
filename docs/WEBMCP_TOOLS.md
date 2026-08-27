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

| Eset | Eredmény | Bizonyíték |
|---|---|---|
| `enter_machine_city {}` | siker; `MACHINE_CITY_READY` | UI integrációs teszt és helyi fallback próba |
| `present_dilemma` helyes session/revision | siker; aktív dilemma és `AWAITING_HUMAN_SELECTION` együtt | `gameEngine.test.ts`, UI integrációs teszt |
| bármely tool extra `lens` mezővel | `INVALID_INPUT`, állapotváltozás nélkül | `playerAgentBoundary.test.ts` |
| reflexió nem aktuális selection ID-val | `SELECTION_ID_MISMATCH` | `gameEngine.test.ts` |
| reveal megerősítés előtt | `HUMAN_DECISION_REQUIRED` | `gameEngine.test.ts` |
| reveal megerősítés után | siker; `CONSEQUENCE_REVEALED` | domain- és fallback próba |
| ugyanazon reveal retry | `alreadyRevealed: true`; változatlan balance; history hossza 1 | `gameEngine.test.ts` |
| következő `present_dilemma` két elemű tesztkatalógussal | új dilemma ID és `AWAITING_HUMAN_SELECTION` egy commitban | `gameEngine.test.ts` |

Az automatizált ModelContext mock `getTools()` eredménye pontosan az öt stabil toolnevet tartalmazta. Ez regisztrációs/discovery integrációs bizonyíték, nem helyettesíti a későbbi valós WebMCP-klienspróbát.
