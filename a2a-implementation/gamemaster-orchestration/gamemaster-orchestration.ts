import { Agent, McpClient, tool } from "@strands-agents/sdk";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";
import { A2AAgent } from "@strands-agents/sdk/a2a";
import express from "express";
import cors from "cors";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import z from "zod";

// --- Local model with Ollama (uncomment to use) ---
// Run `ollama serve` and `ollama pull llama3.1` first. See README.
// Note: this orchestrator demands strict JSON-only output, so a larger
// local model follows the instructions more reliably than an 8B one.
// import { OpenAIModel } from "@strands-agents/sdk/models/openai";
//
// const ollamaModel = new OpenAIModel({
//   api: "chat",
//   modelId: "llama3.1",
//   apiKey: "ollama", // any non-empty string; Ollama ignores it
//   clientConfig: { baseURL: "http://localhost:11434/v1" },
// });
// Then pass `model: ollamaModel` to the gamemaster Agent below.
// ---------------------------------------------------

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

Available agents (reach them only through their tools):
- Rules Agent - call the ask_rules_agent tool. Looks up official D&D 5e Basic Rules with page references.
- Character Agent - call the ask_character_agent tool. Handles character creation and management.

Available tools:
- roll_dice (MCP dice server) - Rolls dice. Pass "faces" (sides per die, e.g. 20 for a d20) and "count" (number of dice).
  It returns the individual "rolls" and their "total".

Dice rules:
- Whenever a roll is needed (attacks, checks, saves, damage, random tables), you MUST call roll_dice. Never invent dice results.
- Every entry in "dices_rolls" must come from an actual roll_dice call made in this turn, using the value it returned.
- If no dice were rolled this turn, return an empty "dices_rolls" array.
- Character creation (including ability score rolls) is handled by the Character Agent; do not re-roll its stats yourself.

Rules lookups:
- Before resolving any player action that involves game mechanics (attacks, spells, skill checks,
  saving throws, movement, conditions, combat actions), you MUST call ask_rules_agent once with a
  short question about the relevant rule, and base your ruling on its answer.
- Mention the rule and page reference returned by ask_rules_agent in "details".

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
    "dices_rolls": [{"dice_type": "d20", "result": <total returned by roll_dice>, "reason": "attack roll"}]
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
  description:
    "Look up the official D&D 5e Basic Rules for a mechanic (attacks, checks, saves, spells, conditions). " +
    "Call this before resolving any player action that involves game mechanics. Returns a rule summary with page reference.",
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
  model: new BedrockModel({
    modelId: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  }),
  // model: ollamaModel, // <- use this instead to run locally with Ollama
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
// Bind to loopback only: this API has no authentication and calls a paid model.
const HOST = "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`🏰 D&D Game Master API running on http://${HOST}:${PORT}`);
});
