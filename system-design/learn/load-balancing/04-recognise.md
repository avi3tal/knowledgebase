## How to recognise you need it

**Strong signals:**
- "Handle more traffic than one server can": you've scaled out a stateless tier.
- "No single point of failure" / high availability for the API tier.
- Many backends of the same kind: app servers, read replicas, cache nodes, model servers.
- Routing by path or host to different services (L7 / API gateway).
- Users on several continents who should reach the nearest region (global load balancing).

**Look-alikes, and why they're different:**
- **Consistent hashing:** use it when a request must reach the server that **owns a key's
  data** (cache node, partition) and membership changes. A plain LB assumes any server can
  answer.
- **Rate limiting:** an LB never rejects work for policy reasons. If you need to say "no, too
  many", that's a limiter (often running in the same gateway).
- **Message queues:** an LB pushes a request synchronously to a server **now**. A queue holds
  work so consumers can take it **at their own pace**, which suits bursty or slow background
  jobs.
- **Sharding** splits **data**. Load balancing splits **requests** across identical copies.
- **CDN** offloads static content near users before it ever reaches your LB.

> [!NUMBERS] Rough sizes
> - One app server: 1k–10k simple requests/s. Sizing: 20 000 peak QPS ÷ ~5 000 per server = 4, plus
>   50% headroom for losing a zone → about 6 servers.
> - One in-DC hop through an LB: well under 1 ms. A managed L4 LB handles millions of
>   connections.
> - DNS failover takes about the TTL (often 30–60 s) plus client caching. An in-region LB ejects
>   a dead server in seconds.

> [!INTERVIEW] The one-liner
> "Stateless app servers behind a redundant L7 load balancer, least connections because request
> times vary, health checks with draining on deploy, and sessions in a shared cache."

> [!PITFALL] Interview pitfalls
> - Drawing an LB in front of servers that still keep session state in memory.
> - Forgetting health checks, or the LB's own redundancy.
> - Defaulting to round robin when request costs vary wildly (long polls, uploads, LLM calls).
> - Not distinguishing L4 from L7 when routing by path or terminating TLS.
