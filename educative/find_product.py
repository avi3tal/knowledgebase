def find_product(lst):
    b = 1
    ans = []
    for i, v in enumerate(lst):
        tmp = 1
        for j in lst[i+1:]:
            tmp *= j
        ans.append(tmp * b)
        b *= v
    print(ans)
    return ans


assert find_product([1,2,3,4]) == [24,12,8,6]
assert find_product([4,2,1,5, 0]) == [0,0,0,0,40]