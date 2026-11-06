## Dynamic window: grow until invalid, shrink until valid

Often the size isn't given. You want the **longest** (or **shortest**) window that satisfies a
condition. The window then **grows** on the right every step, and **shrinks** from the left
only while the condition is broken:

```python
window_start, state, best = 0, <empty>, 0
for window_end in range(len(s)):
    <add s[window_end] to state>
    while <state violates the condition>:      # shrink until valid again
        <remove s[window_start] from state>
        window_start += 1
    best = max(best, window_end - window_start + 1)
```

- **Longest valid window:** shrink while the window is *invalid*, then record.
- **Shortest window that satisfies X:** shrink while it is *still valid*, recording inside the
  loop (e.g. minimum-size subarray sum ≥ target).

The `while` inside the `for` looks like O(n²), but `window_start` only ever moves right, so the
total shrink work over the whole run is at most n. That's still **O(n)** overall. This
"amortised" argument is worth saying out loud in an interview.

In the example below, the state is a **hash map of character counts**. Watch a key disappear
when its count drops to 0. That's how `len(counts)` tracks the number of distinct characters.
