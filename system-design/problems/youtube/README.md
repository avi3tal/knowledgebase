# Design YouTube (video streaming)

> Difficulty: **hard** · Topics: video streaming, CDN, blob storage, message queues, search · ~60 min

Design a video platform. Creators upload videos; viewers all over the world watch them on phones,
laptops and TVs, search for them, and see how many times each one has been viewed.

## What the interviewer tells you if you ask
- **800 million daily active viewers**, each watching about **5 videos a day**; an average view
  lasts **~10 minutes** at an average of **~3 Mbps**.
- **500 hours of video are uploaded every minute**. Uploads can be hours long and tens of GB,
  often from unreliable connections.
- Plan for ~**3 GB stored per hour of video** once you count every version you keep.
- Playback should start in **under 2 seconds** and rarely stall, on anything from a 3G phone to a
  4K TV.
- A new upload may take **a few minutes** to become watchable.
- View counts may be approximate and a little behind, but they must not slow down playback.
- Viewing must almost never be down; an uploaded video must never be lost.
- Recommendations, comments, ads and live streaming are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(processing uploads, getting bytes to viewers, metadata and search, counting views…). Solve each
part on its own: options, choice and a small diagram. Then **reduce** them into one high-level
design (v1 → v2 → …), followed by deep dives and wrap-up. Use the checklist and ask for tips when
stuck: nudge first, then hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- How do you make a 3-hour upload watchable in many resolutions within minutes?
- What happens if the machine processing a video dies halfway through?
- Where do the bytes a viewer watches actually come from, and in what shape?
- How does a phone on a weak network keep playing when its bandwidth drops?
- A video goes viral at 20,000 views a second. What happens to its view counter?
- Do rarely watched videos deserve the same treatment as popular ones?
