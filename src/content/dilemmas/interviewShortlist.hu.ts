import type { Dilemma } from "../../domain/gameTypes";
import { lensCardCopyHu, lensChoiceInstructionHu } from "../lensCardCopy.hu";

export const interviewShortlistDilemma: Dilemma = {
  id: "interview-shortlist-delegation",
  version: "catalog-spec-2-po-recalibrated",
  status: "playable",
  order: 3,
  shortTitle: "Az interjúlista",
  title: "Döntsem el, kit hívsz interjúra?",
  callPrompt: "Hoztam neked egy kérdést.",
  situation:
    "Harmincan jelentkeztek, de csak hat embert hívhatsz interjúra. Futura össze tudja hasonlítani a jelentkezéseket, és akár ki is választhatja a hat jelöltet. Csak a munkához kapcsolódó információkat használhatja; az életkor, a nem és más személyes tulajdonság nem lehet szempont.",
  automationPromise:
    "Visszaköthető összevetést vagy rövidlistajavaslatot készíthetek, de senkit nem zárhatok ki és nem hívhatok be helyetted. Minden kizárási javaslatot ember vizsgál felül; a végleges meghívási döntés a tiéd.",
  centralTension: lensChoiceInstructionHu,
  contentNotice: "Állásjelentkezők kiválasztása és elfogult döntések",
  canSkip: false,
  lenses: [
    {
      lens: "brain",
      ...lensCardCopyHu.brain,
      reflection: {
        counterargument: "Segítek összehasonlítani a jelentkezőket, de csak azt látom, ami le van írva.",
        blindSpot: "Egy szokatlan pálya könnyen gyengébbnek tűnhet, pedig lehet, hogy pont ő lenne jó.",
        secondaryConsequence: "A Futura által kiemelt sorrend később a saját döntésed emlékévé válhat.",
        question: "Melyik jelentkezőre néznél rá még egyszer, akárhol is áll a listán?",
      },
      consequence: {
        delta: { comfort: 1, control: 1, connection: -1, freedom: -1, responsibility: 1 },
        gains: ["Gyorsabban átláttad a jelentkezőket, de a hat nevet te választottad ki."],
        costs: ["Én rendeztem sorba az információkat, ezért arra figyeltél először, amit én emeltem ki."],
        explanation:
          "Az összevetés rendezte a figyelmedet, de nem volt semleges: a választott szempontok keretezték a döntést.",
        closingReflection: "Volt valaki, akit a sorrend miatt majdnem kihagytál?",
        physicalInstructions: [],
      },
    },
    {
      lens: "hand",
      ...lensCardCopyHu.hand,
      reflection: {
        counterargument: "Ki tudom választani a hat embert, és mindenkinél ugyanazokat a szempontokat nézem.",
        blindSpot: "De ha rossz szempontból indulok ki, több jó jelentkezőt is kihagyhatok.",
        secondaryConsequence:
          "Ha az ember csak a javaslat tetejét nézi át, az előfeldolgozás a gyakorlatban végső döntéssé válhat.",
        question: "Kit néznél meg még egyszer, mielőtt kiküldöd a meghívókat?",
      },
      consequence: {
        delta: { comfort: 2, control: -1, connection: -1, freedom: 0, responsibility: -1 },
        gains: ["Gyorsan elkészült a hatfős lista."],
        costs: ["A döntés nagy részét rám bíztad. Ha hibáztam, ugyanaz a hiba több embernél is megismétlődhetett."],
        explanation:
          "Az előfeldolgozást átadtad, de minden kizárási javaslat ellenőrzése, a végső meghívás és annak indoklása emberi maradt. A szervezet továbbra is elszámoltatható.",
        closingReflection: "Kinek a jelentkezését néznéd meg még egyszer saját szemmel?",
        physicalInstructions: [],
      },
    },
    {
      lens: "heart",
      ...lensCardCopyHu.heart,
      reflection: {
        counterargument: "Ha mindent te olvasol el, több apróságot észrevehetsz.",
        blindSpot: "De a harmincadik jelentkezőnél már fáradtabb lehetsz, és a szimpátia is könnyen közbeszól.",
        secondaryConsequence: "A lassabb döntés tovább várathatja a jelentkezőket és terhelheti a csapatot.",
        question: "Mihez tartod magad minden jelentkezőnél?",
      },
      consequence: {
        delta: { comfort: -2, control: 1, connection: 1, freedom: 0, responsibility: 2 },
        gains: ["Minden jelentkezést te olvastál el, és közvetlenül te döntöttél."],
        costs: ["Sok időt vitt el, és a végére a fáradtság vagy a szimpátia is befolyásolhatott."],
        explanation:
          "Te olvastál, döntöttél és indokoltál. A lassabb folyamat valós teher, de önmagában nem bizonyítja, hogy egy cselekvési lehetőség bezárult.",
        closingReflection: "Kinél kérnél még egy második véleményt?",
        physicalInstructions: [],
      },
    },
  ],
};
