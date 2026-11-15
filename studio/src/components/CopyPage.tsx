import { useEffect, useRef, useState } from "react";
import type { PageKind } from "../api";
import { api, markdownUrl } from "../api";
import { copyText } from "../clipboard";
import { Icon } from "./Icon";
import * as S from "./CopyPage.style";

type CopyState = "idle" | "copying" | "copied" | "failed";

const LABEL: Record<CopyState, string> = {
  idle: "Copy page",
  copying: "Copying…",
  copied: "Copied",
  failed: "Copy failed",
};

/**
 * "Copy page": puts the page's markdown twin (kb/pagemd.py: prose, code, diagrams as Mermaid) on
 * the clipboard for an LLM agent, fetched on click. ".md" opens the raw markdown URL.
 */
export function CopyPage({
  kind,
  subject,
  slug,
}: {
  kind: PageKind;
  subject: string;
  slug: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const settle = (next: CopyState) => {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1500);
  };
  const copy = () => {
    setState("copying");
    copyText(api.markdown(kind, subject, slug)).then(
      () => settle("copied"),
      () => settle("failed"),
    );
  };

  return (
    <S.Group>
      <S.CopyButton
        $variant="ghost"
        $size="sm"
        $tone={state === "copied" ? "ok" : state === "failed" ? "bad" : undefined}
        onClick={copy}
        disabled={state === "copying"}
        title="Copy this page as Markdown for an LLM (diagrams as Mermaid)"
      >
        <Icon name={state === "copied" ? "check" : "copy"} size={14} /> {LABEL[state]}
      </S.CopyButton>
      <S.RawLink
        href={markdownUrl(kind, subject, slug)}
        target="_blank"
        rel="noreferrer"
        title="Open this page as raw Markdown"
      >
        .md
      </S.RawLink>
    </S.Group>
  );
}
