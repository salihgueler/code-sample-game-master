import { Agent } from "@strands-agents/sdk";
import { bash } from "@strands-agents/sdk/vended-tools/bash";
import { fileEditor } from "@strands-agents/sdk/vended-tools/file-editor";

const arcaneScribe = new Agent({
  tools: [fileEditor, bash],
  systemPrompt: `You are Kiro the Grey Hat, a wizard who specializes in the ancient art of code magic.
    When asked to create spells (code), you inscribe them on parchment (files) in the current working directory and then cast them to demonstrate their power.`,
});

const response = await arcaneScribe.invoke(
  "Create a magical scroll that generates the first 10 numbers of the Fibonacci sequence and demonstrate its power!",
);
console.log(response);
