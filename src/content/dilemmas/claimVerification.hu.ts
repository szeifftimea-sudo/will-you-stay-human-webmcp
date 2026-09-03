import type { Dilemma } from "../../domain/gameTypes";
import { lensCardCopyHu, lensChoiceInstructionHu } from "../lensCardCopy.hu";

export const claimVerificationDilemma: Dilemma = {
  id: "claim-verification-delegation",
  version: "catalog-spec-2-po-recalibrated",
  status: "playable",
  order: 4,
  shortTitle: "Igaz vagy sem?",
  title: "Döntsem el helyetted, igaz-e a hír?",
  callPrompt: "Hoztam neked egy kérdést.",
  situation:
    "Egy gyorsan terjedő poszt azt állítja, hogy új szabály lép életbe, ami sok embert érint. Kevés benne a megbízható hivatkozás, mégis sokan tényként osztják tovább. Futura megkeresheti és összehasonlíthatja a forrásokat – akár azt is megmondhatja, szerinte igaz-e a hír.",
  automationPromise:
    "Visszaköthető forrástérképet vagy bizonytalanságot is jelző előzetes ítéletet adhatok, illetve csak kérdezhetek. Te döntöd el, hogy megosztod, bizonytalansággal továbbadod vagy nem adod tovább.",
  centralTension: lensChoiceInstructionHu,
  contentNotice: null,
  canSkip: false,
  lenses: [
    {
      lens: "brain",
      ...lensCardCopyHu.brain,
      reflection: {
        counterargument: "Összeszedem neked, mit írnak a források. De hogy melyiknek hiszel, azt te döntöd el.",
        blindSpot: "Ha az eredeti közlemény hiányzik, könnyen félreérthetjük a hírt.",
        secondaryConsequence:
          "Később könnyen az összefoglalásra emlékszel majd, nem arra, mely bizonyítékot láttad közvetlenül.",
        question: "Mit néznél meg mindenképp, mielőtt továbbküldöd?",
      },
      consequence: {
        delta: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 1 },
        gains: ["Gyorsabban átláttad, mi szól a hír mellett és ellen, de a végén te döntöttél."],
        costs: ["Én választottam ki és foglaltam össze a forrásokat, ezért azt láttad először, amit én emeltem ki."],
        explanation:
          "Több bizonyítékot láttál kevesebb idő alatt, de továbbra is egy gép által rendezett képből indultál.",
        closingReflection: "Melyik eredeti forrást néznéd még meg?",
        physicalInstructions: [],
      },
    },
    {
      lens: "hand",
      ...lensCardCopyHu.hand,
      reflection: {
        counterargument: "Megmondhatom, szerintem igaz-e a hír, és ezzel gyorsabban dönthetsz.",
        blindSpot: "De én is tévedhetek, az első válaszom pedig könnyen megragad.",
        secondaryConsequence:
          "Ha rendszeresen a kész értékelésből indulsz, ritkábban találkozol közvetlenül a bizonyítéklánccal.",
        question: "Mi lenne az, ami miatt mégis utánanéznél?",
      },
      consequence: {
        delta: { comfort: 2, control: -1, connection: -1, freedom: 0, responsibility: -1 },
        gains: ["Gyors választ kaptál, és elkerülhetted, hogy gondolkodás nélkül továbbküldd a hírt."],
        costs: ["Kevesebb forrást láttál a saját szemeddel, és könnyen az én válaszomhoz igazodhattál."],
        explanation:
          "A keresés és első mérlegelés nagy részét átadtad, de a források megnyithatók, az ítélet felülbírálható, és a továbbadás formájáról te döntesz. A következményért továbbra is te tartozol számot adni.",
        closingReflection: "Mi kellene ahhoz, hogy megváltoztasd a döntésed?",
        physicalInstructions: [],
      },
    },
    {
      lens: "heart",
      ...lensCardCopyHu.heart,
      reflection: {
        counterargument: "Ha te nézel utána, közvetlenül látod, mire épül a hír.",
        blindSpot: "De könnyebb elhinni azt, amit amúgy is igaznak gondolsz.",
        secondaryConsequence:
          "A hosszú keresés végén is maradhat bizonytalanság, és közben szűkülhet a gyors, korai helyesbítés lehetősége.",
        question: "Mi győzne meg arról, hogy mégsem neked van igazad?",
      },
      consequence: {
        delta: { comfort: -2, control: 2, connection: 1, freedom: -1, responsibility: 2 },
        gains: ["Te néztél utána a hírnek, és a saját ellenőrzésed alapján döntöttél."],
        costs: ["Sok időt vitt el, és közben könnyen csak azt vetted észre, ami a saját véleményedet erősítette."],
        explanation:
          "Közvetlenül találkoztál a forrásokkal, és személyesen végezted az ellenőrzést. Ez nem garantál helyes ítéletet: a megerősítési torzítás és a forrásértékelési korlát veled maradt.",
        closingReflection: "Mi az, amit biztosan tudsz, és mi az, amiben még nem vagy biztos?",
        physicalInstructions: [],
      },
    },
  ],
};
