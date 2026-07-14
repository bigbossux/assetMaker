---
name: log-lesson
description: Use whenever something goes wrong while using this plugin's other skills (setup, generate-asset, produce-movie, edit-video) that a future run could avoid — a mistaken assumption, an instruction in this plugin that turned out wrong or incomplete, an unexpected cost, a model/tool bug worth documenting, or a workflow step that was missing. Also triggers on explicit requests like "remember this," "log this mistake," "update your instructions," or "learn from this." This is how the plugin improves itself instead of repeating the same mistake in every future project that uses it.
---

# Log a lesson back into the plugin

The other skills in this plugin already carry lessons from past mistakes (the arm-hallucination note, the MCP quoting bug, the zsh `status` gotcha, the "don't blind-crop landscape to vertical" warning). This skill is how that list keeps growing instead of staying frozen at whatever was known when the plugin was first written — and how the *next* project that installs this plugin starts out already knowing what this one had to learn the hard way.

## When to run this

- A generation cost more than expected, or a cost estimate given to the user turned out wrong.
- A model behaved differently than its documented schema suggested.
- An instruction in `setup`, `generate-asset`, `produce-movie`, or `edit-video` was followed correctly but still led to a bad outcome — meaning the instruction itself was incomplete or wrong, not that it was skipped.
- A workaround was needed that isn't already documented (a new MCP bug, a new ffmpeg/Remotion gotcha, a new Atlas Cloud API quirk).
- The user explicitly points out a mistake or asks you to remember something.

Don't log routine one-off mistakes that were just execution slip-ups with no generalizable cause (e.g. a typo in a single API call) — this is for things a *future* run of this plugin would hit again if not documented.

## Process

1. **Name the actual lesson**, not just the symptom. "Regeneration cost more than expected" is a symptom; "video billing is token-based and the headline `$X/request` price is a floor, not the real cost" is the lesson (and is already documented — check first, see step 2).

2. **Check for an existing entry first.** Read the skill file(s) this lesson would belong in and look for something that already covers it, even partially. If a close match exists, refine/extend that entry rather than adding a near-duplicate one elsewhere in the file.

3. **Pick the right home:**
   - Wrong or incomplete step in a specific phase/workflow → **edit that instruction directly** in the relevant skill (don't just append a caveat below an instruction that is actually wrong — fix the instruction itself).
   - A new model/tool failure mode → add to `generate-asset`'s "Known model failure modes" section (or `edit-video`'s equivalent, if it's a local-tooling issue).
   - A new environment/auth/MCP quirk → `setup`'s troubleshooting section.
   - Something that spans multiple skills or doesn't fit an existing section → propose a new section, but check it isn't better placed as a cross-reference from an existing one instead of duplicating context.

4. **Write it in the file's existing voice**: imperative, specific, includes *why* (root cause) so a future read can judge edge cases rather than blindly follow a rule that might not apply. Match the terseness of what's already there — this is a working reference, not a narrative.

5. **Show the user the diff** before touching git. Briefly explain what the lesson is and why you're filing it where you are.

6. **Version bump**: patch bump (e.g. `0.2.0` → `0.2.1`) for a lesson/doc correction — this isn't a new feature, but it still needs a version bump or `/plugin update` won't pick it up anywhere the plugin is already installed (plugins are version-pinned, not auto-synced from new commits).

7. **Commit and push only after the user confirms.** Don't auto-publish — stage the change, show the diff and the proposed commit message, and wait for explicit go-ahead, same as any other change to this repo.

## Commit message convention

```
<Short imperative summary of the lesson>

<What went wrong, why, and what the corrected instruction now says.>

Bump to <version>.
```
