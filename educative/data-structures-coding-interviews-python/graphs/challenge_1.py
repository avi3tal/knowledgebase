"""
Now, we shall implement the BFS algorithm in Pythonic code.

"""

graph = {
    'A' : ['B','C'],
    'B' : ['D', 'E'],
    'C' : ['F'],
    'D' : [],
    'E' : ['F'],
    'F' : []
}

visited = set() # List to keep track of visited nodes.
queue = []     #Initialize a queue

def bfs(visited, graph, node):
    queue.append(node)
    visited.add(node)
    while queue:
        item = queue.pop(0)
        print(item, end=" ")
        for n in graph[item]:
            if n not in visited:
                visited.add(n)
                queue.append(n)


bfs(visited, graph, "A")