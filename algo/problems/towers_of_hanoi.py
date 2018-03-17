COUNT = 0


def hanoi(n, source, target, helper):
    global COUNT
    if n > 0:
        COUNT += 1
        hanoi(n - 1, source, helper, target)
        if source:
            target.append(source.pop())
        hanoi(n - 1, helper, target, source)


if __name__ == "__main__":
    s = [5, 4, 3, 2, 1]
    t = []
    h = []
    hanoi(len(s), s, t, h)
    print COUNT

    print("source: {}, helper: {}, target: {}".format(s, h, t))
