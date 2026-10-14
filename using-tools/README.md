# 2. Using Tools

Agents become useful when they can call tools. This folder has three agents, each showing a different kind of tool: a vended HTTP tool, vended file-system tools, and a custom tool you define yourself.

## The three agents

| File | Tools | What it shows |
|---|---|---|
| `agent.ts` | `httpRequest` (vended) | The agent fetches a web page and answers a question from it (the designers of D&D from Wikipedia). |
| `writing-agent.ts` | `fileEditor` + `bash` (vended) | "Kiro the Grey Hat" writes a Fibonacci script to disk and runs it. Note: this agent writes files in your working directory and executes shell commands. |
| `agent-with-dice-rolling.ts` | a custom `roll_dice` tool | "Lady Luck" uses a tool you define with `tool()` + a Zod schema to roll 4d6-drop-lowest ability scores. |

Vended tools ship with the SDK (`@strands-agents/sdk/vended-tools/*`). Custom tools are defined inline with `tool({ name, description, inputSchema, callback })`.

## Run them

From the project root (after `npm install`):

```bash
npx tsx using-tools/agent.ts                    # web lookup
npx tsx using-tools/writing-agent.ts            # file editor + bash
npx tsx using-tools/agent-with-dice-rolling.ts  # custom dice tool
```

`writing-agent.ts` creates and runs a file in the current directory, so run it from a folder you don't mind writing to.

## Model

All three use Claude on Amazon Bedrock by default (AWS credentials with Bedrock access required). To run locally with Ollama instead, uncomment the Ollama block at the top of each file and follow the [Running locally with Ollama](../README.md#running-locally-with-ollama) section in the root README. Pick a tool-capable local model, these agents all call tools.

## Next

Move on to [`mcp-implementation/`](../mcp-implementation/) to expose a tool over the Model Context Protocol.
