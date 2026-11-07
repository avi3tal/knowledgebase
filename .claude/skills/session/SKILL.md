---
name: session
description: Plan a personalised study session in the kb platform. Reads the learner's progress (kb feedback) and previous sessions, explains their strongest and weakest areas, and creates a session of lessons and practice problems aimed at a goal. Use when the user says "/session", "plan my study session", "what should I focus on", "build me a practice set for <goal>", or "review my last sessions".
argument-hint: "[goal or focus, e.g. 'onsite in 2 weeks', 'weak spots', 'graphs only']"
---

# /session: plan a study session from your history

kb owns the facts and the files; you own the judgment. **Deterministic first**: if the user only
wants a quick set ("give me 5 two-pointer problems"), run `./kb session new …` and don't plan
anything yourself.

## 1. Read the evidence (only these; never read attempt code for planning)
```sh
./kb feedback --json                 # per topic: solved/failing/untried, quiz accuracy, review due, advice
./kb session list --json             # previous sessions: scope, items, per-item scores, completion
./kb learn list                      # topics with lessons
```
Use `--subject` for other subjects once they unlock. Only `algo` has problems today; system design
and OOD items are rejected until their console exists, so plan concept lessons only for those.

## 2. Decide (keep it short and concrete)
- **Strengths:** topics with solved problems, high quiz accuracy, high session scores.
- **Weak spots:** failing items, complexity misses (score ≤ 80 although all cases passed), low quiz
  accuracy, abandoned sessions, topics never practised that the goal needs.
- **Shape:** 3–8 problems, easy → hard, at most 3 per topic, one or two lessons/quizzes first.
  Mix in one due review. Respect the time budget (~20 min easy, ~35 medium, ~50 hard).

## 3. Write the plan, then let kb validate and save it
Write the plan to the scratchpad (never into the repo):
```json
{
  "title": "Two pointers + intervals: fix the weak spots",
  "focus": "weak",
  "goal": "onsite in 2 weeks",
  "scope": {"subject": "algo", "topics": ["two-pointers", "merge-intervals"], "minutes": 120},
  "rationale": [
    "Two Pointers: 2 failing attempts and 50% on the quiz: weakest pattern.",
    "Merge Intervals untouched but common at onsites."
  ],
  "materials": [{"subject": "algo", "topic": "two-pointers", "why": "redo 'how to recognise it' + quiz"}],
  "items": [
    {"slug": "three-sum", "topic": "two-pointers", "why": "your latest attempt fails 2 cases"},
    {"slug": "merge-intervals", "topic": "merge-intervals", "why": "new, core interval drill"}
  ]
}
```
Then `./kb session new --plan <file> --dry-run`, fix any validation errors, and finally run it without
`--dry-run`. kb assigns ids, titles and difficulties and stores it in `_workspace/sessions/`.
Problem slugs must exist (`./kb list`); don't invent problems. If the goal needs a problem we don't
have, suggest `/new-problem` instead.

## 4. Report back (≤ 8 lines)
Strengths and weak spots in one line each, the session title and id, the first step
(`open http://127.0.0.1:8765/#/session/<id>` or `./kb session attempt <id> --item p1 --lang go`), and
how scores work (passing cases 70, target complexity 20, first real try 10; re-runs update them).

## Rules
- Sessions, attempts and progress are private (`_workspace/`, git-ignored). Never commit them.
- Never change scores or `progress/*.jsonl` by hand; scores are derived by kb.
- Planning reads only `kb` JSON output. Read solution code only when the user asks for a review
  (`/review`), and then only the attempts they name.
