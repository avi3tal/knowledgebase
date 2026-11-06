package gokb

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
	"sort"
)

const floatTol = 1e-6

// Compare reports whether got (a Go value) matches expected (raw JSON) under
// the named comparator. It mirrors tools/kb/compare.py.
func Compare(got any, expected json.RawMessage, comparator string, design bool) (bool, any, error) {
	gotJSON, err := json.Marshal(Normalize(got))
	if err != nil {
		return false, nil, fmt.Errorf("marshal result: %w", err)
	}
	var g, e any
	if err := json.Unmarshal(gotJSON, &g); err != nil {
		return false, nil, fmt.Errorf("normalise result: %w", err)
	}
	if err := json.Unmarshal(expected, &e); err != nil {
		return false, g, fmt.Errorf("decode expected: %w", err)
	}
	if !design {
		ok, err := compareValues(g, e, comparator)
		return ok, g, err
	}
	gl, gok := g.([]any)
	el, eok := e.([]any)
	if !gok || !eok || len(gl) != len(el) {
		return false, g, nil
	}
	for i := range gl {
		ok, err := compareValues(gl[i], el[i], comparator)
		if err != nil || !ok {
			return false, g, err
		}
	}
	return true, g, nil
}

func compareValues(g, e any, comparator string) (bool, error) {
	switch comparator {
	case "exact":
		return reflect.DeepEqual(g, e), nil
	case "unordered":
		gl, gok := g.([]any)
		el, eok := e.([]any)
		if !gok || !eok {
			return reflect.DeepEqual(g, e), nil
		}
		return reflect.DeepEqual(canonSorted(gl), canonSorted(el)), nil
	case "unordered_deep":
		return reflect.DeepEqual(deepSort(g), deepSort(e)), nil
	case "float":
		return closeTo(g, e), nil
	case "any_of":
		el, ok := e.([]any)
		if !ok {
			return false, fmt.Errorf("any_of expects a list of acceptable answers")
		}
		for _, cand := range el {
			if reflect.DeepEqual(g, cand) {
				return true, nil
			}
		}
		return false, nil
	default:
		return false, fmt.Errorf("unknown comparator %q", comparator)
	}
}

func canon(v any) string {
	b, _ := json.Marshal(v) // values came from json.Unmarshal, so Marshal cannot fail
	return string(b)
}

func canonSorted(xs []any) []string {
	out := make([]string, len(xs))
	for i, x := range xs {
		out[i] = canon(x)
	}
	sort.Strings(out)
	return out
}

func deepSort(v any) any {
	xs, ok := v.([]any)
	if !ok {
		return v
	}
	out := make([]any, len(xs))
	for i, x := range xs {
		out[i] = deepSort(x)
	}
	sort.Slice(out, func(i, j int) bool { return canon(out[i]) < canon(out[j]) })
	return out
}

func closeTo(g, e any) bool {
	switch ev := e.(type) {
	case float64:
		gv, ok := g.(float64)
		if !ok {
			return false
		}
		return math.Abs(gv-ev) <= floatTol*math.Max(1, math.Abs(ev))
	case []any:
		gl, ok := g.([]any)
		if !ok || len(gl) != len(ev) {
			return false
		}
		for i := range ev {
			if !closeTo(gl[i], ev[i]) {
				return false
			}
		}
		return true
	default:
		return reflect.DeepEqual(g, e)
	}
}
