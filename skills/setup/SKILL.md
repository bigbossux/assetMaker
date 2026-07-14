---
name: setup
description: Use when the user wants to set up, configure, or initialize the assetMaker plugin for the first time in a project — triggers on "set up assetMaker", "configure asset maker", "initialize assetMaker", or when generate-asset/edit-video are invoked but ATLASCLOUD_API_KEY is not yet set.
---

# assetMaker setup

Run this once per machine (or per project, if the user wants project-scoped config) before using `generate-asset` or `edit-video`.

> If something goes wrong here that a future setup should know about — a new env/auth/MCP quirk — see `log-lesson` before moving on.

## 1. Verify Node.js and npm

```bash
node --version   # need >= 18
npm --version
```

If missing, tell the user to install Node.js first and stop.

## 2. Atlas Cloud API key (required)

Atlas Cloud powers all paid generation (image/video/audio models). **How you set this depends entirely on which Claude surface you're in — these are two genuinely different mechanisms, not variations on one theme. Figure out which surface you're in first, then follow only that path.**

### Path A: Claude Code CLI or Claude Desktop (terminal / shell-based)

1. Ask the user to get a key from https://www.atlascloud.ai/console/api-keys if they don't have one.
2. Ask where they want it stored: a project-local `.env`-style shell file they already source, or their shell profile (`~/.zshrc` / `~/.bashrc`).
3. Have them set `ATLASCLOUD_API_KEY` there. **Do not wrap the value in quotes** in the shell file — Claude Desktop's `.mcp.json` env-var expansion mangles quoted values into `"key"` (literal quote characters included), which Atlas Cloud rejects as an invalid key. Plain `export ATLASCLOUD_API_KEY=apikey-xxxx` (no quotes) is safest.
4. After they set it, verify with a fresh shell:
   ```bash
   zsh -ic 'echo "len=${#ATLASCLOUD_API_KEY}"'
   ```
   A length of 0 means it didn't get picked up — troubleshoot before continuing.

**If the MCP tools report "Invalid or expired API key" despite a good key** (Claude Desktop specifically): this has been observed as a bug where the `.mcp.json` `${ATLASCLOUD_API_KEY}` expansion gets pinned to a stale/mangled snapshot from whenever the MCP server first connected, and doesn't refresh even across full app restarts or new chats tied to the same underlying session. Don't loop on restarting the app. Instead:
1. Verify the key works directly against the API (bypassing the MCP layer entirely):
   ```bash
   curl -s -H "Authorization: Bearer $ATLASCLOUD_API_KEY" https://api.atlascloud.ai/public/v1/balance
   ```
   If this returns a real balance, the key is fine and the bug is in the MCP connection, not the credential.
2. If confirmed, fall back to calling the Atlas Cloud REST API directly via `curl` for generation calls in this session (see `generate-asset` skill) rather than the `mcp__atlascloud__*` tools, and tell the user the MCP layer needs a fresh chat (not just an app restart) to pick up the current config.
3. `atlas_get_model_info` / `atlas_search_docs` are read-only and tend to keep working even when the auth-gated tools (`atlas_get_balance`, `atlas_generate_*`, `atlas_upload_media`) don't — safe to use those for model lookups regardless.

### Path B: Cowork

**Ruled out by direct testing, do not re-suggest these:**
- The `atlascloud` connector bundled with the plugin install: Cowork doesn't expand `${VAR}` placeholders, so it's stuck holding the literal text `${ATLASCLOUD_API_KEY}` as its "value," and that config is read-only after install with no reinstall-time prompt either.
- Pointing Cowork's "Add custom connector" form directly at Atlas Cloud: that form is for **remote, URL-based MCP servers** only (fields are `Name`, `Remote MCP server URL`, plus optional OAuth Client ID/Secret). Atlas Cloud's MCP server (`atlascloud-mcp`) is a **local process launched via `npx`**, not a hosted URL, and Atlas Cloud's own docs confirm they offer no remote/hosted MCP endpoint. No combination of values in that form will ever reach `atlascloud-mcp` directly.

**Two working options, pick based on whether the user wants real MCP tool calls or is fine with direct API calls:**

