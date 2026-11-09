import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { Markdown } from "./Markdown";

const render = (md: string) => renderToString(<Markdown text={md} path="x.md" />);

it("passes the fence meta through rehype-raw: title, highlighted lines, line numbers", () => {
  const h = render('```python title="a.py" {2} showLineNumbers\nx=1\ny=2\n```\n');
  expect(h).toContain("a.py");
  expect(h).toContain('class="cb-line hl"');
  expect(h).toContain("cb-ln");
});

it("turns consecutive fences sharing a group into tabs", () => {
  const h = render('```python group="g"\nx=1\n```\n\n```go group="g"\nx := 1\n```\n');
  expect(h.match(/cb-tab/g)?.length).toBeGreaterThanOrEqual(2);
  expect(h.match(/<figure/g)).toHaveLength(1);
});
