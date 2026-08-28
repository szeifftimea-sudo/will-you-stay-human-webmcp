export {};

declare global {
  interface WebMcpExecuteOptions {
    signal?: AbortSignal;
  }

  interface WebMcpToolDefinition {
    name: string;
    title?: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    annotations?: {
      readOnlyHint?: boolean;
      untrustedContentHint?: boolean;
    };
    execute(
      input: Record<string, unknown>,
      options?: WebMcpExecuteOptions,
    ): Promise<unknown> | unknown;
  }

  interface RegisteredWebMcpTool {
    name: string;
    title?: string;
    description: string;
    inputSchema?: Record<string, unknown>;
  }

  interface ModelContext {
    registerTool(
      tool: WebMcpToolDefinition,
      options?: { signal?: AbortSignal; exposedTo?: string[] },
    ): Promise<void>;
    getTools?(): Promise<RegisteredWebMcpTool[]>;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
