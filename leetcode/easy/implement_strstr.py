"""
https://leetcode.com/problems/implement-strstr/
"""


def str_str(haystack: str, needle: str) -> int:
    if haystack == "" and needle == "":
        return 0
    elif haystack == "" or needle == "":
        return -1
    for i, v in enumerate(haystack):
        if v == needle[0]:
            if haystack[i:i+len(needle)] == needle:
                return i
    return -1


print(str_str(haystack="hello", needle="ll"))
print(str_str(haystack="aaaaa", needle="bba"))
print(str_str(haystack="", needle=""))
print(str_str(haystack="", needle="a"))
print(str_str(haystack="a", needle=""))

