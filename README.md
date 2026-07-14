# assetMaker

A Claude Code / Claude Desktop plugin for generating and editing image, video, and audio assets.

- **Generation** (paid): Atlas Cloud, across image/video/audio models — Claude surveys available models and their pricing per request rather than defaulting to one, and always checks your balance and confirms estimated cost with you before submitting a generation.
- **Preview before you pay for video**: a storyboard (cheap still images) is always offered before a multi-scene video's actual renders, and any voice is generated and confirmed by you *before* it's used in a video generation.
- **Editing** (free): Remotion + hyperframes, run locally — reframing/resizing, stitching clips together, muxing audio, captions. No API cost for anything that doesn't need new pixels generated.
- **Replicate**: optional, off by default. You choose whether to enable it during setup.

## Install

This repo is both the plugin and its own marketplace (`.claude-plugin/marketplace.json` alongside `.claude-plugin/plugin.json`). Add the marketplace first, then install from it — a plain `claude plugin install owner/repo` does **not** work without this step; Claude's plugin installer specifically needs a marketplace source, not just a plugin repo.

**CLI:**
```bash
claude plugin marketplace add bigbossux/assetMaker
claude plugin install asset-maker@bigbossux
```

**Interactive (Claude Code CLI only — `/plugin` is not available in Cowork):**
```
/plugin marketplace add bigbossux/assetMaker
/plugin install asset-maker@bigbossux
```

**Cowork desktop app** uses a GUI flow for install, but **MCP will never work for Atlas Cloud in Cowork at all** — not the plugin-bundled connector, and not a manually-added one either. Atlas Cloud's MCP server is a local `npx` process with no remote/hosted equivalent, and Cowork's "Add custom connector" form only accepts remote URL-based servers — the transport types are fundamentally incompatible, confirmed by direct testing of every candidate mechanism.

1. Click **"+"** in the Personal plugins section (or the **Customize** menu in the left sidebar) → **"Add marketplace"** → enter `bigbossux/assetMaker`.
2. Click **"+"** next to the prompt box → **Plugins** → **Add plugin** → find and install `asset-maker`.
3. **Skip MCP entirely for Atlas Cloud in Cowork** — put your key in a `.env` file (gitignored) in whatever project folder is connected to your Cowork session:
   ```
   ATLASCLOUD_API_KEY=apikey-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   Every skill in this plugin calls the Atlas Cloud REST API directly with `curl` when running in Cowork (reading the key from that file), rather than going through `mcp__atlascloud__*` tools — see `skills/setup/SKILL.md`'s Path B for the exact pattern.

To try it locally instead of from GitHub, point at a local clone:
```bash
claude plugin marketplace add ./assetMaker
claude plugin install asset-maker@bigbossux
```

## Setup

Run the `setup` skill first (`"set up assetMaker"`). It will:
1. Verify Node.js/npm.
2. Walk you through getting an Atlas Cloud API key and setting `ATLASCLOUD_API_KEY` (required for generation).
3. Ask — explicitly, not automatically — whether you want Replicate enabled as an additional model source. If you say no (the default), it stays off and unmentioned.
4. Confirm Remotion + hyperframes are available (no key needed — installed on-demand by `edit-video` when first used).

## Skills

| Skill | What it does | Cost |
|---|---|---|
| `setup` | First-time configuration, including the Replicate opt-in | free |
| `brainstorm` | Conversational ideation to shape a concept before spending anything on a generation that might miss the mark | free |
| `generate-asset` | Generate a new image, video, or audio/voice clip via Atlas Cloud, saved into a reusable asset library (or a separate folder for one-off images) | paid — always confirmed with you first |
| `produce-movie` | Longer/multi-scene video: reusable characters+voices first, then a scenario you approve, then an optional storyboard preview, then per-scene generation, then free assembly | paid (per scene, all pre-approved) + free (assembly) |
| `edit-video` | Reframe, resize, stitch, caption, or otherwise edit *existing* footage via Remotion/hyperframes | free |
| `check-credits` | Shows your current Atlas Cloud balance and recent spend | free, read-only |
| `log-lesson` | Files a mistake/gotcha back into the relevant skill's own instructions, so the next project that installs this plugin doesn't repeat it | free |

Atlas Cloud video models cap out around 10-15s per call — for anything longer, `produce-movie` is what generates multiple scenes and stitches them into one video.

Atlas Cloud's API is read-only for billing — there's no way to add credit programmatically (via this plugin or otherwise). Top up at atlascloud.ai's web console when `check-credits` shows you're running low.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ATLASCLOUD_API_KEY` | Yes | Atlas Cloud generation (image/video/audio) |
| `REPLICATE_API_TOKEN` | Only if you opt in during setup | Additional Replicate-hosted models |

**How you set these depends on which Claude surface you're using:**

- **Claude Code CLI / Claude Desktop**: set them in your shell profile or a project `.env` file. **Don't wrap the value in quotes** (`export KEY=value`, not `export KEY="value"`) — a quoting bug in Claude Desktop's `.mcp.json` env-var expansion can bake literal quote characters into the value, which Atlas Cloud then rejects as invalid.
- **Cowork**: MCP doesn't work for this server at all here — see step 3 under "Install" above. The key goes in a `.env` file in your mounted project folder, read directly by `curl` calls, not through any MCP connector.

Full troubleshooting for both paths: `skills/setup/SKILL.md`.

## Why this exists

Built after a session generating a character-driven promo video via Atlas Cloud surfaced three recurring problems worth encoding once instead of relearning per-project:
1. Video generation cost isn't the flat headline "$X/request" price — it's token-based and scales with resolution/duration, and iterative regeneration (chasing a lip-sync or artifact fix) can burn a large budget fast without anyone explicitly deciding to spend it.
2. A meaningful fraction of "video work" (resizing, reframing, stitching) doesn't need AI generation at all — it's a deterministic edit that should be free and local.
3. Claude Desktop's MCP env-var handling has real, reproducible bugs (quoting, stale config snapshots) that are worth documenting once rather than re-debugging from scratch each time.

## Self-improvement

This plugin is meant to keep learning. Whenever a mistake, cost surprise, or tool bug turns up while using it, `log-lesson` writes the fix back into the relevant skill's own instructions (with your confirmation before anything is committed/pushed) — so the next project that installs this plugin starts out already knowing what this one had to learn the hard way. **Remember that updates aren't automatic**: this repo pins a `version` in `plugin.json`, so anywhere it's already installed needs `/plugin update` (or `claude plugin marketplace update assetMaker`) to pick up new lessons.

## Roadmap

Not built yet — see [ROADMAP.md](./ROADMAP.md) for ideas under consideration (Google/Meta Ads publishing integration, social-engagement agents).
