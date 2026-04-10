import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Agent, McpClient } from "@strands-agents/sdk";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import * as readline from "readline";

async function main() {
  console.log("\nConnecting to D&D Dice Roll MCP Server...");

  const mcpClient = new McpClient({
    transport: new StreamableHTTPClientTransport(
      new URL("http://localhost:8080/mcp"),
    ) as Transport,
  });

  const tools = await mcpClient.listTools();
  console.log(
    "Available tools:",
    tools.map((t) => t.name),
  );

  const gamemaster = new Agent({
    tools,
    systemPrompt: `You are Lady Luck, the mystical keeper of dice and fortune in D&D adventures.
      You speak with theatrical flair and always announce dice rolls with appropriate drama.
      You know all about D&D mechanics, always use the appropriate tools when applicable - never make up results!`,
  });

  console.log("\n🎲 Lady Luck - D&D Gamemaster with MCP Dice Rolling");
  console.log("=".repeat(60));
  console.log('\n🎯 Try: "Roll a d20" or "Roll a d6" or "Roll a d100"');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (): void => {
    rl.question("\n🎲 Your request: ", async (userInput) => {
      if (["exit", "quit", "bye"].includes(userInput.toLowerCase())) {
        console.log("🎲 May fortune favor your future adventures!");
        await mcpClient.disconnect();
        rl.close();
        return;
      }

      console.log("\n🎲 Rolling the dice of fate...\n");
      await gamemaster.invoke(userInput);
      askQuestion();
    });
  };

  askQuestion();
}

main().catch(console.error);
