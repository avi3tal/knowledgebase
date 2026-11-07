# Resources: what we use, and why

Our own lessons and problems are the platform. External resources are **pointers for going
deeper**, curated so each topic shows a focused handful (at most 3, focused material first), not a
pile of links.

- `sources.json` is the single registry of every external source: problem-origin tags (leetcode,
  interviewbit, …) and learning resources, each with a **verdict** and a **reason**. Verdicts can
  differ per subject (`subject_verdicts`).
- `refs/<source>.json` holds research references: a deep link (or book page), our own one-line
  summary, quality 1–5, and access. They're mapped to catalog topics and, by title, to our
  problems. Refs that explain one of **our** practice problems appear only on that problem's
  page, marked "solution inside".
- `RESEARCH.md` is the guide for research agents (`.claude/agents/research-{web,repo,book}.md`).
- `ROADMAP.md` is the study path.

Tools: `./kb refs validate | topics | list --topic … | --problem …`, `./kb graph <subject>`; in the
studio, the 🗺️ Knowledge map, topic pages, and "Go deeper" on lessons.

## Verdicts (2026-11-07)

| source | algo | system design | OOD | why |
|---|---|---|---|---|
| **ByteByteGo** | supplementary | **core** | **core** | Best SD library: a consistent 4-step framework (scope → high-level → deep dive → wrap-up), designs evolved stage by stage, strongest diagrams; about a third of chapters readable without login. Its coding-patterns course duplicates the repo below. |
| **System Design School** | – | **core** | – | Best free, interactive case studies: requirements → estimates (live calculator) → API → data → step-by-step high-level design → deep dives with Bad/Good/Great answers → transferable pattern. The model for our SD console. |
| **AlgoMaster** | **core** | supplementary | supplementary | Best visual companion for algo patterns: a step animation per problem with named states, a caption per step and side panels. SD/OOD case studies are paywalled, and its SD "practice" is code-judged (mechanism drills, not design). |
| AlgoMonster | supplementary | – | supplementary | Free editorials and pattern-choice cheatsheets (problem cue → technique, input size → complexity); a strong low-level design course. Core pattern families are paid. |
| DesignGurus (Grokking) | supplementary | skip | skip | The canonical pattern taxonomy (our catalog's origin), with a free cheat sheet and a few free intros; mostly paywalled. ByteByteGo / System Design School cover SD and OOD better. |
| Tech Interview Handbook | supplementary | skip | – | Free study plans, Grind 75, per-topic corner-case checklists; teaches little itself. |
| ByteByteGo patterns repo | supplementary | – | – | Free, commented reference code (brute force → optimal, DP ladders). Licence CC BY-NC-ND, so we only link to it. |
| Coding Interview University | skip | skip | skip | Mostly dated link lists. Its useful structure (fundamentals order, study method, implement-the-API exercises) is folded into ROADMAP.md. |
| LeetCode solutions PDF (local) | skip | – | – | Copied statements plus code-only solutions, no explanations, unclear provenance. |

**Borrowed ideas** (described in our own words, no assets copied), queued for the studio:
- Algo:
  - one animation per practice problem, with a state legend and a caption per step;
  - a pattern-choice flowchart and quick drills (problem cue → technique, input size →
    complexity);
  - a capstone "problem challenge" set per pattern;
  - "compare with neighbouring patterns" sections;
  - brute-force → optimal and DP top-down → bottom-up ladders.
- System design: the step-structured console, specified in `system-design/CONSOLE_SPEC.md`.
- Study method: a priority and hour estimate per topic, schedules generated from available hours,
  spaced re-solving (already in `kb feedback`).

**Candidates not added** (to keep the platform focused): `awesome-low-level-design` (AlgoMaster's
OOD code repo; maybe when OOD unlocks), System Design Primer, NeetCode videos. Add a source only
when a topic has no good core reference.
