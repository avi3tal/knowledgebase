## Architecture at a glance

Before the strategies, see the system an architect would draw. This is telemetry ingest for an
electricity utility: 5 M smart meters, firmware that sends the daily billing read right after
midnight, and cell towers that drop out and come back with hours of buffered data. Every layer has
a limit and a policy for when it's reached. Play the figure, then switch the tabs: the midnight
burst, a time-series database that slows down, and a firmware change that spreads the load.

```figure
system-overview
```

### Zoom in: the admission decision

The cheapest place to say no is before any work is done. Follow the three questions the Ingest
API asks about every batch, then try the tabs: a full log for a billing read, a full queue for
diagnostics, and a tower that reconnects with six hours of backlog.

```figure
meter-admission
```

### Zoom in: consumers pull with credits

Inside the pipeline, the validators set the pace. Watch how the number of free slots decides how
much a validator takes, then compare slower writes, a validator that crashes mid-batch, and
scaling out on lag.

```figure
validator-credits
```

### How it scales

The design changes as the pressure grows: one unbounded buffer, then a bound with shedding by
class, then consumers that autoscale on lag, then a pipeline of bounded stages with per-tenant
quotas.

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Where data waits when full | ingest RAM · central log · edge gateways | **Edge gateways (store & forward)** | They already hold readings on disk; waiting there costs the core nothing |
| Billing log bound | unbounded · bytes · time of work | **About 1 h of validator throughput** | Covers the midnight burst many times over; more than that is an outage, so push back |
| When full: billing reads | block · drop · reject with a hint | **429 + Retry-After, gateway keeps it** | Must never be lost; the gateway retries with jitter later |
| When full: diagnostics | reject · drop newest · drop oldest + sample | **Drop oldest, sample 1 in 10** | Fresh voltage data is worth more than stale; nobody bills on it |
| How validators get work | log pushes · pull with credits | **Pull, credit = free slots** | A slow validator takes less by itself; no hidden buffers |
| Fairness | one global line · per-gateway and per-tenant quotas | **Quotas per gateway and per tenant** | A reconnect flood or one utility's firmware can't starve everyone else |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Lost billing reads | ack sent before the durable write | Missing usage, estimated bills | Ack only after a replicated append; the gateway deletes only on ack |
| Synchronised retries | every gateway honours the same Retry-After | A second burst right after the first | Jittered Retry-After, exponential backoff at the gateway |
| Reconnect flood | a tower returns after hours offline | One gateway hogs admission | Per-gateway quota, replay at low priority, drop expired diagnostics |
| Duplicate reads | replays after timeouts or a crash | Usage counted twice | Idempotent writes keyed by meter id + interval |
| Edge buffer overflow | an outage longer than gateway storage | Oldest readings lost at the edge | Size edge disks for days, keep billing reads first, alert on edge depth |
| Slow time-series DB | compaction or a hot partition | Lag grows, 429s at every gateway | Credits slow consumers, lag alerts, a separate bound per stage |
