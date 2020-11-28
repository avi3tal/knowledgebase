class Solution:
    # @param A : string
    # @return an integer
    def isPalindrome(self, A):
        i, j = 0, len(A) - 1

        while i <= j:
            print(i, j, A[i], A[j])
            if not A[i].isalnum():
                i += 1
                print("A[i] is ", A[i], " which is not alphanumeric")
                continue

            if not A[j].isalnum():
                j -= 1
                print("A[j] is ", A[j], " which is not alphanumeric")
                continue

            if A[i].lower() != A[j].lower():
                return 0

            i += 1
            j -= 1
        return 1


s = Solution()
print(s.isPalindrome("A man, a plan, a canal: Panama"))