import type {
  Consequence,
  Lens,
  PublicDilemma,
  ReflectionContent,
} from "../domain/gameTypes";

export const UI_LOCALES = ["hu", "en"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

type TranslationShape<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [K in keyof T]: TranslationShape<T[K]> }
    : T extends object
      ? { [K in keyof T]: TranslationShape<T[K]> }
      : T;

const huCopy = {
  language: {
    selectorLabel: "Nyelv kiválasztása",
    huLabel: "Magyar",
    enLabel: "Angol",
  },
  app: {
    ariaLabel: "Ember maradsz? — Szív a gépben",
    unknownError: "Ismeretlen játékmenet-hiba.",
  },
  sound: {
    controlLabel: "Hang",
    mute: "Hang némítása",
    unmute: "Hang visszakapcsolása",
  },
  errors: {
    sessionQuery: "Nincs ilyen aktív játékmenet.",
    sessionRequired: "Nincs aktív játékmenet.",
    sessionIdMismatch: "A sessionazonosító nem egyezik.",
    presentDilemmaPhase: "Ebben a fázisban nem mutatható be dilemma.",
    noDilemma: "Nincs bemutatható dilemma.",
    selectPhase: "Ebben a fázisban a játékos nem jelölhet irányt.",
    unknownLens: "Ismeretlen döntési irány.",
    selectionRequired: "Előbb a játékosnak kell kijelölnie egy irányt.",
    selectionMismatch: "A kijelölésazonosító nem az aktuális választáshoz tartozik.",
    reflectionPhase: "Ebben a fázisban nem mutatható be új reflexió.",
    reflectionUnavailable: "Nincs játékos által megtartható reflexió.",
    reflectionIdMismatch: "A reflexióazonosító nem aktuális.",
    reflectionMissing: "Hiányzó reflexió.",
    confirmationRequiresReflection: "A döntés csak megtartott reflexió után erősíthető meg.",
    reflectionNotKept: "A reflexiót a játékos még nem tartotta meg.",
    revealRequiresHuman: "Következmény csak véglegesen megerősített emberi döntés után tárható fel.",
    confirmedDecisionMissing: "Hiányzik a megerősített döntés.",
    decisionIdMismatch: "A döntésazonosító nem egyezik.",
    consequenceMissing: "A döntés következménye hiányzik.",
    decisionMissing: "Hiányzó döntés.",
    restartPhase: "Új játék csak a befejezés után indítható.",
    activeDilemmaMissing: "Nincs bemutatott aktuális dilemma.",
    staleRevision: "Az állapot időközben megváltozott.",
    reflectionNotFound: "A reflexió nem található.",
    reflectionContentMissing: "A reflexiós tartalom hiányzik.",
    contentVersion: "A session tartalomverziója nem kompatibilis.",
    activeStateWithoutDilemma: "Kiválasztható vagy aktív állapot nem létezhet bemutatott dilemma nélkül.",
    dilemmaNotInCatalog: "Az aktív dilemma nem található a katalógusban.",
    unexpectedSelection: "A kijelölésre váró állapot már tartalmaz kijelölést.",
    playerSelectionMissing: "Hiányzik a játékosi kijelölés.",
    linkedReflectionMissing: "Hiányzik az aktuális kijelöléshez kötött reflexió.",
    playerMustKeepReflection: "A reflexiót kizárólag a játékos tarthatja meg.",
    humanConfirmationMissing: "Nincs érvényes emberi megerősítés.",
    revealReceiptIncomplete: "A feltárt következmény bizonylata hiányos.",
    duplicateEffect: "Egy döntés hatása többször szerepel.",
  },
  landing: {
    overline: "Interaktív döntésjáték",
    title: "Ember maradsz?",
    subtitle: "Szív a gépben",
    tagline: "A Gép javasol. Te döntesz. A mérleg emlékszik.",
    entryTagline: "A Gép javasol. Te döntesz.",
    introTitle: "A Gépváros készen áll.",
    introBody: "Itt mindig te döntesz.",
    enter: "Belépek a Gépvárosba",
  },
  futura: {
    status: "FUTURA KAPCSOLÓDVA",
    statusAriaLabel: "Futura kapcsolódási állapota",
    heading: "Hoztam neked egy kérdést.",
    body: "Megmutatom, mit választhatsz, és azt is, mivel járhat a döntésed. De te döntöd el, meddig segíthetek.",
    showQuestion: "Mutasd a kérdést",
  },
  dilemma: {
    arrival: "Új kérdés érkezett a Gépvárosból",
    topicPrefix: "Téma:",
    showOptions: "Megnézem a lehetőségeket",
  },
  guide: {
    heading: "Te döntöd el, mennyit bízol Futurára",
    lenses: {
      brain: "Segít elindulni, te döntesz.",
      hand: "Futura elvégzi helyetted.",
      heart: "Te döntesz és te cselekszel.",
    },
    continue: "Értem, jöhet az első kérdés",
  },
  choice: {
    heading: "Mit bíznál Futurára?",
    instruction: "Válaszd ki, meddig segítsen Futura.",
    groupLabel: "Mit bíznál Futurára? Válassz egy döntési irányt.",
    help: "Mit jelent az AGY–KÉZ–SZÍV?",
    selectedKicker: "Még nem végleges",
    selectedBody: "Mielőtt döntesz, nézzük meg a másik oldalát is.",
    selectedGroupLabel: "Kijelölt döntési irány módosítása",
    showCounterpoint: "Mutasd a másik oldalát",
    footprint: "Te állsz itt",
    selectedSuffix: "Kijelölve.",
    feedback: {
      brain: "Segítséget kértél, de a döntés a tiéd.",
      hand: "Rábíztad a feladatot a Gépre.",
      heart: "Úgy döntöttél, hogy te viszed végig.",
    },
  },
  counterpoint: {
    kicker: "Futura kérdez",
    heading: "Biztosan ezt választod?",
    actionsLabel: "Döntés az ellenpont után",
    keep: {
      brain: "Maradok az AGY mellett",
      hand: "Maradok a KÉZ mellett",
      heart: "Maradok a SZÍV mellett",
    },
    keepFallback: "Maradok ennél az iránynál",
    reconsider: "Másik irányt választok",
  },
  confirmation: {
    threshold: "Futura itt megáll",
    kicker: "Végleges döntés",
    heading: "Te mondod ki a végső szót.",
    reasonLabel: "Miért ezt választottad?",
    reasonOptional: "Nem kötelező válaszolni.",
    reasonAriaLabel: "Miért ezt választottad? Nem kötelező válaszolni.",
    actionsLabel: "Végleges emberi döntés",
    changeChoice: "Másik irányt választok",
    confirm: "Vállalom ezt a döntést",
  },
  sealed: {
    kicker: "Döntésed rögzítve",
    body: "A döntés végleges. Most megnézheted, mivel jár.",
    reveal: "Megnézem, mivel jár",
  },
  outcome: {
    heading: "Mit nyertél vele – és mi volt az ára?",
    gainLabel: "Mit nyertél vele?",
    costLabel: "Mi volt az ára?",
    showBalance: "Megnézem az Embermérleget",
  },
  balance: {
    kicker: "Embermérleg",
    heading: "A döntéseid nyoma",
    note: "Ez nem pontszám. Azt mutatja, mit tartottál meg magadnál, és mit bíztál a Gépre.",
    axes: {
      comfort: "Kényelem",
      control: "Kontroll",
      connection: "Kapcsolódás",
      freedom: "Szabadság",
      responsibility: "Felelősség",
    },
    roundMemory: "A döntéseid nyomot hagytak. A mérleg emlékszik.",
    gameComplete: "A játék véget ért. Négy helyzetben döntöttél arról, mennyit bízol a Gépre.",
    nextQuestion: "Jöhet a következő kérdés",
    physicalCompanion: "Ismerd meg a fizikai kísérőterméket",
    endGame: "Lezárom a játékot",
    restart: "Új játékot kezdek",
  },
  cards: {
    lenses: {
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
    },
    stateLabels: {
      selected: "kijelölve",
      reflection: "ellenpont feltárva",
      stamped: "emberileg megtartva",
      sealed: "végleg megerősítve",
      outcome: "következmény feltárva",
    },
    cardAriaLabel: "döntési kártya",
    keptSeal: "MEGTARTVA",
    sealedSeal: "LEZÁRVA",
  },
  dilemmas: {
    "apology-delegation": {
      shortTitle: "A bocsánatkérés",
      title: "Kérjek bocsánatot helyetted?",
      situation: "Megbántottál valakit, de azóta nem válaszoltál. Futura ismeri a beszélgetés előzményeit, és felajánlja, hogy megírja – akár el is küldi – helyetted a bocsánatkérést.",
      contentNotice: null,
      branches: {
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
    },
    "homework-delegation": {
      shortTitle: "A házi feladat",
      title: "Megcsináljam helyetted a házit?",
      situation: "Holnap reggelre kell leadnod egy feladatot, de elakadtál. A tanár engedi az AI használatát, ha feltünteted, és el tudod magyarázni a megoldást. Futura felajánlja, hogy segít – akár el is készíti helyetted az egészet.",
      contentNotice: null,
      branches: {
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
    },
    "interview-shortlist-delegation": {
      shortTitle: "Az interjúlista",
      title: "Döntsem el, kit hívsz interjúra?",
      situation: "Harmincan jelentkeztek, de csak hat embert hívhatsz interjúra. Futura össze tudja hasonlítani a jelentkezéseket, és akár ki is választhatja a hat jelöltet. Csak a munkához kapcsolódó információkat használhatja; az életkor, a nem és más személyes tulajdonság nem lehet szempont.",
      contentNotice: "Állásjelentkezők kiválasztása és elfogult döntések",
      branches: {
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
    },
    "claim-verification-delegation": {
      shortTitle: "Igaz vagy sem?",
      title: "Döntsem el helyetted, igaz-e a hír?",
      situation: "Egy gyorsan terjedő poszt azt állítja, hogy új szabály lép életbe, ami sok embert érint. Kevés benne a megbízható hivatkozás, mégis sokan tényként osztják tovább. Futura megkeresheti és összehasonlíthatja a forrásokat – akár azt is megmondhatja, szerinte igaz-e a hír.",
      contentNotice: null,
      branches: {
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
    },
  },
} as const;

const enCopy: TranslationShape<typeof huCopy> = {
  language: {
    selectorLabel: "Choose language",
    huLabel: "Hungarian",
    enLabel: "English",
  },
  app: {
    ariaLabel: "Will You Stay Human? — Heart in the Machine",
    unknownError: "An unknown game error occurred.",
  },
  sound: {
    controlLabel: "Sound",
    mute: "Mute sound",
    unmute: "Turn sound back on",
  },
  errors: {
    sessionQuery: "No matching active game session was found.",
    sessionRequired: "There is no active game session.",
    sessionIdMismatch: "The session ID does not match.",
    presentDilemmaPhase: "A dilemma cannot be presented at this stage.",
    noDilemma: "There is no dilemma available to present.",
    selectPhase: "The player cannot choose a direction at this stage.",
    unknownLens: "Unknown decision direction.",
    selectionRequired: "The player must choose a direction first.",
    selectionMismatch: "The selection ID does not belong to the current choice.",
    reflectionPhase: "A new counterpoint cannot be presented at this stage.",
    reflectionUnavailable: "There is no counterpoint available for the player to keep.",
    reflectionIdMismatch: "The counterpoint ID is no longer current.",
    reflectionMissing: "The counterpoint is missing.",
    confirmationRequiresReflection: "The decision can only be confirmed after the counterpoint has been kept.",
    reflectionNotKept: "The player has not kept the counterpoint yet.",
    revealRequiresHuman: "A consequence can only be revealed after a final human confirmation.",
    confirmedDecisionMissing: "The confirmed decision is missing.",
    decisionIdMismatch: "The decision ID does not match.",
    consequenceMissing: "The consequence for this decision is missing.",
    decisionMissing: "The decision is missing.",
    restartPhase: "A new game can only begin after the current game has ended.",
    activeDilemmaMissing: "There is no current presented dilemma.",
    staleRevision: "The game state has changed in the meantime.",
    reflectionNotFound: "The counterpoint could not be found.",
    reflectionContentMissing: "The counterpoint content is missing.",
    contentVersion: "The session content version is incompatible.",
    activeStateWithoutDilemma: "A selectable or active state cannot exist without a presented dilemma.",
    dilemmaNotInCatalog: "The active dilemma could not be found in the catalog.",
    unexpectedSelection: "A state awaiting selection already contains a selection.",
    playerSelectionMissing: "The player’s selection is missing.",
    linkedReflectionMissing: "The counterpoint linked to the current selection is missing.",
    playerMustKeepReflection: "Only the player can keep the counterpoint.",
    humanConfirmationMissing: "There is no valid human confirmation.",
    revealReceiptIncomplete: "The revealed consequence record is incomplete.",
    duplicateEffect: "The effect of one decision appears more than once.",
  },
  landing: {
    overline: "An interactive decision game",
    title: "Will You Stay Human?",
    subtitle: "Heart in the Machine",
    tagline: "The Machine suggests. You decide. The Balance remembers.",
    entryTagline: "The Machine suggests. You decide.",
    introTitle: "Machine City is ready.",
    introBody: "Here, you always decide.",
    enter: "Enter Machine City",
  },
  futura: {
    status: "FUTURA CONNECTED",
    statusAriaLabel: "Futura connection status",
    heading: "I have a question for you.",
    body: "I’ll show you the choices—and where each one could lead. But you decide how much help you want from me.",
    showQuestion: "Show me the question",
  },
  dilemma: {
    arrival: "A new question has arrived from Machine City",
    topicPrefix: "Topic:",
    showOptions: "Show me the choices",
  },
  guide: {
    heading: "You decide how much to entrust to Futura",
    lenses: {
      brain: "Helps you get started. You decide.",
      hand: "The Machine does it for you.",
      heart: "You decide and you act.",
    },
    continue: "Got it. Show me the choices",
  },
  choice: {
    heading: "What would you trust Futura with?",
    instruction: "Choose how much you want Futura to take on.",
    groupLabel: "What would you trust Futura with? Choose a direction.",
    help: "What do MIND, HAND and HEART mean?",
    selectedKicker: "Not final yet",
    selectedBody: "Before you decide, let’s look at the other side.",
    selectedGroupLabel: "Change the selected direction",
    showCounterpoint: "Show me the other side",
    footprint: "You are here",
    selectedSuffix: "Selected.",
    feedback: {
      brain: "You asked for help, but the decision is yours.",
      hand: "You left the task to the Machine.",
      heart: "You decided to see it through yourself.",
    },
  },
  counterpoint: {
    kicker: "Futura asks",
    heading: "Are you sure this is your choice?",
    actionsLabel: "Decision after the counterpoint",
    keep: {
      brain: "Continue with MIND",
      hand: "Continue with HAND",
      heart: "Continue with HEART",
    },
    keepFallback: "I’m sticking with this direction",
    reconsider: "Choose another direction",
  },
  confirmation: {
    threshold: "Futura stops here",
    kicker: "Final decision",
    heading: "You have the final say.",
    reasonLabel: "Why did you choose this?",
    reasonOptional: "You don’t have to answer.",
    reasonAriaLabel: "Why did you choose this? You don’t have to answer.",
    actionsLabel: "Final human decision",
    changeChoice: "Change my choice",
    confirm: "Confirm",
  },
  sealed: {
    kicker: "Your decision is recorded",
    body: "Your decision is final. Now you can see where it leads.",
    reveal: "Show me what it leads to",
  },
  outcome: {
    heading: "What did you gain—and what did it cost?",
    gainLabel: "What did you gain?",
    costLabel: "What did it cost?",
    showBalance: "Show me the Human Balance",
  },
  balance: {
    kicker: "Human Balance",
    heading: "The mark your choices leave",
    note: "This isn’t a score. It shows what you kept for yourself—and what you handed to the Machine.",
    axes: {
      comfort: "Convenience",
      control: "Control",
      connection: "Connection",
      freedom: "Freedom",
      responsibility: "Responsibility",
    },
    roundMemory: "Your choices left a mark. The Balance remembers.",
    gameComplete: "The game is over. In four situations, you decided how much to entrust to the Machine.",
    nextQuestion: "Bring on the next question",
    physicalCompanion: "Meet the physical companion",
    endGame: "End the game",
    restart: "Start a new game",
  },
  cards: {
    lenses: {
      brain: {
        label: "MIND",
        framing: "I ask for help. I decide.",
        choiceText: "The Machine helps me get started, but the decision is mine.",
      },
      hand: {
        label: "HAND",
        framing: "I leave it to the Machine",
        choiceText: "The Machine does it for me.",
      },
      heart: {
        label: "HEART",
        framing: "I see it through",
        choiceText: "I decide and I act.",
      },
    },
    stateLabels: {
      selected: "selected",
      reflection: "counterpoint revealed",
      stamped: "kept by the player",
      sealed: "finally confirmed",
      outcome: "consequence revealed",
    },
    cardAriaLabel: "decision card",
    keptSeal: "KEPT",
    sealedSeal: "SEALED",
  },
  dilemmas: {
    "apology-delegation": {
      shortTitle: "An apology to someone you hurt",
      title: "Should I apologize on your behalf?",
      situation: "You hurt someone and haven’t responded since. Futura knows the context of the conversation and offers to draft an apology—or even send it on your behalf.",
      contentNotice: null,
      branches: {
        brain: {
          reflection: {
            counterargument: "I can help you get started, but you’re still responsible for every word.",
            blindSpot: "If you begin with my words, my voice may still come through.",
            question: "What would you say even if I didn’t help?",
          },
          consequence: {
            gains: ["You didn’t have to start alone, but you shaped the final message yourself."],
            costs: ["The opening lines came from me, so my voice may still come through."],
            closingReflection: "Which sentence felt most like your own?",
          },
        },
        hand: {
          reflection: {
            counterargument: "I can write it and send it for you.",
            blindSpot: "But they’re probably waiting for an apology from you, not from me.",
            question: "Would you tell them that I wrote and sent it?",
          },
          consequence: {
            gains: ["The message was written and sent quickly."],
            costs: ["You handed me the most personal part: the words—and sending them."],
            closingReflection: "What do you still need to do yourself?",
          },
        },
        heart: {
          reflection: {
            counterargument: "If you write it yourself, it will sound like you.",
            blindSpot: "But they may not need an explanation. They may need you to finally listen.",
            question: "What would you ask them?",
          },
          consequence: {
            gains: ["You apologized in your own words."],
            costs: ["It took time and courage."],
            closingReflection: "Are you ready to hear their response, too?",
          },
        },
      },
    },
    "homework-delegation": {
      shortTitle: "The homework",
      title: "Should I do your homework for you?",
      situation: "Your assignment is due tomorrow morning, and you’re stuck. Your teacher allows you to use AI as long as you disclose it and can explain the solution. Futura offers to help—or even complete the whole assignment for you.",
      contentNotice: null,
      branches: {
        brain: {
          reflection: {
            counterargument: "I can give you a starting point, but you still need to understand the solution.",
            blindSpot: "My first idea can easily steer you down a single path.",
            question: "Which part could you solve on your own now?",
          },
          consequence: {
            gains: ["You got a little help getting started, but you solved the assignment yourself."],
            costs: ["The first idea came from me, so it was easy to stay on my path."],
            closingReflection: "Which part could you solve without help now?",
          },
        },
        hand: {
          reflection: {
            counterargument: "I can do it for you, but you’ll have to answer your teacher’s questions.",
            blindSpot: "The hardest place for you to spot my mistake is exactly where you got stuck.",
            question: "Which part could you explain in your own words?",
          },
          consequence: {
            gains: ["The assignment was finished, and you saved time."],
            costs: ["You had less practice, so explaining the solution may be harder."],
            closingReflection: "If your teacher asks a follow-up, where would you get stuck?",
          },
        },
        heart: {
          reflection: {
            counterargument: "If you solve it alone, you’ll find out what you really know.",
            blindSpot: "But spending a long time on it doesn’t mean you’re on the right track.",
            question: "When do you keep trying, and when do you ask for help?",
          },
          consequence: {
            gains: ["You worked through your own reasoning and discovered what you truly understood."],
            costs: ["It took more time, and you may have left your own mistakes in the answer."],
            closingReflection: "Where would you ask for help next time?",
          },
        },
      },
    },
    "interview-shortlist-delegation": {
      shortTitle: "The interview shortlist",
      title: "Should I decide who gets an interview?",
      situation: "Thirty people applied, but you can only interview six. Futura can compare the applications and even choose the six candidates. It may only use job-related information; age, gender, and other personal characteristics must not be considered.",
      contentNotice: "Choosing job candidates and biased decisions",
      branches: {
        brain: {
          reflection: {
            counterargument: "I can help compare the applicants, but I only see what’s written down.",
            blindSpot: "A candidate with an unusual career path may look weaker on paper—even if they’re right for the job.",
            question: "Which applicant would you take another look at, regardless of where they rank?",
          },
          consequence: {
            gains: ["You reviewed the applicants faster, but you chose the six names yourself."],
            costs: ["I decided how the information was ordered, so you saw what I highlighted first."],
            closingReflection: "Did the ranking almost make you overlook anyone?",
          },
        },
        hand: {
          reflection: {
            counterargument: "I can choose the six candidates and use the same criteria for everyone.",
            blindSpot: "But if I use the wrong criteria, I may leave out several strong candidates.",
            question: "Who would you review again before sending the invitations?",
          },
          consequence: {
            gains: ["The six-person shortlist was ready quickly."],
            costs: ["You handed most of the decision to me. If I made a mistake, it may have affected several people in the same way."],
            closingReflection: "Whose application would you look at again yourself?",
          },
        },
        heart: {
          reflection: {
            counterargument: "If you read everything yourself, you may notice more subtle details.",
            blindSpot: "By the thirtieth application, you may be tired—and personal impressions can easily sway you.",
            question: "What criteria will you use for every applicant?",
          },
          consequence: {
            gains: ["You read every application and made the final decision yourself."],
            costs: ["It took a lot of time, and by the end, fatigue or personal impressions may have influenced you."],
            closingReflection: "Whose application would you ask someone else to review?",
          },
        },
      },
    },
    "claim-verification-delegation": {
      shortTitle: "True or False?",
      title: "Should I decide whether the claim is true?",
      situation: "A fast-spreading post claims that a new rule affecting many people is about to take effect. It cites few reliable sources, yet many people are sharing it as fact. Futura can find and compare the sources—and even tell you whether the claim appears to be true.",
      contentNotice: null,
      branches: {
        brain: {
          reflection: {
            counterargument: "I’ll gather what the sources say. But you decide which ones to trust.",
            blindSpot: "Without the original announcement, it’s easy to misunderstand the claim.",
            question: "What would you check before sharing it?",
          },
          consequence: {
            gains: ["You saw the evidence for and against the claim faster, but you made the final call."],
            costs: ["I chose and summarized the sources, so you saw what I highlighted first."],
            closingReflection: "Which primary source would you check next?",
          },
        },
        hand: {
          reflection: {
            counterargument: "I can tell you whether I think the claim is true, so you can decide faster.",
            blindSpot: "But I can be wrong, and my first answer can be hard to shake.",
            question: "What would make you look into it anyway?",
          },
          consequence: {
            gains: ["You got a quick answer and avoided sharing the claim without a second thought."],
            costs: ["You saw fewer sources yourself and may have relied too heavily on my answer."],
            closingReflection: "What would make you change your mind?",
          },
        },
        heart: {
          reflection: {
            counterargument: "If you investigate the claim yourself, you see the evidence firsthand.",
            blindSpot: "But it’s easier to believe something you already think is true.",
            question: "What would convince you that you were wrong?",
          },
          consequence: {
            gains: ["You checked the claim yourself and made your decision based on what you found."],
            costs: ["It took a lot of time, and you may have focused only on evidence that supported your view."],
            closingReflection: "What do you know for sure—and what are you still unsure about?",
          },
        },
      },
    },
  },
};

export const uiCopy = { hu: huCopy, en: enCopy } as const;
export type UiCopy = TranslationShape<typeof huCopy>;

export type LocalizedChoice = {
  lens: Lens;
  label: string;
  framing: string;
  choiceText: string;
};

export type LocalizedDilemma = Omit<PublicDilemma, "choices"> & {
  choices: LocalizedChoice[];
};

type DilemmaCopy = UiCopy["dilemmas"][keyof UiCopy["dilemmas"]];

function getDilemmaCopy(id: string, locale: UiLocale): DilemmaCopy | null {
  return uiCopy[locale].dilemmas[id as keyof UiCopy["dilemmas"]] ?? null;
}

export function localizeDilemma(dilemma: PublicDilemma, locale: UiLocale): LocalizedDilemma {
  const copy = getDilemmaCopy(dilemma.id, locale);
  if (!copy) return dilemma;
  return {
    ...dilemma,
    shortTitle: copy.shortTitle,
    title: copy.title,
    situation: copy.situation,
    centralTension: uiCopy[locale].choice.instruction,
    contentNotice: copy.contentNotice,
    choices: dilemma.choices.map((choice) => ({
      ...choice,
      ...uiCopy[locale].cards.lenses[choice.lens],
    })),
  };
}

export function localizeReflection(
  dilemmaId: string,
  lens: Lens,
  reflection: ReflectionContent,
  locale: UiLocale,
): ReflectionContent {
  const copy = getDilemmaCopy(dilemmaId, locale);
  if (!copy) return reflection;
  return { ...reflection, ...copy.branches[lens].reflection };
}

export function localizeConsequence(
  dilemmaId: string,
  lens: Lens,
  consequence: Consequence,
  locale: UiLocale,
): Consequence {
  const copy = getDilemmaCopy(dilemmaId, locale);
  if (!copy) return consequence;
  const localized = copy.branches[lens].consequence;
  return {
    ...consequence,
    ...localized,
    gains: [...localized.gains],
    costs: [...localized.costs],
  };
}

export function translateErrorMessage(message: string, locale: UiLocale): string {
  const key = (Object.keys(uiCopy.hu.errors) as Array<keyof UiCopy["errors"]>)
    .find((candidate) => uiCopy.hu.errors[candidate] === message);
  return key ? uiCopy[locale].errors[key] : message;
}
