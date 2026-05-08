import { Agent, tool } from "@strands-agents/sdk";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";
import { A2AExpressServer } from "@strands-agents/sdk/a2a/express";
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
Roll a dice to generate the stats (ability scores).
When rolling ability scores, remember the traditional method: roll 4d6, drop the lowest die.`,
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

const SYSTEM_PROMPT = `You are a D&D character management specialist. When creating characters, always roll ability scores using the traditional
method: roll 4d6 and drop the lowest die for each of the six abilities (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma).
Use the appropriate tools to create, find, or list characters as requested. Provide clear confirmations when characters are created and
helpful summaries when characters are found. Keep responses focused and include relevant character details like class, race, and key stats.`;

const agent = new Agent({
  // TODO: Configure the Character Agent with:
  model: new BedrockModel({
    modelId: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  }),
  tools: [findCharacterByName, listAllCharacters, createCharacter],
  // - systemPrompt: SYSTEM_PROMPT
  systemPrompt: SYSTEM_PROMPT,
});

const server = new A2AExpressServer({
  agent,
  name: "Character Creator Agent",
  description: DESCRIPTION,
  port: 8001,
});

await server.serve();
