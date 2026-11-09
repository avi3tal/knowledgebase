import { t } from "../theme/theme";
import * as S from "./panes.style";
import { CENTER_SELECTOR } from "./Workbench";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * Shared building blocks for Workbench side panes (every page uses the Workbench layout).
 * - NavList: a filterable, grouped list of links for the left pane (topics, problems, lessons…).
 * - useCenterScroller: the Workbench center element (the scroller) for OnThisPage / scroll-spy.
 * For the right pane's table of contents use `OnThisPage` from ./DesignReaderPanes with toc.ts.
 * Styles: panes.style.ts.
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
  /** shown but not a link (e.g. a planned topic with nothing to show yet) */
  disabled?: boolean;
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
    listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [groups]);

  return (
    <S.List ref={listRef}>
      <S.Filter
        type="search"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setQuery("")}
      />
      {groups.length === 0 && <S.Empty>{emptyText}</S.Empty>}
      {groups.length > 0 && shown.length === 0 && <S.Empty>Nothing matches “{query}”.</S.Empty>}
      {shown.map((g) => {
        const color = g.color ?? t.easy;
        return (
          <S.Group key={g.key} $color={color}>
            <h4>
              <S.Dot $color={color} />
              {g.icon && <span aria-hidden>{g.icon}</span>}
              {g.label}
              <S.Count $color={color}>
                {g.items.length === g.total ? g.total : `${g.items.length}/${g.total}`}
              </S.Count>
            </h4>
            <ul>
              {g.items.map((it, i) => (
                <S.Item key={it.id} $i={i}>
                  <S.Link
                    $color={color}
                    $current={!!it.current}
                    $muted={!!it.muted}
                    $disabled={!!it.disabled}
                    href={it.disabled ? undefined : it.href}
                    aria-disabled={it.disabled || undefined}
                    aria-current={it.current ? "page" : undefined}
                    title={it.title}
                  >
                    {it.icon && <S.Status>{it.icon}</S.Status>}
                    <S.Title>{it.title}</S.Title>
                    {it.badge !== undefined && it.badge !== "" && <S.Badge>{it.badge}</S.Badge>}
                  </S.Link>
                </S.Item>
              ))}
            </ul>
          </S.Group>
        );
      })}
    </S.List>
  );
}

/** The Workbench center scroller that contains `ref` (null until mounted). */
export function useCenterScroller(ref: RefObject<HTMLElement | null>): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setEl(ref.current?.closest<HTMLElement>(CENTER_SELECTOR) ?? null);
  }, [ref]);
  return el;
}
