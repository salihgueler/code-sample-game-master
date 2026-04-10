/**
 * D&D Basic Rules Knowledge Base Creator
 * Creates a LanceDB vector knowledge base from the D&D Basic Rules PDF
 * Uses all-MiniLM-L6-v2 for local embeddings (same model as ChromaDB's default)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import * as lancedb from "@lancedb/lancedb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KBChunk {
  id: string;
  text: string;
  page: number;
  paragraph: number;
  source: string;
}

interface LanceRecord extends KBChunk {
  vector: number[];
}

async function createEmbedder(): Promise<FeatureExtractionPipeline> {
  console.log("Loading embedding model (all-MiniLM-L6-v2)...");
  const pipelineFn = pipeline as (
    ...args: unknown[]
  ) => Promise<FeatureExtractionPipeline>;
  const extractor = await pipelineFn(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );
  console.log("Embedding model loaded");
  return extractor;
}

async function embedTexts(
  extractor: FeatureExtractionPipeline,
  texts: string[],
): Promise<number[][]> {
  const vectors: number[][] = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    vectors.push(Array.from(output.data as Float32Array));
  }
  return vectors;
}

async function extractTextFromPdf(pdfPath: string): Promise<KBChunk[]> {
  const chunks: KBChunk[] = [];

  try {
    const { PDFParse } = await import("pdf-parse");
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = new Uint8Array(dataBuffer);
    const parser = new PDFParse({ data });
    const result = await parser.getText();

    for (const page of result.pages) {
      const pageNum = page.num;
      if (!page.text.trim()) continue;

      const paragraphs = page.text.split("\n\n");

      for (let paraIdx = 0; paraIdx < paragraphs.length; paraIdx++) {
        const paragraph = paragraphs[paraIdx].trim();
        if (paragraph.length > 50) {
          chunks.push({
            id: `page_${pageNum}_para_${paraIdx}`,
            text: paragraph,
            page: pageNum,
            paragraph: paraIdx,
            source: "DnD_BasicRules_2018.pdf",
          });
        }
      }
    }
  } catch (e) {
    console.error(`Error reading PDF: ${e}`);
    return [];
  }

  return chunks;
}

async function createKnowledgeBase(pdfPath: string, dbPath: string) {
  console.log("Extracting text from PDF...");
  const chunks = await extractTextFromPdf(pdfPath);

  if (chunks.length === 0) {
    console.log("No text chunks extracted from PDF");
    return;
  }

  console.log(`Extracted ${chunks.length} text chunks`);

  const extractor = await createEmbedder();

  console.log("Generating embeddings and storing in LanceDB...");
  const db = await lancedb.connect(dbPath);

  const batchSize = 50;
  const allRecords: LanceRecord[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.text);
    const vectors = await embedTexts(extractor, texts);

    for (let j = 0; j < batch.length; j++) {
      allRecords.push({ ...batch[j], vector: vectors[j] });
    }

    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / batchSize);
    console.log(`Embedded batch ${batchNum}/${totalBatches}`);
  }

  await db.createTable(
    "dnd_basic_rules",
    allRecords as unknown as Record<string, unknown>[],
    { mode: "overwrite" },
  );

  console.log(`Knowledge base created successfully at: ${dbPath}`);
  console.log(`Total documents: ${allRecords.length}`);
}

// Main
const pdfFile = path.join(__dirname, "DnD_BasicRules_2018.pdf");

if (!fs.existsSync(pdfFile)) {
  console.log(`PDF file '${pdfFile}' not found!`);
  console.log("Please place DnD_BasicRules_2018.pdf in the utils/ directory.");
  process.exit(1);
}

const outputPath = path.join(__dirname, "dnd_knowledge_base");
await createKnowledgeBase(pdfFile, outputPath);
console.log("Knowledge base creation complete!");
