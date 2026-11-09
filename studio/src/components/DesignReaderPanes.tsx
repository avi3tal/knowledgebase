import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { ProblemRow } from "../api";
import type { DesignView } from "../route";
import { designViewHref } from "../route";
import type { TocEntry } from "../toc";
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
    listRef.current?.querySelector(".rd-prob.current")?.scrollIntoView({ block: "nearest" });
  }, [rows]);

  return (
    <div className="rd-list" ref={listRef}>
      <input
        className="rd-filter"
        type="search"
        value={query}
        placeholder="Filter problems…"
        aria-label="Filter problems"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setQuery("")}
      />
      {error && <div className="inline-error">⚠ {error}</div>}
      {!rows && !error && <div className="loader small-loader" aria-label="loading" />}
      {rows && groups.length === 0 && <p className="muted small">No problem matches “{query}”.</p>}
      {groups.map((g) => (
        <section key={g.difficulty} className={`rd-group ${g.difficulty}`}>
          <h4>
            <span className="rd-dot" />
            {g.difficulty}
            <span className="rd-count">
              {g.rows.length === g.total ? g.total : `${g.rows.length}/${g.total}`}
            </span>
          </h4>
          <ul>
            {g.rows.map((r, i) => (
              <li key={r.slug} style={{ ["--i" as string]: i }}>
                <a
                  className={`rd-prob ${r.slug === slug ? "current" : ""}`}
                  href={designViewHref(subject, r.slug, view)}
                  aria-current={r.slug === slug ? "page" : undefined}
                  title={r.title}
                >
                  <span className={`rd-status ${r.status}`} title={r.status}>
                    {STATUS_ICON[r.status]}
                  </span>
                  <span className="rd-prob-title">{shortTitle(r.title)}</span>
                  {r.attempts > 0 && <span className="rd-prob-n">{r.attempts}</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
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
    <div className="chips">
      {ids.map((id) => {
        const href = kind === "covers" ? null : topicHref(subject, id, names);
        const label = kind === "covers" ? id : chipLabel(id, names);
        return href ? (
          <a key={id} className={`rd-chip ${kind}`} href={href}>
            {label}
          </a>
        ) : (
          <span key={id} className={`rd-chip ${kind} plain`}>
            {label}
          </span>
        );
      })}
    </div>
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
    <div className="rd-otp">
      {toc.length > 0 && (
        <div className="rd-progress" aria-label={`${pct}% read`} title={`${pct}% read`}>
          <div className="rd-progress-bar" style={{ transform: `scaleX(${progress})` }} />
        </div>
      )}
      {toc.length === 0 ? null : (
        <ol className="rd-toc">
          {toc.map((t, i) => (
            <li key={t.id} className={`l${t.level} ${i === active ? "on" : ""}`}>
              <button type="button" onClick={() => go(t.id, i)} title={t.text}>
                {t.text}
              </button>
            </li>
          ))}
        </ol>
      )}
      {children}
    </div>
  );
}
