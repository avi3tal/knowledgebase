

def cal_list(arr):
    if len(arr) == 1:
        return arr[0]
    else:
        return arr[0] + cal_list(arr[1:])


if __name__ == "__main__":
    # a = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    a = [i for i in range(0, 100)]
    print(cal_list(a))
