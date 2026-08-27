# Architektúra

## Rétegek

- `src/domain`: tiszta állapotgép, invariánsok és Embermérleg-számítás.
- `src/application`: külön Player/Agent portok és szűrt query portok.
- `src/content`: verziózott magyar dilemmaadat és validáció.
- `src/infrastructure`: `localStorage`, WebMCP-regisztráció és tool adapterek.
- `src/ui`: React read model és kizárólag ember által használható kontrollok.

## Parancshatár

```text
React UI -> PlayerCommandPort -> GameEngine
WebMCP   -> AgentCommandPort  -> GameEngine
Fallback -> AgentCommandPort  -> GameEngine
```

A WebMCP réteg nem importálja és konstruktorban sem kapja meg a `PlayerCommandPort`-ot. Nincs általánosan exportált `dispatch`, globális store vagy DOM-kattintást szimuláló tool.

## Állapotfolyam

```text
NO_SESSION -> MACHINE_CITY_READY -> AWAITING_HUMAN_SELECTION
-> TENTATIVE_SELECTION_RECORDED -> REFLECTION_PRESENTED
-> READY_FOR_CONFIRMATION -> DECISION_CONFIRMED
-> CONSEQUENCE_REVEALED -> GAME_COMPLETE
```

Több dilemma esetén a `present_dilemma` a teljesen perzisztált `CONSEQUENCE_REVEALED` fázisból atomikusan választja ki és mutatja be a következő dilemmát. `AWAITING_HUMAN_SELECTION` nem állhat fenn érvényes `activeDilemmaId` nélkül.

## Publikus hostingréteg

- Vercel-projekt: `will-you-stay-human`; publikus URL: <https://will-you-stay-human.vercel.app/>.
- `vercel.json`: Vite framework, `pnpm build`, `dist` output, két globális WebMCP-környezeti válaszfejléc.
- `pnpm-workspace.yaml`: kizárólag `esbuild: true` a dependency build-script allowlistben.
- SPA fallback rewrite nincs: a jelenlegi spike egyetlen gyökérútvonalat használ, kliensoldali router nélkül.
- A hostingréteg nem kap Player- vagy Agent-portot, és nem változtat a domain állapotgépén.
