import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * Shared building blocks for Workbench side panes (every page uses the Workbench layout).
 * - NavList: a filterable, grouped list of links for the left pane (topics, problems, lessons…).
 * - useCenterScroller: the `.wb-center` element (the scroller) for OnThisPage / scroll-spy.
 * For the right pane's table of contents use `OnThisPage` from ./DesignReaderPanes with toc.ts.
 * Styles reuse the reader's `rd-*` classes (reader.css).
 */

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  /** small trailing badge, e.g. attempts count or "3/5" */
  badge?: string | number;
  current?: boolean;
  /** extra text the filter also searches (tags, slug…) */
  hint?: string;
  /** dimmed (e.g. no lesson yet) */
  muted?: boolean;
}

export interface NavGroup {
  key: string;
  label: string;
  /** CSS colour for the group dot / current marker */
  color?: string;
  icon?: string;
  items: NavItem[];
}

/** Every word of the query must appear in the title or hint (case-insensitive). */
export function navMatches(item: Pick<NavItem, "title" | "hint" | "id">, query: string): boolean {
  const hay = `${item.title} ${item.hint ?? ""} ${item.id}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export function filterGroups(groups: NavGroup[], query: string): (NavGroup & { total: number })[] {
  return groups
    .map((g) => ({
      ...g,
      total: g.items.length,
      items: g.items.filter((i) => navMatches(i, query)),
    }))
    .filter((g) => g.items.length > 0);
}

export function NavList({
  groups,
  placeholder = "Filter…",
  emptyText = "Nothing here yet.",
}: {
  groups: NavGroup[];
  placeholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const shown = filterGroups(groups, query);

  useEffect(() => {
    listRef.current?.querySelector(".rd-prob.current")?.scrollIntoView({ block: "nearest" });
  }, [groups]);

  return (
    <div className="rd-list" ref={listRef}>
      <input
        className="rd-filter"
        type="search"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setQuery("")}
      />
      {groups.length === 0 && <p className="muted small">{emptyText}</p>}
      {groups.length > 0 && shown.length === 0 && (
        <p className="muted small">Nothing matches “{query}”.</p>
      )}
      {shown.map((g) => (
        <section
          key={g.key}
          className="rd-group"
          style={g.color ? { ["--c" as string]: g.color } : undefined}
        >
          <h4>
            <span className="rd-dot" />
            {g.icon && <span aria-hidden>{g.icon}</span>}
            {g.label}
            <span className="rd-count">
              {g.items.length === g.total ? g.total : `${g.items.length}/${g.total}`}
            </span>
          </h4>
          <ul>
            {g.items.map((it, i) => (
              <li key={it.id} style={{ ["--i" as string]: i }}>
                <a
                  className={`rd-prob ${it.current ? "current" : ""} ${it.muted ? "muted" : ""}`}
                  href={it.href}
                  aria-current={it.current ? "page" : undefined}
                  title={it.title}
                >
                  {it.icon && <span className="rd-status">{it.icon}</span>}
                  <span className="rd-prob-title">{it.title}</span>
                  {it.badge !== undefined && it.badge !== "" && (
                    <span className="rd-prob-n">{it.badge}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** The Workbench center scroller that contains `ref` (null until mounted). */
export function useCenterScroller(ref: RefObject<HTMLElement | null>): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setEl(ref.current?.closest<HTMLElement>(".wb-center") ?? null);
  }, [ref]);
  return el;
}
