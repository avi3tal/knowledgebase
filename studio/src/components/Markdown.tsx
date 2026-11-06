import { useContext } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { RootContext } from "../context";
import { linkTarget } from "../links";

// Content is authored in this repo (trusted), so raw HTML such as <details> spoilers is allowed.
export function Markdown({ text, path }: { text: string; path: string }) {
  const root = useContext(RootContext);
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
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
        {text}
      </ReactMarkdown>
    </div>
  );
}
