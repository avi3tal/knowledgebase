package gokb

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"
)

// Case is one entry of cases.json. Function problems use Args; design
// problems use Ctor, Ops and OpArgs.
type Case struct {
	Name     string                     `json:"name"`
	Args     map[string]json.RawMessage `json:"args"`
	Ctor     []json.RawMessage          `json:"ctor"`
	Ops      []string                   `json:"ops"`
	OpArgs   [][]json.RawMessage        `json:"op_args"`
	Expected json.RawMessage            `json:"expected"`
}

// Thunk runs the solution once on already-decoded inputs.
type Thunk func() any

// Prepare decodes a case's inputs (outside any timing) and returns a Thunk.
type Prepare func(c Case) (Thunk, error)

// CaseResult is written to $KB_OUT for the kb CLI.
type CaseResult struct {
	Name     string          `json:"name"`
	OK       bool            `json:"ok"`
	Got      any             `json:"got,omitempty"`
	Expected json.RawMessage `json:"expected"`
	Error    string          `json:"error,omitempty"`
	NS       int64           `json:"ns"`
}

// BenchPoint is one measured input size.
type BenchPoint struct {
	N  int     `json:"n"`
	NS float64 `json:"ns"`
}

const (
	benchTarget   = 200 * time.Millisecond
	benchMaxReps  = 50
	benchStopCall = 500 * time.Millisecond
)

// LoadCases reads a cases.json file.
func LoadCases(path string) ([]Case, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read cases: %w", err)
	}
	var cases []Case
	if err := json.Unmarshal(data, &cases); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	return cases, nil
}

func safeRun(th Thunk) (got any, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic: %v\n%s", r, debug.Stack())
		}
	}()
	return th(), nil
}

// RunCases is the table-driven test over cases.json used by generated tests.
func RunCases(t *testing.T, casesPath, comparator string, design bool, prepare Prepare) {
	t.Helper()
	cases, err := LoadCases(casesPath)
	if err != nil {
		t.Fatal(err)
	}
	results := make([]CaseResult, 0, len(cases))
	for _, c := range cases {
		res := CaseResult{Name: c.Name, Expected: c.Expected}
		t.Run(c.Name, func(t *testing.T) {
			th, err := prepare(c)
			if err != nil {
				res.Error = err.Error()
				t.Fatal(err)
			}
			start := time.Now()
			got, err := safeRun(th)
			res.NS = time.Since(start).Nanoseconds()
			if err != nil {
				res.Error = err.Error()
				t.Fatal(err)
			}
			ok, norm, err := Compare(got, c.Expected, comparator, design)
			res.OK, res.Got = ok, norm
			if err != nil {
				res.Error = err.Error()
				t.Fatal(err)
			}
			if !ok {
				t.Errorf("got %s, want %s", canon(norm), string(c.Expected))
			}
		})
		results = append(results, res)
	}
	writeJSON(t, os.Getenv("KB_OUT"), results)
}

// BenchResult is written to $KB_BENCH_OUT after every size, so partial data survives a crash.
type BenchResult struct {
	Points []BenchPoint `json:"points"`
	Note   string       `json:"note,omitempty"`
}

// RunBench times the solution over $KB_BENCH inputs ([{"n", "case"}]).
// It stops early, keeping the points so far, when a call panics, exceeds the
// per-call budget, or the total budget is used. Skipped unless invoked by kb.
func RunBench(t *testing.T, prepare Prepare) {
	t.Helper()
	in := os.Getenv("KB_BENCH")
	if in == "" {
		t.Skip("set by `kb run`")
	}
	data, err := os.ReadFile(in)
	if err != nil {
		t.Fatalf("read bench inputs: %v", err)
	}
	var items []struct {
		N    int  `json:"n"`
		Case Case `json:"case"`
	}
	if err := json.Unmarshal(data, &items); err != nil {
		t.Fatalf("parse bench inputs: %v", err)
	}
	callBudget := envDuration("KB_CALL_BUDGET_S", 5*time.Second)
	deadline := time.Now().Add(envDuration("KB_BENCH_BUDGET_S", 45*time.Second))
	outPath := os.Getenv("KB_BENCH_OUT")
	res := BenchResult{Points: []BenchPoint{}}
	for _, it := range items {
		var samples []time.Duration
		var total time.Duration
		for total < benchTarget && len(samples) < benchMaxReps {
			th, err := prepare(it.Case)
			if err != nil {
				t.Fatalf("n=%d: %v", it.N, err)
			}
			d, err := timeCall(th, callBudget)
			if err != nil {
				firstLine, _, _ := strings.Cut(err.Error(), "\n")
				res.Note = fmt.Sprintf("stopped at n=%d: %s", it.N, firstLine)
				writeJSON(t, outPath, res)
				return
			}
			samples = append(samples, d)
			total += d
		}
		med := median(samples)
		res.Points = append(res.Points, BenchPoint{N: it.N, NS: float64(med.Nanoseconds())})
		writeJSON(t, outPath, res)
		if med > benchStopCall {
			res.Note = fmt.Sprintf("stopped after n=%d: calls now take over %v", it.N, benchStopCall)
			writeJSON(t, outPath, res)
			return
		}
		if time.Now().After(deadline) {
			res.Note = fmt.Sprintf("stopped after n=%d: bench budget used", it.N)
			writeJSON(t, outPath, res)
			return
		}
	}
}

// timeCall runs th in a goroutine so a runaway call can be abandoned after budget.
// (The goroutine keeps running, but the test binary exits once the test returns.)
func timeCall(th Thunk, budget time.Duration) (time.Duration, error) {
	type result struct {
		d   time.Duration
		err error
	}
	done := make(chan result, 1)
	go func() {
		start := time.Now()
		_, err := safeRun(th)
		done <- result{time.Since(start), err}
	}()
	select {
	case r := <-done:
		return r.d, r.err
	case <-time.After(budget):
		return 0, fmt.Errorf("a call took over %v", budget)
	}
}

func envDuration(name string, def time.Duration) time.Duration {
	v, err := strconv.ParseFloat(os.Getenv(name), 64)
	if err != nil || v <= 0 {
		return def
	}
	return time.Duration(v * float64(time.Second))
}

func median(ds []time.Duration) time.Duration {
	s := append([]time.Duration(nil), ds...)
	sort.Slice(s, func(i, j int) bool { return s[i] < s[j] })
	if len(s)%2 == 1 {
		return s[len(s)/2]
	}
	return (s[len(s)/2-1] + s[len(s)/2]) / 2
}

func writeJSON(t *testing.T, path string, v any) {
	t.Helper()
	if path == "" {
		return
	}
	data, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal results: %v", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}
