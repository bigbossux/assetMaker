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

## Not yet scoped

Both of the above need their own design pass (component planning, clarifying questions) before implementation — same process used for the rest of this plugin. Don't build against this list without going through that.
