import { describe, expect, it, vi } from "vitest";
import { createAgentCommandPort } from "../../src/application/agentCommandPort";
import { createAgentQueryPort } from "../../src/application/queryPorts";
import { dilemmaCatalog } from "../../src/content/dilemmaCatalog.hu";
import { GameEngine } from "../../src/domain/gameEngine";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import { WEBMCP_TOOL_NAMES } from "../../src/infrastructure/webmcp/contracts";
import { registerWebMcpTools } from "../../src/infrastructure/webmcp/registerTools";
import { createWebMcpToolDefinitions } from "../../src/infrastructure/webmcp/toolHandlers";

describe("WebMCP regisztráció", () => {
  it("mind az öt toolt regisztrálja és felfedezhető definíciót ad", async () => {
    const engine = new GameEngine(dilemmaCatalog, new MemoryGameRepository());
    const definitions = createWebMcpToolDefinitions(
      createAgentCommandPort(engine),
      createAgentQueryPort(engine),
      () => engine.getSnapshot(),
    );
    const registered: WebMcpToolDefinition[] = [];
    const modelContext: ModelContext = {
      registerTool: vi.fn(async (tool) => {
        registered.push(tool);
      }),
      getTools: vi.fn(async () =>
        registered.map(({ name, title, description, inputSchema }) => ({
          name,
          title,
          description,
          inputSchema,
        })),
      ),
    };
    const statuses: string[] = [];

    await registerWebMcpTools(modelContext, definitions, (status) => statuses.push(status.mode));
    const discovered = await modelContext.getTools!();

    expect(registered.map(({ name }) => name)).toEqual([...WEBMCP_TOOL_NAMES]);
    expect(discovered.map(({ name }) => name)).toEqual([...WEBMCP_TOOL_NAMES]);
    expect(statuses.at(-1)).toBe("webmcp");
  });

  it("az execute a Chrome runtime egyargumentumos hívásformájával is működik", async () => {
    const engine = new GameEngine(dilemmaCatalog, new MemoryGameRepository());
    const definitions = createWebMcpToolDefinitions(
      createAgentCommandPort(engine),
      createAgentQueryPort(engine),
      () => engine.getSnapshot(),
    );
    const enterMachineCity = definitions.find(({ name }) => name === "enter_machine_city")!;

    const result = await enterMachineCity.execute({});

    expect(result).toMatchObject({
      ok: true,
      tool: "enter_machine_city",
      phase: "MACHINE_CITY_READY",
      data: {
        playableDilemmaCount: 4,
      },
    });
    expect(engine.getSnapshot()?.phase).toBe("MACHINE_CITY_READY");
  });
});
