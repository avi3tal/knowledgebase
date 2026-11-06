import math

def printTree(tree):
    print("")
    n = len(tree)
    if n == 0:
        print("<empty>")
        return

    # height of the heap (0-based)
    h = int(math.floor(math.log2(n)))

    max_width = 2 ** (h + 1)  # rough width for spacing

    index = 0
    level = 0
    while index < n and level <= h:
        level_count = 2 ** level          # nodes at this level (max)
        # actual nodes available in array
        items = tree[index:index + level_count]
        index += level_count

        spaces_between = max_width // (2 ** level + 1)
        leading = spaces_between // 2

        line = " " * leading
        line += (" " * spaces_between).join(str(x) for x in items)
        print(line)

        level += 1


def heapify(arr, n, i):
    """
    Docstring for heapify
    
    :param array: current array
    :param n: current size
    :param i: current index
    """

    # initialize the largest from the root node
    largest = i

    # recornize left and right children of root
    l = (2 * i) + 1
    r = (2 * i) + 2

    # if left child index is in range and it value is larger then root's, then announce left child has the largest value
    if l < n and arr[l] > arr[largest]:
        largest = l

    # if right child index is in range and it value is larger then root's, then announce right child has the largest value
    if r < n and arr[r] > arr[largest]:
        largest = r
    
    # if largest was indeed replaced by one of the children then swap the values inside the arr and call heapify
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]

        # Recursively heapify the affected sub-tree
        heapify(arr, n, largest)


def heap_sort(arr):
    """
    Explanations:

    At step 1 we 
    `range(n // 2 - 1, -1, -1)` is just a compact way to say: “iterate i over all **non‑leaf nodes**, from the last one up to the root, going backwards”.

    Given an array of length `n` interpreted as a binary heap:
    - Children of index `i` are at `2*i + 1` (left) and `2*i + 2` (right).  
    - Any index `i` with `2*i + 1 >= n` has **no children**, so it is a **leaf**.  

    Solve `2*i + 1 >= n` ⇒ `i >= (n - 1) / 2`.  
    So the **first leaf index** is `⌈(n - 1) / 2⌉`, and the **last non‑leaf index** is `⌊(n - 1) / 2⌋ = n // 2 - 1` in Python integer division.[1][2]

    Therefore:
    - `start = n // 2 - 1` → last non‑leaf node.  
    - `stop = -1` with step `-1` → go down to `0` inclusive (Python’s `range` excludes the stop).  

    So in English:
    ```python
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    ```

    means:
    > “For every internal (non‑leaf) node i, starting from the bottommost/rightmost one and moving up to the root, apply `heapify`.”[4][1]
     
    
    At Step 2 we 
    iterate frem the end to the start NOT including index 0
    Before each iteration with index i, arr[i+1 : n] is already in final sorted order, and arr[0 : i+1] is a max‑heap.
    After the swap and heapify(arr, i, 0), arr[i : n] becomes sorted, arr[0 : i] remains a max‑heap, and you move on with i-1.
    """
    n = len(arr)


    
    print("Step 1 - Build heap (rearrange vector)    ")
    for i in range(n // 2-1, -1, -1):
        print(f"Heapify arr len {n} at index {i}")
        heapify(arr, n, i)
        printTree(arr)

    print("\nStep 2 - One by one extract element from heap")
    for i in range(n-1, 0, -1):
        # move root to the end
        print(f"replacing root {arr[0]} by {arr[i]} at index {i}")
        arr[0], arr[i] = arr[i], arr[0]

        heapify(arr, i, 0)


if __name__ == "__main__":
    arr = [9, 4, 3, 8, 10, 2, 5, 19, 12,7,1,11]
    
    heap_sort(arr)

    for i in range(len(arr)):
        print(arr[i], end=" ")

    