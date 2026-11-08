# Load Balancing

> Building block · Ideas: scale out, L4 vs L7, algorithms, health checks, sticky sessions

Every design starts on one server, and one server has a ceiling: CPU, memory, open connections.
It is also a single point of failure.

```figure
single-server
```

The fix is **horizontal scaling**: run N copies of a **stateless** service and put a load
balancer (LB) in front that spreads requests across them.

```figure
lb-pool
```

> [!PROS]
> - **Capacity:** add servers when load grows, remove them when it's quiet (autoscaling).
> - **Availability:** health checks take a dead server out of rotation before users notice.
> - **Zero-downtime deploys:** drain a server, upgrade it, put it back, one at a time.

> [!CONS]
> - The servers must be **stateless**: session data moves to a shared store (cache or DB) or
>   into a signed token.
> - One more hop (well under a millisecond in one data center), and the LB itself must be
>   redundant or it becomes the new single point of failure.

## L4 vs L7

An LB works at one of two layers, and real systems often stack both:

```figure
l4-vs-l7
```

| | L4 (transport) | L7 (application) |
|---|---|---|
| sees | IP + port, TCP/UDP | HTTP method, path, headers, cookies |
| can do | forward connections, very fast | route `/api` vs `/img`, TLS termination, retries, auth, rewriting |
| cost | cheap, millions of connections | more CPU per request |
| typical | network LB in front of everything | API gateway / reverse proxy |

> [!INTERVIEW] What to say
> "A managed L4 load balancer takes the public traffic and spreads connections over a few L7
> proxies. Those terminate TLS and route by path to the API and image services." Then name the
> algorithm and the health check, and move on.
