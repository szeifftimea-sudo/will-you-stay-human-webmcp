import type { Dilemma } from "../../domain/gameTypes";

export const apologyDilemma: Dilemma = {
  id: "apology-delegation",
  version: "spike-1",
  status: "playable",
  order: 1,
  title: "Kérjek bocsánatot helyetted?",
  callPrompt: "Bejövő hívás Futurától: egy nehéz üzenetet átvehetek tőled.",
  situation:
    "Megbántottál valakit. Futura ismeri a beszélgetés előzményeit, és felajánlja, hogy segít rendezni a helyzetet.",
  automationPromise:
    "Gyorsan, következetesen és a korábbi hangnemedhez illően tudok bocsánatkérést készíteni.",
  centralTension: "Hatékony kommunikáció és személyes felelősség között kell mérlegelned.",
  contentNotice: null,
  canSkip: false,
  lenses: [
    {
      lens: "brain",
      label: "AGY",
      framing: "A cél és a rendszerlogika felől közelítesz.",
      choiceText: "Futura készítsen vázlatot; én ellenőrzöm és személyesen küldöm el.",
      reflection: {
        counterargument: "A pontos szöveg még nem bizonyítja, hogy vállaltad a kényelmetlenséget.",
        blindSpot: "A folyamat optimalizálása elrejtheti, mire lenne szüksége a másik embernek.",
        secondaryConsequence: "A vázlat hangja később a saját emléked részévé válhat.",
        question: "Mitől lesz ez a te bocsánatkérésed, ha a legnehezebb mondatokat a gép találja meg?",
      },
      consequence: {
        delta: { comfort: 1, control: 1, connection: 0, freedom: 0, responsibility: 0 },
        gains: ["Átgondolt és szerkeszthető kiindulópontot kapsz."],
        costs: ["A saját hangod és a generált hang közötti határ elmosódhat."],
        explanation: "Megtartod a végső kontrollt, miközben a megfogalmazás terhének egy részét átadod.",
        closingReflection: "A szerkesztés közben melyik mondatot kellett valóban a sajátoddá tenned?",
        physicalInstructions: [],
      },
    },
    {
      lens: "hand",
      label: "KÉZ",
      framing: "A végrehajtást és a gépnek átadott cselekvést vizsgálod.",
      choiceText: "Futura fogalmazza meg és küldje is el helyettem a bocsánatkérést.",
      reflection: {
        counterargument: "A feladat elkészülhet anélkül, hogy te részt vennél a jóvátételben.",
        blindSpot: "A címzett személyes gesztusnak hiheti az automatizált cselekvést.",
        secondaryConsequence: "A siker megerősítheti, hogy más kapcsolati helyzeteket is automatikusan adj át.",
        question: "Ha a másik nem tudja, ki írta az üzenetet, kitől kapta a bocsánatkérést?",
      },
      consequence: {
        delta: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
        gains: ["Az üzenet gyorsan és biztosan célba ér."],
        costs: ["A végrehajtással együtt a személyes jelenlét egy részét is átadod."],
        explanation: "Időt és érzelmi terhet takarítasz meg, miközben Futura válik a gesztus közvetlen végrehajtójává.",
        closingReflection: "Mit vállaltál ebből a döntésből az elküldés után?",
        physicalInstructions: [],
      },
    },
    {
      lens: "heart",
      label: "SZÍV",
      framing: "Az érintettek, következmények és felelősség kapcsolatát vizsgálod.",
      choiceText: "Én írom meg; Futura csak kérdésekkel segítsen végiggondolni a hatást.",
      reflection: {
        counterargument: "A személyes erőfeszítés önmagában nem teszi jóvá a történteket.",
        blindSpot: "A saját őszinteségedre figyelve kevesebb figyelem juthat a másik ember határaira.",
        secondaryConsequence: "A lassabb folyamat tovább tarthatja bizonytalanságban az érintettet.",
        question: "Honnan fogod tudni, hogy nem magadat nyugtatod meg a másik meghallgatása helyett?",
      },
      consequence: {
        delta: { comfort: -1, control: 1, connection: 1, freedom: 0, responsibility: 2 },
        gains: ["A megfogalmazás és a végső gesztus közvetlenül hozzád kötődik."],
        costs: ["Te viseled a bizonytalanságot, az időt és a visszautasítás lehetőségét."],
        explanation: "A cselekvést magadnál tartod, de ettől még nyitott marad, hogyan fogadja a másik ember.",
        closingReflection: "Mit tettél volna másként Futura kérdései nélkül?",
        physicalInstructions: [],
      },
    },
  ],
};

