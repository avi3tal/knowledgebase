


#**Relationship between array indexes and tree elements**

Complete binary tree has an interesting property that we can use to find the children and parents of any node.

If the index of any element in the array is i, the element in the index **2i+1 will become the left** child and element in **2i+2 index will become the right** child. Also, **the parent of any element at index i is given by the lower bound of (i-1)/2**.


Example:

`arr = [1, 12, 9, 5, 6, 10]`

Left child of 1 (index 0)
= element in (2*0+1) index 
= element in 1 index 
= 12


Right child of 1
= element in (2*0+2) index
= element in 2 index 
= 9

Similarly,
Left child of 12 (index 1)
= element in (2*1+1) index
= element in 3 index
= 5

Right child of 12
= element in (2*1+2) index
= element in 4 index
= 6