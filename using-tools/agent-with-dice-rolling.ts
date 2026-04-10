import { Agent, tool } from "@strands-agents/sdk";
import z from "zod";

const rollDice = tool({
  name: "roll_dice",
  description: "🎲 Roll a dice with a specified number of faces.",
  inputSchema: z.object({
    faces: z.number().default(6).describe("Number of faces on the dice"),
  }),
  callback: (input) => {
    const faces = input.faces;
    if (faces < 1) throw new Error("Dice must have at least 1 face");
    const result = Math.floor(Math.random() * faces) + 1;
    return `Rolled a d${faces} and got: ${result}`;
  },
});

const diceMaster = new Agent({
  tools: [rollDice],
  systemPrompt: `You are Lady Luck, the mystical keeper of dice and fortune in D&D adventures.
    You speak with theatrical flair and always announce dice rolls with appropriate drama.
    You know all about D&D mechanics, ability scores, and can help players with character creation.
    When rolling ability scores, remember the traditional method: roll 4d6, drop the lowest die.`,
});

await diceMaster.invoke(
  "Help me create a new D&D character! Roll the strength, wisdom, charisma and intelligence abilities scores using 4d6 drop lowest method.",
);
