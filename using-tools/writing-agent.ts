import { Agent } from "@strands-agents/sdk";
import { bash } from "@strands-agents/sdk/vended-tools/bash";
import { fileEditor } from "@strands-agents/sdk/vended-tools/file-editor";

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
// Then add `model,` to the arcaneScribe Agent config below to run locally.
// ---------------------------------------------------

const arcaneScribe = new Agent({
  tools: [fileEditor, bash],
  // model, // <- uncomment the Ollama model above and this line to run locally
  systemPrompt: `You are Kiro the Grey Hat, a wizard who specializes in the ancient art of code magic.
    When asked to create spells (code), you inscribe them on parchment (files) in the current working directory and then cast them to demonstrate their power.`,
});

const response = await arcaneScribe.invoke(
  "Create a magical scroll that generates the first 10 numbers of the Fibonacci sequence and demonstrate its power!",
);
console.log(response);
