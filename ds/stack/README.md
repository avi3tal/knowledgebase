Stack: abstract data type (interface)
---
Can be implemented with a one dimensional array or linked-list

Basic operations: pop, peek, push

To get a variable we need to pop all other variables until will capture the desired variable
The pop method will lose variables forever

memory size is limited 


Stack memory Vs Heap memory


| Stack memory  | Heap memory |
|:----------:|:-------------:|
| limited in size | no size limit |
| fast access | slow access |
| local variables | objects |
| space is managed efficiently by CPU | memory may be fragmented |
| variables cannot be resized | variables can be resized // realloc() |


Stack and recursion
---

Recursive methods will be handy in case of: DFS, traversing a binary search tree, looking for an item in linked-list ...

When using recursion the OS will use a Stack DS in the background anyways

BTW, any recursive algorithm can be converted into simple stack method


Applications:
---

* Back button in web browser
* undo
* 