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
      description:
        "Roll D&D dice. 'faces' is the number of sides per die (d4=4, d6=6, d8=8, d10=10, d12=12, d20=20, d100=100) " +
        "and 'count' is how many dice to roll (e.g. 4d6 is faces=6, count=4). " +
        "Returns the individual rolls and their total. Always use this instead of inventing dice results.",
      inputSchema: {
        faces: z
          .number()
          .int()
          .min(2)
          .default(6)
          .describe("Sides per die, e.g. 20 for a d20"),
        count: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(1)
          .describe("Number of dice to roll"),
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

// Bind to loopback only: this MCP server has no authentication.
const HOST = "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(
    `🎲 D&D Dice Roll MCP Server running on http://${HOST}:${PORT}/mcp`,
  );
});
