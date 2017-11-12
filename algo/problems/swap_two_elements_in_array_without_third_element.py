"""
Assumption: only possible for numeric elements
"""

a = [4, 8]

a[0] += a[1]
a[1] = a[0] - a[1]
a[0] = a[0] - a[1]

print a