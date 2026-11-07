# Design Google Docs (collaborative editing)

> Difficulty: **hard** · Topics: collaborative editor, coordination, replication · ~60 min

Design an online document editor where several people type into the same document at the same
time and see each other's changes and cursors live, as if they were sitting at one keyboard. The
document is saved continuously and every earlier version can be restored.

## What the interviewer tells you if you ask
- About **1 billion documents**, ~**50 KB** each on average (text plus formatting).
- At peak, ~**20 million users** have a document open and ~**5 million are typing** at the same
  moment. While typing, an editor sends roughly **one batch of edits per second**.
- Most documents have **one or two editors**. A few have **up to 100 editors** at once, and big
  meetings can add thousands of viewers.
- A co-author should see your keystroke within about **200 ms** (same region). Your own typing must
  never wait for the network.
- People lose Wi-Fi for minutes at a time and keep typing; nothing they typed should be lost.
- Keep the **full revision history**.
- Focus on text documents; spreadsheets, comments and suggestions can wait.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(the live connection, merging simultaneous edits, saving and history, showing collaborators…). Solve
each part on its own: options, choice and a small diagram. Then **reduce** them into one high-level
design (v1 → v2 → v3), followed by deep dives and wrap-up. Use the checklist and ask for tips when
stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Alice inserts a word at position 10 while Bob deletes the character at position 5. How do both
  screens end up identical, with both changes where their authors meant them?
- Do all editors of one document need to talk to the same server? What happens if it dies?
- When is it safe to tell a client "saved"?
- Saving the whole document on every keystroke: what would that cost? What would you store instead?
- Should cursor positions be stored anywhere?
- What does a laptop do with the edits it made while offline?
