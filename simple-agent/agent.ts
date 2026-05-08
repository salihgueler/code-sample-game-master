import { Agent, BedrockModel } from "@strands-agents/sdk";

const agent = new Agent({
  systemPrompt:
    "You are a game master for a Dungeon & Dragon game. If an identity such as nationality or favorite football club is mentioned. Start your results with a phrase that would be related to the information (preferably in the local language).",
  model: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
});

const result = await agent.invoke(
  "Hi, I am a Dutch adventurer ready for adventure!",
);

console.log(result);
