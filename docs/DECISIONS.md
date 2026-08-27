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

## D-004 — Három össze nem vonható Embermérleg-csere

**Dátum:** 2026. augusztus 27.

**Döntés:** Az első dilemma jóváhagyott deltái:

- AGY: Kényelem `+1`, Kontroll `+1`, Kapcsolódás `−1`, Szabadság `0`, Felelősség `0`;
- KÉZ: Kényelem `+2`, Kontroll `−1`, Kapcsolódás `−1`, Szabadság `+1`, Felelősség `−1`;
- SZÍV: Kényelem `−1`, Kontroll `+1`, Kapcsolódás `+1`, Szabadság `−1`, Felelősség `+1`.

Az öt tengelyből nem készül összpontszám, és a pozitív vagy negatív eltérések nem jelölnek helyes vagy helytelen választ. A KÉZ Szabadság-nyeresége a felszabaduló időt, mentális kapacitást és deeszkalációs lehetőséget jelenti. A SZÍV Kapcsolódás-nyeresége a gesztus közvetlenségét, nem a kapcsolat biztos helyreállítását jelöli; az idő- és figyelemigény Szabadság `−1` értékben is megjelenik.

**Indok:** Mindhárom ág valós, helyzetfüggő nyereséget és árat mutasson, erkölcsi rangsor nélkül. A tartalmi és mérlegváltozás miatt a dilemma verziója `spike-2`, a katalógusé `hu-spike-2`; így korábbi, még fel nem tárt döntés nem kaphat észrevétlenül új következményt.
