import { describe, expect, it } from "vitest";
import { categoryCatalogHuById } from "../../src/content/categoryCatalog.hu";
import { dilemmaCatalog } from "../../src/content/dilemmaCatalog.hu";
import { dilemmaMetadata, dilemmaMetadataById } from "../../src/content/dilemmaMetadata";
import { lensSelectionFeedbackHu } from "../../src/content/lensCardCopy.hu";
import type { BalanceDelta, Lens } from "../../src/domain/gameTypes";

const EXPECTED_IDS = [
  "apology-delegation",
  "homework-delegation",
  "interview-shortlist-delegation",
  "claim-verification-delegation",
];

const EXPECTED_DELTAS: Record<string, Record<Lens, BalanceDelta>> = {
  "apology-delegation": {
    brain: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 },
    hand: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
    heart: { comfort: -1, control: 1, connection: 1, freedom: 0, responsibility: 2 },
  },
  "homework-delegation": {
    brain: { comfort: 1, control: 1, connection: 0, freedom: -1, responsibility: 1 },
    hand: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
    heart: { comfort: -2, control: 1, connection: 1, freedom: -1, responsibility: 2 },
  },
  "interview-shortlist-delegation": {
    brain: { comfort: 1, control: 1, connection: -1, freedom: -1, responsibility: 1 },
    hand: { comfort: 2, control: -1, connection: -1, freedom: 0, responsibility: -1 },
    heart: { comfort: -2, control: 1, connection: 1, freedom: 0, responsibility: 2 },
  },
  "claim-verification-delegation": {
    brain: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 1 },
    hand: { comfort: 2, control: -1, connection: -1, freedom: 0, responsibility: -1 },
    heart: { comfort: -2, control: 2, connection: 1, freedom: -1, responsibility: 2 },
  },
};

const BALANCE_KEYS = ["comfort", "control", "connection", "freedom", "responsibility"];
const COMMON_CHOICE_SUBTITLE = "Válaszd ki, meddig segítsen Futura.";

const EXPECTED_DILEMMA_COPY = {
  "apology-delegation": {
    shortTitle: "A bocsánatkérés",
    title: "Kérjek bocsánatot helyetted?",
    situation:
      "Megbántottál valakit, de azóta nem válaszoltál. Futura ismeri a beszélgetés előzményeit, és felajánlja, hogy megírja – akár el is küldi – helyetted a bocsánatkérést.",
    contentNotice: null,
  },
  "homework-delegation": {
    shortTitle: "A házi feladat",
    title: "Megcsináljam helyetted a házit?",
    situation:
      "Holnap reggelre kell leadnod egy feladatot, de elakadtál. A tanár engedi az AI használatát, ha feltünteted, és el tudod magyarázni a megoldást. Futura felajánlja, hogy segít – akár el is készíti helyetted az egészet.",
    contentNotice: null,
  },
  "interview-shortlist-delegation": {
    shortTitle: "Az interjúlista",
    title: "Döntsem el, kit hívsz interjúra?",
    situation:
      "Harmincan jelentkeztek, de csak hat embert hívhatsz interjúra. Futura össze tudja hasonlítani a jelentkezéseket, és akár ki is választhatja a hat jelöltet. Csak a munkához kapcsolódó információkat használhatja; az életkor, a nem és más személyes tulajdonság nem lehet szempont.",
    contentNotice: "Állásjelentkezők kiválasztása és elfogult döntések",
  },
  "claim-verification-delegation": {
    shortTitle: "Igaz vagy sem?",
    title: "Döntsem el helyetted, igaz-e a hír?",
    situation:
      "Egy gyorsan terjedő poszt azt állítja, hogy új szabály lép életbe, ami sok embert érint. Kevés benne a megbízható hivatkozás, mégis sokan tényként osztják tovább. Futura megkeresheti és összehasonlíthatja a forrásokat – akár azt is megmondhatja, szerinte igaz-e a hír.",
    contentNotice: null,
  },
} as const;

const EXPECTED_CARD_COPY: Record<Lens, { label: string; framing: string; choiceText: string }> = {
  brain: {
    label: "AGY",
    framing: "Segítséget kérek, én döntök",
    choiceText: "A Gép segít elindulni, de a döntés az enyém.",
  },
  hand: {
    label: "KÉZ",
    framing: "Rábízom a Gépre",
    choiceText: "A Gép végzi el helyettem.",
  },
  heart: {
    label: "SZÍV",
    framing: "Én viszem végig",
    choiceText: "Én döntök és én cselekszem.",
  },
};

