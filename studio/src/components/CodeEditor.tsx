import type { KeyboardEvent } from "react";
import { useRef } from "react";
import { useHighlighted } from "../highlight";
import { Tokens } from "./CodeBlock";

/**
 * A textarea with live syntax highlighting: a highlighted <pre> underlay sits behind a textarea
 * with transparent text. Both share font metrics, padding and no-wrap, and scroll is mirrored.
 */
export function CodeEditor({
  value,
  onChange,
  lang,
  onKeyDown,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  label: string;
}) {
  const under = useRef<HTMLPreElement>(null);
  const tokens = useHighlighted(value, lang);
  const lines = value.split("\n");
  return (
    <div className="ce">
      <pre className="ce-under" ref={under} aria-hidden="true">
        <code>
          {lines.map((text, i) => (
            <span key={i} className="ce-line">
              <Tokens line={tokens?.[i]} text={text} />
            </span>
          ))}
        </code>
      </pre>
      <textarea
        className="ce-input"
        aria-label={label}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => {
          const u = under.current;
          if (!u) return;
          u.scrollTop = e.currentTarget.scrollTop;
          u.scrollLeft = e.currentTarget.scrollLeft;
        }}
      />
    </div>
  );
}
