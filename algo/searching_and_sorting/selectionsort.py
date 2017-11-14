"""
http://www.geeksforgeeks.org/selection-sort/

Time Complexity O(n*n)

Selection sort algorithm is easy to use but, there are other sorting algorithm which perform better than selection sort.
Specially, selection sort shouldn't be used to sort large number of elements if the performance matters in that program.
"""


def selection_sort(arr):
    size = len(arr)

    for i in range(0, size):
        lowest = i
        for j in range(i, size):
            if j+1 < size and arr[lowest] > arr[j+1]:
                lowest = j+1
        arr[i], arr[lowest] = arr[lowest], arr[i]


if __name__ == "__main__":
    # array = [12, 11, 13, 5, 6, 7]
    # array = [1, 12, 9, 5, 6, 10]
    array = [11, 12, 22, 25, 64]
    selection_sort(array)
    print ("Sorted array is {}".format(array))