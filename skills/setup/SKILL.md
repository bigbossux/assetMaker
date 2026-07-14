---
name: setup
description: Use when the user wants to set up, configure, or initialize the assetMaker plugin for the first time in a project — triggers on "set up assetMaker", "configure asset maker", "initialize assetMaker", or when generate-asset/edit-video are invoked but ATLASCLOUD_API_KEY is not yet set.
---

# assetMaker setup

Run this once per machine (or per project, if the user wants project-scoped config) before using `generate-asset` or `edit-video`.

## 1. Verify Node.js and npm

```bash
node --version   # need >= 18
npm --version
```

If missing, tell the user to install Node.js first and stop.

## 2. Atlas Cloud API key (required)

Atlas Cloud powers all paid generation (image/video/audio models).

1. Ask the user to get a key from https://www.atlascloud.ai/console/api-keys if they don't have one.
2. Ask where they want it stored: a project-local `.env`-style shell file they already source, or their shell profile (`~/.zshrc` / `~/.bashrc`).
3. Have them set `ATLASCLOUD_API_KEY` there. **Do not wrap the value in quotes** in the shell file — some MCP client env-var expansion implementations (observed in Claude Desktop) mangle quoted values into `"key"` (literal quote characters included), which Atlas Cloud rejects as an invalid key. Plain `export ATLASCLOUD_API_KEY=apikey-xxxx` (no quotes) is safest.
4. After they set it, verify with a fresh shell:
   ```bash
   zsh -ic 'echo "len=${#ATLASCLOUD_API_KEY}"'
   ```
   A length of 0 means it didn't get picked up — troubleshoot before continuing.

### If the MCP tools report "Invalid or expired API key" despite a good key

This has been observed as a Claude Desktop bug where the `.mcp.json` `${ATLASCLOUD_API_KEY}` expansion gets pinned to a stale/mangled snapshot from whenever the MCP server first connected, and doesn't refresh even across full app restarts or new chats tied to the same underlying session.

Don't loop on restarting the app. Instead:
1. Verify the key works directly against the API (bypassing the MCP layer entirely):
   ```bash
   curl -s -H "Authorization: Bearer $ATLASCLOUD_API_KEY" https://api.atlascloud.ai/public/v1/balance
   ```
   If this returns a real balance, the key is fine and the bug is in the MCP connection, not the credential.
2. If confirmed, fall back to calling the Atlas Cloud REST API directly via `curl` for generation calls in this session (see `generate-asset` skill) rather than the `mcp__atlascloud__*` tools, and tell the user the MCP layer needs a fresh chat (not just an app restart) to pick up the current config.
3. `atlas_get_model_info` / `atlas_search_docs` are read-only and tend to keep working even when the auth-gated tools (`atlas_get_balance`, `atlas_generate_*`, `atlas_upload_media`) don't — safe to use those for model lookups regardless.

## 3. Replicate (optional, opt-in — off by default)

Replicate gives access to additional third-party models beyond Atlas Cloud's catalog, but it's a separate paid account and API surface. **Do not enable this automatically.** Ask the user explicitly:

> "Do you want to enable Replicate as an additional model source? It's optional — Atlas Cloud alone covers image/video/audio generation. Only enable this if you specifically want access to Replicate-hosted models."

- **If no** (default): do nothing further. Do not add a `replicate` entry to `.mcp.json`, do not mention it again unless asked.
- **If yes**:
  1. Point them to https://replicate.com/account/api-tokens for a token.
  2. Have them set `REPLICATE_API_TOKEN` in their shell (same quoting caveat as above — no wrapping quotes).
  3. Add a `replicate` entry to this plugin's `.mcp.json` (or the current project's `.mcp.json` if project-scoped) alongside `atlascloud`:
     ```json
     "replicate": {
       "command": "npx",
       "args": ["-y", "replicate-mcp"],
       "env": { "REPLICATE_API_TOKEN": "${REPLICATE_API_TOKEN}" }
     }
     ```
     (Verify the actual package name for the current Replicate MCP server before adding — check `npm view replicate-mcp` or search for the official Replicate MCP integration, since this may change.)
  4. Tell the user a fresh chat is needed for the new server to connect.

## 4. Remotion + hyperframes (free local editing — no API key needed)

These do NOT require Atlas Cloud or any paid account. They run entirely locally for compositing, reframing, resizing, and stitching video that's already been generated — no reason to gate them behind setup. If the project doesn't have a Remotion project yet, `edit-video` will scaffold one on first use (see that skill).

## 5. Confirm

Summarize what's configured:
- Atlas Cloud: ✓ (or ✗ — blocking)
- Replicate: enabled / not enabled (user's choice)
- Remotion + hyperframes: available on-demand, no setup needed

Tell the user they're ready to use `generate-asset` and `edit-video`.
