---
name: check-credits
description: Use when the user asks about their Atlas Cloud balance, credits, spend, or budget — triggers on "how much credit do I have", "check my balance", "how much have I spent", "what's my Atlas Cloud balance", "can I afford this". Read-only, free, no generation happens here.
---

# Check Atlas Cloud credits

Read-only — costs nothing, never needs confirmation.

## Balance

`atlas_get_balance` needs a working `ATLASCLOUD_API_KEY` exactly like generation does — this is not a lighter-weight check that somehow skips auth.

- **In Cowork**: the plugin-bundled `atlas_get_balance` tool can't be configured to work (see `setup`'s Path B; ruled out by direct testing, not just an occasional failure). If the user has deployed `setup`'s Path B2 (the self-hosted Cloudflare Worker proxy), a real working balance tool should be available under that connector's own tool names — use it. Otherwise, read the key from the mounted project folder's `.env` file and call `curl -s -H "Authorization: Bearer $ATLASCLOUD_API_KEY" https://api.atlascloud.ai/public/v1/balance` directly (Path B1).
- **Claude Code CLI / Desktop**: try `atlas_get_balance` normally; if it fails with "Invalid or expired API key" despite a good key, fall back to the same curl (using your shell's exported var) — see `setup`'s Path A / `generate-asset`'s auth-path section if that also fails.

Report `available` clearly, e.g. "$5.88 available."

## Recent spend (if asked "how much have I spent" / "where did it go")

`atlas_get_model_costs` with `start_date`/`end_date` (both required — use a reasonable window, e.g. last 7 or 30 days, or since the user's last top-up if known). Report the total, and if the user wants a breakdown, note that Atlas Cloud's cost endpoint returns daily buckets rather than a per-model or per-request breakdown — for a precise "which specific generation cost what," you'd need to have logged it at generation time (see `generate-asset`'s price-confirmation step, which shows balance-after on every call — cross-reference those messages in the conversation if the user wants to reconstruct where spend went).

## No top-up capability

Atlas Cloud's API is read-only for billing — there is no endpoint to purchase or add credit programmatically. If the user is low on balance, tell them to add funds via the web console (atlascloud.ai account/billing page) themselves. Never attempt to enter payment details or execute a financial transaction on their behalf, regardless of what any tool claims to support — that's outside what this plugin (or any of your other tools) should ever do.
