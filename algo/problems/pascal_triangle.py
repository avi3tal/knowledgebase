"""
Pascal's Triangle

1
11
121
1331
14641

Question:
Find the value in given row and column

First solution: brute force
Second solution: Dynamic programming
"""
from algo import dynamic_programming


def print_triangle(t):
    for i in t:
        print(", ".join(map(str, i)))


def build_triangle(row, triangle):
    if len(triangle) < row:
        last_row = len(triangle) - 1
        new_row = []
        for i in range(0, len(triangle[last_row]) + 1):
            if i == 0:
                new_row.append(1)
            elif i >= len(triangle[last_row]):
                new_row.append(1)
            else:
                new_value = triangle[last_row][i] + triangle[last_row][i-1]
                new_row.append(new_value)
        triangle.append(new_row)
        build_triangle(row, triangle)


def find_value_brute_force(row, column):
    if row <= 2:
        return 1

    triangle = [[1], [1, 1]]
    build_triangle(row, triangle)
    print_triangle(triangle)
    return triangle[row - 1][column - 1]


@dynamic_programming
def find_value_dynamically(row, column):
    if row <= 2:
        return 1

    row = row - 3
    previous_row = [1, 1]
    while row:
        new_row = [1]
        [new_row.append(previous_row[i-1] + previous_row[i]) for i in range(1, len(previous_row))]
        new_row.append(1)
        previous_row = new_row
        row -= 1
    return previous_row[column-2] + previous_row[column-1]


if __name__ == "__main__":
    print(find_value_brute_force(50, 28))
    print(find_value_dynamically(50, 28))
