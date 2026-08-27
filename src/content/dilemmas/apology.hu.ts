import type { Dilemma } from "../../domain/gameTypes";

export const apologyDilemma: Dilemma = {
  id: "apology-delegation",
  version: "spike-2",
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
        secondaryConsequence: "Később nehéz lehet felidézned, mely mondatok származtak valóban tőled.",
        question: "Mely mondatokat kell átdolgoznod ahhoz, hogy valóban vállalni tudd őket?",
      },
      consequence: {
        delta: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 },
        gains: ["Átgondolt és szerkeszthető kiindulópontot kapsz."],
        costs: ["A saját hangod és a generált hang közötti határ elmosódhat."],
        explanation: "Megtartod a végső kontrollt, miközben a megfogalmazás terhének egy részét átadod.",
        closingReflection: "Melyik mondat lett igazán a tiéd a szerkesztés során?",
        physicalInstructions: [],
      },
    },
    {
      lens: "hand",
      label: "KÉZ",
      framing: "A végrehajtást és a gépnek átadott cselekvést vizsgálod.",
      choiceText: "Futura fogalmazza meg és küldje is el helyettem a bocsánatkérést.",
      reflection: {
        counterargument: "A gyors, higgadt üzenet megállíthatja az eszkalációt, de a jóvátételhez később is szükség lehet rád.",
        blindSpot: "Nem magától értetődő, mit kell tudnia a címzettnek Futura szerepéről.",
        secondaryConsequence: "A felszabaduló idő és mentális kapacitás most segíthet, miközben könnyebbé teheti a későbbi delegálást is.",
        question: "Mit kell tudnia a címzettnek arról, hogyan született és ki küldte ezt az üzenetet?",
      },
      consequence: {
        delta: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
        gains: ["Az üzenet gyorsan elkészül és elküldhető; időt és mentális kapacitást nyersz."],
        costs: ["A megfogalmazással és az elküldéssel személyes jelenlétet, kontrollt és felelősséget is átadsz."],
        explanation: "A higgadt üzenet csökkentheti az eszkalációt, amikor még nem tudsz biztonságosan megszólalni, de Futura lesz a gesztus közvetlen végrehajtója.",
        closingReflection: "Milyen személyes lépést teszel azután, hogy Futura elküldte az üzenetet?",
        physicalInstructions: [],
      },
    },
    {
      lens: "heart",
      label: "SZÍV",
      framing: "Az érintettek, következmények és felelősség kapcsolatát vizsgálod.",
      choiceText: "Én írom meg; Futura csak kérdésekkel segítsen végiggondolni a hatást.",
      reflection: {
        counterargument: "A saját szöveg önmagában nem teszi jóvá a történteket.",
        blindSpot: "Az őszinteségedre figyelve háttérbe szorulhat, mire van szüksége a másiknak.",
        secondaryConsequence: "A lassabb folyamat tovább tarthatja bizonytalanságban a címzettet.",
        question: "Hogyan deríted ki, hogy a másik valóban meghallgatva érzi-e magát?",
      },
      consequence: {
        delta: { comfort: -1, control: 1, connection: 1, freedom: -1, responsibility: 1 },
        gains: ["A megfogalmazás és a végső gesztus közvetlenül hozzád kötődik."],
        costs: [
          "A folyamat időt, figyelmet és érzelmi kapacitást köt le, és tovább tarthat a másik bizonytalansága.",
          "A saját hangod sem garantálja, hogy a címzett meghallgatva érzi magát.",
        ],
        explanation: "A cselekvést magadnál tartod, ezért a gesztus közvetlenebb, de a kapcsolat helyreállítása továbbra is a másik válaszától és határaitól függ.",
        closingReflection: "Mitől érezheti a másik, hogy nemcsak megszólaltál, hanem meg is hallottad?",
        physicalInstructions: [],
      },
    },
  ],
};
