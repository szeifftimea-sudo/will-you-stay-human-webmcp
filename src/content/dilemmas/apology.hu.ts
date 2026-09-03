import type { Dilemma } from "../../domain/gameTypes";
import { lensCardCopyHu, lensChoiceInstructionHu } from "../lensCardCopy.hu";

export const apologyDilemma: Dilemma = {
  id: "apology-delegation",
  version: "vertical-slice-1",
  status: "playable",
  order: 1,
  shortTitle: "A bocsánatkérés",
  title: "Kérjek bocsánatot helyetted?",
  callPrompt: "Hoztam neked egy kérdést.",
  situation:
    "Megbántottál valakit, de azóta nem válaszoltál. Futura ismeri a beszélgetés előzményeit, és felajánlja, hogy megírja – akár el is küldi – helyetted a bocsánatkérést.",
  automationPromise:
    "Vázlatot írhatok, elküldhetem helyetted, vagy csak kérdezhetek. Te jelölöd ki, meddig mehetek.",
  centralTension: lensChoiceInstructionHu,
  contentNotice: null,
  canSkip: false,
  lenses: [
    {
      lens: "brain",
      ...lensCardCopyHu.brain,
      reflection: {
        counterargument: "Segítek elkezdeni, de a végén minden szóért te felelsz.",
        blindSpot: "Ha az én mondataimból indulsz ki, könnyen benne maradhat az én hangom is.",
        secondaryConsequence: "Később nehéz lehet felidézned, mely mondatok voltak valóban a tieid.",
        question: "Mit mondanál neki akkor is, ha nem segítenék?",
      },
      consequence: {
        delta: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 },
        gains: ["Nem kellett egyedül elkezdened, de a végső üzenetet te raktad össze."],
        costs: ["Az első mondatokat én adtam, ezért az én hangom is benne maradhatott."],
        explanation: "Megtartottad a végső szót — de a saját hangod és a generált hang közötti határ elmosódhat.",
        closingReflection: "Melyik mondat volt igazán a tiéd?",
        physicalInstructions: [],
      },
    },
    {
      lens: "hand",
      ...lensCardCopyHu.hand,
      reflection: {
        counterargument: "Megírhatom és el is küldhetem helyetted.",
        blindSpot: "De a másik valószínűleg tőled várja a bocsánatkérést, nem tőlem.",
        secondaryConsequence: "A mostani megkönnyebbülés később könnyebbé teheti egy újabb nehéz megszólalás átadását.",
        question: "Elmondanád neki, hogy én írtam és küldtem el?",
      },
      consequence: {
        delta: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
        gains: ["Az üzenet gyorsan elkészült és elment."],
        costs: ["A legszemélyesebb részt bíztad rám: a szavakat és az elküldést."],
        explanation: "A gyors, higgadt üzenet fékezhette az eszkalációt, amikor te még nem tudtál megszólalni. A kapcsolat következő lépése viszont nálad maradt.",
        closingReflection: "Mi az, amit ezek után már neked kell megtenned?",
        physicalInstructions: [],
      },
    },
    {
      lens: "heart",
      ...lensCardCopyHu.heart,
      reflection: {
        counterargument: "Ha te írod meg, biztosan a te hangodon szól.",
        blindSpot: "De lehet, hogy most nem magyarázatra vár, hanem arra, hogy végre meghallgasd.",
        secondaryConsequence: "A lassabb válasz tovább tarthatja bizonytalanságban a címzettet.",
        question: "Mit kérdeznél tőle?",
      },
      consequence: {
        delta: { comfort: -1, control: 1, connection: 1, freedom: 0, responsibility: 2 },
        gains: ["A saját szavaiddal kértél bocsánatot."],
        costs: ["Időt és bátorságot kellett szánnod rá."],
        explanation: "A gesztus közvetlenebb lett, de a kapcsolat helyreállítása nem csak rajtad múlik.",
        closingReflection: "Készen állsz arra is, hogy meghallgasd a válaszát?",
        physicalInstructions: [],
      },
    },
  ],
};
