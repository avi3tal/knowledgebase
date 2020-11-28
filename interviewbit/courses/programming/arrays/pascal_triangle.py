def helper(numRows, triangle):
    """
    [
     [1],
     [1,1],
     [1,2,1],
     [1,3,3,1],
     [1,4,6,4,1]
    ]
    """
    if numRows <= 2:
        return triangle[numRows-1]

    line = [1]
    prev_line = helper(numRows-1, triangle)
    for i in range(len(prev_line)-1):
        line.append(prev_line[i] + prev_line[i + 1])
    line.append(1)
    triangle.append(line)
    return line


def pascal_triangle(numRows):
    triangle = [[1], [1, 1]]
    helper(numRows, triangle)
    return triangle


print(pascal_triangle(5))

