import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.argv[2];
if (!url) {
  console.error("usage: node test_mcp_proxy.mjs <mcp-url>");
  process.exit(1);
}

const client = new Client({ name: "smoke-test", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(url));

try {
  await client.connect(transport);
  console.log("connected OK");

  const tools = await client.listTools();
  console.log("tools:", tools.tools.map((t) => t.name).join(", "));

  const balance = await client.callTool({ name: "atlas_get_balance", arguments: {} });
  console.log("atlas_get_balance result:");
  console.log(JSON.stringify(balance, null, 2));
} catch (err) {
  console.error("FAILED:", err.message || err);
  process.exit(1);
} finally {
  await client.close();
}
