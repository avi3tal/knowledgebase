import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isPlainLang, langLabel } from "../codeblock";
import type { TokLine } from "../highlight";
import { useHighlighted } from "../highlight";

export interface CodeSpec {
  code: string;
  lang?: string;
  title?: string;
  highlight?: number[];
  lineNumbers?: boolean;
}

/** One line of tokens (or plain text before the highlighter is ready). */
export function Tokens({ line, text }: { line?: TokLine; text: string }) {
  if (!line) return <>{text || " "}</>;
  if (line.length === 0) return <> </>;
  return (
    <>
      {line.map((t, i) => (
        <span key={i} className="tok" style={t.style}>
          {t.content}
        </span>
      ))}
    </>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  }, [text]);
  return (
    <button
      type="button"
      className={`cb-copy ${copied ? "done" : ""}`}
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

/** Highlighted body: one block-level span per line, optional gutter and highlighted lines. */
export function CodeBody({ code, lang, highlight = [], lineNumbers = false }: CodeSpec) {
  const tokens = useHighlighted(code, lang);
  const lines = code.split("\n");
  const hl = new Set(highlight);
  return (
    <div className="cb-body">
      <pre className={`cb-pre ${lineNumbers ? "numbered" : ""}`} tabIndex={0}>
        <code className="cb-code">
          {lines.map((text, i) => (
            <span key={i} className={`cb-line ${hl.has(i + 1) ? "hl" : ""}`}>
              {lineNumbers && <span className="cb-ln">{i + 1}</span>}
              <Tokens line={tokens?.[i]} text={text} />
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export function CodeBlock({ code, lang, title, highlight, lineNumbers }: CodeSpec) {
  const plain = isPlainLang(lang);
  if (plain) {
    return (
      <figure className="cb cb-plain">
        {title && <figcaption className="cb-cap">{title}</figcaption>}
        <CodeBody code={code} lang={lang} highlight={highlight} lineNumbers={lineNumbers} />
        <div className="cb-float">
          <CopyButton text={code} />
        </div>
      </figure>
    );
  }
  return (
    <figure className="cb">
      <div className="cb-head">
        <span className="cb-title">{title ?? langLabel(lang)}</span>
        {title && <span className="cb-lang">{langLabel(lang)}</span>}
        <CopyButton text={code} />
      </div>
      <CodeBody code={code} lang={lang} highlight={highlight} lineNumbers={lineNumbers} />
    </figure>
  );
}

const TAB_KEY = "kb.codetab";
const TAB_EVENT = "kb-codetab";
const tabId = (s: CodeSpec) => langLabel(s.lang);

const readTab = (): string | null => {
  try {
    return localStorage.getItem(TAB_KEY);
  } catch {
    return null;
  }
};

/** Fences sharing `group="x"`: one block, tabs per language; the last choice is remembered. */
export function CodeTabs({ items }: { items: CodeSpec[] }): ReactNode {
  const [pref, setPref] = useState<string | null>(readTab);
  useEffect(() => {
    const on = () => setPref(readTab());
    window.addEventListener(TAB_EVENT, on);
    return () => window.removeEventListener(TAB_EVENT, on);
  }, []);
  const found = items.findIndex((s) => tabId(s) === pref);
  const [local, setLocal] = useState(0);
  const active = items[found >= 0 ? found : Math.min(local, items.length - 1)];
  if (!active) return null;
  const pick = (i: number) => {
    const it = items[i];
    if (!it) return;
    setLocal(i);
    try {
      localStorage.setItem(TAB_KEY, tabId(it));
    } catch {
      /* private mode: remembering is optional */
    }
    window.dispatchEvent(new Event(TAB_EVENT));
  };
  return (
    <figure className="cb">
      <div className="cb-head">
        <div className="cb-tabs" role="tablist">
          {items.map((s, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={s === active}
              className={`cb-tab ${s === active ? "on" : ""}`}
              onClick={() => pick(i)}
            >
              {s.title ?? langLabel(s.lang)}
            </button>
          ))}
        </div>
        <CopyButton text={active.code} />
      </div>
      <CodeBody
        key={items.indexOf(active)}
        code={active.code}
        lang={active.lang}
        highlight={active.highlight}
        lineNumbers={active.lineNumbers}
      />
    </figure>
  );
}
