---
name: learn
description: Build or open a lesson in the kb learning studio — a visual, animated tutorial for a subject topic (e.g. an algorithm pattern) with how-to-recognise-it guidance, a recognition quiz and graded practice problems — or give feedback on the user's progress. Use when the user says "teach me <pattern>", "/learn algo two-pointers", "I want to learn X", "how am I doing", or "what should I practise next".
argument-hint: <subject> <topic> | feedback [topic]
---

# /learn — lessons and feedback in the kb studio

Everything that can be deterministic is: traces, quiz grading, progress and feedback are computed by
`./kb`. You (Claude) author lesson **content once**, store it in the repo, and never redo work kb can
do. Read `CLAUDE.md` first.

## A. `/learn feedback [topic]` — what to improve
1. Run `./kb feedback` (or `--topic <id>`). That's the answer's backbone. Don't recompute it yourself.
2. Summarise in 3–6 bullets: weakest topics, failing attempts, complexity misses, due reviews, next
   problem. Quote the kb advice and don't invent new metrics.
3. Only if the user asks for a **code review**: run `./kb run <slug> <attempt>`, read that attempt's
   solution, and give focused feedback on correctness, complexity versus `expected_complexity`, and
   idioms. Give hints before full fixes.

## B. `/learn <subject> <topic>` — open or build a lesson
`subject` is a directory with `<subject>/learn/catalog.json` (`algo` today; `system-design` later).
`topic` must be a catalog id (`./kb learn list`).

**If `<subject>/learn/<topic>/lesson.json` exists:** tell the user to open the studio
(`make studio` → http://127.0.0.1:8765/#/learn/<subject>/<topic>) and stop.

**Otherwise build it.** Use `algo/learn/sliding-window/` as the reference implementation and copy its
structure and tone.

1. **Content (markdown, 2–4 files):**
   - **Intro:** the problem shape, the key insight, an ASCII sketch, and the code template.
   - **Variants:** the second template if one exists, e.g. fixed vs dynamic window.
   - **How to recognise it:** strong signals, anti-signals that name the look-alike pattern and
     why, complexity, and pitfalls.
   - Use the catalog entry (`usage`, `ds`, `samples` come from the DesignGurus patterns PDF) as the
     seed. No `<!-- -->` placeholders.
2. **Worked examples → animations.** Write 1–2 small, clean reference functions in
   `<topic>/examples/*.py`.
   - Add `# note: …` comments on the key lines. They become the narration and are stripped from
     the code shown.
   - **Don't use any practice problem as a worked example** (that's a spoiler). Use a sibling
     problem instead.
   - Add a `trace` block to `lesson.json` with `source`, `function`, a small `input` (about
     30–60 steps), `view` and **`checks`** (2–4 input/expected pairs, so the animated code is
     verified correct).
   - View types: `array` (`var`, `pointers: {label: var}`, `window: [lo_var, hi_var]`), `map`
     (`var`: a dict or set), `vars` (a list of scalar names) and `linkedlist` (`var`: head,
     `pointers: {label: var}`; nodes keep stable positions while links and pointers animate).
     Strings work as arrays.
   - Typed inputs: `"types": {"head": "ListNode"}` converts JSON input (and `checks` inputs)
     using kb meta types; `"returns": "ListNode"` converts the result back. For cycle demos, use
     `"cycle": {"head": pos}` on the block (or on a check) to link the tail to node `pos`.
   - If the topic needs a visual that doesn't exist yet (tree, grid, heap,
     intervals), say so and propose adding a view type: Python `kb/trace.py` snapshot, plus the
     TS type in `studio/src/trace.ts`, plus a renderer in `studio/src/components/TraceViews.tsx`,
     plus fixture tests. Don't fake it.
3. **Quiz (`quiz.json`, 6–10 items):** short problem statements and the question "which pattern?".
   - Options are catalog topic ids. Always include the near-miss patterns from the anti-signals.
   - Each `why` says which signal decides it.
   - Mix: about half the answers are this topic, the rest are look-alikes.
   - Every item needs two real near-miss distractors, not throwaways. kb shuffles the option
     order when serving, so the order you author doesn't matter.
4. **Practice problems (3–6, easy → hard):**
   - Reuse existing `algo/problems` that are tagged with this pattern (`./kb list --pattern`).
     Create any missing ones with the `/new-problem` flow: README, meta, cases. Verify the expected
     values with a scratch reference implementation, and **don't add solution attempts**.
   - Put the slugs in a `problems` block.
5. **Build and validate:**
   `./kb learn build <subject>/<topic> && ./kb learn validate && ./kb validate <new slugs>`.
6. Tell the user the studio URL and the first problem's `./kb attempt …` command. Keep it short.

Lesson block types: `markdown {src}` · `trace {id, title, source, function, input, view, checks}` ·
`quiz {src}` · `problems {slugs}`. New subjects (system design) reuse this format with new block or
view types. Extend kb and the studio when that happens.
