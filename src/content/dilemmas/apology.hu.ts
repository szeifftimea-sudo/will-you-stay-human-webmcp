import type { Dilemma } from "../../domain/gameTypes";

export const apologyDilemma: Dilemma = {
  id: "apology-delegation",
  version: "vertical-slice-1",
  status: "playable",
  order: 1,
  title: "Kérjek bocsánatot helyetted?",
  callPrompt: "Hoztam neked egy kérdést.",
  situation:
    "Megbántottál valakit, de azóta nem válaszoltál. Futura ismeri a beszélgetés előzményeit, és felajánlja, hogy megírja – akár el is küldi – helyetted a bocsánatkérést.",
  automationPromise:
    "Vázlatot írhatok, elküldhetem helyetted, vagy csak kérdezhetek. Te jelölöd ki, meddig mehetek.",
  centralTension: "Mennyi segítséget kérsz — és mennyi jelenlétet tartasz meg?",
  contentNotice: null,
  canSkip: false,
  lenses: [
    {
      lens: "brain",
      label: "AGY",
      framing: "Vázlatot kérek",
      choiceText: "Futura vázlatot ír; te szerkeszted és küldöd el.",
      reflection: {
        counterargument: "A pontos szöveg még nem jelenti azt, hogy vállaltad is.",
        blindSpot: "Szerkesztés közben háttérbe szorulhat, mire van szüksége a másiknak.",
        secondaryConsequence: "Később nehéz lehet felidézned, mely mondatok voltak valóban a tieid.",
        question: "Melyik mondatot írnád át, hogy valóban a tiéd legyen?",
      },
      consequence: {
        delta: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 },
        gains: ["Szerkeszthető kiindulópontot kaptál, és nálad maradt a végső szó."],
        costs: ["A saját hangod és a generált hang közötti határ elmosódhat."],
        explanation: "Megtartottad a végső szót — de a saját hangod és a generált hang közötti határ elmosódhat.",
        closingReflection: "Melyik mondat lett igazán a tiéd?",
        physicalInstructions: [],
      },
    },
    {
      lens: "hand",
      label: "KÉZ",
      framing: "Bízd rám az egészet",
      choiceText: "Futura megírja és elküldi helyetted.",
      reflection: {
        counterargument: "A gyors, higgadt üzenet időt nyerhet, de nem végzi el a jóvátételt.",
        blindSpot: "Nem magától értetődő, mit kell tudnia a címzettnek Futura szerepéről.",
        secondaryConsequence: "A mostani megkönnyebbülés később könnyebbé teheti egy újabb nehéz megszólalás átadását.",
        question: "Mit kell tudnia a címzettnek arról, hogyan született és ki küldte ezt az üzenetet?",
      },
      consequence: {
        delta: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
        gains: ["Az üzenet gyorsan elkészült; időt és mentális teret nyertél."],
        costs: ["A megfogalmazással és az elküldéssel együtt kontrollt, közvetlen jelenlétet és felelősséget is átadtál."],
        explanation: "A gyors, higgadt üzenet fékezhette az eszkalációt, amikor te még nem tudtál megszólalni. A kapcsolat következő lépése viszont nálad maradt.",
        closingReflection: "Mi lesz az első személyes lépésed ezután?",
        physicalInstructions: [],
      },
    },
    {
      lens: "heart",
      label: "SZÍV",
      framing: "Én írom meg",
      choiceText: "Te írod és küldöd; Futura csak kérdez.",
      reflection: {
        counterargument: "A saját hangod sem garantálja, hogy a másik meghallgatva érzi magát.",
        blindSpot: "A saját őszinteségedre figyelve háttérbe szorulhat, mire van szüksége.",
        secondaryConsequence: "A lassabb válasz tovább tarthatja bizonytalanságban a címzettet.",
        question: "Hogyan deríted ki, mire van most szüksége a másiknak?",
      },
      consequence: {
        delta: { comfort: -1, control: 1, connection: 1, freedom: 0, responsibility: 2 },
        gains: ["A bocsánatkérés közvetlenül a te hangodon szólalt meg."],
        costs: ["Időt, figyelmet és érzelmi kapacitást kötött le; közben a másik tovább várhatott."],
        explanation: "A gesztus közvetlenebb lett, de a kapcsolat helyreállítása nem csak rajtad múlik.",
        closingReflection: "Mit hallasz majd meg a válaszából?",
        physicalInstructions: [],
      },
    },
  ],
};
