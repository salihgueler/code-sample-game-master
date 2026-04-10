import { Agent } from "@strands-agents/sdk";
import { httpRequest } from "@strands-agents/sdk/vended-tools/http-request";

const agent = new Agent({
  tools: [httpRequest],
});

await agent.invoke(`
  Using the website https://en.wikipedia.org/wiki/Dungeons_%26_Dragons tell me the name of the designers of
  Dungeons and Dragons.
`);
