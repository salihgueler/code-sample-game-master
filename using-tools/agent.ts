import { Agent } from "@strands-agents/sdk";
import { httpRequest } from "@strands-agents/sdk/vended-tools/http-request";

// --- Local model with Ollama (uncomment to use) ---
// Run `ollama serve` and `ollama pull llama3.1` first. See README.
// import { OpenAIModel } from "@strands-agents/sdk/models/openai";
//
// const model = new OpenAIModel({
//   api: "chat",
//   modelId: "llama3.1",
//   apiKey: "ollama", // any non-empty string; Ollama ignores it
//   clientConfig: { baseURL: "http://localhost:11434/v1" },
// });
// Then add `model,` to the Agent config below to run locally.
// ---------------------------------------------------

const agent = new Agent({
  tools: [httpRequest],
  // model, // <- uncomment the Ollama model above and this line to run locally
});

await agent.invoke(`
  Using the website https://en.wikipedia.org/wiki/Dungeons_%26_Dragons tell me the name of the designers of
  Dungeons and Dragons.
`);
