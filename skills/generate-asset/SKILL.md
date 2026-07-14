---
name: generate-asset
description: Use when the user wants to generate an image, video, or audio/voice clip via Atlas Cloud — triggers on "generate a video", "generate an image", "create a voiceover", "make an animation", "render this scene", "text to speech this line", or any request to produce a new visual/audio asset with AI. Also use when deciding which Atlas Cloud model to use for a generation task. Do not use for editing/resizing/reframing existing footage — see edit-video for that (it's free, no API cost).
---

# Generate an asset via Atlas Cloud

Atlas Cloud (`mcp__atlascloud__*` tools, or direct REST fallback — see below) provides image, video, and audio (TTS) generation across many provider models. This skill is paid generation — follow the cost discipline below on every call, no exceptions.

> If something goes wrong here that a future run of this plugin should know about — an unexpected cost, a model behaving unlike its schema, a new failure mode — see `log-lesson` before moving on.

## Before generating anything: cost discipline (mandatory)

1. **Check current balance.** `atlas_get_balance`, or if that tool is failing auth (see Troubleshooting below), `curl -H "Authorization: Bearer $ATLASCLOUD_API_KEY" https://api.atlascloud.ai/public/v1/balance`.
2. **Survey alternatives.** Call `atlas_list_models` filtered to the relevant type (Image/Video/Audio) — do not default to the first or most-familiar model. Compare at least one cheaper option against whatever you'd naturally reach for.
3. **Pricing is not the flat headline price.** The "$X/request" shown by `atlas_get_model_info` is a floor, not the real cost for video especially — video billing scales with resolution × duration (tokens). A 9s/1080p `reference-to-video` render has cost roughly $2–3 in practice; a 4s/1080p render roughly $1–1.5; 720p is meaningfully cheaper than 1080p for the same duration. Use `atlas_get_model_costs` (needs `start_date`/`end_date`, e.g. today's date for both) against recent history if you want a real empirical anchor instead of guessing.
4. **Always show a price confirmation before generating — Higgsfield-style.** Don't just mention cost in passing inside a longer message; surface it as its own clear, structured block the user can't miss, every single time, no exceptions for "small" or "obviously cheap" calls either. Use this shape:

   ```
   💰 Estimated cost: $X.XX
      Model: <model id> (<resolution>, <duration>s if video)
      Cheaper option: <alt model id> — $Y.YY (<tradeoff: e.g. "720p instead of 1080p, softer text">)
      Balance after: $Z.ZZ of $B.BB remaining

   Proceed with <model id>, or use the cheaper option?
   ```

   Then actually wait for the answer — use `AskUserQuestion` when there's a real choice to make (e.g. proceed vs. cheaper alt vs. cancel), not a plain yes/no buried in prose.

5. **Get explicit go-ahead before submitting.** Do not chain multiple paid regenerations back-to-back (e.g. iterating on a prompt fix, lip-sync, an artifact) without re-running the price confirmation and checking in on cost after each one — a single silent retry loop can burn a large fraction of a budget in a few requests.
6. **Prefer cheap validation first.** If testing whether a prompt fix works, use a shorter duration / lower resolution / single test frame before committing to a full-price full-resolution run — and still show the price confirmation for that cheap test, not just the final run.

## Generation workflow

1. Identify asset type (Image / Video / Audio) and pick a candidate model via `atlas_list_models(type=...)` or `atlas_search_docs(query=...)`.
2. `atlas_get_model_info(model=...)` for the exact parameter schema — required vs optional fields vary a lot between models. Don't guess parameter names.
3. For image/audio reference inputs from local files, either use `atlas_upload_media` (returns a public URL) or inline as a base64 data URI (`data:image/png;base64,...`) directly in the request body — both work for `reference_images`/`reference_audios`/`images` style fields on most models.
4. Submit the generation call. It returns a prediction `id` immediately (status `processing`) — this is async.
5. Poll `atlas_get_prediction(prediction_id=...)` (or `GET /api/v1/model/prediction/{id}` / `/result/{id}` directly) every ~5-10s until `status` is `completed`/`succeeded`/`failed`/`timeout`. Don't poll faster than every 5s.
6. Download `outputs[]` URLs to the project's asset folder once complete.

## Troubleshooting: MCP auth failing despite a good key

If `mcp__atlascloud__*` tools (other than `atlas_get_model_info`/`atlas_search_docs`, which are read-only and auth-independent) return "Invalid or expired API key":

1. Confirm the key is actually valid by hitting the REST API directly: `curl -s -H "Authorization: Bearer $ATLASCLOUD_API_KEY" https://api.atlascloud.ai/public/v1/balance`.
2. If that succeeds but the MCP tool still fails, this is a known Claude Desktop bug (stale/mangled `.mcp.json` env-var expansion — see `setup` skill for detail). Don't loop on app restarts. Fall back to direct `curl` calls against `https://api.atlascloud.ai/api/v1/model/generateVideo`, `.../generateImage`, `.../generateAudio` (POST, `Authorization: Bearer $ATLASCLOUD_API_KEY`, JSON body per the model's schema) for the rest of the session, and tell the user the MCP connection needs a genuinely fresh chat to recover.

## Background rendering scripts (bash, not zsh)

If you background a polling loop, avoid the variable name `status` in `zsh -ic` scripts — it's a zsh read-only special variable and will fail with `read-only variable: status`. Use a different name (e.g. `st`). When polling multiple predictions in one loop, double- and triple-check that each result is written under the correct ID's filename — a scoping bug here (writing the wrong prediction's result to the wrong file) is easy to introduce silently and will make you report the wrong output to the user. Verify by re-checking `data.id` in the file matches the ID you intended before trusting it.

## Known model failure modes worth designing prompts around

- **Character/limb hallucination**: reference-to-video models can invent extra limbs (e.g. hands/arms on a character with none) especially during "gesture" instructions. If a character's design has no arms, say so explicitly and forbid it in the prompt ("NEITHER mascot has arms — do not draw any arm/hand/finger shape, ever"), and describe gestures as body lean/tilt instead of limb movement. Apply this to *every* character in the scene, not just the one that failed last time — the model will happily move the artifact to a different character.
- **Partial lip-sync**: mouths can stop animating partway through a longer line even with correct audio-track mapping. Explicitly instruct sustained lip-sync for the *entire* duration of each audio track, not just "lip-sync this audio."
- **Background/text fidelity**: `reference-to-video` regenerates the whole frame rather than compositing a background layer — fine UI text/detail degrades noticeably at 720p. Bump to 1080p if legible on-screen text matters; note this doubles-ish the cost.
- **Multi-speaker audio**: if a scene has two speakers, pass each speaker's line as a *separate* `reference_audios` entry (don't merge into one track) — models given a single merged track will guess where the speaker change happens and often get it wrong.
