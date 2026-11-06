Heaps
=====

Heaps are completely binary trees let you get the current min/mx in O(1) and support insertion and deletion in O(logn).
Heaps are ideal for "top-K", scheduling, and streaming-style interview Qs.

A good way to recognize heap questions is to loop for the following patterns in the text
1. K-th smallest/largest ...
2. Top K ...
3. Dynamic ordering ...
4. Priority-like behavior ...



## Patterns to best recognize heap questions 
1. k-th smallest / largest element
* `return the K-th largest/smallest element`, `find K largest elements`, `find K numbest closest ...`
* Typical approach:
* * use *min-heap of size k* to track top-k `largest` (heap root is smallest among the kept elements)
* * use *max-heap of size k* to track top-k `smallest`

2. Top-K by frequency / score
* `k most frequent elements/words`, `top k frequent`, `k most common...`
* Typical appeoach:
* * Count with `hash map` then push (frequency, value) into heap; size-k heap or full heap depending on constraints

3. Online / streaming order statistics
* `numbers are coming in stream`, `afer each insertion, output k-th largest/median`, `k0th largest in a stream...`
* Typical appeoach:
* * Maintain one or two heaps (two-heap median: max-geap for lower half, min-heap for upper half)

4. Merge many sorted things efficiently
* `Merge K sorted arrays`, `find smallest rangw covering elements from each list`, `merge k sorted streams`
* Typical appeoach:
* * Put the *current head* of each list into a min-heap keyed by value, repeatedly pop/push next element

5. Intervl scheduling / meeting rooms / resource alloction
* `minimum number of meeting rooms`, `allocate machine/rooms`, `reuse resources when possible`
* Typical appeoach:
* * Sort by start time, then use a *min-heap to end times* to reuse rooms/resources when earliest-ending one is free

6. Greedy "always pick best next"
* `repeatedly choose the largest/smallest remaining X`, `combine two smallest costs repeatedly`, `last stone weight`
* Typical appeoach:
* * Maintain a *heap of candidates*, repeatedly extract min/max and push combined/resulting value

7. Nearly sorted / sliding structure 
* `array where each element is at most k away from its sorted position`, `sort a k-sorted array`, `slide window top-k / min`
* Typical appeoach:
* * Use a *size-k+1 heap* to sort almost sorted arrays in O(n log k)

8. Graph / grip where "cheapest next step" mattters
* `always take lowest hieght/wall`, `flood fill with rising water`, `trap rain water in 2D grid`
* Typical appeoach:
* * Use a *min-heap on cost/height/distance* to pick the next frontier cell

9. Explicit "Priority Queue" in statement
* `design a priority queue`, `implement a scheduler`, `implement a heap`, `build a max heap from array`
* Typical appeoach:
* * Implement binary heap with array indexing formula: children at `2i+1`, `2i+2`, parent at `(i-1)/2`


