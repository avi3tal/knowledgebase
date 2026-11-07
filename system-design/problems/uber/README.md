# Design Uber (ride hailing)

> Difficulty: **hard** · Topics: ride hailing, proximity search, caching, distributed transactions · ~60 min

Design a ride-hailing service like Uber or Lyft. A rider opens the app, sees cars around them, requests
a ride and is matched with a nearby driver. The driver accepts, drives to the pickup and completes the
trip, and the rider is charged at the end. Both sides watch each other move on the map in real time.

## What the interviewer tells you if you ask
- About **1 million drivers online** at peak worldwide. Each driver app sends its GPS position
  **every 4 seconds**.
- About **20 million trips per day**. Almost every trip starts and ends in the same city.
- Nearby search should answer in **under 100 ms**, and a driver should see the offer within
  **about 5 seconds** of the request.
- A driver can only carry one ride at a time. **Assigning the same driver twice is a serious bug.**
- If a driver doesn't answer an offer within **15 seconds**, move on to the next one.
- Payments go through an external payment provider that is occasionally slow or down.
- Surge pricing, ETA models, pooled rides and driver onboarding are out of scope.

## Your job
Work through the console's stages: scope → estimates → API & data → **decompose** into parts
(location ingestion, nearby search, dispatch, the trip and its payment…). Solve each part on its own:
options, choice and a small diagram. Then **reduce** them into one high-level design (v1 → v2 → …),
followed by deep dives and wrap-up. Use the checklist and ask for tips when stuck: nudge first, then
hint, and *show* only as a last resort.

## Things worth deciding (no answers here)
- Where do a million positions that change every 4 seconds live, and how durable must they be?
- How do you find "drivers within 2 km" without scanning every driver?
- Two riders want the same nearby driver at the same moment. Who gets them, and how do you guarantee it?
- What happens when a driver ignores an offer, or accepts it just as it expires?
- How does the end of a trip turn into exactly one charge when the payment provider is unreliable?
- How do you split the load when a few huge cities hold most of the drivers?
