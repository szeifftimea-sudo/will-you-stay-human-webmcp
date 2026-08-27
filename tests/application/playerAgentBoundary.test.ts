import { describe, expect, it } from "vitest";
import { createWebMcpToolDefinitions } from "../../src/infrastructure/webmcp/toolHandlers";
import { WEBMCP_TOOL_NAMES, toolInputSchemas } from "../../src/infrastructure/webmcp/contracts";
import { createTestEngine } from "../../src/test/fixtures";

describe("Player/Agent parancshatár", () => {
  it("az AgentCommandPort nem exportál játékosi műveletet", () => {
    const { agent, player } = createTestEngine();

    expect(Object.keys(agent).sort()).toEqual([
      "enterMachineCity",
      "presentChoiceReflection",
      "presentDilemma",
      "revealConfirmedConsequence",
    ]);
    expect("selectLens" in agent).toBe(false);
    expect("acknowledgeReflection" in agent).toBe(false);
    expect("confirmDecision" in agent).toBe(false);
    expect(Object.keys(player)).toContain("confirmDecision");
  });

  it("egyik WebMCP-séma sem fogad döntési értéket", () => {
    const forbidden = ["lens", "choice", "reasoning", "humanConfirmed", "acknowledged", "confirmed"];

    expect(Object.keys(toolInputSchemas)).toEqual([...WEBMCP_TOOL_NAMES]);
    for (const schema of Object.values(toolInputSchemas)) {
      expect(schema.additionalProperties).toBe(false);
      const properties = Object.keys(schema.properties);
      for (const field of forbidden) expect(properties).not.toContain(field);
    }
  });

  it("a zárt runtime-séma elutasítja a becsempészett lens mezőt", async () => {
    const { agent, query, engine } = createTestEngine();
    const tools = createWebMcpToolDefinitions(agent, query, () => engine.getSnapshot());
    const enter = tools.find(({ name }) => name === "enter_machine_city")!;

    const result = await enter.execute(
      { lens: "heart" },
      { signal: new AbortController().signal },
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
    expect(engine.getSnapshot()).toBeNull();
  });
});

