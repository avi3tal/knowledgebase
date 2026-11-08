## What the traces show

| request | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| duration (ticks) | **8** | 1 | 1 | **8** | 1 | 1 | **8** | 1 | 1 |
| round robin → server | 0 | 1 | 2 | 0 | 1 | 2 | 0 | 1 | 2 |
| least connections → server | 0 | 1 | 1 | 1 | 2 | 2 | 2 | 0 | 0 |

Round robin ignores how busy a server is. The stream repeats every three requests, so every slow
request lands on server 0, which ends up holding three at once (`peak = 3`) while the others sit
idle. Least connections looks at `active` and routes around the busy server, so the slow
requests spread over all three and the worst pile-up is 2.

## Health checks and failover

```figure
health-check
```

- **Active** checks poll `/healthz`; **passive** checks watch real traffic for errors and
  timeouts. Most setups use both.
- Keep `/healthz` cheap, and decide whether it checks dependencies. If it fails whenever the DB is
  slow, every server is ejected at once.
- **Connection draining:** on deploy, stop sending new requests to a server but let the open ones
  finish.

## Sticky sessions

The LB pins a client to one server with a cookie, so in-memory session state keeps working.

> [!PROS]
> - No shared session store needed; works with legacy apps that keep state in memory.
> - Local caches stay warm for that user.

> [!CONS]
> - Load becomes uneven: a few heavy users pin a few servers.
> - When the server dies, its sessions die with it, and scaling in is harder.
> - Prefer making the server stateless and keeping sessions in a shared cache.

## Beyond one region

The LB tier itself needs redundancy: an active-passive pair with a floating IP, or many LB
nodes behind DNS or anycast. Across regions, DNS or anycast does the first split:

Use the tabs to watch a whole region fail, stale DNS caches slow the failover, and anycast as the alternative.

```figure
global-lb
```
