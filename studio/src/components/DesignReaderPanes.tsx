import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { ProblemRow } from "../api";
import { InlineError, Loader, MutedP } from "../theme/primitives";
import type { DesignView } from "../route";
import { designViewHref } from "../route";
import type { TocEntry } from "../toc";
import * as S from "./DesignReaderPanes.style";
import {
  STATUS_ICON,
  activeHeading,
  chipLabel,
  groupProblems,
  readingProgress,
  shortTitle,
  topicHref,
} from "../reader";

// ---------------------------------------------------------------- left pane

/** Every problem of the subject, filterable, grouped by difficulty; the current one highlighted. */
export function ProblemList({
  subject,
  slug,
  view,
  rows,
  error,
}: {
  subject: string;
  slug: string;
  view: DesignView;
  rows: ProblemRow[] | null;
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const groups = rows ? groupProblems(rows, query) : [];

  // Bring the current problem into view in a long list.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [rows]);

  return (
    <S.List ref={listRef}>
      <S.Filter
        type="search"
        value={query}
        placeholder="Filter problems…"
        aria-label="Filter problems"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setQuery("")}
      />
      {error && <InlineError>⚠ {error}</InlineError>}
      {!rows && !error && <Loader $small aria-label="loading" />}
      {rows && groups.length === 0 && <MutedP $small>No problem matches “{query}”.</MutedP>}
      {groups.map((g) => (
        <S.Group key={g.difficulty} $difficulty={g.difficulty}>
          <h4>
            <S.Dot />
            {g.difficulty}
            <S.Count>{g.rows.length === g.total ? g.total : `${g.rows.length}/${g.total}`}</S.Count>
          </h4>
          <ul>
            {g.rows.map((r, i) => (
              <S.Item key={r.slug} $i={i}>
                <S.Prob
                  $current={r.slug === slug}
                  href={designViewHref(subject, r.slug, view)}
                  aria-current={r.slug === slug ? "page" : undefined}
                  title={r.title}
                >
                  <S.ProbStatus $status={r.status} title={r.status}>
                    {STATUS_ICON[r.status]}
                  </S.ProbStatus>
                  <S.ProbTitle>{shortTitle(r.title)}</S.ProbTitle>
                  {r.attempts > 0 && <S.ProbCount>{r.attempts}</S.ProbCount>}
                </S.Prob>
              </S.Item>
            ))}
          </ul>
        </S.Group>
      ))}
    </S.List>
  );
}

// ---------------------------------------------------------------- right pane

export function Chips({
  ids,
  subject,
  names,
  kind,
}: {
  ids: string[];
  subject: string;
  names: Record<string, string>;
  kind: "topic" | "tech" | "pattern" | "covers";
}) {
  return (
    <S.ChipRow>
      {ids.map((id) => {
        const href = kind === "covers" ? null : topicHref(subject, id, names);
        const label = kind === "covers" ? id : chipLabel(id, names);
        return href ? (
          <S.Chip as="a" key={id} $kind={kind} href={href}>
            {label}
          </S.Chip>
        ) : (
          <S.Chip key={id} $kind={kind} $plain>
            {label}
          </S.Chip>
        );
      })}
    </S.ChipRow>
  );
}

/** Offset of `el` inside the scroller's content (not the viewport). */
function topIn(scroller: HTMLElement, el: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

/** Reading progress of the center pane plus a scroll-spied table of contents. */
export function OnThisPage({
  toc,
  scroller,
  children,
}: {
  toc: TocEntry[];
  scroller: HTMLElement | null;
  children?: ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!scroller) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      setProgress(readingProgress(scrollTop, scrollHeight, clientHeight));
      const tops = toc.map((t) => {
        const el = document.getElementById(t.id);
        return el ? topIn(scroller, el) : Infinity;
      });
      setActive(activeHeading(tops, scrollTop, 80, scrollTop + clientHeight >= scrollHeight - 4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    // Content grows after mount (solution, canvases): re-measure when it does.
    const ro = new ResizeObserver(onScroll);
    if (scroller.firstElementChild) ro.observe(scroller.firstElementChild);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scroller, toc]);

  // The app routes on the hash, so TOC entries scroll the center pane instead of linking.
  const go = (id: string, i: number) => {
    const el = document.getElementById(id);
    if (!scroller || !el) return;
    scroller.scrollTo({ top: Math.max(0, topIn(scroller, el) - 12) });
    setActive(i);
  };

  const pct = Math.round(progress * 100);
  return (
    <S.Otp>
      {toc.length > 0 && (
        <S.Progress aria-label={`${pct}% read`} title={`${pct}% read`}>
          <S.ProgressBar $progress={progress} />
        </S.Progress>
      )}
      {toc.length === 0 ? null : (
        <S.Toc>
          {toc.map((t, i) => (
            <S.TocItem key={t.id} $on={i === active}>
              <S.TocButton
                type="button"
                $level={t.level}
                $on={i === active}
                onClick={() => go(t.id, i)}
                title={t.text}
              >
                {t.text}
              </S.TocButton>
            </S.TocItem>
          ))}
        </S.Toc>
      )}
      {children}
    </S.Otp>
  );
}
