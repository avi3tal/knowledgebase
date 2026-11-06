package gokb

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestListRoundTrip(t *testing.T) {
	tests := []struct {
		name string
		in   []int
	}{
		{"empty", []int{}},
		{"one", []int{1}},
		{"many", []int{1, 2, 3, 4}},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := ListToSlice(ListFromSlice(tc.in)); !reflect.DeepEqual(got, tc.in) {
				t.Errorf("got %v, want %v", got, tc.in)
			}
		})
	}
}

func TestTreeRoundTrip(t *testing.T) {
	tests := []struct {
		name string
		in   string
	}{
		{"empty", `[]`},
		{"root", `[1]`},
		{"gaps", `[3,9,20,null,null,15,7]`},
		{"left-skew", `[1,2,null,3]`},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var root *TreeNode
			if err := Decode(json.RawMessage(tc.in), &root); err != nil {
				t.Fatal(err)
			}
			out, _ := json.Marshal(Normalize(root))
			if string(out) != tc.in {
				t.Errorf("got %s, want %s", out, tc.in)
			}
		})
	}
}

func TestCompare(t *testing.T) {
	tests := []struct {
		name       string
		got        any
		expected   string
		comparator string
		design     bool
		want       bool
	}{
		{"exact ok", []int{0, 1}, `[0,1]`, "exact", false, true},
		{"exact order", []int{1, 0}, `[0,1]`, "exact", false, false},
		{"unordered", []int{1, 0}, `[0,1]`, "unordered", false, true},
		{"unordered len", []int{1}, `[0,1]`, "unordered", false, false},
		{"unordered_deep", [][]int{{2, 1}, {0}}, `[[0],[1,2]]`, "unordered_deep", false, true},
		{"float", 0.3333333, `0.33333333`, "float", false, true},
		{"float off", 0.4, `0.3`, "float", false, false},
		{"any_of", 2, `[1,2]`, "any_of", false, true},
		{"list nil is empty", (*ListNode)(nil), `[]`, "exact", false, true},
		{"design per op", []any{nil, 4, 5}, `[null,4,5]`, "exact", true, true},
		{"design mismatch", []any{nil, 4}, `[null,4,5]`, "exact", true, false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ok, _, err := Compare(tc.got, json.RawMessage(tc.expected), tc.comparator, tc.design)
			if err != nil {
				t.Fatal(err)
			}
			if ok != tc.want {
				t.Errorf("Compare(%v, %s, %s) = %v, want %v", tc.got, tc.expected, tc.comparator, ok, tc.want)
			}
		})
	}
}
