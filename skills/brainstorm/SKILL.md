---
name: brainstorm
description: Use when the user wants to explore or shape a creative idea before committing to generation — triggers on "brainstorm ideas for", "help me think through a concept", "what should this look like", "I have a rough idea for a video/image/character but need help fleshing it out", or when a generation request is vague enough that jumping straight to a prompt would waste money on a guess. This is free and conversational — no Atlas Cloud calls happen here.
---

# Brainstorm before generating

Purely conversational — no generation, no cost, no tool calls to Atlas Cloud. The point is to get to a concrete, specific creative direction *before* spending anything on a generation that might miss what the user actually wanted.

## When to reach for this instead of going straight to generate-asset/produce-movie

- The request is vague on things that materially change the prompt: style, mood, characters, palette, length, audience, platform.
- The user says something like "I have an idea but I'm not sure how it should look" or "help me figure out what this should be."
- Before `produce-movie`'s Phase 1 (scenario writing), if the concept itself isn't settled yet — brainstorm the concept first, then write the scenario once it's concrete.

Don't force this when the user has already been specific (a detailed prompt, a clear reference, an established character from `characters.json`/asset library) — skip straight to generation in that case, don't make them re-explain something they already specified.

## How to run it

1. Ask about what actually matters for the output, not generic creative-brief filler: Who's it for? What's the vibe/tone? Any existing brand palette, characters, or assets to stay consistent with (check the reusable asset library first — see `generate-asset`'s "Reusable asset library" section)? What's the length/format/platform if it's a video?
2. Offer 2-3 concrete directions rather than one vague pitch, when there's a real creative choice to make — let the user pick or mix rather than guessing which one they want.
3. Converge on something specific enough to write an actual generation prompt from: for images, a real prompt draft; for video, enough for `produce-movie`'s scenario phase to start from.
4. Hand off explicitly: "Here's the direction — want me to move to generating this?" Don't slide into paid generation without the user clearly signing off on the direction, separately from later signing off on the price.

## Keep it lean

This should be a handful of exchanges, not an extended workshop — the goal is a concrete brief, not exhaustive creative development. If the user wants deep collaborative ideation beyond shaping one generation request, that's just a normal conversation, not something this skill needs to manage.
