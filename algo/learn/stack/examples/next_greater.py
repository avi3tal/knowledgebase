"""Worked example (monotonic stack): for each element, the next element to its right that is larger.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def next_greater(nums: list[int]) -> list[int]:
    result = [-1] * len(nums)  # note: -1 = no greater element to the right (yet)
    stack: list[int] = []  # note: indices still waiting for their answer; their values decrease bottom → top
    for i in range(len(nums)):
        while stack and nums[stack[-1]] < nums[i]:
            j = stack.pop()  # note: nums[i] is the first larger value to the right of j — answer j and pop it
            result[j] = nums[i]
        stack.append(i)  # note: i now waits for its own larger element; the stack stays decreasing
    return result  # note: each index is pushed once and popped at most once → O(n)
