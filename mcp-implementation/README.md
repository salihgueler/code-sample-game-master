# 3. MCP (Model Context Protocol)

The previous chapter's tools lived inside the agent process. MCP moves a tool into its own server that any MCP-aware client can connect to over HTTP. Here a dice-rolling tool runs as a standalone server, and a Game Master agent connects to it as a client.

## The two pieces

| File | Role |
|---|---|
| `dice-roll-mcp-server.ts` | An MCP server (Express + Streamable HTTP) exposing a `roll_dice` tool. Listens on `http://localhost:8080/mcp`. |
| `game-master-mcp-client.ts` | An interactive REPL agent ("Lady Luck") that connects to the server, lists its tools, and uses them to answer your dice requests. |

## Run it

You need two terminals, both from the project root (after `npm install`).

```bash
# Terminal 1 — start the MCP server (stays running on port 8080)
npx tsx mcp-implementation/dice-roll-mcp-server.ts
```

```bash
# Terminal 2 — start the interactive client
npx tsx mcp-implementation/game-master-mcp-client.ts
```

In the client, type requests like `Roll a d20` or `Roll a d6`. Type `exit`, `quit`, or `bye` to leave.

## Model

The client agent uses Claude on Amazon Bedrock by default (AWS credentials with Bedrock access required). The server itself needs no model, it only rolls dice. To run the client locally with Ollama instead, uncomment the Ollama block near the top of `game-master-mcp-client.ts`, then set `model: ollamaModel` on the agent, and follow the [Running locally with Ollama](../README.md#running-locally-with-ollama) section in the root README. Use a tool-capable local model.

## Next

Move on to [`a2a-implementation/`](../a2a-implementation/) to connect several agents together.
