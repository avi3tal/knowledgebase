class FactorialWithRecursion(object):

    @staticmethod
    def factorial(n):
        if n < 0:
            return

        if n == 0:
            return 1
        return n * FactorialWithRecursion.factorial(n-1)


class FactorialWithStack(object):

    @staticmethod
    def factorial(n):
        l = []
        if n < 0:
            return

        while n > 0:
            l.append(n)
            n = n -1

        if not l:
            return 1

        a = l.pop()
        while l:
            a = a * l.pop()
        return a


if __name__ == "__main__":
    print FactorialWithRecursion.factorial(-1)
    print FactorialWithStack.factorial(-1)

    print FactorialWithRecursion.factorial(0)
    print FactorialWithStack.factorial(0)

    print FactorialWithRecursion.factorial(6)
    print FactorialWithStack.factorial(6)

    # recursion will break trying to calculate factorial(1000)
    # print FactorialWithRecursion.factorial(1000)
    print FactorialWithStack.factorial(1000)
