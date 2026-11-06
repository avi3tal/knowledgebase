Heaps - Basics
==============

## Operation / time complexity 

* Peek (get min/max at root) `O(1)`
* Insert / decrease-key / increase-key: bubble up - `O(logn)`
* Extract-min / extract-max / delete: swap with last, pop, heapify down - `O(logn)`

* Heapify builds a heap from an array in `O(n)`
* * Heap Sort 
* * Build heap from array 

* Heaps are binary trees that stored in an array setisfied either the `max-heap` or `min-heap` property


For coding interviews, heaps are usually used via a *Priority Queue* abstractions
- `heapq` in python
- `PriorityQueue` in Java
- `homegrown binary heap` in Go/Typescript 


## Binary Heaps

[Binary-heap geekforgeeks](https://www.geeksforgeeks.org/dsa/binary-heap/)

Binary heap is special type of a *complete binary tree* which means all levels are filled except maybe the last one, and they are filled from left to right

* It allows a quick finding of Max / Min value using Max-heap or Min-heam
* Min Heaps is when the root node is the lowest value and it is true for all subtrees
* Max Heap is similar to Min only that the root node is highest value 
* They are mostly used in Priotiy Queue due to an efficient insertion and deletion of values


### How is it being represented?
It is a complete binary tree usually represented as an array
Parent node -> arr[(i-1)/2]
Left child -> arr[(2*i)+1]
Right child -> arr[(2*i)+2]


### Which Traversal technique is being used?
Traversal technique used to achieve the array representation is [Level Order Traversal](https://www.geeksforgeeks.org/dsa/level-order-tree-traversal/)
Level Order Traversal technique is a method which ensures all nodes oresent in the same level is traversed before moving to the next level

