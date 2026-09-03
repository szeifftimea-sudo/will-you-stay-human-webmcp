import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";

describe("technikai spike UI", () => {
  beforeEach(() => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, "hu");
  });

  it("mentett választás nélkül angolul indul, és nem ír mentést a felhasználó helyett", () => {
    localStorage.removeItem(UI_LOCALE_STORAGE_KEY);
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} />);

    expect(screen.getByRole("heading", { name: "Will You Stay Human?" })).toBeVisible();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hungarian" })).toHaveAttribute("aria-pressed", "false");
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["hu", "Ember maradsz?", "Magyar"],
    ["en", "Will You Stay Human?", "English"],
  ] as const)("a mentett %s nyelvet változtatás nélkül visszaállítja", (savedLocale, heading, languageLabel) => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, savedLocale);
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} />);

    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    expect(screen.getByRole("button", { name: languageLabel })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe(savedLocale);
  });

  it.each([
    ["hu", "Hungarian", "Ember maradsz?", "Magyar"],
    ["en", "English", "Will You Stay Human?", "English"],
  ] as const)("a kifejezetten kiválasztott %s nyelvet új megnyitáskor is megőrzi", (selectedLocale, initialLanguageLabel, heading, restoredLanguageLabel) => {
    localStorage.removeItem(UI_LOCALE_STORAGE_KEY);
    const firstServices = createAppServices(new MemoryGameRepository());
    const firstRender = render(<App services={firstServices} />);

    fireEvent.click(screen.getByRole("button", { name: initialLanguageLabel }));
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe(selectedLocale);
    firstRender.unmount();

    const restoredServices = createAppServices(new MemoryGameRepository());
    render(<App services={restoredServices} />);
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    expect(screen.getByRole("button", { name: restoredLanguageLabel })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe(selectedLocale);
  });

  it("prezentációs nyelvként angolra vált, és újrakezdés után is angol marad", async () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} />);

    expect(screen.getByText("A Gép javasol. Te döntesz.")).toBeVisible();
    expect(screen.queryByText("Interaktív döntésjáték")).not.toBeInTheDocument();
    expect(screen.queryByText("A Gép javasol. Te döntesz. A mérleg emlékszik.")).not.toBeInTheDocument();
    expect(screen.queryByText("A Gépváros készen áll.")).not.toBeInTheDocument();
    expect(screen.queryByText("Itt mindig te döntesz.")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Nyelv kiválasztása" })).toBeVisible();
    const english = screen.getByRole("button", { name: "Angol" });
    expect(english).toHaveTextContent("EN");
    expect(english).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(english);
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe("en");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Will You Stay Human?" })).toBeVisible();
    expect(screen.getByText("The Machine suggests. You decide.")).toBeVisible();
    expect(screen.queryByText("An interactive decision game")).not.toBeInTheDocument();
    expect(screen.queryByText("The Machine suggests. You decide. The Balance remembers.")).not.toBeInTheDocument();
    expect(screen.queryByText("Machine City is ready.")).not.toBeInTheDocument();
    expect(screen.queryByText("Here, you always decide.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Enter Machine City/ }));
    expect(screen.getByRole("heading", { name: "I have a question for you." })).toBeVisible();

    await act(async () => {
      for (let index = 0; index < 4; index += 1) {
        let session = services.engine.getSnapshot()!;
        session = services.agentCommands.presentDilemma(session.sessionId, session.stateRevision).session;
        session = services.playerCommands.selectLens("brain");
        session = services.agentCommands.presentChoiceReflection(
          session.sessionId,
          session.tentativeSelection!.selectionId,
          session.stateRevision,
        ).session;
        session = services.playerCommands.acknowledgeReflection(session.presentedReflection!.reflectionId);
        session = services.playerCommands.confirmDecision();
        services.agentCommands.revealConfirmedConsequence(
          session.sessionId,
          session.confirmedDecision!.decisionId,
          session.stateRevision,
        );
      }
      const session = services.engine.getSnapshot()!;
      services.agentCommands.presentDilemma(session.sessionId, session.stateRevision);
    });

    expect(screen.getByText("The game is over. In four situations, you decided how much to entrust to the Machine.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Start a new game" }));
    expect(screen.getByRole("heading", { name: "Will You Stay Human?" })).toBeVisible();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  });

  it("egy regisztrált WebMCP-tool hívása látható UI-állapotváltozást okoz", async () => {
    const services = createAppServices(new MemoryGameRepository());
    const registered: WebMcpToolDefinition[] = [];
    document.modelContext = {
      registerTool: vi.fn(async (tool) => {
        registered.push(tool);
      }),
    };
    render(<App services={services} />);

    await waitFor(() => expect(registered).toHaveLength(5));
    expect(screen.getByTestId("webmcp-status")).toHaveTextContent("5 WebMCP-tool regisztrálva");
    expect(screen.getByTestId("game-phase")).toHaveTextContent("NO_SESSION");

    const enter = registered.find(({ name }) => name === "enter_machine_city")!;
    let enterResult: unknown;
    await act(async () => {
      enterResult = await enter.execute({}, { signal: new AbortController().signal });
    });
    expect(screen.getByTestId("game-phase")).toHaveTextContent("MACHINE_CITY_READY");

    const entered = enterResult as { sessionId: string; stateRevision: number };
    const present = registered.find(({ name }) => name === "present_dilemma")!;
    await act(async () => {
      await present.execute(
        { sessionId: entered.sessionId, expectedRevision: entered.stateRevision },
        { signal: new AbortController().signal },
      );
    });

    expect(screen.getByTestId("game-phase")).toHaveTextContent("AWAITING_HUMAN_SELECTION");
    expect(screen.getByText("Kérjek bocsánatot helyetted?")).toBeVisible();
    expect(screen.getByRole("button", { name: /Megnézem a lehetőségeket/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /^AGY/ })).not.toBeInTheDocument();
  });

  it("fallbackben is végig megőrzi a külön emberi kontrollpontokat", async () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} />);

    await waitFor(() => expect(screen.getByTestId("webmcp-status")).toHaveTextContent("manuális agentmód"));
    expect(screen.queryByText("FUTURA KAPCSOLÓDVA")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Belépek a Gépvárosba/ }));
    expect(screen.getAllByText(/Futura kapcsolódva/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Hoztam neked egy kérdést." })).toBeVisible();
    expect(screen.getByText("Megmutatom, mit választhatsz, és azt is, mivel járhat a döntésed. De te döntöd el, meddig segíthetek.")).toBeVisible();
    expect(screen.queryByText(/Van egy üzenet, amit átvehetek/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mutasd a kérdést/ }));
    expect(screen.getByRole("heading", { name: "Kérjek bocsánatot helyetted?" })).toBeVisible();
    expect(screen.getByText("Megbántottál valakit, de azóta nem válaszoltál.")).toBeVisible();
    expect(screen.getByText(/akár el is küldi – helyetted a bocsánatkérést/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /^AGY/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Megnézem a lehetőségeket/ }));
    expect(screen.getByRole("heading", { name: "Te döntöd el, mennyit bízol Futurára" })).toBeVisible();
    expect(screen.queryByText("Három delegálási határ")).not.toBeInTheDocument();
    expect(screen.getByText("Segít elindulni, te döntesz.")).toBeVisible();
    expect(screen.getByText("Futura elvégzi helyetted.")).toBeVisible();
    expect(screen.getByText("Te döntesz és te cselekszel.")).toBeVisible();
    expect(screen.getAllByRole("listitem").map((item) => item.getAttribute("aria-label"))).toEqual([
      "AGY — Segít elindulni, te döntesz.",
      "KÉZ — Futura elvégzi helyetted.",
      "SZÍV — Te döntesz és te cselekszel.",
    ]);
    expect(screen.queryAllByRole("button", { name: /^(AGY|KÉZ|SZÍV)/ })).toHaveLength(0);
    expect(screen.queryByText("Futura keretet ad")).not.toBeInTheDocument();
    expect(screen.queryByText("Futura végrehajt")).not.toBeInTheDocument();
    expect(screen.queryByText("Te viszed végig")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Értem, jöhet az első kérdés/ }));
    expect(screen.getByRole("heading", { name: "Mit bíznál Futurára?" })).toBeVisible();
    expect(screen.getByText("Válaszd ki, meddig segítsen Futura.")).toBeVisible();
    const neutralChoices = [
      screen.getByRole("button", {
        name: "AGY — Segítséget kérek, én döntök. A Gép segít elindulni, de a döntés az enyém.",
      }),
      screen.getByRole("button", {
        name: "KÉZ — Rábízom a Gépre. A Gép végzi el helyettem.",
      }),
      screen.getByRole("button", {
        name: "SZÍV — Én viszem végig. Én döntök és én cselekszem.",
      }),
    ];
    neutralChoices.forEach((choice) => {
      expect(choice).toBeVisible();
      expect(choice).toHaveAttribute("aria-pressed", "false");
      expect(choice).not.toHaveClass("is-selected");
      expect(choice).not.toHaveClass("is-subdued");
      choice.focus();
      expect(choice).toHaveFocus();
    });
    fireEvent.click(neutralChoices[0]);

    expect(screen.getByRole("button", {
      name: "AGY — Segítséget kérek, én döntök. A Gép segít elindulni, de a döntés az enyém. Kijelölve.",
    })).toBeVisible();
    expect(screen.getByRole("button", {
      name: "KÉZ — Rábízom a Gépre. A Gép végzi el helyettem.",
    })).toBeVisible();
    expect(screen.getByRole("button", {
      name: "SZÍV — Én viszem végig. Én döntök és én cselekszem.",
    })).toBeVisible();

    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Vállalom ezt a döntést/ })).not.toBeInTheDocument();
    expect(screen.getByText("Még nem végleges")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Segítséget kértél, de a döntés a tiéd." })).toBeVisible();
    expect(screen.getByText("Mielőtt döntesz, nézzük meg a másik oldalát is.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Mutasd a másik oldalát/ }));
    expect(screen.getByText("Futura kérdez")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Biztosan ezt választod?" })).toBeVisible();
    expect(screen.getByText("Segítek elkezdeni, de a végén minden szóért te felelsz.")).toBeVisible();
    expect(screen.getByText("Ha az én mondataimból indulsz ki, könnyen benne maradhat az én hangom is.")).toBeVisible();
    expect(screen.getByText("Mit mondanál neki akkor is, ha nem segítenék?")).toBeVisible();
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/AGY döntési kártya, ellenpont feltárva/);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Vállalom ezt a döntést/ })).not.toBeInTheDocument();
    const keepBrainDirection = screen.getByRole("button", { name: "Maradok az AGY mellett" });
    const reconsiderAfterReflection = screen.getByRole("button", { name: "Másik irányt választok" });
    expect(keepBrainDirection).toBeVisible();
    expect(keepBrainDirection).toHaveClass("primary-action");
    expect(reconsiderAfterReflection).toBeVisible();
    expect(reconsiderAfterReflection).toHaveClass("secondary-action");
    expect(reconsiderAfterReflection.querySelector("svg")).toBeInTheDocument();
    keepBrainDirection.focus();
    expect(keepBrainDirection).toHaveFocus();
    reconsiderAfterReflection.focus();
    expect(reconsiderAfterReflection).toHaveFocus();

    fireEvent.click(reconsiderAfterReflection);
    expect(screen.getByRole("heading", { name: "Mit bíznál Futurára?" })).toBeVisible();
    expect(screen.getByText("A bocsánatkérés")).toBeVisible();
    expect(screen.getByText("Válaszd ki, meddig segítsen Futura.")).toBeVisible();
    expect(screen.getByRole("button", {
      name: "AGY — Segítséget kérek, én döntök. A Gép segít elindulni, de a döntés az enyém.",
    })).toBeVisible();
    expect(screen.getByRole("button", {
      name: "KÉZ — Rábízom a Gépre. A Gép végzi el helyettem.",
    })).toBeVisible();
    expect(screen.getByRole("button", {
      name: "SZÍV — Én viszem végig. Én döntök és én cselekszem.",
    })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^KÉZ/ }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("TENTATIVE_SELECTION_RECORDED");
    expect(screen.getByRole("heading", { name: "Rábíztad a feladatot a Gépre." })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Mutasd a másik oldalát/ }));
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/KÉZ döntési kártya, ellenpont feltárva/);

    fireEvent.click(screen.getByRole("button", { name: "Maradok a KÉZ mellett" }));
    expect(screen.getByLabelText(/Miért ezt választottad/)).toBeVisible();
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/emberileg megtartva/);
    const retainedSeal = screen.getByText("MEGTARTVA");
    expect(retainedSeal.closest(".ritual-card-face")).toBeNull();
    const reconsiderBeforeConfirmation = screen.getByRole("button", { name: "Másik irányt választok" });
    expect(reconsiderBeforeConfirmation).toBeVisible();
    expect(reconsiderBeforeConfirmation).toHaveClass("secondary-action");
    expect(reconsiderBeforeConfirmation.querySelector("svg")).toBeInTheDocument();
    reconsiderBeforeConfirmation.focus();
    expect(reconsiderBeforeConfirmation).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /Vállalom ezt a döntést/ }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("DECISION_CONFIRMED");
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/végleg megerősítve/);
    const sealedLabel = screen.getByText("LEZÁRVA");
    expect(sealedLabel.closest(".ritual-card-face")).toBeNull();
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Másik irányt választok" })).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Rábíztad a feladatot a Gépre." })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Megnézem, mivel jár/ }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("CONSEQUENCE_REVEALED");
    expect(screen.getByRole("heading", { name: "Mit nyertél vele – és mi volt az ára?" })).toBeVisible();
    expect(screen.getByText("Mit nyertél vele?")).toBeVisible();
    expect(screen.getByText("Mi volt az ára?")).toBeVisible();
    expect(screen.queryByText("Ezt adtad át")).not.toBeInTheDocument();
    expect(screen.queryByText(/A döntésed nyoma/)).not.toBeInTheDocument();
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/következmény feltárva/);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Megnézem az Embermérleget" }));
    expect(screen.getByTestId("human-balance")).toBeVisible();
    expect(screen.getByText("A döntéseid nyomot hagytak. A mérleg emlékszik.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Jöhet a következő kérdés" })).toBeVisible();
  });

  it("a meglévő állapotgépet a városi jelenetek mögötti Journey-állomásokhoz rendeli", async () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /Belépek a Gépvárosba/ })).toBeVisible());
    expect(screen.getByTestId("journey-step")).toHaveTextContent("connection");
    fireEvent.click(screen.getByRole("button", { name: /Belépek a Gépvárosba/ }));
    expect(screen.getByTestId("journey-step")).toHaveTextContent("dilemma");
    expect(screen.queryByRole("navigation", { name: "Döntési út" })).not.toBeInTheDocument();
  });

  it("a SZÍV consequence mind az öt aktuális domainértékét jeleníti meg az Embermérlegen", async () => {
    const services = createAppServices(new MemoryGameRepository());
    const entered = services.agentCommands.enterMachineCity().session;
    services.agentCommands.presentDilemma(entered.sessionId, entered.stateRevision);
    let session = services.playerCommands.selectLens("heart");
    services.agentCommands.presentChoiceReflection(
      session.sessionId,
      session.tentativeSelection!.selectionId,
      session.stateRevision,
    );
    session = services.engine.getSnapshot()!;
    services.playerCommands.acknowledgeReflection(session.presentedReflection!.reflectionId);
    const confirmed = services.playerCommands.confirmDecision();
    services.agentCommands.revealConfirmedConsequence(
      confirmed.sessionId,
      confirmed.confirmedDecision!.decisionId,
      confirmed.stateRevision,
    );

    render(<App services={services} />);
    fireEvent.click(screen.getByRole("button", { name: "Megnézem az Embermérleget" }));

    expect(screen.getByRole("heading", { name: "A döntéseid nyoma" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Kényelem: -1" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Kontroll: 1" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Kapcsolódás: 1" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Szabadság: 0" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Felelősség: 2" })).toBeVisible();
  });

  it("adatvezérelten visz át a bocsánatkérésből a házi feladat dilemmába ugyanabban a sessionben", async () => {
    const services = createAppServices(new MemoryGameRepository());
    const entered = services.agentCommands.enterMachineCity().session;
    const first = services.agentCommands.presentDilemma(entered.sessionId, entered.stateRevision).session;
    let session = services.playerCommands.selectLens("brain");
    const reflection = services.agentCommands.presentChoiceReflection(
      session.sessionId,
      session.tentativeSelection!.selectionId,
      session.stateRevision,
    );
    session = services.playerCommands.acknowledgeReflection(
      reflection.session.presentedReflection!.reflectionId,
    );
    session = services.playerCommands.confirmDecision();
    services.agentCommands.revealConfirmedConsequence(
      session.sessionId,
      session.confirmedDecision!.decisionId,
      session.stateRevision,
    );

    render(<App services={services} />);
    fireEvent.click(screen.getByRole("button", { name: "Megnézem az Embermérleget" }));
    fireEvent.click(screen.getByRole("button", { name: "Jöhet a következő kérdés" }));

    expect(services.engine.getSnapshot()?.sessionId).toBe(first.sessionId);
    expect(services.engine.getSnapshot()?.completedDilemmaIds).toEqual(["apology-delegation"]);
    expect(screen.getByRole("heading", { name: "Megcsináljam helyetted a házit?" })).toBeVisible();
    expect(screen.getByText(/Holnap reggelre kell leadnod egy feladatot/)).toBeVisible();
    expect(screen.queryByText(/Megbántottál valakit/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Megnézem a lehetőségeket/ }));
    expect(screen.getByText("A házi feladat")).toBeVisible();
    expect(screen.getByRole("button", {
      name: "KÉZ — Rábízom a Gépre. A Gép végzi el helyettem.",
    })).toBeVisible();
    expect(screen.getByText("Mit jelent az AGY–KÉZ–SZÍV?")).toBeVisible();
  });
});
