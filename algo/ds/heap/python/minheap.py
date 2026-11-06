from heapq import heappop, heappush, heapify

class MinHeap:
    def __init__(self):
        self.heap = []
    
    def parent(self, i):
        return (i-1)//2 # we use // since in python 3 the self.parent[i] has to be int and not float. // refers to abs value
    
    def getMin(self):
        return self.heap[0] if self.heap else None
    
    def extractMin(self):
        return heappop(self.heap)

    def decreaseKey(self, i, new_v):
        self.heap[i] = new_v
        while(i != 0 and self.heap[self.parent(i)] > self.heap[i]):
            self.heap[i], self.heap[self.parent(i)] = self.heap[self.parent(i)], self.heap[i]

    def insert(self, v):
        heappush(self.heap, v)

    def delete(self, i):
        self.decreaseKey(i, float("-inf"))
        self.extractMin()


if __name__ == "__main__":
    heapObj = MinHeap()
    heapObj.insert(3)
    heapObj.insert(2)
    heapObj.delete(1)
    heapObj.insert(15)
    heapObj.insert(5)
    heapObj.insert(4)
    heapObj.insert(45)

    print(heapObj.extractMin(), end=" ")
    print(heapObj.getMin(), end=" "), 
    heapObj.decreaseKey(2, 1)
    print(heapObj.getMin())