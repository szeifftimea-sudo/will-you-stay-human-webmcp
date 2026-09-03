import type { Dilemma } from "../../domain/gameTypes";
import { lensCardCopyHu, lensChoiceInstructionHu } from "../lensCardCopy.hu";

export const homeworkDilemma: Dilemma = {
  id: "homework-delegation",
  version: "catalog-spec-2-po-recalibrated",
  status: "playable",
  order: 2,
  shortTitle: "A házi feladat",
  title: "Megcsináljam helyetted a házit?",
  callPrompt: "Hoztam neked egy kérdést.",
  situation:
    "Holnap reggelre kell leadnod egy feladatot, de elakadtál. A tanár engedi az AI használatát, ha feltünteted, és el tudod magyarázni a megoldást. Futura felajánlja, hogy segít – akár el is készíti helyetted az egészet.",
  automationPromise:
    "Készíthetek visszakövethető tervet, teljes első változatot, vagy csak kérdésekkel segíthetek. Az AI-segítséget te tünteted fel; csak ellenőrzött és megértett megoldást adhatsz be.",
  centralTension: lensChoiceInstructionHu,
  contentNotice: null,
  canSkip: false,
  lenses: [
    {
      lens: "brain",
      ...lensCardCopyHu.brain,
      reflection: {
        counterargument: "Adok egy kezdést, de attól még neked kell megértened a megoldást.",
        blindSpot: "Az én ötletem könnyen elvihet egyetlen irányba.",
        secondaryConsequence:
          "A beadás után csak akkor derül ki, mi maradt meg, amikor hasonló feladattal egyedül találkozol.",
        question: "Melyik részt tudnád most már egyedül is megoldani?",
      },
      consequence: {
        delta: { comfort: 1, control: 1, connection: 0, freedom: -1, responsibility: 1 },
        gains: ["Kaptál egy kis segítséget az induláshoz, de a feladatot te oldottad meg."],
        costs: ["Az első ötlet tőlem jött, ezért könnyen abban az irányban maradtál."],
        explanation:
          "Könnyebb lett elindulni, miközben te dolgoztad ki a választ. Az első keretet azonban már nem te választottad.",
        closingReflection: "Melyik részt tudnád most már segítség nélkül is megoldani?",
        physicalInstructions: [],
      },
    },
    {
      lens: "hand",
      ...lensCardCopyHu.hand,
      reflection: {
        counterargument: "Megcsinálhatom helyetted, de a tanár neked fog kérdéseket feltenni.",
        blindSpot: "És pont ott lesz a legnehezebb észrevenned, ha hibáztam, ahol te is elakadtál.",
        secondaryConsequence:
          "Ha a megértés a kész szöveghez kötődik, egy új feladatnál újra hiányozhat a saját megoldási út.",
        question: "Melyik részt tudnád a saját szavaiddal elmagyarázni?",
      },
      consequence: {
        delta: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
        gains: ["A feladat elkészült, és időt nyertél."],
        costs: ["Kevesebbet gyakoroltál, és nehezebb lehet elmagyaráznod a megoldást."],
        explanation:
          "A megoldás nagy részét átadtad. A feltüntetés, ellenőrzés, javítás és magyarázhatóság továbbra is a te aktív feladatod; a beadásért te tartozol számot adni.",
        closingReflection: "Ha a tanár visszakérdez, melyik résznél akadnál el?",
        physicalInstructions: [],
      },
    },
    {
      lens: "heart",
      ...lensCardCopyHu.heart,
      reflection: {
        counterargument: "Ha egyedül oldod meg, tényleg kiderül, mit tudsz.",
        blindSpot: "De attól, hogy sokáig próbálkozol, még nem biztos, hogy jó úton jársz.",
        secondaryConsequence: "A hosszabb munka elveheti az időt a pihenéstől vagy más feladatoktól.",
        question: "Mikor próbálkozol tovább, és mikor kérsz segítséget?",
      },
      consequence: {
        delta: { comfort: -2, control: 1, connection: 1, freedom: -1, responsibility: 2 },
        gains: ["Végigmentél a saját gondolatmeneteden, és kiderült, mit értesz."],
        costs: ["Több időd ment rá, és a saját hibádat is benne hagyhattad."],
        explanation:
          "A megoldás és a gondolatmenet a tiéd maradt. Ennek ára az elakadás, a nagyobb terhelés és egy másik időablak szűkülése.",
        closingReflection: "Hol kérnél legközelebb segítséget?",
        physicalInstructions: [],
      },
    },
  ],
};
