## Two directions of information flow

Almost every binary tree problem is one of these two recursions (or both at once):

**Top-down (pre-order): pass state down as arguments.** The node needs to know something about
its ancestors: current depth, the path so far, the allowed `(lo, hi)` range for a BST check.

```python
def walk(node, state):
    if node is None:
        return
    <use node with state>
    walk(node.left,  <state updated for the left child>)
    walk(node.right, <state updated for the right child>)
```

**Bottom-up (post-order): return a summary up.** The answer at a node depends on answers from its
children: height, size, subtree sum, "is balanced".

```python
def solve(node):
    if node is None:
        return <value for the empty tree>
    left, right = solve(node.left), solve(node.right)
    return <combine(left, right, node.val)>
```

## Return one thing, record another

The hardest tree problems ask for an answer that can sit **anywhere** in the tree and is built
from **both** children: the longest path between any two nodes, the largest path sum, the total
"tilt". The trick is to split each call's work in two:

- **record** a complete candidate at this node (it may use both children) in an outer variable;
- **return** only what the parent can extend (usually one side, or a subtree total).

```python
best = <identity>
def solve(node):
    nonlocal best
    if node is None:
        return 0
    left, right = solve(node.left), solve(node.right)
    best = <update with a candidate using left AND right>   # record
    return <what the parent can use>                         # return
```

In the animation below, `subtree_sum` *returns* the sum of its subtree (the parent needs that),
while the tilt `|left − right|` of every node is *recorded* in `tilt`. Watch the call stack: a
node's line runs only after both children have returned.

## Other BST tools worth knowing
- **In-order = sorted.** k-th smallest, "is this a BST", "two-sum in a BST", and a BST iterator
  are all in-order walks, often written iteratively with an explicit stack so they can pause
  between values.
- **Lowest common ancestor in a BST:** walk from the root; if both keys are smaller go left, if
  both are larger go right, otherwise the current node splits them, so it's the LCA. O(h).
- **Build a balanced BST from sorted data:** take the middle as the root and recurse on both
  halves.
