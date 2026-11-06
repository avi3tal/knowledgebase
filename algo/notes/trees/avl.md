AVL Trees (aka balanced trees)
===
Motivation:
--
Binary Search Trees complexity is O(logN) but in case the tree is unbalanced 
the complexity might reduce to O(n) (unpredictable...)
In this case AVL Trees or Red-Black Trees are guaranteed to be balanced and so
O(logN) complexity will be also  guaranteed

The major benefit is predictability!!!


AVL are faster than Red-Black trees because they are more balanced BUT in 
they require more work.
There for constructing AVL tree might be a bit slower than Red-Black tree

On every insertion we have to check if the tree is unbalanced or not


Height of a given node
---
AVL algorithm uses height of node, we want the height to be as smaller as possible.
We store the height parameter and if it gets height we fix it (with Rotation)

Height of a node: length of a longest path from it to a leaf
> we use recursion to calculate it:
```$xslt
height = max(leftChild.height(), rightChild.height()) + 1
```
The leaf nodes has no children, we consider the height to be -1 or NULL


**IMPORTANT: All subtrees height parameter must not differ more than 1**  
meaning, the height diff between two children of a single node must not be higher than 1     
*AVL Property =>* `|height(leftSubtree) - height(rightSubtree)| <= 1`  
In case it is is higher than 1 it means we have an unbalanced tree and we'll have to fix it (with Rotation)


Insertion
---
O(N*LogN)
- We perform a regular BST insertion
- Fix AVL Property on every insertion from insertion upwards
> There may be several violations of AVL Property from the inserted node to the root, we have to check them all and fix

Rotations
---
> O(1) time complexity

Fixing a violation of AVL property would be with Rotation.
 
We just update the references which can be done in O(1) time complexity 
> note: the in-order traversal output must be identical before and after rotation

- Right Rotation: leftChile become root -> the rightChild of this node become leftChile of origin root -> the origin root become rightChile of new root  
- Left Rotation: rightChile become root -> the leftChild of this node become rightChile of origin root -> the origin root become leftChile of new root


AVL Tree Applications
===

AVL Sort
---
This data structure can be used to sort items. We'll insert all items (make sure it is balanced of course) 
and run in-order traversal.

The overall complexity is **O(N\*logN)** since insertion takes O(N*LogN) and  in order takes O(N)
 