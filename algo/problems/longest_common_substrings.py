"""
solution based on https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Longest_common_substring#Python
"""
from algo import dynamic_programming


@dynamic_programming
def longest_common_substring(s1, s2):
    m = [[0] * (1 + len(s2)) for _ in range(1 + len(s1))]

    longest, x_longest = 0, 0
    substrings = set()

    for x in range(1, 1 + len(s1)):
        for y in range(1, 1 + len(s2)):
            if s1[x - 1] == s2[y - 1]:
                m[x][y] = m[x - 1][y - 1] + 1
                if m[x][y] > longest:
                    longest = m[x][y]
                    x_longest = x
                if x == len(s1):
                    substrings.add(s1[-m[x][y]:])
                if y == len(s2):
                    substrings.add(s2[-m[x][y]:])
            else:
                if m[x-1][y-1] > 1:
                    substrings.add(s1[x - 1 - m[x-1][y-1]: x - 1])
                m[x][y] = 0

    print("S1 => {}\nS2 => {}".format(s1, s2))
    print("table:")
    print('\n'.join([''.join(['{:4}'.format(item) for item in row])
                           for row in m]))
    print("all substrings:\n{}".format("\n".join(substrings)))
    print("Longest common substring is {}".format(s1[x_longest - longest: x_longest]))


if __name__ == "__main__":
    S1 = "sparkbeyond"
    S2 = "parckspkkrkeffnlkondsparkbq"

    longest_common_substring(S1, S2)
