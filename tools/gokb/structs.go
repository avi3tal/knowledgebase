// Package gokb is the Go side of the kb practice runner: LeetCode-style
// ListNode/TreeNode, JSON case decoding, comparators and the test/bench drivers
// used by the generated solution_test.go files.
package gokb

// ListNode is a singly linked list node; serialised as [1,2,3].
type ListNode struct {
	Val  int
	Next *ListNode
}

// TreeNode is a binary tree node; serialised in level order with nulls: [3,9,20,null,null,15,7].
type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

// ListFromSlice builds a linked list from values (nil for an empty slice).
func ListFromSlice(vals []int) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	for _, v := range vals {
		tail.Next = &ListNode{Val: v}
		tail = tail.Next
	}
	return dummy.Next
}

// ListToSlice returns the values of a linked list ([]int{} for nil).
func ListToSlice(head *ListNode) []int {
	out := []int{}
	for n := head; n != nil; n = n.Next {
		out = append(out, n.Val)
	}
	return out
}

// TreeFromSlice builds a tree from a level-order slice where nil marks a missing node.
func TreeFromSlice(vals []*int) *TreeNode {
	if len(vals) == 0 || vals[0] == nil {
		return nil
	}
	root := &TreeNode{Val: *vals[0]}
	queue := []*TreeNode{root}
	for i := 1; len(queue) > 0 && i < len(vals); {
		node := queue[0]
		queue = queue[1:]
		if i < len(vals) && vals[i] != nil {
			node.Left = &TreeNode{Val: *vals[i]}
			queue = append(queue, node.Left)
		}
		i++
		if i < len(vals) && vals[i] != nil {
			node.Right = &TreeNode{Val: *vals[i]}
			queue = append(queue, node.Right)
		}
		i++
	}
	return root
}

// TreeToSlice serialises a tree in level order with trailing nils trimmed.
func TreeToSlice(root *TreeNode) []*int {
	out := []*int{}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		if node == nil {
			out = append(out, nil)
			continue
		}
		v := node.Val
		out = append(out, &v)
		queue = append(queue, node.Left, node.Right)
	}
	for len(out) > 0 && out[len(out)-1] == nil {
		out = out[:len(out)-1]
	}
	return out
}
