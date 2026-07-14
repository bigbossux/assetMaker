# Roadmap

Ideas for future versions — not implemented yet, not committed to. Recorded here so they don't get lost and so `log-lesson`/future design work has a place to check before re-proposing something already on the list.

## Ad platform integration (Google Ads, Meta Ads)

Push assetMaker-generated images/video directly into ad campaigns instead of stopping at "asset generated, now go upload it yourself."

- **Google Ads** — via an MCP server for the Google Ads API (not currently connected in this environment; would need to be added/found). Would let a new skill (e.g. `publish-ad`) create/update ad creative in an existing campaign directly from a generated asset.
- **Meta Ads** — same idea via the Meta Marketing API / an MCP server for it.
- **Reuse the existing marketing skills already available in this environment rather than reinventing ad strategy logic**:
  - `ads-google`, `ads-meta` — deep account/creative audits; a future `generate-asset` → ad-platform handoff should check these audits' creative-diversity and platform-spec guidance (aspect ratios, safe zones, format requirements) *before* generating, not after.
  - `ads-create`, `ads-generate`, `ads-dna`, `ads-photoshoot` — campaign concept/copy/brand-DNA and photography workflows that should feed the *brief* a generation prompt is built from, so assetMaker isn't guessing at creative direction independently of established campaign strategy.
  - `ads-creative` — cross-platform creative-fatigue and diversity scoring; could gate whether a new generation is even needed vs. reusing/varying an existing asset from the library.
- This is a real scope jump from "generate an asset" to "manage ad creative lifecycle" — should probably be its own skill or two (`publish-ad`, maybe `audit-before-generate`) rather than folded into `generate-asset`, to keep that skill focused.

## Social engagement agents (e.g. Reddit)

An agent that finds and comments on relevant Reddit (and similar) threads — for promotion, community engagement, or monitoring brand mentions.

Needs real thought before building, not just wiring up an API:
- Authenticity/disclosure — an agent posting as a brand or product needs to not read as covert marketing/astroturfing; platform ToS and subreddit-specific rules on promotional content matter a lot here.
- This is a "send a message on the user's behalf" / "publish public content" class action — should always require per-post confirmation, never auto-post, matching the caution already baked into how this plugin handles paid generation.
- Scope: starts as a monitoring/drafting agent (finds relevant threads, drafts a reply, waits for the user to approve and post it themselves) before any version of this should be allowed to post autonomously, if ever.

## Availability for other LLMs / tools, not just Claude

Everything here is currently Claude-specific by construction — `skills/*/SKILL.md` and `.claude-plugin/plugin.json` are Claude Code's/Cowork's own plugin format, not a portable one. Other tools (Cursor, Cline, Windsurf, generic agent frameworks) can't install this as-is.

Two layers worth separating when tackling this:
- **The Atlas Cloud MCP server itself is already tool-agnostic** — MCP is a cross-vendor protocol, so any MCP-compatible client can already talk to `atlascloud-mcp` directly, same as any other MCP server. The generation *capability* isn't Claude-locked; the *workflow discipline* around it (cost confirmation, storyboard/voice preview, asset library conventions, the accumulated failure-mode knowledge) currently only exists as Claude skill instructions, so a non-Claude tool using the raw MCP server gets none of that.
- **Porting the actual workflow logic** to other tools would mean something closer to how `ainstruct` handles multi-tool sync today (parallel instruction files per tool — Cursor rules, a generic `AGENTS.md`, Copilot instructions, Gemini system instructions — kept in sync from one canonical source rather than copy-pasted and left to drift). The cost-discipline rules, the "check reusable library before regenerating," the known model failure modes — all of that content is tool-agnostic in substance even though it's currently written as Claude skill bodies.

Given `ainstruct` already exists as this repo's owner's canonical multi-tool sync point, the natural home for a ported version might be *there* (referencing assetMaker's underlying logic) rather than duplicating a whole second sync system inside assetMaker itself — worth deciding which repo owns the ported instructions before starting, not assuming assetMaker should grow its own parallel-file-per-tool structure.

## Not yet scoped

All three ideas above need their own design pass (component planning, clarifying questions) before implementation — same process used for the rest of this plugin. Don't build against this list without going through that.
