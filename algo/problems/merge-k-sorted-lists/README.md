# Merge k Sorted Lists

> Difficulty: **hard** · Patterns: linked-list, heap · Sources: [leetcode](https://leetcode.com/problems/merge-k-sorted-lists/), [interviewbit](https://www.interviewbit.com/problems/merge-k-sorted-lists/)

## Problem
You're given an array of `k` linked lists, each sorted ascending. Merge them all into one sorted
linked list and return its head. Any of the lists may be empty, and so may the array itself.

## Examples
- `[[1,4,5],[1,3,4],[2,6]]` → `[1,1,2,3,4,4,5,6]`.
- `[]` → `[]`: no lists at all.
- `[[]]` → `[]`: one list, and it's empty.

## Constraints
- `0 <= k <= 10^4`, each list has `0..500` nodes, total nodes `N <= 10^4`, values `-10^4..10^4`.
- Target: O(N log k) time, O(k) extra space.

## Pattern & how to recognise it
- **"k sorted sources, produce one sorted output"** → a **min-heap of the k current heads**
  (k-way merge). The smallest remaining element is always one of the heads.
- Naive options: merging lists one after another costs O(N·k), and concatenating then sorting
  costs O(N log N) time plus O(N) space.
- See [algo/notes/heaps/README.md](../../notes/heaps/README.md) and
  [algo/notes/linked-lists.md](../../notes/linked-lists.md).

## Learning material
- **k-way merge with a heap:** push every non-empty head. Then repeatedly pop the minimum, append
  it to the output and push its `next` if there is one. Each of the N nodes is pushed and popped
  once, and the heap never holds more than k entries, so the total is O(N log k).
- **Heap entries must be comparable.** In Python, push `(val, index, node)`. The unique index
  breaks ties, so the nodes themselves are never compared. Alternatively, give the node `__lt__`.
  In Go, implement `heap.Interface` over `[]*ListNode`.
- **Empty lists (`None`) must never enter the heap.** Filter them out when you seed it.
- **Divide and conquer** is the other O(N log k) solution: merge the lists in pairs, halving k
  each round, using [Merge Two Sorted Lists](../merge-two-sorted-lists/README.md). It needs no
  heap and O(1) extra space with an iterative merge.
- Heap operations: [algo/notes/heaps/OPERATIONS.md](../../notes/heaps/OPERATIONS.md).

## Hints
<details><summary>Hint 1</summary>

The next output node is the smallest of the k current heads. Which data structure gives you the
minimum of k items quickly and lets you replace it?
</details>
<details><summary>Hint 2</summary>

After you pop a node, which single node can take its place in the heap?
</details>
<details><summary>Hint 3</summary>

What should happen to an empty list in the input?
</details>

## Approach (spoiler)
<details><summary>Show</summary>

Seed a min-heap with `(head.val, i, head)` for every non-empty list. Use a dummy head and a tail
pointer. While the heap is non-empty: pop `(v, i, node)`, append `node`, and if `node.next` exists
push `(node.next.val, i, node.next)`. Return `dummy.next`.
Time O(N log k), space O(k). Divide and conquer pairwise merging is also O(N log k).
</details>

## Follow-ups
- Merge Two Sorted Lists: the k = 2 case, and the building block of the divide-and-conquer
  solution.
- Kth Smallest Element in a Sorted Matrix (LeetCode 378): the same k-way merge, stopping after k pops.
- Smallest Range Covering Elements from K Lists (LeetCode 632): a heap of heads plus a running max.
- External sorting: merge k sorted runs from disk — the real-world use of k-way merge.
