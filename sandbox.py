G = {
    "A": ["B", "C"],
    "B": ["D", "E"],
    "C": ["F", "G"],
    "D": ["A"],
    "E": [],
    "F": [],
    "G": []
}


# def bfs(graph, start):
#     visited = set()
#     q = [start]
#
#     visited.add(start)
#     while q:
#         item = q.pop(0)
#         print(item, end=" ")
#         for node in graph[item]:
#             if node not in visited:
#                 q.append(node)
#                 visited.add(node)
#
#
# bfs(G, "A")
#
#
# def _helper(graph, node, visited):
#     visited.add(node)
#     print(node, end=" ")
#     for n in graph[node]:
#         if n not in visited:
#             _helper(graph, n, visited)
#
#
# def dfs(graph, start):
#     visited = set()
#     _helper(graph, start, visited)
#
# print()
# dfs(G, "A")


# import datetime
# t = datetime.datetime.now()
# print(t.microsecond % 10)


def calclist(num_list):
    if len(num_list) == 1:
        return num_list[0]
    return num_list[0] + calclist(num_list[1:])

print(calclist([1, 2, 3, 4]))