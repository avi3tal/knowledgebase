"""
http://www.geeksforgeeks.org/bubble-sort/
https://www.programiz.com/dsa/bubble-sort


"""


def bubble_sort(arr):
    n = len(arr)
    while True:
        loop = False
        for i in range(0, n-1):
            if i+1 <= n and arr[i] > arr[i+1]:
                loop = True
                arr[i], arr[i+1] = arr[i+1], arr[i]
        if not loop:
            break
    return arr


if __name__ == "__main__":
    array = [12, 11, 13, 5, 6, 7]
    # array = [1, 12, 9, 5, 6, 10]
    bubble_sort(array)
    print ("Sorted array is {}".format(array))