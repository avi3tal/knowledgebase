"""Markdown content rules for lessons, problem READMEs and reference walkthroughs.

- Every fenced block names its language (```python, ```go, ```sql, ```text for formulas and
  output…). The studio highlights by that name; an unnamed fence renders as plain text.
- No ASCII-art diagrams in code fences: boxes, arrows and pointer sketches belong in figures
  (```figure, see figures.py: architecture, sequence, flowchart, uml, structure) or, for design
  problems, in ```diagram fences.
"""

from __future__ import annotations

import re

OPEN_RE = re.compile(r"^(?P<indent>\s*(?:[-*+] |\d+\. )?\s*)(?P<fence>`{3,}|~{3,})(?P<info>.*)$")
# Box-drawing and arrow glyphs that only appear in hand-drawn diagrams.
ART_RE = re.compile(r"[─━│┃┌┐└┘├┤┬┴┼╭╮╯╰═║╔╗╚╝▶◀►◄▲▼◁▷△▽◇◆┄┈]")
# Fences whose body is not code (rendered by the studio as figures / diagrams).
SPECIAL = {"figure", "diagram"}


def fences(markdown: str) -> list[tuple[int, str, list[str]]]:
    """(1-based line, info string, body lines) of every fenced block."""
    out: list[tuple[int, str, list[str]]] = []
    lines = markdown.split("\n")
    i = 0
    while i < len(lines):
        m = OPEN_RE.match(lines[i])
        if not m:
            i += 1
            continue
        fence = m.group("fence")
        close = re.compile(rf"^\s*(?:[-*+] |\d+\. )?\s*{re.escape(fence[0])}{{{len(fence)},}}\s*$")
        start, info, body = i + 1, m.group("info").strip(), []
        i += 1
        while i < len(lines) and not close.match(lines[i]):
            body.append(lines[i])
            i += 1
        out.append((start, info, body))
        i += 1
    return out


def is_ascii_art(body: list[str]) -> bool:
    """Two or more lines drawn with box/arrow glyphs."""
    return sum(1 for line in body if ART_RE.search(line)) >= 2


def check(markdown: str, where: str) -> list[str]:
    errors: list[str] = []
    for line, info, body in fences(markdown):
        lang = info.split()[0] if info else ""
        if lang in SPECIAL:
            continue
        if not lang:
            errors.append(f"{where}:{line}: code fence needs a language (```python, ```text, …)")
        if is_ascii_art(body):
            errors.append(f"{where}:{line}: ASCII diagram in a code fence — draw it as a ```figure")
    return errors
