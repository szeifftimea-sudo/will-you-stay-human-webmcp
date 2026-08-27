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
    expect(screen.getByRole("heading", { name: "Kérjek bocsánatot helyetted?" })).toBeVisible();
  });

  it("fallbackben is végig megőrzi a külön emberi kontrollpontokat", async () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} />);

    await waitFor(() => expect(screen.getByTestId("webmcp-status")).toHaveTextContent("manuális agentmód"));
    fireEvent.click(screen.getByRole("button", { name: "Belépés a Gépvárosba" }));
    fireEvent.click(screen.getByRole("button", { name: "Dilemma bemutatása" }));
    fireEvent.click(screen.getByRole("button", { name: /AGY/ }));

    expect(screen.queryByRole("button", { name: "Döntésem végleges megerősítése" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Futura ellenpontja" }));
    expect(screen.getByRole("heading", { name: "Állj meg egy pillanatra" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Döntésem végleges megerősítése" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Megtartom ezt az irányt" }));
    fireEvent.click(screen.getByRole("button", { name: "Döntésem végleges megerősítése" }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("DECISION_CONFIRMED");

    fireEvent.click(screen.getByRole("button", { name: "Következmény feltárása" }));
    expect(screen.getByTestId("game-phase")).toHaveTextContent("CONSEQUENCE_REVEALED");
    expect(screen.getByRole("heading", { name: "Mit nyertél, és mit adtál át?" })).toBeVisible();
  });
});

