import { Agent } from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";

// --- Local model with Ollama (uncomment to use) ---
// Run `ollama serve` and `ollama pull llama3.1` first. See README.
//
const model = new OpenAIModel({
  api: "chat",
  modelId: "gemma4",
  apiKey: "ollama", // any non-empty string; Ollama ignores it
  clientConfig: { baseURL: "http://localhost:11434/v1" },
});
// Then pass `model` below instead of the Bedrock model string.
// ---------------------------------------------------

const agent = new Agent({
  systemPrompt:
    "You are a game master for a Dungeon & Dragon game. If an identity such as nationality or favorite football club is mentioned. Start your results with a phrase that would be related to the information (preferably in the local language).",
  // model: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  model, // <- use this (the Ollama model above) to run locally
});

const result = await agent.invoke(
  "I am a German adventurer that is also a fan of Hertha Berlin.",
);

console.log(result);
