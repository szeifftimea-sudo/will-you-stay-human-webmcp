export interface WebMcpRegistrationStatus {
  mode: "registering" | "webmcp" | "fallback" | "error";
  registeredTools: string[];
  message: string;
}

export async function registerWebMcpTools(
  modelContext: ModelContext | undefined,
  tools: WebMcpToolDefinition[],
  onStatus: (status: WebMcpRegistrationStatus) => void,
): Promise<AbortController | null> {
  if (!modelContext?.registerTool) {
    onStatus({
      mode: "fallback",
      registeredTools: [],
      message: "A WebMCP API nem érhető el; manuális agentmód aktív.",
    });
    return null;
  }

  const controller = new AbortController();
  const registeredTools: string[] = [];
  onStatus({ mode: "registering", registeredTools, message: "WebMCP-toolok regisztrálása…" });

  try {
    for (const tool of tools) {
      await modelContext.registerTool(tool, { signal: controller.signal });
      registeredTools.push(tool.name);
      onStatus({
        mode: "registering",
        registeredTools: [...registeredTools],
        message: `${registeredTools.length}/${tools.length} WebMCP-tool regisztrálva.`,
      });
    }
    onStatus({
      mode: "webmcp",
      registeredTools: [...registeredTools],
      message: `${registeredTools.length} WebMCP-tool regisztrálva és felfedezhető.`,
    });
    return controller;
  } catch (error) {
    controller.abort();
    onStatus({
      mode: "error",
      registeredTools: [...registeredTools],
      message: error instanceof Error ? error.message : "A WebMCP-regisztráció sikertelen.",
    });
    return null;
  }
}

