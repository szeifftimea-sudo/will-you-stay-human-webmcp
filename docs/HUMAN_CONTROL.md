# Emberi kontrollpont

## Védett műveletek

Csak a `PlayerCommandPort` végezheti:

1. AGY/KÉZ/SZÍV kijelölése vagy módosítása;
2. a bemutatott reflexió játékosi tudomásulvétele;
3. a döntés végleges megerősítése.

Az `AgentCommandPort` dilemmát és reflexiót mutathat be, állapotot olvashat, valamint már megerősített döntés következményét tárhatja fel. Nem kap Player-port referenciát.

## Negatív tesztminimum

- az öt tool sémájában nincs döntési mező;
- extra `lens` és `humanConfirmed` mező runtime-ban is hibás;
- agent porton nincs select, acknowledge vagy confirm metódus;
- reflexió kijelölés nélkül vagy másik selection ID-val hibás;
- reveal minden `DECISION_CONFIRMED` előtti fázisból hibás;
- ugyanaz a következmény retry esetén sem alkalmazható újra.

## Garancia határa

A bizonyított állítás a WebMCP tool surface-re vonatkozik. Nem kriptográfiai védelem egy általános computer-use vagy DOM-automatizáló rendszer ellen; a demóban Futura ilyen eszközzel nem használhatja a játékosi gombokat.

