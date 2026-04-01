#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getToolDefinitions, dispatchTool } from "./tools/index.js";
import { getResourceDefinitions, readResource } from "./resources/index.js";
import { getPromptDefinitions, getPrompt } from "./prompts/index.js";

// ========================================
// SERVER INIT
// ========================================

const server = new Server(
  {
    name: "@elsahafy/ui-toolkit-mcp",
    version: "2.0.0",
  },
  {
    capabilities: {
      resources: { listChanged: true },
      tools: { listChanged: true },
      prompts: { listChanged: true },
    },
  }
);

// ========================================
// TOOLS
// ========================================

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getToolDefinitions(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await dispatchTool(name, (args ?? {}) as Record<string, unknown>);
    return {
      content: result.content as { type: "text"; text: string }[],
      isError: result.isError,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ========================================
// RESOURCES
// ========================================

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: getResourceDefinitions(),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  try {
    const result = readResource(uri);
    return {
      contents: [result],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(message);
  }
});

// ========================================
// PROMPTS
// ========================================

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: getPromptDefinitions(),
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    return getPrompt(name, (args ?? {}) as Record<string, string>);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(message);
  }
});

// ========================================
// START
// ========================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
