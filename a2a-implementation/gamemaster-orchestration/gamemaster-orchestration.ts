import { Agent, McpClient, tool } from "@strands-agents/sdk";
import { A2AAgent } from "@strands-agents/sdk/a2a";
import express from "express";
import cors from "cors";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import z from "zod";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

// TODO: Create MCP Client for dice rolling service
// Connect to the MCP server at http://localhost:8080/mcp
const mcpClient = new McpClient({
  transport: new StreamableHTTPClientTransport(
    new URL("http://localhost:8080/mcp"),
  ),
});

// System prompt for the agent
const SYSTEM_PROMPT = `You are a D&D Game Master orchestrator with access to specialized agents and tools.

Available agents:
- Rules Agent (http://127.0.0.1:8000) - For D&D mechanics and rules
- Character Agent (http://127.0.0.1:8001) - For character creation and management

To communicate with agents, use the A2A protocol.

Available D&D dice types:
- d4 (4-sided die) - Used for damage rolls of small weapons like daggers
- d6 (6-sided die) - Used for damage rolls of weapons like shortswords, spell damage
- d8 (8-sided die) - Used for damage rolls of weapons like longswords, rapiers
- d10 (10-sided die) - Used for damage rolls of heavy weapons, percentile rolls
- d12 (12-sided die) - Used for damage rolls of great weapons like greataxes
- d20 (20-sided die) - Used for ability checks, attack rolls, saving throws
- d100 (percentile die) - Used for random tables, wild magic surges

When you reply, please reply with a JSON (and ONLY A JSON, no text other than the json).
Always respond in JSON format:
{
    "response": "Your narrative response as Game Master",
    "actions_suggestions": ["Action 1", "Action 2", "Action 3"],
    "details": "Brief summary of tools/agents used",
    "dices_rolls": [{"dice_type": "d20", "result": 15, "reason": "attack roll"}]
}

Be creative, engaging, and use your available tools to enhance the D&D experience.

Remember, the response should ONLY be a PURE json with no markdown or text around it.
`;

// TODO: Create A2A agent clients for Rules Agent and Character Agent
const rulesAgent = new A2AAgent({ url: "http://127.0.0.1:8000" });
const characterAgent = new A2AAgent({ url: "http://127.0.0.1:8001" });

// TODO: Wrap A2A agents as tools using tool() + a2aAgent.invoke()
// Example:
const askRulesAgent = tool({
  name: "ask_rules_agent",
  description: "Ask the Rules Agent about D&D mechanics and rules",
  inputSchema: z.object({
    question: z.string().describe("The D&D rules question to ask"),
  }),
  callback: async (input) => {
    const result = await rulesAgent.invoke(input.question);
    return String(result);
  },
});
const askCharacterAgent = tool({
  name: "ask_character_agent",
  description: "Ask the Character Agent about available characters",
  inputSchema: z.object({
    question: z.string().describe("The D&D rules characters to ask"),
  }),
  callback: async (input) => {
    const result = await characterAgent.invoke(input.question);
    return String(result);
  },
});

// TODO: Create the gamemaster agent with A2A tool wrappers and MCP tools
const agent = new Agent({
  tools: [askRulesAgent, askCharacterAgent, mcpClient],
  systemPrompt: SYSTEM_PROMPT,
});

app.get("/user/:name", async (req, res) => {
  const { name } = req.params;
  console.log(`Looking up character: ${name}`);
  try {
    const result = await characterAgent.invoke(
      `Find the character named "${name}" and return ONLY the raw JSON data from the find_character_by_name tool, nothing else.`,
    );
    const text = String(result);
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.status(404).json({ error: "Character not found" });
    }
  } catch (e) {
    console.error(`Error fetching character: ${e}`);
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

app.post("/inquire", async (req, res) => {
  console.log("Processing request...");
  try {
    const { question } = req.body as { question: string };

    // TODO: Process the request using the gamemaster agent
    const response = await agent.invoke(question);
    const content = String(response);

    res.json({ response: content });
  } catch (e) {
    console.error(`Error occurred: ${e}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = 8009;
app.listen(PORT, () => {
  console.log(`🏰 D&D Game Master API running on http://localhost:${PORT}`);
});
