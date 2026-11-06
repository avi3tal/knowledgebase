class Stack(object):

    def __init__(self):
        self.stack = []

    def is_empty(self):
        return not self.stack

    def push(self, v):
        self.stack.append(v)

    def pop(self):
        data = self.stack[-1]
        del self.stack[-1]
        return data

    def peek(self):
        return self.stack[-1]

    def size_stack(self):
        return len(self.stack)


if __name__ == "__main__":
    s = Stack()
    s.push(1)
    s.push(2)
    s.push(3)
    print(s.size_stack())
    print("Popped: ", s.pop())
    print("Popped: ", s.pop())
    print(s.size_stack())
    print("Peek: ", s.peek())
    print("Popped: ", s.pop())
    print(s.size_stack())