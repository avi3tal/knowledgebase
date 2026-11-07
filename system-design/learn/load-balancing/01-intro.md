# Load Balancing

> Building block · Ideas: L4 vs L7, algorithms, health checks, sticky sessions

One server has a ceiling: CPU, memory, connections, and it's a single point of failure. The fix
is **horizontal scaling**: run N copies of a **stateless** service and put a load balancer (LB)
in front that spreads requests across them.

```
                ┌──► app-1 ─┐
client ──► LB ──┼──► app-2 ─┼──► shared DB / cache
                └──► app-3 ─┘
           │
           └── health checks: stop sending to app-2 if it fails /healthz
```

What the LB buys you:
- **Capacity:** add servers to handle more load, and remove them when it's quiet (autoscaling).
- **Availability:** a dead server is taken out of rotation by health checks, so clients never
  notice.
- **Zero-downtime deploys:** drain a server, upgrade it, put it back.

The precondition is that servers are **stateless**. Session data goes to a shared store
(cache/DB) or into a signed token, so any server can handle any request.

## L4 vs L7
| | L4 (transport) | L7 (application) |
|---|---|---|
| sees | IP + port, TCP/UDP | HTTP method, path, headers, cookies |
| can do | forward connections, very fast | route `/api` vs `/static`, TLS termination, retries, auth, rewriting |
| cost | cheap, millions of conns | more CPU per request |
| typical | network LB in front of everything | API gateway / reverse proxy |

## Algorithms
- **Round robin:** server `i % N` in turn. It's simple and fine when requests cost about the
  same.
- **Weighted round robin:** bigger machines get more turns.
- **Least connections:** send to the server with the fewest open requests. It adapts when
  request durations vary a lot (uploads, long polls, slow queries).
- **Least response time / power of two choices:** pick two servers at random and use the less
  loaded one. Nearly as good as a global minimum without tracking every server exactly.
- **Hash-based (IP or key hash):** the same client or key always reaches the same server. Use
  it for affinity, with consistent hashing so adding a server doesn't reshuffle everyone.

The two traces below replay the **same** request stream: one request per tick, three servers,
and every third request is slow (8 ticks) while the rest take 1 tick. Watch `active`
(open connections per server).
