# 4. A2A (Agent-to-Agent) Orchestration

The final pattern: several specialist agents, each its own A2A server, tied together by a Game Master orchestrator. The orchestrator also reuses the MCP dice server from chapter 3. This is where tools, MCP, RAG, and multi-agent communication come together.

## The agents

| Folder / file | Port | Role |
|---|---|---|
| `rules-agent/rules-agent.ts` | 8000 | D&D rules lookup over RAG. Embeds your query locally (Hugging Face `all-MiniLM-L6-v2`) and searches a LanceDB vector store built from the D&D Basic Rules PDF. |
| `character-agent/character-agent.ts` | 8001 | Character CRUD. Creates, finds, and lists characters, persisting them to `character-agent/characters.json`. |
| `gamemaster-orchestration/gamemaster-orchestration.ts` | 8009 | The orchestrator. Exposes an HTTP API, wraps the two agents above as A2A tools, connects to the MCP dice server, and returns strict JSON responses. The React frontend talks to this. |
| `utils/create_knowledge_base.ts` | — | One-off script that builds the LanceDB store from `utils/DnD_BasicRules_2018.pdf`. A pre-built store is already committed. |

## Run it

You need four terminals, all from the project root (after `npm install`). Start them in this order so each dependency is up first.

```bash
# Terminal 1 — MCP dice server (from chapter 3), port 8080
npx tsx mcp-implementation/dice-roll-mcp-server.ts
```

```bash
# Terminal 2 — Rules Agent, port 8000
npx tsx a2a-implementation/rules-agent/rules-agent.ts
```

```bash
# Terminal 3 — Character Agent, port 8001
npx tsx a2a-implementation/character-agent/character-agent.ts
```

```bash
# Terminal 4 — Game Master orchestrator, port 8009
npx tsx a2a-implementation/gamemaster-orchestration/gamemaster-orchestration.ts
```

Once all four are running, send a request to the orchestrator:

```bash
curl -X POST http://localhost:8009/inquire \
  -H "Content-Type: application/json" \
  -d '{"question": "Create a level 1 half-elf bard named Finn"}'
```

Or run the [React frontend](../sample-once-upon-agentic-ai-typescript-frontend/), which calls the same API.

## Rebuilding the knowledge base

The Rules Agent ships with a pre-built LanceDB store, so you don't normally need this. To regenerate it from the PDF:

```bash
npx tsx a2a-implementation/utils/create_knowledge_base.ts
```

The script reads `utils/DnD_BasicRules_2018.pdf`, chunks it per paragraph, embeds each chunk locally, and writes `utils/dnd_knowledge_base`. Embeddings run on your machine and need no cloud account.

## Model

The three agents use Claude on Amazon Bedrock by default (AWS credentials with Bedrock access required). The MCP dice server and the local embeddings need no model. To run the agents locally with Ollama instead, uncomment the Ollama block near the top of each agent file, set `model: ollamaModel` on the agent, and follow the [Running locally with Ollama](../README.md#running-locally-with-ollama) section in the root README. The orchestrator demands strict JSON-only output, so a larger local model follows that instruction more reliably than a small one.
