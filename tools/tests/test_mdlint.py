"""Markdown content rules: fence languages and no ASCII-art diagrams."""

from __future__ import annotations

import pytest
from kb import mdlint


def test_fences_finds_blocks_with_info_and_body() -> None:
    md = 'intro\n```python title="a.py"\nx = 1\n```\n- item\n  ```go\n  y := 2\n  ```\n'
    assert [(line, info) for line, info, _ in mdlint.fences(md)] == [(2, 'python title="a.py"'), (6, "go")]
    assert mdlint.fences(md)[0][2] == ["x = 1"]


def test_longer_fences_contain_shorter_ones() -> None:
    md = "````markdown\n```python\nx\n```\n````\n"
    assert [info for _, info, _ in mdlint.fences(md)] == ["markdown"]


@pytest.mark.parametrize(
    ("md", "expected"),
    [
        ("```python\nx = 1\n```", []),
        ("```text\nT(n) = 2T(n/2) + n\n```", []),
        ("```figure\nplacement\n```", []),
        ("```diagram\nv1\n```", []),
        ("```\nx = 1\n```", ["language"]),
        ("```text\n┌───┐\n│ A │\n└───┘\n```", ["ASCII"]),
        ("```\n[A] ──► [B]\n [C] ◄── [D]\n```", ["language", "ASCII"]),
        ("```text\na -> b\n```", []),
    ],
)
def test_check(md: str, expected: list[str]) -> None:
    errors = mdlint.check(md, "f.md")
    assert len(errors) == len(expected)
    for err, word in zip(errors, expected, strict=True):
        assert word in err and err.startswith("f.md:1:")


def test_repo_content_has_no_untagged_fences_or_ascii_art() -> None:
    from kb.paths import ROOT

    skip = {"node_modules", ".claude", "_workspace", "dist", "testdata"}
    errors = [
        e
        for p in sorted(ROOT.glob("**/*.md"))
        if not skip & set(p.relative_to(ROOT).parts)
        for e in mdlint.check(p.read_text(), str(p.relative_to(ROOT)))
    ]
    assert errors == []
