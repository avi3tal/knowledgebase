## How to recognise you need it

**Strong signals:**
- "Handle more traffic than one server can": you've scaled out a stateless tier.
- "No single point of failure" / high availability for the API tier.
- Many backends of the same kind: app servers, read replicas, cache nodes, model servers.
- Routing by path or host to different services (L7 / API gateway).

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

**Interview pitfalls:**
- Drawing an LB in front of servers that still keep session state in memory.
- Forgetting health checks, or the LB's own redundancy.
- Defaulting to round robin when request costs vary wildly (long polls, uploads, LLM calls).
- Not distinguishing L4 from L7 when routing by path or terminating TLS.
