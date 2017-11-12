"""
https://www.programiz.com/dsa/insertion-sort
http://www.geeksforgeeks.org/insertion-sort/
"""


def insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        hold = arr[i]

        j = i - 1

        while j >= 0 and hold < arr[j]:
            arr[j+1] = arr[j]
            j -= 1
        arr[j+1] = hold


if __name__ == "__main__":
    array = [12, 11, 13, 5, 6, 7]
    # array = [1, 12, 9, 5, 6, 10]
    insertion_sort(array)
    print ("Sorted array is {}".format(array))