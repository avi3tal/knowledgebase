package gokb

import (
	"encoding/json"
	"fmt"
)

// Decode unmarshals a JSON case value into dst, converting list/tree arrays
// into *ListNode / *TreeNode (and slices of them) where dst asks for them.
func Decode(raw json.RawMessage, dst any) error {
	if raw == nil {
		return fmt.Errorf("missing value")
	}
	switch d := dst.(type) {
	case **ListNode:
		var vals []int
		if err := json.Unmarshal(raw, &vals); err != nil {
			return fmt.Errorf("decode list: %w", err)
		}
		*d = ListFromSlice(vals)
	case *[]*ListNode:
		var vals [][]int
		if err := json.Unmarshal(raw, &vals); err != nil {
			return fmt.Errorf("decode lists: %w", err)
		}
		*d = make([]*ListNode, len(vals))
		for i, v := range vals {
			(*d)[i] = ListFromSlice(v)
		}
	case **TreeNode:
		var vals []*int
		if err := json.Unmarshal(raw, &vals); err != nil {
			return fmt.Errorf("decode tree: %w", err)
		}
		*d = TreeFromSlice(vals)
	case *[]*TreeNode:
		var vals [][]*int
		if err := json.Unmarshal(raw, &vals); err != nil {
			return fmt.Errorf("decode trees: %w", err)
		}
		*d = make([]*TreeNode, len(vals))
		for i, v := range vals {
			(*d)[i] = TreeFromSlice(v)
		}
	default:
		if err := json.Unmarshal(raw, dst); err != nil {
			return fmt.Errorf("decode: %w", err)
		}
	}
	return nil
}

// Arg returns args[i] or nil when out of range (Decode then reports it missing).
func Arg(args []json.RawMessage, i int) json.RawMessage {
	if i < len(args) {
		return args[i]
	}
	return nil
}

// Normalize converts solution results into JSON-friendly values
// (lists and trees become slices) before comparison.
func Normalize(v any) any {
	switch x := v.(type) {
	case *ListNode:
		return ListToSlice(x)
	case *TreeNode:
		return TreeToSlice(x)
	case []*ListNode:
		out := make([][]int, len(x))
		for i, l := range x {
			out[i] = ListToSlice(l)
		}
		return out
	case []*TreeNode:
		out := make([][]*int, len(x))
		for i, t := range x {
			out[i] = TreeToSlice(t)
		}
		return out
	case []any:
		out := make([]any, len(x))
		for i, e := range x {
			out[i] = Normalize(e)
		}
		return out
	default:
		return v
	}
}
