"""Unit tests: structs, comparators, complexity estimate, naming, generators."""

from __future__ import annotations

import math
import random

import pytest
from kb import gens
from kb.compare import compare, compare_case
from kb.complexity import canonical, estimate, matches
from kb.convert import to_json, to_py
from kb.naming import camel, go_exported, snake
from kb.structs import ListNode, TreeNode


@pytest.mark.parametrize("values", [[], [1], [1, 2, 3]])
def test_list_round_trip(values: list[int]) -> None:
    assert ListNode.to_list(ListNode.from_list(values)) == values


@pytest.mark.parametrize(
    "values",
    [[], [1], [3, 9, 20, None, None, 15, 7], [1, None, 2], [1, 2, None, 3]],
)
def test_tree_round_trip(values: list) -> None:
    assert TreeNode.to_list(TreeNode.from_list(values)) == values


@pytest.mark.parametrize(
    "t, value",
    [
        ("int[]", [1, 2]),
        ("ListNode", [1, 2]),
        ("ListNode[]", [[1], []]),
        ("TreeNode", [1, None, 2]),
        ("int[][]", [[1]]),
    ],
)
def test_convert_round_trip(t: str, value: list) -> None:
    assert to_json(t, to_py(t, value)) == value


def test_to_py_returns_fresh_objects() -> None:
    src = [[1, 2], [3]]
    out = to_py("int[][]", src)
    out[0].append(9)
    assert src == [[1, 2], [3]]


@pytest.mark.parametrize(
    "got, expected, comparator, want",
    [
        ([0, 1], [0, 1], "exact", True),
        ([1, 0], [0, 1], "exact", False),
        ([1, 0], [0, 1], "unordered", True),
        ([1], [0, 1], "unordered", False),
        ([[2, 1], [0]], [[0], [1, 2]], "unordered_deep", True),
        (0.3333333, 0.33333333, "float", True),
        (0.4, 0.3, "float", False),
        (2, [1, 2], "any_of", True),
        (3, [1, 2], "any_of", False),
    ],
)
def test_compare(got, expected, comparator: str, want: bool) -> None:
    assert compare(got, expected, comparator) is want


def test_compare_design_per_op() -> None:
    assert compare_case([None, 4, 5], [None, 4, 5], "exact", design=True)
    assert not compare_case([None, 4], [None, 4, 5], "exact", design=True)


def test_compare_unknown_comparator() -> None:
    with pytest.raises(ValueError):
        compare(1, 1, "nope")


MODELS = {
    "O(1)": lambda n: 1.0,
    "O(log n)": lambda n: math.log2(n),
    "O(n)": lambda n: float(n),
    "O(n log n)": lambda n: n * math.log2(n),
    "O(n^2)": lambda n: float(n * n),
}


@pytest.mark.parametrize("model", list(MODELS))
@pytest.mark.parametrize("noise", [0.0, 0.05])
def test_estimate_recovers_model(model: str, noise: float) -> None:
    rng = random.Random(7)
    ns = [256 * 2**k for k in range(10)]
    pts = [(n, (5 + MODELS[model](n)) * (1 + rng.uniform(-noise, noise))) for n in ns]
    fit = estimate(pts)
    assert fit is not None and fit.best == model


def test_estimate_needs_points() -> None:
    assert estimate([(10, 1.0), (20, 2.0)]) is None


@pytest.mark.parametrize(
    "measured, expected, want",
    [
        ("O(n)", "O(n)", True),
        ("O(n)", "O(n log n)", True),  # within slope tolerance: indistinguishable in practice
        ("O(n)", "O(n^2)", False),
        ("O(n^2)", "O(n)", False),
        ("O(n)", "O(m*n)", None),  # multi-variable: not judged
    ],
)
def test_matches(measured: str, expected: str, want: bool | None) -> None:
    ns = [256 * 2**k for k in range(10)]
    fit = estimate([(n, MODELS[measured](n)) for n in ns])
    assert fit is not None
    assert matches(fit, expected, ns) is want


@pytest.mark.parametrize("raw, want", [("O(n * log(n))", "o(nlogn)"), ("O(N²)", "o(n^2)"), ("O(1)", "o(1)")])
def test_canonical(raw: str, want: str) -> None:
    assert canonical(raw) == want


@pytest.mark.parametrize(
    "fn, arg, want",
    [
        (snake, "twoSum", "two_sum"),
        (snake, "KthLargest", "kth_largest"),
        (snake, "add", "add"),
        (camel, "two-sum", "twoSum"),
        (go_exported, "getMin", "GetMin"),
    ],
)
def test_naming(fn, arg: str, want: str) -> None:
    assert fn(arg) == want


def test_generators_deterministic_and_sized() -> None:
    assert gens.evaluate("int_array(n)", 100) == gens.evaluate("int_array(n)", 100)
    assert len(gens.evaluate("int_array(n)", 100)) == 100
    assert len(gens.evaluate("string(n)", 50)) == 50
    assert gens.evaluate("sorted_int_array(n)", 64) == sorted(gens.evaluate("sorted_int_array(n)", 64))
    tree = TreeNode.from_list(gens.evaluate("bst(n)", 31))
    vals: list[int] = []

    def inorder(t: TreeNode | None) -> None:
        if t:
            inorder(t.left)
            vals.append(t.val)
            inorder(t.right)

    inorder(tree)
    assert len(vals) == 31 and vals == sorted(vals)


def test_sizes() -> None:
    assert gens.sizes({"sizes": [1, 2]}) == [1, 2]
    assert gens.sizes({"min_n": 100, "max_n": 800}) == [100, 200, 400, 800]


def test_bench_args_are_independent() -> None:
    args = gens.bench_inputs({"args": {"a": "int_array(n)", "b": "int_array(n)"}, "sizes": [16]})[0]["args"]
    assert args["a"] != args["b"]


def test_estimate_factorial() -> None:
    fit = estimate([(n, float(math.factorial(n))) for n in range(4, 10)])
    assert fit is not None and fit.best == "O(n!)"
