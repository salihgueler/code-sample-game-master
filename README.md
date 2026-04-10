# Once Upon Agentic AI — D&D Edition 🐉

A hands-on workshop exploring agentic AI patterns through Dungeons & Dragons, built with [Strands Agents SDK](https://github.com/strands-agents/sdk-typescript) in TypeScript.

Each folder demonstrates a progressively more advanced agentic pattern — from a simple single-turn agent all the way to a multi-agent orchestration with A2A protocol, MCP tools, RAG, and a React frontend.

## Project Structure

```
├── simple-agent/              # 1. Minimal agent — single prompt, single response
├── using-tools/               # 2. Agents with tools
│   ├── agent.ts               #    HTTP request tool (web lookup)
│   ├── writing-agent.ts       #    File editor + bash tools
│   └── agent-with-dice-rolling.ts  # Custom dice-rolling tool
├── mcp-implementation/        # 3. Model Context Protocol
│   ├── dice-roll-mcp-server.ts     # MCP server (Express + Streamable HTTP)
│   └── game-master-mcp-client.ts   # MCP client agent (interactive REPL)
├── a2a-implementation/        # 4. Agent-to-Agent orchestration
│   ├── rules-agent/           #    Rules lookup agent (LanceDB + RAG)
│   ├── character-agent/       #    Character CRUD agent (JSON DB)
│   ├── gamemaster-orchestration/   # Orchestrator combining A2A + MCP
│   └── utils/                 #    Knowledge base builder (PDF → LanceDB)
└── sample-once-upon-agentic-ai-typescript-frontend/  # 5. React + Vite frontend
```

## Prerequisites

- Node.js 18+
- An AWS account with [Amazon Bedrock](https://aws.amazon.com/bedrock/) model access enabled (Claude)

## Getting Started

```bash
npm install
```

### 1. Simple Agent

A single-turn Game Master agent using Claude on Bedrock.

```bash
npx tsx simple-agent/agent.ts
```

### 2. Using Tools

Agents enhanced with tools — HTTP requests, file editing, and custom dice rolling.

```bash
npx tsx using-tools/agent.ts                    # Web lookup
npx tsx using-tools/writing-agent.ts            # File editor + bash
npx tsx using-tools/agent-with-dice-rolling.ts  # Dice rolling
```

### 3. MCP (Model Context Protocol)

A dice-rolling MCP server and a Game Master client that connects to it.

```bash
# Terminal 1 — start the MCP server
npx tsx mcp-implementation/dice-roll-mcp-server.ts

# Terminal 2 — start the interactive client
npx tsx mcp-implementation/game-master-mcp-client.ts
```

### 4. A2A (Agent-to-Agent) Orchestration

Multi-agent system with a Rules Agent (RAG over D&D Basic Rules), a Character Agent, and a Game Master orchestrator that ties them together with MCP dice rolling.

```bash
# Terminal 1 — MCP dice server
npx tsx mcp-implementation/dice-roll-mcp-server.ts

# Terminal 2 — Rules Agent (port 8000)
npx tsx a2a-implementation/rules-agent/rules-agent.ts

# Terminal 3 — Character Agent (port 8001)
npx tsx a2a-implementation/character-agent/character-agent.ts

# Terminal 4 — Game Master orchestrator (port 8009)
npx tsx a2a-implementation/gamemaster-orchestration/gamemaster-orchestration.ts
```

### 5. Frontend

A React UI that connects to the Game Master orchestrator API. Requires all four services from step 4 to be running.

```bash
cd sample-once-upon-agentic-ai-typescript-frontend
npm install
npm run dev
```

Opens at http://localhost:5173 — pick a character, connect to the Game Master, and play.

## Knowledge Base Setup

The Rules Agent uses a LanceDB vector store built from the D&D Basic Rules PDF. A pre-built database is included, but you can regenerate it:

```bash
npx tsx a2a-implementation/utils/create_knowledge_base.ts
```

## Tech Stack

- [Strands Agents SDK](https://github.com/strands-agents/sdk-typescript) — agent framework
- [Amazon Bedrock](https://aws.amazon.com/bedrock/) — LLM provider (Claude)
- [Model Context Protocol](https://modelcontextprotocol.io/) — tool interoperability
- [A2A Protocol](https://github.com/google/A2A) — agent-to-agent communication
- [LanceDB](https://lancedb.com/) — vector database for RAG
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js) — local embeddings (all-MiniLM-L6-v2)
- [React](https://react.dev/) + [Vite](https://vite.dev/) — frontend

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

## Connect

- GitHub: [@salihgueler](https://github.com/salihgueler)
- X: [@salihgueler](https://x.com/salihgueler)
- LinkedIn: [@salihgueler](https://linkedin.com/in/salihgueler)
- Bluesky: [@salihgueler](https://bsky.app/profile/salihgueler.bsky.social)
