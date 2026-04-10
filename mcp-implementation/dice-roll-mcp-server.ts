import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import z from "zod";

function createServer(): McpServer {
  const server = new McpServer({
    name: "D&D Dice Roll Service",
    version: "1.0.0",
  });

  server.registerTool(
    "roll_dice",
    {
      description: "Roll dice for D&D",
      inputSchema: {
        faces: z.number().default(6),
        count: z.number().default(1),
      },
    },
    async ({ faces, count }) => {
      const rolls = Array.from(
        { length: count },
        () => Math.floor(Math.random() * faces) + 1,
      );
      const total = rolls.reduce((sum, roll) => sum + roll, 0);
      const result = { rolls, total, faces, count };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  );

  return server;
}

const app = express();
app.use(express.json());

const PORT = 8080;

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  res.on("close", () => {
    transport.close();
    server.close();
  });
});

app.get("/mcp", async (_req, res) => {
  res.status(405).json({ error: "Method not allowed" });
});

app.delete("/mcp", async (_req, res) => {
  res.status(405).json({ error: "Method not allowed" });
});

app.listen(PORT, () => {
  console.log(
    `🎲 D&D Dice Roll MCP Server running on http://localhost:${PORT}/mcp`,
  );
});
