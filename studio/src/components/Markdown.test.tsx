import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { Markdown } from "./Markdown";

const render = (md: string) => renderToString(<Markdown text={md} path="x.md" />);

it("passes the fence meta through rehype-raw: title, highlighted lines, line numbers", () => {
  const h = render('```python title="a.py" {2} showLineNumbers\nx=1\ny=2\n```\n');
  expect(h).toContain("a.py");
  expect(h.match(/data-line=/g)).toHaveLength(2);
  expect(h.match(/data-highlighted="true"/g)).toHaveLength(1);
  expect(h.match(/data-line-number=/g)).toHaveLength(2);
});

it("turns consecutive fences sharing a group into tabs", () => {
  const h = render('```python group="g"\nx=1\n```\n\n```go group="g"\nx := 1\n```\n');
  expect(h.match(/role="tab"/g)).toHaveLength(2);
  expect(h.match(/<figure/g)).toHaveLength(1);
});

it("renders callouts as <Callout> with kind and heading, body still markdown", () => {
  const h = render("> [!TIP] Handy\n> use **this**\n");
  expect(h).toContain('data-callout="tip"');
  expect(h).toContain("Handy");
  expect(h).toContain("<strong>this</strong>");
  expect(h).not.toContain("kb-callout");
});

it("renders dialogue lines per speaker", () => {
  const h = render("> [!DIALOGUE]\n> **Candidate:** What scale?\n> **Interviewer:** 1M users\n");
  expect(h).toContain('data-speaker="candidate"');
  expect(h).toContain('data-speaker="interviewer"');
  expect(h).toContain("What scale?");
});
