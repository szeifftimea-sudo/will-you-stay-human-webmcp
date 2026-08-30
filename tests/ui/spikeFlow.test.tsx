import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";

describe("technikai spike UI", () => {
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
    expect(screen.getByText("Megmutathatom a lehetőségeket és a következményeket. A határt azonban csak te húzhatod meg.")).toBeVisible();
    expect(screen.queryByText(/Van egy üzenet, amit átvehetek/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mutasd a kérdést/ }));
    expect(screen.getByRole("heading", { name: "Kérjek bocsánatot helyetted?" })).toBeVisible();
    expect(screen.getByText("Megbántottál valakit, de azóta nem válaszoltál.")).toBeVisible();
    expect(screen.getByText(/felajánlja, hogy megírja – akár el is küldi/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /^AGY/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Megnézem a lehetőségeket/ }));
    expect(screen.getByRole("heading", { name: "Mit bíznál Futurára?" })).toBeVisible();
    expect(screen.getByRole("button", { name: /AGY — Vázlatot kérek/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /AGY/ }));

    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Vállalom ezt a döntést/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Megfordítom a kártyát/ }));
    expect(screen.getByRole("heading", { name: "Maradsz ennél az iránynál?" })).toBeVisible();
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/AGY döntési kártya, ellenpont feltárva/);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Vállalom ezt a döntést/ })).not.toBeInTheDocument();
    const keepBrainDirection = screen.getByRole("button", { name: "Megtartom az AGY irányt" });
    const reconsiderAfterReflection = screen.getByRole("button", { name: "Másik irányt választok" });
    expect(keepBrainDirection).toBeVisible();
    expect(reconsiderAfterReflection).toBeVisible();
    keepBrainDirection.focus();
    expect(keepBrainDirection).toHaveFocus();
    reconsiderAfterReflection.focus();
    expect(reconsiderAfterReflection).toHaveFocus();

    fireEvent.click(reconsiderAfterReflection);
    expect(screen.getByRole("heading", { name: "Mit bíznál Futurára?" })).toBeVisible();
    expect(screen.getByRole("button", { name: /^AGY/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /^KÉZ/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /^SZÍV/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^KÉZ/ }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("TENTATIVE_SELECTION_RECORDED");
    fireEvent.click(screen.getByRole("button", { name: /Megfordítom a kártyát/ }));
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/KÉZ döntési kártya, ellenpont feltárva/);

    fireEvent.click(screen.getByRole("button", { name: "Megtartom a KÉZ irányt" }));
    expect(screen.getByLabelText(/Mit fogsz mindenképp a saját szavaiddal megírni/)).toBeVisible();
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/emberileg megtartva/);
    const reconsiderBeforeConfirmation = screen.getByRole("button", { name: "Másik irányt választok" });
    expect(reconsiderBeforeConfirmation).toBeVisible();
    reconsiderBeforeConfirmation.focus();
    expect(reconsiderBeforeConfirmation).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /Vállalom ezt a döntést/ }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("DECISION_CONFIRMED");
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/végleg megerősítve/);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Másik irányt választok" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Felfedem a lenyomatot/ }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("CONSEQUENCE_REVEALED");
    expect(screen.getByRole("heading", { name: "Ezt nyerted. Ezt adtad át." })).toBeVisible();
    expect(screen.getByTestId("ritual-card")).toHaveAccessibleName(/következmény feltárva/);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Megnézem a döntés lenyomatát" }));
    expect(screen.getByTestId("human-balance")).toBeVisible();
    expect(screen.getByText("A szavaid nálad maradtak. A határ azonban elmozdult.")).toBeVisible();
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
    fireEvent.click(screen.getByRole("button", { name: "Megnézem a döntés lenyomatát" }));

    expect(screen.getByRole("heading", { name: "A döntés lenyomata" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Kényelem: -1" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Kontroll: 1" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Kapcsolódás: 1" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Szabadság: 0" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Felelősség: 2" })).toBeVisible();
  });
});
