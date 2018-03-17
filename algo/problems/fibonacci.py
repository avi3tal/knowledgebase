

def fib_rec(n):
    """
    simple recursive function
    O(2^n)

    """
    if n == 0:
        return n

    if n == 1:
        return n
    return fib_rec(n-1) + fib_rec(n-2)


def fib_dp(n):
    """
    Dynamic programming solution
    O(n)
    """
    if n == 0:
        return n

    if n < 2:
        return 1

    seq = [0] * n
    seq[0] = seq[1] = 1

    for i in range(2, n):
        seq[i] = seq[i-1] + seq[i-2]

    return seq[n-1]


if __name__ == "__main__":
    print(fib_dp(10))
    print(fib_rec(10))
