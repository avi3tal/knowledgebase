Bobble Sort

1. Iterate every two elements from left to right (starting from position 0) and comparing the value ans swap so that min is on the left
2. Once we got to Position N, we keep the largest element at Pos N, decrease the size of the array by N-1 (n=n-1) and perform the same logic on new N
3. Eventually we end us when we have size(arr) == 2


