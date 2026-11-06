Merge Sort

Basically a divide and conque algorithm usually approached as reqursive solution

1. Split the array to half
2. split the left array to half until we have single elements (binary tree)
3. Start building the left from the bottom comparing the two leaves and choose the min when building the new array
4. On any new level we go over left to right (on the exiting array) comparing to the right element 
5. Once completing the left half we do the same thing on the right half (go over 2-4)
6. eventually we go over each element of the two arrays from left to right and assamble the final array (it is easy since those two arrays are basically sorted)



https://www.hackerearth.com/practice/algorithms/sorting/merge-sort/visualize/
