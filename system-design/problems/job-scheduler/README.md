# Design a distributed job scheduler

> Difficulty: **medium** · Topics: job scheduler, message queues, coordination, sharding · ~50 min

Design a service that runs other teams' jobs at the right time: "send this reminder at 09:00
tomorrow", "rebuild this report every night at 02:00", "retry this webhook in 5 minutes". Users
register jobs through an API. The system triggers each run on a fleet of workers, retries failures
and shows what happened. Think of cron, but for a whole company, with no single machine it depends on.

## What the interviewer tells you if you ask
- About **50 million job definitions**, most of them one-off delayed tasks, the rest cron schedules.
- About **100 million runs per day**. Many cron jobs are set to `:00`, so the **top of each hour sees
  ~10× the average rate**.
- A run should start **within 2 seconds** of its scheduled time.
- Runs take **30 seconds on average and up to an hour**. The scheduler calls the job's handler (an HTTP
  endpoint or queue); it doesn't host user code.
- A run must **never be silently lost**, even if a machine dies mid-run. Running something twice is
  acceptable only if it is harmless.
- Owners want to see the status and history of their runs for **30 days**.
- Workflow dependencies (Airflow-style DAGs) are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts (the job
store, finding due jobs, dispatch and execution, retries and status…). Solve each part on its own:
options, choice and a small diagram. Then **reduce** them into one high-level design (v1 → v2 → …),
followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then
hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- How does the system find the jobs that are due *now* without reading all 50 million?
- How do you run several schedulers without two of them firing the same job?
- A worker dies 20 minutes into a run. Who notices, and when?
- Is "exactly once" achievable here? If not, what do you promise instead, and who makes it safe?
- What should retries do to a downstream service that is already down?
- What happens at 09:00:00 when twelve thousand jobs want to start at once?
