---
name: produce-movie
description: Use when the user wants a longer video than a single generation call can produce — a multi-scene video, an "ad", a "movie", a "full video with intro and outro", or anything described in terms of a script/narrative rather than one shot. Atlas Cloud video models cap out around 15s per call, so longer output means generating several scenes and stitching them — this skill is the orchestration layer over generate-asset (paid, per scene) and edit-video (free, stitching). Do not generate scenes ad hoc without this skill's scenario-confirmation step first.
---

# Produce a longer video (multi-scene)

A single Atlas Cloud video generation call tops out around 10-15 seconds. A "movie" — anything longer, or anything with an intro/scene/outro structure — is built by generating several short scenes and stitching them together for free. Example shape: 5× 10s scenes generated via `generate-asset`, assembled into one ~50s video via `edit-video`. Never skip straight to generating scenes; follow the phases below in order.

> If something goes wrong in this workflow that a future run should know about — a bad continuity assumption, a cost estimate that was off across a multi-scene budget — see `log-lesson` before moving on.

## Phase 0: Reusable assets first

Before generating any scene, generate or collect everything that needs to stay *consistent* across every scene, once:

- **Characters/personas**: reference images for each character (generate via `generate-asset` if none exist, e.g. with an image model), plus a written definition (appearance, personality, role) saved to a `characters.json`-style file in the project so every later scene prompt can reference it instead of re-describing the character from scratch and drifting.
- **Voices**: generate each character's voice line(s) via a TTS model (see `generate-asset`) as clean, separate per-line clips — not one merged multi-speaker track. **Always let the user hear and confirm each voice before it's used in any scene generation** — this is `generate-asset`'s voice-preview step; don't skip it just because it's inside a bigger multi-scene workflow. If a character speaks in multiple scenes, keep voice/model/settings identical across all of them (same `voice_id`, same stability setting) so the voice doesn't drift scene to scene.
- **Brand assets**: logo, intro/outro key art, color palette — anything that appears in every video, generate once and reuse.

Save all of this under a dedicated assets folder (e.g. `ad-assets/characters/`, `ad-assets/brand/`) so it survives across sessions and multiple videos, not just the one you're making right now.

This phase still follows `generate-asset`'s cost-confirmation rules — persona/voice generation is paid too.

## Phase 1: Write the scenario, then STOP for confirmation

Before generating a single scene, write out the full scene-by-scene plan as a structured document (a `scenes.json`-style file works well) covering, per scene:

- Title / beat description
- Narration (which character says what)
- Target duration
- The actual generation prompt you intend to submit
- Camera/continuity notes (e.g. "starts from previous scene's last frame")

Also compute and show the **total estimated cost across all planned scenes** (sum of each scene's estimate, using the same cost-discipline as `generate-asset`) — the user needs to approve the whole movie's budget up front, not discover it scene-by-scene. Use the same structured price-confirmation format as `generate-asset`, but as a totals table:

```
📋 Scenario: <N> scenes, ~<total duration>s total

| # | Beat | Duration | Est. cost |
|---|------|----------|-----------|
| 1 | ...  | 10s      | $X.XX     |
...
Total estimated cost: $Y.YY   |   Balance after: $Z.ZZ of $B.BB
```

**Do not generate anything until the user explicitly confirms the scenario.** If they want changes, revise and re-confirm — don't proceed on an assumption that silence means approval.

## Phase 2: Storyboard (optional — ask, don't assume)

Once the scenario is confirmed, ask the user whether they want a full storyboard before any video generation starts: one cheap still image per scene (an image-model call per scene, using the planned reference images/characters and describing that scene's key frame), shown as a set before committing to the actual video renders.

This is optional because some users will want to move straight to video, but it's worth offering every time on a multi-scene job — the cost of N still images is a small fraction of N video renders, and it catches composition/character/continuity problems across the whole movie at once rather than one expensive scene at a time. If the user declines, skip straight to Phase 3.

## Phase 3: Generate each scene

For each confirmed scene, use `generate-asset` (which handles its own per-call price confirmation — still show it, don't skip it just because the total was already approved; per-scene actuals can differ from the estimate).

**Continuity between scenes**: if scenes should visually flow into each other (not hard-cut), use `return_last_frame: true` on each generation, then feed that returned frame back in as the first `reference_images` entry for the *next* scene's request. This keeps consecutive scenes starting from where the previous one visually ended instead of resetting to a generic wide shot each time.

Apply the same per-scene lessons from `generate-asset`'s known-failure-modes section (limb hallucination, partial lip-sync, background fidelity, separate audio tracks per speaker) to every scene, not just the first one you generate.

## Phase 4: Assemble the movie (free)

Once all scenes are generated and approved individually, use `edit-video` to:
1. Normalize codec/resolution/framerate across all scene clips (and intro/outro if present).
2. Add silent audio tracks to any clip missing one, so concatenation doesn't drop audio.
3. Concatenate in order via `ffmpeg`'s `filter_complex concat` (re-encoding, not the stream-copy demuxer, given clips may differ slightly in audio channel count etc.).
4. Pull frames at every transition point and inspect them before calling it done — a clean exit code doesn't mean the cut is clean.

## Phase 5: Review with the user

Show the user the assembled movie (or at least confirm frames from each transition) and ask if any individual scene needs a re-roll before considering the movie final. A single bad scene should be regenerated on its own (back to Phase 3 for that scene, with its own price confirmation) — don't regenerate scenes that are already approved.
