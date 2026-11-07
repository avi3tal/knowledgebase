# Linked List Basics

> Fundamental · Data structures: singly / doubly linked list

A linked list is a chain of nodes. Each node holds a value and a pointer to the next node:

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

```
head
 │
 ▼
[1] → [2] → [3] → [4] → None
```

There's no index. To reach the 4th node you follow three `next` pointers. In exchange, once
you **hold a pointer to a node**, inserting or deleting right after it is O(1): you change one
or two pointers and nothing shifts.

## Operations and their cost

| Operation | Singly linked list | Array |
|---|---|---|
| access k-th element | O(k) | O(1) |
| search by value | O(n) | O(n) (O(log n) if sorted) |
| insert / delete at the head | **O(1)** | O(n) |
| insert / delete after a node you hold | **O(1)** | O(n) |
| delete a node you hold (singly) | O(n), you need its predecessor | — |
| append at the tail | O(1) with a tail pointer, else O(n) | O(1) amortised |
| extra memory | one pointer per node | none |

A **doubly linked list** (`prev` + `next`) lets you delete a node you hold in O(1). Combined with
a hash map from key to node, that's the standard way to build an O(1) cache with eviction order.

## The three moves everything is built from

```python
# 1. traverse
curr = head
while curr:
    ...
    curr = curr.next

# 2. delete the node after prev
prev.next = prev.next.next

# 3. insert node x after prev (order matters!)
x.next = prev.next
prev.next = x
```

## The dummy (sentinel) head

The head is special: it has no predecessor, so deleting or inserting at the front would need its
own `if` branch. Put a **dummy node in front** and every real node has a predecessor. At the end,
return `dummy.next`, since the original `head` may have been removed.

```python
dummy = ListNode(0, head)
prev = dummy
...                     # same code for the first node and all the others
return dummy.next
```

Below, the first node is itself a target, so the old `head` pointer ends up pointing at a
deleted node. `dummy.next` is the right answer.
