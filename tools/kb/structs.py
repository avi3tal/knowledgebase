"""LeetCode-style linked list and binary tree nodes with array (de)serialisation.

Solutions import them as ``from kb.structs import ListNode, TreeNode``.
Lists serialise as ``[1, 2, 3]``; trees as level-order with ``None`` gaps: ``[3, 9, 20, None, None, 15, 7]``.
"""

from __future__ import annotations

from collections import deque
from collections.abc import Iterable
from typing import Any


class ListNode:
    def __init__(self, val: Any = 0, next: ListNode | None = None) -> None:  # noqa: A002
        self.val = val
        self.next = next

    @staticmethod
    def from_list(values: Iterable[Any] | None) -> ListNode | None:
        dummy = ListNode()
        tail = dummy
        for v in values or []:
            tail.next = ListNode(v)
            tail = tail.next
        return dummy.next

    @staticmethod
    def to_list(head: ListNode | None, limit: int = 10_000_000) -> list[Any]:
        out: list[Any] = []
        while head is not None:
            if len(out) >= limit:
                raise ValueError("linked list too long (cycle?)")
            out.append(head.val)
            head = head.next
        return out

    def __repr__(self) -> str:
        return f"ListNode({ListNode.to_list(self, limit=50)})"


class TreeNode:
    def __init__(
        self,
        val: Any = 0,
        left: TreeNode | None = None,
        right: TreeNode | None = None,
    ) -> None:
        self.val = val
        self.left = left
        self.right = right

    @staticmethod
    def from_list(values: list[Any] | None) -> TreeNode | None:
        if not values or values[0] is None:
            return None
        root = TreeNode(values[0])
        queue: deque[TreeNode] = deque([root])
        i = 1
        while queue and i < len(values):
            node = queue.popleft()
            if i < len(values) and values[i] is not None:
                node.left = TreeNode(values[i])
                queue.append(node.left)
            i += 1
            if i < len(values) and values[i] is not None:
                node.right = TreeNode(values[i])
                queue.append(node.right)
            i += 1
        return root

    @staticmethod
    def to_list(root: TreeNode | None) -> list[Any]:
        out: list[Any] = []
        queue: deque[TreeNode | None] = deque([root])
        while queue:
            node = queue.popleft()
            if node is None:
                out.append(None)
                continue
            out.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        while out and out[-1] is None:
            out.pop()
        return out

    def __repr__(self) -> str:
        return f"TreeNode({TreeNode.to_list(self)})"
