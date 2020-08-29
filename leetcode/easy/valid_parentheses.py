"""
https://leetcode.com/problems/valid-parentheses
"""


def is_valid(s: str) -> bool:
    """
    Time: O(n)
    Space: O(n) due to the stack we maintain
    """
    stack = []
    mapping = {"}": "{", ")": "(", "]": "["}
    for c in s:
        if c in mapping:
            last_elm = stack.pop()
            if mapping[c] != last_elm:
                return False
        else:
            stack.append(c)
    return not stack


print(is_valid("[(())]{}"))
print(is_valid("[(())]{}{"))
print(is_valid("[((])]{}"))
