---
name: review
description: Review one of the learner's attempts like a tutor. Runs the deterministic kb checks first, then writes structured feedback (verdict, strengths, issues with examples, tips, next step) to the attempt's review.md. Use when the user says "/review", "review my attempt", "what's wrong with my solution", or "give me feedback on <problem>".
argument-hint: "<slug> [attempt] | <path to attempt or solution file>"
---

# /review: tutor feedback on an attempt (on demand only)

AI review never runs automatically. The user asked, so be worth it: specific, kind, short.

## 1. Facts first (deterministic)
```sh
./kb run <slug-or-attempt-path> [attempt]      # cases + measured complexity; records the run
./kb feedback --topic <topic>                   # context: how this topic is going
```
If cases fail, the diff kb prints is the evidence. Don't restate what kb measured; build on it.

## 2. Read only what was asked
The attempt lives in `_workspace/attempts/<subject>/<slug>/<attempt>/` (solution file + notes.md),
and the problem in `<subject>/problems/<slug>/` (README, meta.json with `expected_complexity`). Don't
browse other attempts unless comparing was requested.

## 3. Write `review.md` in the attempt folder (overwrite; private, never committed)
```markdown
# Review — <title> · <attempt> · <date>
**Verdict:** <one line: correct / partially correct / incorrect; measured vs target complexity>

## What's good
- …

## Issues
1. **<issue>** — <why it matters>. Example input: `…` → got `…`, expected `…`.

## Tips
- Hint first (what to look at), then the idea. No full rewritten solution unless asked.

## Next step
<one concrete action: fix X and re-run, or try the follow-up problem Y, or redo the lesson quiz>
```
Keep it under ~40 lines. Use examples from kb's failing cases or a tiny input you traced by hand.

## 4. Tell the user
Two or three lines: the verdict, the single most important fix, and where the review is
(`review.md` next to their solution; open it in VS Code).
