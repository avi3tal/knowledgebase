import type { ReactNode } from "react";
import { Children, isValidElement, useContext } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { expandCallouts } from "../callouts";
import { RootContext } from "../context";
import { linkTarget } from "../links";
import { slugify, uniqueId } from "../toc";

const textOf = (n: ReactNode): string =>
  typeof n === "string" || typeof n === "number"
    ? String(n)
    : Array.isArray(n)
      ? n.map(textOf).join("")
      : isValidElement<{ children?: ReactNode }>(n)
        ? textOf(n.props.children)
        : "";

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
        rehypePlugins={[rehypeRaw]}
        components={{
          h2: heading("h2"),
          h3: heading("h3"),
          pre: ({ children }) => {
            const child = Children.toArray(children)[0];
            if (fence && isValidElement<{ className?: string; children?: ReactNode }>(child)) {
              const lang = /language-([\w-]+)/.exec(child.props.className ?? "")?.[1];
              const custom = lang ? fence(lang, textOf(child.props.children).trim()) : undefined;
              if (custom !== undefined) return <>{custom}</>;
            }
            return <pre>{children}</pre>;
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
        }}
      >
        {expandCallouts(text)}
      </ReactMarkdown>
    </div>
  );
}
