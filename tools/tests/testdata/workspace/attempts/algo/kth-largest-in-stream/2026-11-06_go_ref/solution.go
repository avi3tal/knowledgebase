package solution

import (
	"container/heap"
	"sort"
)

type minHeap struct{ sort.IntSlice }

func (h *minHeap) Push(x any) { h.IntSlice = append(h.IntSlice, x.(int)) }
func (h *minHeap) Pop() any {
	old := h.IntSlice
	x := old[len(old)-1]
	h.IntSlice = old[:len(old)-1]
	return x
}

type KthLargest struct {
	k int
	h *minHeap
}

func NewKthLargest(k int, nums []int) *KthLargest {
	kl := &KthLargest{k: k, h: &minHeap{}}
	for _, x := range nums {
		kl.Add(x)
	}
	return kl
}

func (kl *KthLargest) Add(val int) int {
	heap.Push(kl.h, val)
	if kl.h.Len() > kl.k {
		heap.Pop(kl.h)
	}
	return kl.h.IntSlice[0]
}
