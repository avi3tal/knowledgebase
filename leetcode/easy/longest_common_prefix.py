"""
https://leetcode.com/problems/longest-common-prefix
"""
from typing import List


def extract_longest_common(str1: str, str2: str) -> str:
    lcp = ""
    for i in range(len(min([str1, str2]))):
        if str1[i] == str2[i]:
            lcp += str1[i]
        else:
            break
    return lcp


def longest_common_prefix(strs: List[str]) -> str:
    if not strs:
        return ""
    if len(strs) == 1:
        return strs[0]

    lcp = strs[0]
    for s in strs[1:]:
        lcp = extract_longest_common(lcp, s)
    return lcp


print(longest_common_prefix(["flower", "flow", "flight"]))
print(extract_longest_common("flower", "flo"))
