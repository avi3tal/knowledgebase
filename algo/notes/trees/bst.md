Binary Search Tree are Data structures
===
O(logN)


* Every node can have at most two children (left and right child)
* left child: smaller than the parent
* right child: higher than the parent

Time complexity O(logN)

Height of the tree
---
The tree contains layers of nodes  
layer 1 -> 2^0 = 1 node  
layer 2 -> 2^1 = 2 nodes  
...  
layer h -> 2^h-1 = m nodes

Balanced tree is when h ~ O(logN)  
otherwise the tree is unbalanced which means the tree is asymmetric which is a PROBLEM!!!    

Tip:  
* Finding the smallest node would require simply go to the left nodes as much as possible
* Finding the largest node would require simply go to the right nodes as much as possible

Deleting node
===
There are three possible cases
* Deleting a leaf node
* Deleting a node with a single child
* deleting a node that has two children

Deleting a leaf node:
---
Searching for the node by its value and then set its parent reference to null
Complexity => O(logN) finding the item + O(1) delete = O(logN)

Deleting node with single child:
---
Update the references  
Basically we search node with O(logN) and then set parent reference to node's single child with O(1)  
overall complexity is O(logN)

Deleting node with two children:
---
* predecessor - Largest item in the left tree
* successor -  Smallest item in the right tree

There are two ways
1. Switching places with the predecessor: meaning we look for the predecessor with O(logN) and then switch places with the root  
and then we remove the leaf
2. Switching places with the successor: meaning we look for the smallest node in the right tree. 
This node will usually have child, then we switch with root and update reference

Overall complexity O(logN)


Traversal
===
* In-order traversal
* Pre-order traversal
* Post-order traversal


In-order traversal
---
*It is a numerical ordering e.g.  1-3-6-10-15*

Using it in a recursive manner. We first go to the left sub-tree then to root and the to right sub-tree
We do it in recursion on each iteration we handle another tree

Pre-order traversal
---
Root node -> left sub-tree -> right sub-tree (recursively)

Post-order traversal
---
Left sub-tree -> right sub-tree -> root (recursively)


Running times
===

|  | average case | worst case |
|:----------:|:----------:|:----------:|
| Space | O(n) | O(n) |
| Insert | O(logN) | O(n) |
| Delete | O(logN) | O(n) |
| Search | O(logN) | O(n) |

note: unbalanced tree will cost O(n) therefore we have to make sure we balance the tree as much as possible
This is where AVL Tree and RedBlack Tree is needed  

Trees Applications
===
* filesystem = representing an hierarchical data
* machine learning = decision trees and boosting 

> An important tree data has placed in the next AVL Tree module