import type { ReactNode } from "react";
import { Children, isValidElement, useContext } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { expandCallouts } from "../callouts";
import { metaOf, parseMeta, rehypeCodeTabs, rehypeKeepMeta, type HastLike } from "../codeblock";
import { RootContext } from "../context";
import { linkTarget } from "../links";
import { slugify, uniqueId } from "../toc";
import { CodeBlock, CodeTabs, type CodeSpec } from "./CodeBlock";

const textOf = (n: ReactNode): string =>
  typeof n === "string" || typeof n === "number"
    ? String(n)
    : Array.isArray(n)
      ? n.map(textOf).join("")
      : isValidElement<{ children?: ReactNode }>(n)
        ? textOf(n.props.children)
        : "";

/** Code spec for a hast `<pre><code class="language-x">` node (meta lives in `code.data.meta`). */
const specOf = (pre: HastLike | undefined): CodeSpec | undefined => {
  const code = pre?.children?.find((c) => c.tagName === "code");
  if (!code) return undefined;
  const cls = code.properties?.className;
  const lang = (Array.isArray(cls) ? cls.map(String) : [])
    .map((c) => /^language-([\w-]+)$/.exec(c)?.[1])
    .find(Boolean);
  const text = (n: HastLike): string =>
    n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(text).join("");
  const m = parseMeta(metaOf(code));
  return {
    code: text(code).replace(/\n$/, ""),
    lang,
    title: m.title,
    highlight: m.highlight,
    lineNumbers: m.lineNumbers,
  };
};

/**
 * Content is authored in this repo (trusted), so raw HTML such as <details> spoilers is allowed.
 * `fence(lang, body)` may replace a fenced code block (e.g. ```diagram v2```) with a component;
 * `anchors` gives h2/h3 the ids that toc.ts extractToc computes.
 */
export function Markdown({
  text,
  path,
  fence,
  anchors = false,
}: {
  text: string;
  path: string;
  fence?: (lang: string, body: string) => ReactNode | undefined;
  anchors?: boolean;
}) {
  const root = useContext(RootContext);
  const seen = new Map<string, number>();
  const heading =
    (Tag: "h2" | "h3") =>
    ({ children }: { children?: ReactNode }) => {
      const id = anchors ? uniqueId(slugify(textOf(children)), seen) : undefined;
      return <Tag id={id}>{children}</Tag>;
    };
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeKeepMeta, rehypeRaw, rehypeCodeTabs]}
        components={
          {
            h2: heading("h2"),
            h3: heading("h3"),
            codetabs: ({ node }: { node?: HastLike }) => (
              <CodeTabs
                items={(node?.children ?? []).flatMap((p) => {
                  const s = specOf(p);
                  return s ? [s] : [];
                })}
              />
            ),
            pre: ({ children, node }) => {
              const child = Children.toArray(children)[0];
              if (fence && isValidElement<{ className?: string; children?: ReactNode }>(child)) {
                const lang = /language-([\w-]+)/.exec(child.props.className ?? "")?.[1];
                const custom = lang ? fence(lang, textOf(child.props.children).trim()) : undefined;
                if (custom !== undefined) return <>{custom}</>;
              }
              const spec = specOf(node as HastLike | undefined);
              return spec ? <CodeBlock {...spec} /> : <pre>{children}</pre>;
            },
            a: ({ href = "", children }) => {
              const t = linkTarget(path, href, root);
              if (t.kind === "external") {
                return (
                  <a href={t.href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                );
              }
              if (t.kind === "file") {
                return (
                  <a href={t.href} title={`Open ${t.path} in VS Code`}>
                    {children}
                  </a>
                );
              }
              return <a href={t.href}>{children}</a>;
            },
          } as Components
        }
      >
        {expandCallouts(text)}
      </ReactMarkdown>
    </div>
  );
}
