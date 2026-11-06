# Operations of MinHeap
=======================

note: same for max heap but with relative references

## getMin()
==========
Get the root element of a min-heap. 
Time complexity is O(1)


## extractMin()
==============
Remoive the min element from a min-heap


## decreasKey(V, v)
==================
Decrease the value of a key. If the new value is greater then there is nothing we need to do but otherwiswe we will have to traverse and fix the violated tree


## insert(X)
===========
Insert new value to array. Same as decrease, if the new value is greater then its parent there is nothing we need to do otherwise fix it (heapify)

## delete()
==========
Replace the root element with the last element end remove the last element. since the new root can violate the heap, we will restore the heap structure by calling heapify on the root element




