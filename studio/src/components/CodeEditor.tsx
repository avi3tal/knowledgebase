import type { KeyboardEvent } from "react";
import { useRef } from "react";
import { useHighlighted } from "../highlight";
import { Tokens } from "./CodeBlock";
import * as S from "./CodeEditor.style";

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
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  label: string;
  /** lets a parent size the editor with `styled(CodeEditor)` */
  className?: string;
}) {
  const under = useRef<HTMLPreElement>(null);
  const tokens = useHighlighted(value, lang);
  const lines = value.split("\n");
  return (
    <S.Editor className={className}>
      <S.Under ref={under} aria-hidden="true">
        <code>
          {lines.map((text, i) => (
            <S.Line key={i}>
              <Tokens line={tokens?.[i]} text={text} />
            </S.Line>
          ))}
        </code>
      </S.Under>
      <S.Input
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
    </S.Editor>
  );
}
