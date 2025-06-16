#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMermaidServer } from "../features/server/index.js";

const server = createMermaidServer();

async function startStdioServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mermaid Parser MCP Server running on stdio");
}

startStdioServer().catch((error) => {
  console.error("Fatal error in startStdioServer():", error);
  process.exit(1);
});