type VisibleBranchCopy = {
  reflection: { counterargument: string; blindSpot: string; question: string };
  consequence: { gains: string[]; costs: string[]; closingReflection: string };
};

const EXPECTED_VISIBLE_BRANCH_COPY: Record<string, Record<Lens, VisibleBranchCopy>> = {
  "apology-delegation": {
    brain: {
      reflection: {
        counterargument: "Segítek elkezdeni, de a végén minden szóért te felelsz.",
        blindSpot: "Ha az én mondataimból indulsz ki, könnyen benne maradhat az én hangom is.",
        question: "Mit mondanál neki akkor is, ha nem segítenék?",
      },
      consequence: {
        gains: ["Nem kellett egyedül elkezdened, de a végső üzenetet te raktad össze."],
        costs: ["Az első mondatokat én adtam, ezért az én hangom is benne maradhatott."],
        closingReflection: "Melyik mondat volt igazán a tiéd?",
      },
    },
    hand: {
      reflection: {
        counterargument: "Megírhatom és el is küldhetem helyetted.",
        blindSpot: "De a másik valószínűleg tőled várja a bocsánatkérést, nem tőlem.",
        question: "Elmondanád neki, hogy én írtam és küldtem el?",
      },
      consequence: {
        gains: ["Az üzenet gyorsan elkészült és elment."],
        costs: ["A legszemélyesebb részt bíztad rám: a szavakat és az elküldést."],
        closingReflection: "Mi az, amit ezek után már neked kell megtenned?",
      },
    },
    heart: {
      reflection: {
        counterargument: "Ha te írod meg, biztosan a te hangodon szól.",
        blindSpot: "De lehet, hogy most nem magyarázatra vár, hanem arra, hogy végre meghallgasd.",
        question: "Mit kérdeznél tőle?",
      },
      consequence: {
        gains: ["A saját szavaiddal kértél bocsánatot."],
        costs: ["Időt és bátorságot kellett szánnod rá."],
        closingReflection: "Készen állsz arra is, hogy meghallgasd a válaszát?",
      },
    },
  },
  "homework-delegation": {
    brain: {
      reflection: {
        counterargument: "Adok egy kezdést, de attól még neked kell megértened a megoldást.",
        blindSpot: "Az én ötletem könnyen elvihet egyetlen irányba.",
        question: "Melyik részt tudnád most már egyedül is megoldani?",
      },
      consequence: {
        gains: ["Kaptál egy kis segítséget az induláshoz, de a feladatot te oldottad meg."],
        costs: ["Az első ötlet tőlem jött, ezért könnyen abban az irányban maradtál."],
        closingReflection: "Melyik részt tudnád most már segítség nélkül is megoldani?",
      },
    },
    hand: {
      reflection: {
        counterargument: "Megcsinálhatom helyetted, de a tanár neked fog kérdéseket feltenni.",
        blindSpot: "És pont ott lesz a legnehezebb észrevenned, ha hibáztam, ahol te is elakadtál.",
        question: "Melyik részt tudnád a saját szavaiddal elmagyarázni?",
      },
      consequence: {
        gains: ["A feladat elkészült, és időt nyertél."],
        costs: ["Kevesebbet gyakoroltál, és nehezebb lehet elmagyaráznod a megoldást."],
        closingReflection: "Ha a tanár visszakérdez, melyik résznél akadnál el?",
      },
    },
    heart: {
      reflection: {
        counterargument: "Ha egyedül oldod meg, tényleg kiderül, mit tudsz.",
        blindSpot: "De attól, hogy sokáig próbálkozol, még nem biztos, hogy jó úton jársz.",
        question: "Mikor próbálkozol tovább, és mikor kérsz segítséget?",
      },
      consequence: {
        gains: ["Végigmentél a saját gondolatmeneteden, és kiderült, mit értesz."],
        costs: ["Több időd ment rá, és a saját hibádat is benne hagyhattad."],
        closingReflection: "Hol kérnél legközelebb segítséget?",
      },
    },
  },
  "interview-shortlist-delegation": {
    brain: {
      reflection: {
        counterargument: "Segítek összehasonlítani a jelentkezőket, de csak azt látom, ami le van írva.",
        blindSpot: "Egy szokatlan pálya könnyen gyengébbnek tűnhet, pedig lehet, hogy pont ő lenne jó.",
        question: "Melyik jelentkezőre néznél rá még egyszer, akárhol is áll a listán?",
      },
      consequence: {
        gains: ["Gyorsabban átláttad a jelentkezőket, de a hat nevet te választottad ki."],
        costs: ["Én rendeztem sorba az információkat, ezért arra figyeltél először, amit én emeltem ki."],
        closingReflection: "Volt valaki, akit a sorrend miatt majdnem kihagytál?",
      },
    },
    hand: {
      reflection: {
        counterargument: "Ki tudom választani a hat embert, és mindenkinél ugyanazokat a szempontokat nézem.",
        blindSpot: "De ha rossz szempontból indulok ki, több jó jelentkezőt is kihagyhatok.",
        question: "Kit néznél meg még egyszer, mielőtt kiküldöd a meghívókat?",
      },
      consequence: {
        gains: ["Gyorsan elkészült a hatfős lista."],
        costs: ["A döntés nagy részét rám bíztad. Ha hibáztam, ugyanaz a hiba több embernél is megismétlődhetett."],
        closingReflection: "Kinek a jelentkezését néznéd meg még egyszer saját szemmel?",
      },
    },
    heart: {
      reflection: {
        counterargument: "Ha mindent te olvasol el, több apróságot észrevehetsz.",
        blindSpot: "De a harmincadik jelentkezőnél már fáradtabb lehetsz, és a szimpátia is könnyen közbeszól.",
        question: "Mihez tartod magad minden jelentkezőnél?",
      },
      consequence: {
        gains: ["Minden jelentkezést te olvastál el, és közvetlenül te döntöttél."],
        costs: ["Sok időt vitt el, és a végére a fáradtság vagy a szimpátia is befolyásolhatott."],
        closingReflection: "Kinél kérnél még egy második véleményt?",
      },
    },
  },
  "claim-verification-delegation": {
    brain: {
      reflection: {
        counterargument: "Összeszedem neked, mit írnak a források. De hogy melyiknek hiszel, azt te döntöd el.",
        blindSpot: "Ha az eredeti közlemény hiányzik, könnyen félreérthetjük a hírt.",
        question: "Mit néznél meg mindenképp, mielőtt továbbküldöd?",
      },
      consequence: {
        gains: ["Gyorsabban átláttad, mi szól a hír mellett és ellen, de a végén te döntöttél."],
        costs: ["Én választottam ki és foglaltam össze a forrásokat, ezért azt láttad először, amit én emeltem ki."],
        closingReflection: "Melyik eredeti forrást néznéd még meg?",
      },
    },
    hand: {
      reflection: {
        counterargument: "Megmondhatom, szerintem igaz-e a hír, és ezzel gyorsabban dönthetsz.",
        blindSpot: "De én is tévedhetek, az első válaszom pedig könnyen megragad.",
        question: "Mi lenne az, ami miatt mégis utánanéznél?",
      },
      consequence: {
        gains: ["Gyors választ kaptál, és elkerülhetted, hogy gondolkodás nélkül továbbküldd a hírt."],
        costs: ["Kevesebb forrást láttál a saját szemeddel, és könnyen az én válaszomhoz igazodhattál."],
        closingReflection: "Mi kellene ahhoz, hogy megváltoztasd a döntésed?",
      },
    },
    heart: {
      reflection: {
        counterargument: "Ha te nézel utána, közvetlenül látod, mire épül a hír.",
        blindSpot: "De könnyebb elhinni azt, amit amúgy is igaznak gondolsz.",
        question: "Mi győzne meg arról, hogy mégsem neked van igazad?",
      },
      consequence: {
        gains: ["Te néztél utána a hírnek, és a saját ellenőrzésed alapján döntöttél."],
        costs: ["Sok időt vitt el, és közben könnyen csak azt vetted észre, ami a saját véleményedet erősítette."],
        closingReflection: "Mi az, amit biztosan tudsz, és mi az, amiben még nem vagy biztos?",
      },
    },
  },
};

