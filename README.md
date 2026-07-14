# assetMaker

A Claude Code / Claude Desktop plugin for generating and editing image, video, and audio assets.

- **Generation** (paid): Atlas Cloud, across image/video/audio models — Claude surveys available models and their pricing per request rather than defaulting to one, and always checks your balance and confirms estimated cost with you before submitting a generation.
- **Editing** (free): Remotion + hyperframes, run locally — reframing/resizing, stitching clips together, muxing audio, captions. No API cost for anything that doesn't need new pixels generated.
- **Replicate**: optional, off by default. You choose whether to enable it during setup.

## Install

```
claude plugin install bigbossux/assetMaker
```

or add it to a project directly by cloning/symlinking this repo's contents alongside your project, or referencing it as a marketplace source per Claude Code's plugin docs.

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
| `generate-asset` | Generate a new image, video, or audio/voice clip via Atlas Cloud | paid — always confirmed with you first |
| `produce-movie` | Longer/multi-scene video: reusable characters+voices first, then a scenario you approve *before* any paid generation, then per-scene generation, then free assembly | paid (per scene, all pre-approved) + free (assembly) |
| `edit-video` | Reframe, resize, stitch, caption, or otherwise edit *existing* footage via Remotion/hyperframes | free |

Atlas Cloud video models cap out around 10-15s per call — for anything longer, `produce-movie` is what generates multiple scenes and stitches them into one video.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ATLASCLOUD_API_KEY` | Yes | Atlas Cloud generation (image/video/audio) |
| `REPLICATE_API_TOKEN` | Only if you opt in during setup | Additional Replicate-hosted models |

**Don't wrap these in quotes** in your shell config (`export KEY=value`, not `export KEY="value"`). A quoting bug observed in Claude Desktop's `.mcp.json` env-var expansion can bake literal quote characters into the value it passes to the MCP server, which Atlas Cloud then rejects as an invalid key. See `skills/setup/SKILL.md` for the full troubleshooting path if you hit this.

## Why this exists

Built after a session generating a character-driven promo video via Atlas Cloud surfaced three recurring problems worth encoding once instead of relearning per-project:
1. Video generation cost isn't the flat headline "$X/request" price — it's token-based and scales with resolution/duration, and iterative regeneration (chasing a lip-sync or artifact fix) can burn a large budget fast without anyone explicitly deciding to spend it.
2. A meaningful fraction of "video work" (resizing, reframing, stitching) doesn't need AI generation at all — it's a deterministic edit that should be free and local.
3. Claude Desktop's MCP env-var handling has real, reproducible bugs (quoting, stale config snapshots) that are worth documenting once rather than re-debugging from scratch each time.
