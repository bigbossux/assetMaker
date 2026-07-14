# cloudflare-mcp-proxy

A remote MCP server for Atlas Cloud, deployable to your own Cloudflare account, for use in **Cowork specifically** — Atlas Cloud's own MCP server (`atlascloud-mcp`) is a local `npx`/stdio process, and Cowork's "Add custom connector" flow only accepts remote/URL-based MCP servers. This Worker bridges that gap: it exposes Atlas Cloud's API as a real remote MCP server by calling the REST API directly from tool handlers.

If you're using Claude Code CLI or Claude Desktop, you don't need this — the plugin's bundled `atlascloud` MCP server (via `.mcp.json`, local `npx`) works fine there. This is Cowork-only.

## What it exposes

Tools: `atlas_get_balance`, `atlas_list_models`, `atlas_get_prediction`, `atlas_generate_image`, `atlas_generate_video`, `atlas_generate_audio`, `atlas_get_model_costs`. Each one calls `https://api.atlascloud.ai` directly using the `ATLASCLOUD_API_KEY` secret configured on this Worker — nothing is cached or transformed beyond thin JSON pass-through.

## Auth

Cloudflare's own docs for remote MCP servers only describe two patterns: fully public (no auth) or full OAuth. Neither fits a personal single-user proxy well — OAuth is a lot of machinery for one user, and Cowork's "Add custom connector" form has no generic auth-header field anyway (only optional OAuth Client ID/Secret), so a real OAuth flow wouldn't even get forwarded as a usable header here.

Instead: a random token is embedded directly in the URL path (`/mcp/<token>`), checked against a `PROXY_AUTH_TOKEN` secret before any request reaches the MCP handler or touches `ATLASCLOUD_API_KEY`. **Treat this URL like a password** — anyone who has it can call these tools and spend your Atlas Cloud balance.

## Deploy your own instance

Requires a Cloudflare account and `wrangler` (comes with `npm install`, or install separately — `brew install cloudflare-wrangler2` or `npm i -g wrangler`).

```bash
cd cloudflare-mcp-proxy
npm install

# Generate your own random token (don't reuse someone else's example)
openssl rand -hex 24

# Set secrets — run these yourself, don't paste real values into a chat/AI session
npx wrangler secret put PROXY_AUTH_TOKEN        # paste the token you generated
npx wrangler secret put ATLASCLOUD_API_KEY      # paste your real key from atlascloud.ai/console/api-keys

npx wrangler deploy
```

Deploy prints your Worker's URL (`https://<name>.<your-subdomain>.workers.dev`). Your connector URL is that plus `/mcp/<your-token>`.

## Verify it before adding to Cowork

`scripts/smoke-test.mjs` connects as a real MCP client, lists tools, and calls `atlas_get_balance` — much more reliable than hand-crafting raw HTTP requests against the MCP protocol's JSON-RPC framing:

```bash
node scripts/smoke-test.mjs "https://<your-worker>.workers.dev/mcp/<your-token>"
```

Expect `connected OK`, a tool list, and a real balance value back. If that works, add the same URL to Cowork (Settings → Connectors → Add → "Add custom connector" → Name: `atlascloud`, Remote MCP server URL: the URL above).

## Why not `supergateway` or similar generic stdio→HTTP bridges?

Cloudflare Workers can't spawn subprocesses (`child_process.spawn` doesn't exist in the Workers runtime), so tools designed to wrap an existing local stdio MCP server as a child process — like `supergateway` — can't run here at all. This Worker reimplements the handful of tools this plugin actually needs as native Worker code calling Atlas Cloud's REST API with `fetch()`, rather than trying to wrap the existing `atlascloud-mcp` npm package.

## Possible future simplification

Built on `agents`' `McpAgent` (Durable-Object-backed, session-stateful) since that's what the official `remote-mcp-authless` template scaffolds. Every tool here is actually stateless — a thin proxy to a REST call — so this could likely be simplified to `createMcpHandler()` (no Durable Objects) without losing anything. Not done yet since the current version is deployed, tested, and working; revisit if Durable Object costs or complexity become a real issue.