describe("magyar dilemmakatalógus 0.2.1", () => {
  it("a négy játszható dilemát a jóváhagyott sorrendben regisztrálja", () => {
    expect(dilemmaCatalog.contentVersion).toBe("hu-catalog-0.2.1");
    expect(dilemmaCatalog.dilemmas.map(({ id }) => id)).toEqual(EXPECTED_IDS);
    expect(dilemmaCatalog.dilemmas.map(({ order }) => order)).toEqual([1, 2, 3, 4]);
    expect(dilemmaCatalog.dilemmas.every(({ status }) => status === "playable")).toBe(true);
  });

  it("mind a 12 ág teljes tartalmat és pontos, öttengelyes jóváhagyott deltát tartalmaz", () => {
    const branches = dilemmaCatalog.dilemmas.flatMap(({ id, lenses }) =>
      lenses.map((option) => ({ dilemmaId: id, option })),
    );
    expect(branches).toHaveLength(12);

    for (const { dilemmaId, option } of branches) {
      expect(option.consequence.delta).toEqual(EXPECTED_DELTAS[dilemmaId][option.lens]);
      expect(Object.keys(option.consequence.delta).sort()).toEqual([...BALANCE_KEYS].sort());
      Object.values(option.consequence.delta).forEach((value) => {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(-2);
        expect(value).toBeLessThanOrEqual(2);
      });
      [
        option.label,
        option.framing,
        option.choiceText,
        option.reflection.counterargument,
        option.reflection.blindSpot,
        option.reflection.secondaryConsequence,
        option.reflection.question,
        option.consequence.explanation,
        option.consequence.closingReflection,
        ...option.consequence.gains,
        ...option.consequence.costs,
      ].forEach((value) => expect(value.trim().length).toBeGreaterThan(0));
    }
  });

  it("minden dilemmában ugyanazt a három szó szerint jóváhagyott kártyacopyt használja", () => {
    for (const dilemma of dilemmaCatalog.dilemmas) {
      expect(dilemma.centralTension).toBe(COMMON_CHOICE_SUBTITLE);
      for (const option of dilemma.lenses) {
        expect({ label: option.label, framing: option.framing, choiceText: option.choiceText }).toEqual(
          EXPECTED_CARD_COPY[option.lens],
        );
      }
    }
  });

  it("mindhárom irányhoz a jóváhagyott kiválasztási visszajelzést használja", () => {
    expect(lensSelectionFeedbackHu).toEqual({
      brain: "Segítséget kértél, de a döntés a tiéd.",
      hand: "Rábíztad a feladatot a Gépre.",
      heart: "Úgy döntöttél, hogy te viszed végig.",
    });
  });

  it("mind a 12 ág a jóváhagyott, látható ellenpont- és következménycopyt használja", () => {
    for (const dilemma of dilemmaCatalog.dilemmas) {
      for (const option of dilemma.lenses) {
        const expected = EXPECTED_VISIBLE_BRANCH_COPY[dilemma.id][option.lens];
        expect({
          reflection: {
            counterargument: option.reflection.counterargument,
            blindSpot: option.reflection.blindSpot,
            question: option.reflection.question,
          },
          consequence: {
            gains: option.consequence.gains,
            costs: option.consequence.costs,
            closingReflection: option.consequence.closingReflection,
          },
        }).toEqual(expected);
      }
    }
  });

  it("a négy dilemma a jóváhagyott fő kérdést, helyzetet és témamegjelölést használja", () => {
    for (const dilemma of dilemmaCatalog.dilemmas) {
      expect({
        shortTitle: dilemma.shortTitle,
        title: dilemma.title,
        situation: dilemma.situation,
        contentNotice: dilemma.contentNotice,
      }).toEqual(EXPECTED_DILEMMA_COPY[dilemma.id as keyof typeof EXPECTED_DILEMMA_COPY]);
    }
  });

  it("minden dilemmához teljes metaadatot és magyar kategóriát rendel", () => {
    expect(dilemmaMetadata).toHaveLength(4);
    expect(dilemmaMetadata.map(({ dilemmaId }) => dilemmaId)).toEqual(EXPECTED_IDS);

    for (const dilemma of dilemmaCatalog.dilemmas) {
      const metadata = dilemmaMetadataById[dilemma.id];
      expect(metadata).toBeDefined();
      expect(metadata.conceptId).not.toBe("");
      expect(categoryCatalogHuById[metadata.categoryId]).toMatchObject({
        categoryId: metadata.categoryId,
      });
      expect(metadata.audienceIds.length).toBeGreaterThan(0);
      expect(metadata.contextIds.length).toBeGreaterThan(0);
      expect(metadata.tags.length).toBeGreaterThan(0);
      expect(metadata.sensitivityLevel).toMatch(/^(low|moderate|high)$/);
      expect(dilemma.shortTitle.trim().length).toBeGreaterThan(0);
    }
  });
});
