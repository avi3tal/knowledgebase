## Architecture at a glance

Estimates only matter because they pick the boxes. Here is a podcast hosting platform (70 000
shows, 10 M listeners) with every component labelled by the number that put it there. Play the
figure and read the sub-labels, then switch the tabs: the Monday-morning peak, the feed cache going
down, and a new bitrate rolled out over the whole catalogue.

```figure
system-overview
```

> [!NUMBERS] The estimate behind the labels
> - Episodes: 70 000 shows × 1 a week ÷ 7 ≈ **10 000/day** ÷ 1e5 s ≈ 0.1 uploads/s.
> - Storage: 10 000 × (60 MB original + ~90 MB for 3 bitrates) = 1.5 TB/day; × 3 replicas =
>   **4.5 TB/day**, about 1.6 PB a year.
> - Downloads: 10 M listeners × 1 a day = 10 M/day ÷ 1e5 s = **100/s**; Monday peak 5× = **500/s**.
> - Egress: 100/s × 60 MB × 8 bits ≈ **50 Gbps** on average; 500/s ≈ **240 Gbps** at peak.
> - RSS polls: 10 M × 10 feeds × 24 a day = 2.4 B/day ÷ 1e5 s ≈ **24 000/s**; at 99% cache hits
>   the builder sees ~240/s.
> - Analytics: 10 M events/day × 200 B ≈ **2 GB/day**, 500 events/s at peak.

### Zoom in: where the numbers force a component

Follow the peak through the download and feed paths. Watch each sub-label: whenever a number
crosses a single-node limit (a NIC, a server, a database), a new box appears. The tabs change one
input each: a lower hit rate, no CDN at all, and no feed cache.

```figure
podcast-peak
```

### How it scales

Run the same estimate at 10k, 100k, 1 M and 10 M listeners. Each 10× breaks a different number
first: egress (CDN), then feed polls (cache and feed servers), then data size (an analytics log).

```figure
scaling
```

### Design decisions

| Decision | Options | Choice | Why |
|---|---|---|---|
| Which load to size for | average · peak · peak + headroom | **Monday peak (5×) plus ~30% headroom** | New episodes and the commute arrive together; the average hides it |
| Where audio lives | database BLOBs · file servers · object store | **Object store, hot and cold tiers** | 4.5 TB/day and 1.6 PB a year; old episodes are rarely fetched |
| How to serve audio | origin servers · CDN · CDN + origin shield | **CDN + origin shield** | 240 Gbps at peak is ~30 servers' NICs; the shield absorbs release-day misses |
| RSS polls | build per poll · cache · cache + ETag/304 | **Cache + ETag/304** | 24 000 polls/s for feeds that change weekly; all feeds fit in 3.5 GB |
| Transcoding | inline on upload · queue + workers | **Queue + a small worker pool** | 0.1 uploads/s but minutes each; uploads return at once, backfills wait |
| Download counts | a row per download in SQL · log + aggregator | **Log + aggregator** | 10 M events/day ≈ 3.6 B rows a year; counts can be minutes late |

### Risks and mitigations

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| Sizing for the average | quoting 100 downloads/s instead of 500 | CDN commit and origin saturate every Monday | Always state the peak factor and size for it |
| Bytes vs bits | 100/s × 60 MB = 6 GB/s quoted as 6 Gbps | An 8× undersized egress plan | Write units on every line; bandwidth in bits = bytes × 8 |
| Release stampede | a popular show publishes, every edge misses at once | Origin flooded for the first minutes | Origin shield, request collapsing, pre-warm big releases |
| Feed cache loss | cache node down at any hour | 24 000 builds/s on the builder and DB | A replica cache, 304 from last-updated time, shed with Retry-After |
| Egress cost | 10 M × 60 MB ≈ 600 TB a day leaves the CDN | The bandwidth bill dominates | Lower default bitrate on mobile, resume with range requests |
| Inflated counts | range requests and retries for one episode | Creators see more downloads than listeners | Dedupe per IP + app per day, count only near-complete fetches |
