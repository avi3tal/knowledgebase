Core interview patterns
=======================



## 1. Heaps 

### Operations /  Time complexity
top() -> O(1)
insert() -> O(logn)
remove() -> O(logn)
heapify() -> O(n)


Example of questions for Heaps:
1. K Closest Points to Origin 


Tips:
1. Complexity - if we have the array of values from the start then arranging them (heapify) will take O(n) but if we build the heap on the fly (stream values etc) it will take O(nlogn) since we insert and heapify N times
2. 



## 2. Sliding window 
Basically using two pointers to iterate an array
Note: it is an algorithm and not just a random implementation!

### Time complexity - O(n) 
The old brutforce would usually be nested for loops which leads to O(n^2) but since we keep track of two pointers at the same time we will get O(n)


Example of questions for Sliding Window
1. Best time to Buy/Sell a stock



## 3. Binary Search 
Basically cutting a DS after getting a feedback of a given value and continue only with the relative part
Tips: identify a question is a binary search might be challanging usually we tend to think it is a sliding window while it is actually a binary search

### Time complexity - O(logn) 


Example of questions for Binary search
1. Guess number higher or lower ...
2. Search a 2-D matrix ...



## 4. DFS & BFS
This are the fundamental graphs algorithms we'll be using for many types of questions
They are also foundation of more complex algos such as "Djikstra - shortest path", "Belman ford", "minHeap", 

### Time complexity - *usually O(v+E) time & space complexity 

Example of questions for DFS & BFS
1. Number of islands ...


## 5. Recursion 
* including Trees, Graphs, Backtracking, DP (Dynamic programming) and more


### Time complexity 
Note: recursion is not free, it takes an extra memory for example in Memoization (with DP)


Example of questions for Recursion
1. Combination Sum ...
2. N-Qweens ...



## 6. HashhMaps


### Operations /  Time complexity
search() -> O(1)
insert() -> O(1)
remove() -> O(1)


Example of questions for HashMap
1. Two Sum

See also: [resources/README.md](../../resources/README.md) (curated external resources).
