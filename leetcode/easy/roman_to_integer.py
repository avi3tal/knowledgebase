"""
https://leetcode.com/problems/roman-to-integer/
"""

ROMAN_BASE = {
    "I": 1,
    "V": 5,
    "X": 10,
    "L": 50,
    "C": 100,
    "D": 500,
    "M": 1000
}


def roman_to_int(s: str) -> int:
    num = 0
    i = 0
    while i < len(s):
        v = ROMAN_BASE[s[i]]
        if i < len(s) - 1 and v < ROMAN_BASE[s[i+1]]:
            num += ROMAN_BASE[s[i+1]] - v
            i += 2
        else:
            num += v
            i += 1
    return num


print(roman_to_int("III"))
print(roman_to_int("IV"))
print(roman_to_int("IX"))
print(roman_to_int("LVIII"))
print(roman_to_int("MCMXCIV"))