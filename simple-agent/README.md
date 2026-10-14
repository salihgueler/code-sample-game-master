# 1. Simple Agent

The smallest possible agent: one system prompt, one prompt in, one response out. No tools, no memory, no orchestration. This is the baseline the rest of the workshop builds on.

## What it does

`agent.ts` creates a single Game Master agent with a system prompt that tells it to react to a player's identity (nationality, favourite football club) and open its reply with a themed phrase in the local language. It then invokes the agent once with a hardcoded prompt and prints the result.

## Run it

From the project root (after `npm install`):

```bash
npx tsx simple-agent/agent.ts
```

You should see a single Game Master response printed to the console.

## Model

Uses Claude on Amazon Bedrock by default, so you need AWS credentials with Bedrock model access. To run it locally with Ollama instead, uncomment the Ollama block at the top of `agent.ts` and follow the [Running locally with Ollama](../README.md#running-locally-with-ollama) section in the root README.

## Next

Move on to [`using-tools/`](../using-tools/) to give an agent tools it can call.
