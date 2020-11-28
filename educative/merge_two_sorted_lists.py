def merge_lists(lst1, lst2):
    i1 = i2 = 0
    new_list = []
    while i1 < len(lst1) and i2 < len(lst2):
        if lst1[i1] < lst2[i2]:
            new_list.append(lst1[i1])
            i1 += 1
        elif lst1[i1] > lst2[i2]:
            new_list.append(lst2[i2])
            i2 += 1
        else:
            new_list.append(lst1[i1])
            i1 += 1
            i2 += 1

    if i1 <= len(lst1):
        new_list.extend(lst1[i1:])
    if i2 <= len(lst2):
        new_list.extend(lst2[i2:])
    print(new_list)
    return new_list


list1 = [1,3,4,5]
list2 = [2,6,7,8]

assert merge_lists(list1, list2) == [1,2,3,4,5,6,7,8]