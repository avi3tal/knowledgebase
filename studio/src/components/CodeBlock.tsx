import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isPlainLang, langLabel } from "../codeblock";
import type { TokLine } from "../highlight";
import { useHighlighted } from "../highlight";
import * as S from "./CodeBlock.style";

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
        <S.Tok key={i} $vars={t.style}>
          {t.content}
        </S.Tok>
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
    <S.CopyBtn
      type="button"
      $done={copied}
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? "Copied ✓" : "Copy"}
    </S.CopyBtn>
  );
}

/** Highlighted body: one block-level span per line, optional gutter and highlighted lines. */
export function CodeBody({
  code,
  lang,
  highlight = [],
  lineNumbers = false,
  plain = false,
}: CodeSpec & { plain?: boolean }) {
  const tokens = useHighlighted(code, lang);
  const lines = code.split("\n");
  const hl = new Set(highlight);
  return (
    <S.Body>
      <S.Pre $plain={plain} tabIndex={0}>
        <S.Code>
          {lines.map((text, i) => (
            <S.Line
              key={i}
              $hl={hl.has(i + 1)}
              data-line={i + 1}
              data-highlighted={hl.has(i + 1) || undefined}
            >
              {lineNumbers && <S.LineNo data-line-number={i + 1}>{i + 1}</S.LineNo>}
              <Tokens line={tokens?.[i]} text={text} />
            </S.Line>
          ))}
        </S.Code>
      </S.Pre>
    </S.Body>
  );
}

export function CodeBlock({ code, lang, title, highlight, lineNumbers }: CodeSpec) {
  const plain = isPlainLang(lang);
  if (plain) {
    return (
      <S.Figure $plain>
        {title && <S.Caption>{title}</S.Caption>}
        <CodeBody code={code} lang={lang} highlight={highlight} lineNumbers={lineNumbers} plain />
        <S.Float>
          <CopyButton text={code} />
        </S.Float>
      </S.Figure>
    );
  }
  return (
    <S.Figure>
      <S.Head>
        <S.Title>{title ?? langLabel(lang)}</S.Title>
        {title && <S.Lang>{langLabel(lang)}</S.Lang>}
        <CopyButton text={code} />
      </S.Head>
      <CodeBody code={code} lang={lang} highlight={highlight} lineNumbers={lineNumbers} />
    </S.Figure>
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
    <S.Figure>
      <S.Head>
        <S.Tabs role="tablist">
          {items.map((s, i) => (
            <S.Tab
              key={i}
              type="button"
              role="tab"
              aria-selected={s === active}
              $on={s === active}
              onClick={() => pick(i)}
            >
              {s.title ?? langLabel(s.lang)}
            </S.Tab>
          ))}
        </S.Tabs>
        <CopyButton text={active.code} />
      </S.Head>
      <CodeBody
        key={items.indexOf(active)}
        code={active.code}
        lang={active.lang}
        highlight={active.highlight}
        lineNumbers={active.lineNumbers}
      />
    </S.Figure>
  );
}
