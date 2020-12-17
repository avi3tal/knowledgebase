from typing import Optional


# Linked list example in Python
# Node class
class Node:
    # Function to initialize the node object
    def __init__(self, v):
        self.val = v  # Assign value
        self.next = None  # Initialize next as null


# Linked List class
class ListNode:
    # Function to initialize the Linked List
    def __init__(self):
        self.head: Optional[Node] = None
