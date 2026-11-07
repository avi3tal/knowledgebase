# Research guide: evaluating external resources for the kb knowledge graph

Research agents investigate **one source each** and produce `resources/refs/<source-id>.json`.
That file holds references (links plus our own short summaries) mapped onto our catalogs. The
owner of the platform (the parent session) decides afterwards which sources are **core**,
**supplementary** or **skipped**. Agents recommend; they don't decide.

Goal: a clear, focused platform. Reference the best deep link for each topic, don't mirror
whole courses, and say plainly when a source duplicates another or is weak.

## Agent types

| type | for | tools | definition |
|---|---|---|---|
| `research-web` | websites and online courses | WebFetch, WebSearch, Read, Write, Bash (only for `./kb`) | `.claude/agents/research-web.md` |
| `research-repo` | GitHub repositories | Bash (`gh api`, `git clone --depth 1`), Read, Grep, Glob, WebFetch | `.claude/agents/research-repo.md` |
| `research-book` | local PDFs / books | Bash (`pdfinfo`, `pdftotext -f -l`, grep), Read | `.claude/agents/research-book.md` |

## Hard rules (all types)

1. **Copyright.** Never copy text, code, images or diagrams into the repo. A ref is a link (or a
   book page number) plus a summary **in your own words** of at most 240 characters. No solution
   code, ever.
2. **Access.** Only public pages and free-trial previews you can reach without logging in. No
   login, no paywall bypass, no scraping behind auth. If content is locked, record the public
   outline and mark `access: "paid"` or `"trial"`.
3. **Honesty.** Every stored URL must come from a page you actually fetched (or a link on one).
   If a page is a JavaScript single-page app and comes back empty, write "could not render" in
   your report. Don't reconstruct its structure from memory.
4. **Budget.**
   - Web: about 25 fetches per source. Start with index / table-of-contents pages, then sample
     a few lessons.
   - Repos: read the README and the directory tree, then sample 2–3 files. Don't read everything.
   - Books: `pdfinfo` first, then the TOC pages, then targeted `pdftotext -f N -l M` ranges.
     **Never extract the whole book.**
5. **Isolation.**
   - Write only your own refs file.
   - Scratch work goes in your own subfolder: `<scratchpad>/research/<source-id>/`. Never
     write to the scratchpad root.
   - No git write commands.
6. **Validate.** Run `./kb refs validate --file <source-id>.json` until it prints ✓.

## Mapping onto our catalogs

- Allowed topic ids: run `./kb refs topics` (algo, system-design, ood). system-design and ood
  are **locked** subjects: no lessons yet, but map refs to them anyway, because that's how
  they'll be enriched later.
- If something important has no matching topic, don't invent an id. List it under
  "missing topics" in your report.
- Problem-level refs: set `problem_title` to the problem's common name (e.g. "Two Sum",
  "Merge k Sorted Lists"). kb matches it to our problems itself, so don't guess slugs.

## Reference template: `resources/refs/<source-id>.json`

```json
{
  "version": 1,
  "source": "algomaster",
  "researched": "2026-11-07",
  "agent": "research-web",
  "coverage": "One paragraph: what the source covers, how it teaches, what is free vs locked.",
  "refs": [
    {
      "id": "sliding-window-pattern",
      "title": "Sliding Window",
      "url": "https://algomaster.io/learn/dsa/sliding-window",
      "kind": "lesson",
      "access": "free",
      "subject": "algo",
      "topics": ["sliding-window"],
      "summary": "Animated walkthrough of fixed vs variable windows with a step-by-step array visual; good intuition builder before practice.",
      "quality": 4
    },
    {
      "id": "p-merge-k-sorted-lists",
      "title": "Merge k Sorted Lists",
      "page": 37,
      "kind": "problem-solution",
      "access": "local",
      "subject": "algo",
      "topics": ["k-way-merge"],
      "problem_title": "Merge k Sorted Lists",
      "summary": "Heap-of-heads solution with complexity notes; terse.",
      "quality": 3
    }
  ]
}
```

| field | rule |
|---|---|
| `id` | kebab-case, unique within the file |
| `url` / `page` | `url` for web and GitHub (deep link, no `?aff=` or `utm_`); `page` (int) for books |
| `kind` | `lesson`, `visual`, `article`, `problem-solution`, `course-module`, `diagram`, `video` or `cheatsheet` |
| `access` | `free`, `trial`, `paid` or `local` |
| `topics` | catalog ids for `subject`; can be empty only if `problem_title` is set |
| `quality` | 1 = weak, 3 = solid, 5 = best-in-class for this topic |

**How many:** aim for the *best* 1–3 refs per topic the source covers well, plus problem-level
refs only where they add something beyond our own README. Usually 15–60 refs per source.
Quality over quantity.

## Report back (to the parent, concise)

1. **Coverage table:** subject → which topics are covered and how well (1–5).
2. **Teaching style:** visuals, interactivity, depth, how practice is structured.
3. **Access:** what's free, trial-only or paid.
4. **Overlap:** which other sources in `resources/sources.json` it duplicates, and where it's
   clearly better or worse.
5. **Recommendation:** core / supplementary / skip, with a one-line reason. Also list the ideas
   worth borrowing for our studio (UX, visual style, exercise formats), described in your own
   words.
6. **Missing topics** you found that our catalogs don't have.
