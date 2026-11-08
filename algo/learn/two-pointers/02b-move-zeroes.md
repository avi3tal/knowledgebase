### Swap instead of copy: move zeroes

When the removed elements must still be **kept** (moved to the end), swap instead of copy. The
loop is the same; only the write step changes. Read the trace as a progress table: at every
step, everything left of `write` is final, and everything between `write` and `read` is a zero.

Say the invariant before you code. "Where does the next keeper go?" is the only question;
if you find yourself searching for the next zero, you've picked the wrong pointer to track.
Practise: `move-zeroes`, `remove-element`, `remove-duplicates-from-sorted-array`,
`apply-operations-to-an-array`, then `remove-duplicates-from-sorted-array-ii`.
