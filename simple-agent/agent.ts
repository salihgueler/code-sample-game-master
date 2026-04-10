import { Agent, BedrockModel } from "@strands-agents/sdk";

const agent = new Agent({
  systemPrompt: "You are a game master for a Dungeon & Dragon game",
  model: "global.anthropic.claude-opus-4-6-v1",
});

const result = await agent.invoke(
  "Hi, I am an Italian adventurer ready for adventure!",
);

console.log(result);
