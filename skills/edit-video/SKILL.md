---
name: edit-video
description: Use when the user wants to reframe, resize, crop, stitch, concatenate, caption, or otherwise edit video that has ALREADY been generated or recorded — triggers on "resize this video for mobile", "make this vertical", "9:16 crop", "stitch these clips together", "add the intro/outro to this video", "compress this video", "combine these videos". These are free, local, deterministic edits via Remotion and hyperframes — never call a paid Atlas Cloud generation model for this. If the user actually wants NEW footage generated (not editing existing footage), use generate-asset instead.
---

# Edit video locally (free)

Everything in this skill runs locally with Remotion and/or hyperframes and `ffmpeg` — no Atlas Cloud API calls, no cost. Always prefer this over regenerating footage through a paid model when the task is really a composition/format change on assets that already exist.

> If something goes wrong here that a future run of this plugin should know about — a new ffmpeg/Remotion gotcha, a wrong assumption about existing footage — see `log-lesson` before moving on.

## When to use this vs. regenerating

- Changing aspect ratio, resolution, or file size of existing footage → **this skill** (free).
- Concatenating/stitching clips (e.g. intro + scene + outro) → **this skill** (free).
- Adding captions, simple text overlays, or muxing an existing audio track onto existing video → **this skill** (free).
- The actual pixel content is wrong (wrong character, bad lip-sync, hallucinated limb, wrong background) → that needs regeneration — use `generate-asset`, not this skill. Don't try to "fix" bad AI-generated content with local editing; it can't add lip-sync or remove a hallucinated limb that isn't there as a separate layer.

## Setup check

Look for a Remotion project (`remotion.config.ts`/`.js` + `package.json` with a `remotion` dependency) in or near the project's video assets folder. **Check that `node_modules` actually exists and is populated, not just that `package.json` does** — in Cowork specifically, the sandbox VM is destroyed between sessions, so a project folder can persist (if it's in a connected/mounted folder) while its `node_modules` from a prior session does not. A `package.json` alone is not evidence the tools are actually installed and runnable right now.

- **If found and `node_modules` is populated**: use it.
- **If not found, or `package.json` exists but `node_modules` is missing/empty**: (re)install, non-interactively:
  ```bash
  npx create-video@latest --yes --blank <folder-name>   # only if package.json is missing entirely
  cd <folder-name> && npm install
  npm install hyperframes
  ```
  Use `--no-tailwind` only if the user doesn't want Tailwind. Confirm the install succeeded (`npx hyperframes --version`, check `package.json` for `remotion`) before proceeding. See `setup`'s Cowork section for why this re-check matters there specifically.

## Reframing to a different aspect ratio (e.g. 16:9 → 9:16 for mobile)

**Important**: a straight crop of existing landscape footage to portrait will very likely cut off content that isn't centered (e.g. two characters positioned at opposite edges of a 16:9 frame). Before doing a blind center-crop:

1. Pull a few sample frames across the clip's duration and actually look at where the important content sits (character positions, text, UI elements).
2. Decide per-shot whether a center-crop preserves what matters, or whether you need:
   - A **pan/scan** crop that moves the crop window over time to follow the subject (doable in Remotion with an animated `translateX`/`translateY` on a scaled layer), or
   - A **pad/letterbox** approach (scale to fit width, pad top/bottom with a blurred/solid brand-color background) that keeps everything visible but adds bars, or
   - Flagging to the user that this shot should be *regenerated* natively at the target aspect ratio (most `reference-to-video` Atlas Cloud models accept a `ratio` param like `9:16` directly) rather than reframed after the fact — this is a paid option, so if you recommend it, follow `generate-asset`'s cost-discipline rules before doing it.
3. Show the user a test frame of your chosen approach before committing to a full render. Get confirmation on the framing choice, especially for pan/scan or pad decisions that involve judgment calls.

## Stitching clips (e.g. intro + scene(s) + outro)

Check that all clips share codec/resolution/framerate before concatenating; normalize with `ffmpeg` first if not (scale/pad to match resolution, re-encode to consistent codec). If some clips have no audio track (e.g. a silent animated intro) and others do, add a silent audio track to the ones missing it so the final concat doesn't have audio dropouts:

```bash
ffmpeg -i intro.mp4 -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -c:v copy -c:a aac -shortest intro_with_silent_audio.mp4
```

Use `ffmpeg`'s `concat` filter (via `filter_complex`, re-encoding) rather than the concat demuxer when inputs differ even slightly in codec parameters (e.g. mono vs stereo audio) — the demuxer requires byte-identical stream parameters and will produce corrupt output otherwise.

## Verification

After any edit, always pull and inspect a few frames (`ffmpeg -ss <t> -vframes 1 out.jpg`) at transition points and mid-clip before telling the user it's done — don't just trust that the ffmpeg/Remotion command exit code was 0. A successful exit code does not mean the framing/content is correct.
