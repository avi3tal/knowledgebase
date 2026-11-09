# Depth-First Search

> Pattern #9 · Data structures: tree, graph, matrix; recursion (the call stack) or an explicit stack

Many tree questions are about **paths** (is there a root-to-leaf path with this sum? this
sequence?) or about answers that need **both subtrees** first (height, diameter, is it balanced?
are two trees the same?). Going level by level doesn't help here. A level mixes nodes from many
different paths, and a parent is visited before its children have anything to report.

**The insight:** go **deep first**. Follow one branch all the way to a leaf, then back up to the
most recent fork and try the next branch. Recursion does the bookkeeping for you. The **call
stack** *is* the current path from the root, and each frame remembers which child it still has
to try. That gives you two places to put work:
- **On the way down** (pre-order): pass state from parent to child, e.g. "sum so far" or "index
  into the sequence".
- **On the way back up** (post-order): combine the children's return values, e.g.
  `1 + max(left, right)` for the height.

```figure
path-backtrack
```

## The template (recursive)

```python
def dfs(node, state):
    if node is None:                     # 1. base case: fell off the tree
        return BASE
    # 2. pre-order work: update the state with node (check a target, append to a path)
    left = dfs(node.left, new_state)     # 3. recurse into both children
    right = dfs(node.right, new_state)
    # 4. post-order work: combine left and right into this node's answer
    return combine(node, left, right)
```

Questions to answer before writing it:
1. **What does `dfs(node)` return?** A bool (found?), a number (height, count, best sum), or
   nothing because it writes to an outer variable.
2. **What flows down?** Running sum, depth, index, the path list.
3. **What's the leaf / `None` case?** Many bugs live here. A path must end at a **leaf** (both
   children `None`), not just at a `None` child of a node that has another child.
4. **When can you stop early?** `return dfs(left) or dfs(right)` skips the right subtree once
   the left one succeeded.

**Keeping the path.** If you need the actual nodes, push the node onto a shared `path` list on
the way down and **pop it on the way back up**. The list then always mirrors the call stack. This
choose → explore → un-choose rhythm is the core of backtracking.

Step through it below. The tree view highlights the nodes on `path`, and the call stack shows one
`dfs` frame per node on the current branch. Watch the path grow into the left subtree, shrink
back when that branch fails, and grow again on the right.