**Path B1 — quick, zero extra infrastructure (direct `curl`, no MCP at all in Cowork).** Skip MCP for Atlas Cloud entirely and call the REST API directly. Cowork's sandbox has real bash access, so this isn't a workaround-of-last-resort like it is for the Desktop bug (Path A) — used this way, it's just the plan.
1. Ask the user which project folder is connected/mounted in this Cowork session.
2. Have them create a file there (never committed to git — confirm it's covered by `.gitignore`, add an entry if not) containing the key, e.g. `.env`:
   ```
   ATLASCLOUD_API_KEY=apikey-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   This file lives inside the mounted folder, so — unlike the sandbox VM itself — it persists across Cowork sessions.
3. At the start of each task needing Atlas Cloud, read and export it before making any API call:
   ```bash
   export $(grep ATLASCLOUD_API_KEY .env | xargs)
   curl -s -H "Authorization: Bearer $ATLASCLOUD_API_KEY" https://api.atlascloud.ai/public/v1/balance
   ```
4. Use this same pattern for all generation calls (see `generate-asset`'s direct-`curl` examples) — `POST` to `.../generateVideo` / `generateImage` / `generateAudio`, poll `GET .../prediction/{id}`.

**Path B2 — real MCP tool calls, via a self-hosted proxy (one-time Cloudflare Workers deployment).** This plugin ships `cloudflare-mcp-proxy/` as **source code to deploy, not a shared hosted service** — every user who wants this must run their own `wrangler deploy` to their own Cloudflare account with their own secrets. It's a small Worker that reimplements Atlas Cloud's key tools (`atlas_get_balance`, `atlas_generate_image`, `atlas_generate_video`, `atlas_generate_audio`, `atlas_get_prediction`, `atlas_list_models`, `atlas_get_model_costs`) as a genuine remote MCP server, calling Atlas Cloud's REST API from Worker code with the key held server-side as a Cloudflare secret. This gives Cowork something with an actual URL to point "Add custom connector" at, sidestepping the local-process-vs-remote-URL mismatch entirely instead of working around it.

**Never suggest reusing a URL from a different deployment** (e.g. one mentioned earlier in a conversation, or in a screenshot) — each deployed Worker is tied to one specific person's `ATLASCLOUD_API_KEY`, so using someone else's URL means spending *their* balance, not the current user's, and requires having their secret token. There's no shared/multi-tenant version of this — it's one Worker per user, always.
1. Follow `cloudflare-mcp-proxy/README.md` to deploy: `npm install`, generate a random token (`openssl rand -hex 24`), `wrangler secret put PROXY_AUTH_TOKEN` and `wrangler secret put ATLASCLOUD_API_KEY` (**the user runs these themselves in their own terminal** — real secrets should never be typed into this chat or passed through your own tool calls), then `wrangler deploy`.
2. Verify with `node scripts/smoke-test.mjs "<url>/mcp/<token>"` before adding to Cowork — it connects as a real MCP client and confirms tools list + a real `atlas_get_balance` call, which is far more reliable than guessing from raw `curl` against the MCP wire protocol.
3. Add the resulting `<worker-url>/mcp/<token>` to Cowork's "Add custom connector" (Remote MCP server URL field). Tell the user explicitly to treat that URL like a password — the token is the only thing standing between anyone who has it and their Atlas Cloud balance.

Path B2 is more setup but gives real tool-calling through Cowork's native MCP UI; Path B1 is faster to get working and has no hosting to maintain. Ask the user which they'd prefer rather than assuming — default to suggesting B1 first for a quick unblock, then offer B2 if they want the fuller integration.

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

## 5. If running in Cowork specifically

See step 2's "Path B" above first — that covers the Atlas Cloud API key specifically, which is the most common Cowork blocker. The rest of this section covers separate, unrelated Cowork quirks (tool persistence, package managers).

Cowork runs sessions in an isolated sandbox VM that's **destroyed at the end of each session** — this is different from Claude Code CLI on a real machine, where installs just sit on disk. Two practical consequences:

- **Don't assume a tool installed in a previous session is still there.** At the start of each Cowork session, re-check rather than skip straight to using `remotion`/`hyperframes`/etc. — see `edit-video`'s setup check, which verifies `node_modules` actually exists, not just that `package.json` does.
- **Prefer installs that live inside a connected/mounted project folder over system-wide installs.** `npm install` into a project's own `node_modules` is written into the mounted folder itself, which is more likely to persist than something installed to a system-level location outside it (e.g. via a system package manager). This is undocumented/unconfirmed either way — treat it as "probably better, not guaranteed" rather than a fact to rely on.
- **Homebrew (`brew`) is likely unavailable.** The sandbox is a Linux VM even when the host OS is macOS, and Homebrew is macOS-native — this is unconfirmed by Anthropic's docs either way, but assume `brew install <anything>` may fail in Cowork specifically (it works fine in Claude Code CLI on a real Mac). Prefer a pip/npm-based alternative when one exists. Concretely: for audio transcription (used e.g. to split a merged multi-speaker voice track by word-level timestamp — see `generate-asset`'s multi-speaker-audio note), prefer `pip install openai-whisper` over `brew install whisper-cpp` if there's any chance this runs in Cowork — pip is far more likely to be available in a Linux sandbox than Homebrew.

## 6. Confirm

Summarize what's configured:
- Atlas Cloud: ✓ (or ✗ — blocking) — and which path was used (shell env var, or a Cowork custom connector)
- Replicate: enabled / not enabled (user's choice)
- Remotion + hyperframes: available on-demand, no setup needed

Tell the user they're ready to use `generate-asset` and `edit-video`.
