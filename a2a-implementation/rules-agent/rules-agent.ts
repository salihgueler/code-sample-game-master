import { Agent, tool } from "@strands-agents/sdk";
import { A2AExpressServer } from "@strands-agents/sdk/a2a/express";
import z from "zod";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import * as lancedb from "@lancedb/lancedb";
import type { Table } from "@lancedb/lancedb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RulesKnowledgeBase {
  private dbPath: string;
  private table: Table | null = null;
  private extractor: FeatureExtractionPipeline | null = null;

  constructor() {
    const chapterRoot = path.resolve(__dirname, "..", "..");
    this.dbPath = path.join(chapterRoot, "utils", "dnd_knowledge_base");
    console.log(`KB path: ${this.dbPath}`);
  }

  private async init(): Promise<Table | null> {
    if (this.table) return this.table;
    try {
      console.log("Loading embedding model...");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipelineFn = pipeline as (
        ...args: unknown[]
      ) => Promise<FeatureExtractionPipeline>;
      this.extractor = await pipelineFn(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      );
      console.log("Connecting to LanceDB...");
      const db = await lancedb.connect(this.dbPath);
      this.table = await db.openTable("dnd_basic_rules");
      console.log("Knowledge base ready");
      return this.table;
    } catch (e) {
      console.error(`Error connecting to KB: ${e}`);
      return null;
    }
  }

  async quickQuery(query: string): Promise<string> {
    console.log(`Querying KB with: ${query}`);
    const table = await this.init();
    if (!table || !this.extractor) return "KB unavailable";

    try {
      const output = await this.extractor(query, {
        pooling: "mean",
        normalize: true,
      });
      const queryVec = Array.from(output.data as Float32Array);
      const results = await table.vectorSearch(queryVec).limit(1).toArray();

      if (results.length > 0) {
        const doc = results[0] as { text: string; page: number };
        return `Page ${doc.page}: ${doc.text.slice(0, 100)}...`;
      }
      return "No rules found";
    } catch {
      return "KB error";
    }
  }
}

const rulesKb = new RulesKnowledgeBase();

const queryDndRules = tool({
  name: "query_dnd_rules",
  description: "Fast D&D rule lookup. Returns brief rule with page reference.",
  inputSchema: z.object({
    query: z.string().describe("The D&D rule query to look up"),
  }),
  callback: async (input) => {
    return rulesKb.quickQuery(input.query);
  },
});

const DESCRIPTION = `Specialized D&D 5e rules lookup agent that provides fast, authoritative rule clarifications from the Basic Rules.
Queries the LanceDB knowledge base containing indexed D&D content and returns brief, page-referenced rule explanations.
Designed for quick consultation by other agents or players during gameplay.`;

const SYSTEM_PROMPT = `You are a D&D rules expert. When asked about rules, use the query_dnd_rules tool once to find the relevant rule,
then provide a clear, concise answer with the page reference. Keep responses brief and focused on the specific rule requested.`;

const agent = new Agent({
  tools: [queryDndRules],
  systemPrompt: SYSTEM_PROMPT,
});

const server = new A2AExpressServer({
  agent,
  name: "Rules Agent",
  description: DESCRIPTION,
  port: 8000,
});

await server.serve();
