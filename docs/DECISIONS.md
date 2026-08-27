# Döntési napló

## D-001 — Külön Player- és Agent-parancsport

**Dátum:** 2026. augusztus 27.  
**Döntés:** A WebMCP adapter csak `AgentCommandPort` és `AgentQueryPort` referenciát kap. Kijelölést, reflexiótudomásulvételt és megerősítést csak a React UI által használt `PlayerCommandPort` hozhat létre.  
**Indok:** A központi emberi kontrollpont legyen szerkezeti tulajdonság, ne agent által küldhető boolean.

## D-002 — Öt statikusan regisztrált WebMCP-tool

**Dátum:** 2026. augusztus 27.  
**Döntés:** `enter_machine_city`, `present_dilemma`, `get_current_game_state`, `present_choice_reflection`, `reveal_confirmed_consequence`.  
**Indok:** A tool surface minden agentlépést bizonyíthatóvá tesz, de nem tartalmaz emberi döntési műveletet.

## D-003 — Következmény külön perzisztált fázisban

**Dátum:** 2026. augusztus 27.  
**Döntés:** A reveal kizárólag `DECISION_CONFIRMED → CONSEQUENCE_REVEALED` átmenetet végez.  
**Indok:** A feltárt eredmény, a mérlegváltozás és az egyszeri alkalmazás bizonylata együtt helyreállítható.

