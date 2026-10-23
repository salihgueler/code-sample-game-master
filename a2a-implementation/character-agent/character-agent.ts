import { Agent, McpClient, tool } from "@strands-agents/sdk";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";
import { A2AExpressServer } from "@strands-agents/sdk/a2a/express";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// --- Local model with Ollama (uncomment to use) ---
// Run `ollama serve` and `ollama pull llama3.1` first. See README.
// import { OpenAIModel } from "@strands-agents/sdk/models/openai";
//
// const ollamaModel = new OpenAIModel({
//   api: "chat",
//   modelId: "llama3.1",
//   apiKey: "ollama", // any non-empty string; Ollama ignores it
//   clientConfig: { baseURL: "http://localhost:11434/v1" },
// });
// Then pass `model: ollamaModel` to the Agent in createAgent() below.
// ---------------------------------------------------
import z from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Stats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface InventoryItem {
  item_name: string;
  quantity: number;
}

interface Character {
  character_id: string;
  name: string;
  character_class: string;
  race: string;
  gender: string;
  level: number;
  experience: number;
  stats: Stats;
  inventory: InventoryItem[];
  created_at: string;
}

interface CharactersDB {
  _default: Record<string, Character>;
}

const DB_PATH = path.join(__dirname, "characters.json");

// Shared MCP dice server from chapter 3, so ability scores come from real
// rolls instead of numbers the model makes up.
const mcpClient = new McpClient({
  transport: new StreamableHTTPClientTransport(
    new URL("http://localhost:8080/mcp"),
  ),
});

function readDB(): CharactersDB {
  if (!fs.existsSync(DB_PATH)) {
    return { _default: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as CharactersDB;
}

function writeDB(db: CharactersDB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const findCharacterByName = tool({
  name: "find_character_by_name",
  description: "Find a character by name",
  inputSchema: z.object({
    name: z.string().describe("The character's name to search for"),
  }),
  callback: (input) => {
    console.log(`🔍 Searching for character with name: '${input.name}'`);
    const db = readDB();
    const entries = Object.values(db._default);
    const found = entries.find((c) => c.name === input.name);

    if (!found) {
      console.log(`❌ Character with name '${input.name}' not found`);
      return `❌ Character with name '${input.name}' not found`;
    }

    console.log(
      `✅ Found character: ${found.name} (ID: ${found.character_id}, ${found.character_class} ${found.race})`,
    );
    return JSON.stringify(found);
  },
});

const listAllCharacters = tool({
  name: "list_all_characters",
  description: "List all characters in the database",
  inputSchema: z.object({}),
  callback: () => {
    console.log("📋 Listing all characters in database");
    const db = readDB();
    const allChars = Object.values(db._default);

    if (allChars.length === 0) {
      console.log("❌ No characters found in database");
      return "📜 No characters found in the database";
    }

    console.log(`✅ Found ${allChars.length} character(s) in database`);
    for (const char of allChars) {
      console.log(`  - ${char.name} (${char.character_class} ${char.race})`);
    }
    return JSON.stringify(allChars);
  },
});

const createCharacter = tool({
  name: "create_character",
  description: `Character details respecting the GameCharacters object fields.
Before calling this tool, generate every ability score with the roll_dice tool (faces=6, count=4),
drop the lowest die and sum the remaining three. Only pass scores that came from roll_dice results.`,
  inputSchema: z.object({
    name: z.string().describe("Character's name"),
    character_class: z.string().describe("D&D class (Fighter, Wizard, etc.)"),
    race: z.string().describe("D&D race (Human, Elf, etc.)"),
    gender: z.string().describe("Character's gender"),
    stats_dict: z
      .object({
        strength: z.number(),
        dexterity: z.number(),
        constitution: z.number(),
        intelligence: z.number(),
        wisdom: z.number(),
        charisma: z.number(),
      })
      .describe(
        "Dictionary with strength, dexterity, constitution, intelligence, wisdom, charisma",
      ),
  }),
  callback: (input) => {
    const characterId = randomUUID();
    console.log(characterId);

    const stats: Stats = {
      strength: input.stats_dict.strength ?? 10,
      dexterity: input.stats_dict.dexterity ?? 10,
      constitution: input.stats_dict.constitution ?? 10,
      intelligence: input.stats_dict.intelligence ?? 10,
      wisdom: input.stats_dict.wisdom ?? 10,
      charisma: input.stats_dict.charisma ?? 10,
    };
    console.log(stats);

    const character: Character = {
      character_id: characterId,
      name: input.name,
      character_class: input.character_class,
      race: input.race,
      gender: input.gender,
      level: 1,
      experience: 0,
      stats,
      inventory: [
        { item_name: "Starting Equipment Pack", quantity: 1 },
        { item_name: "Gold Pieces", quantity: 100 },
      ],
      created_at: new Date().toISOString(),
    };
    console.log(character);

    const db = readDB();
    const nextKey = String(Object.keys(db._default).length + 1);
    db._default[nextKey] = character;
    writeDB(db);
    console.log("Inserted");

    return JSON.stringify(character);
  },
});

const DESCRIPTION = `Specialized D&D character management agent that handles character creation, storage, and retrieval.
Creates new characters with proper ability score generation (4d6 drop lowest), manages character data in persistent storage,
and provides character lookup services. Maintains complete character profiles including stats, inventory, and progression data for D&D campaigns.`;

const SYSTEM_PROMPT = `You are a D&D character management specialist.

When creating a character, roll ability scores with the traditional 4d6-drop-lowest method using the roll_dice tool:
1. For each of the six abilities (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma), call roll_dice with faces=6 and count=4.
2. From the returned "rolls", drop the single lowest die and sum the remaining three. That sum is the ability score.
3. Pass the six scores to create_character.

You MUST call roll_dice for every ability score. Never invent, estimate, or reuse dice results.
If roll_dice is unavailable or fails, do not create the character; report the error instead.

Use the appropriate tools to find or list characters as requested. Provide clear confirmations when characters are created
(including the individual rolls for each ability) and helpful summaries when characters are found.
Keep responses focused and include relevant character details like class, race, and key stats.`;

// One agent per A2A context, so separate conversations never share state.
const createAgent = () =>
  new Agent({
    // TODO: Configure the Character Agent with:
    model: new BedrockModel({
      modelId: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
    }),
    // model: ollamaModel, // <- use this instead to run locally with Ollama
    tools: [findCharacterByName, listAllCharacters, createCharacter, mcpClient],
    // - systemPrompt: SYSTEM_PROMPT
    systemPrompt: SYSTEM_PROMPT,
  });

const server = new A2AExpressServer({
  agentFactory: createAgent,
  name: "Character Creator Agent",
  description: DESCRIPTION,
  port: 8001,
});

await server.serve();
