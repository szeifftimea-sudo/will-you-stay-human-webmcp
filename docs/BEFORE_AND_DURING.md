# Verseny előtti és alatti munka

## Korábban létezett

- a hibrid játék alapötlete;
- az AGY–KÉZ–SZÍV és Embermérleg termékkoncepció;
- Futura és a Gépváros korai elképzelése;
- a megjelölt *Metropolisz*-inspiráció.

Bizonyíték: a repository első, implementáció előtti baseline commitja és szükség szerint korábbi, külsőleg dátumozott anyagok.

## A versenyidőszakban készül

- WebMCP-specifikus architektúra és öt tool;
- böngészős alkalmazás, domainmotor és portok;
- emberi kontrollpont technikai védelme;
- tesztek, deployment és pályázati bizonyítékok.

A commit historyt nem squasholjuk vagy írjuk át indokolatlanul. Az eredményhirdetésig tartó freeze belső release- és bizonyítási szabály, nem hivatalos követelményként idézett állítás.

## Versenyidőszaki deployment-bizonyíték

- A tesztelt alkalmazáskód baseline commitja: `38f007dce7a2464266b3181d66f27364003aee12`.
- A `will-you-stay-human` Vercel-projekt, a hostingkonfiguráció, a dependency-build allowlist és a publikus deployment 2026. augusztus 27–28-án készült.
- Az első sikertelen és a javított production deployment külön szerepel a build logban; a sikertelen próbát nem töröljük és nem állítjuk be sikeresnek.
- A `.vercel/` projektkapcsolati könyvtár és a helyi `.env.local` nincs verziózva; a reprodukálható beállításokat a repositoryban lévő `vercel.json` és `pnpm-workspace.yaml` tartalmazza.
