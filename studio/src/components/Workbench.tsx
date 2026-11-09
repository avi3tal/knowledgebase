import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import * as S from "./Workbench.style";

/**
 * The layout every studio page uses:
 *
 *   header (PageHeader) with the tabs on its bottom edge
 *   left pane | center | right pane
 *   footer (slim prev / next)
 *
 * The page fills the viewport below the top bar; each pane scrolls on its own. Side panes collapse to
 * a thin rail (remembered per `id` + side in localStorage; `leftCollapsed` sets the first-visit
 * default) and become overlays on narrow screens.
 */
export interface Pane {
  title: string;
  /** unused: pane chrome draws its own icons (kept so call sites need not change) */
  icon?: string;
  content: ReactNode;
  /** px; default 280 (left) / 320 (right) */
  width?: number;
}

/** Selector of the Workbench center (the scroller), for `closest()` lookups. */
export const CENTER_SELECTOR = "[data-wb-center]";

const KEY = (id: string, side: string) => `kb.workbench.${id}.${side}`;

function useCollapsed(
  id: string,
  side: "left" | "right",
  initial = false,
): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY(id, side));
      return stored === null ? initial : stored === "1";
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY(id, side), v ? "1" : "0");
    } catch {
      // private mode: not remembered
    }
  }, [id, side, v]);
  return [v, setV];
}

const NARROW = "(max-width: 1100px)";

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.(NARROW).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.(NARROW);
    if (!mq) return;
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

function SidePane({
  side,
  pane,
  collapsed,
  setCollapsed,
}: {
  side: "left" | "right";
  pane: Pane;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  if (collapsed)
    return (
      <S.Rail
        $side={side}
        onClick={() => setCollapsed(false)}
        title={`Show ${pane.title}`}
        aria-label={`Show ${pane.title}`}
      >
        <Icon name={side === "left" ? "sidebar" : "sidebarRight"} size={16} />
        <S.RailTitle>{pane.title}</S.RailTitle>
      </S.Rail>
    );
  return (
    <S.Pane
      $side={side}
      $width={pane.width ?? (side === "left" ? 280 : 320)}
      aria-label={pane.title}
    >
      <S.PaneHead>
        <span>{pane.title}</span>
        <S.Collapse
          onClick={() => setCollapsed(true)}
          title={`Hide ${pane.title}`}
          aria-label={`Hide ${pane.title}`}
        >
          <Icon name={side === "left" ? "sidebar" : "sidebarRight"} size={15} />
        </S.Collapse>
      </S.PaneHead>
      <S.PaneBody>{pane.content}</S.PaneBody>
    </S.Pane>
  );
}

export function Workbench({
  id,
  header,
  tabs,
  left,
  right,
  footer,
  children,
  flush = false,
  leftCollapsed: leftInitial = false,
}: {
  /** remembers collapsed panes per page kind, e.g. "reader" / "console" */
  id: string;
  header?: ReactNode;
  tabs?: ReactNode;
  left?: Pane;
  right?: Pane;
  footer?: ReactNode;
  children: ReactNode;
  /** the center has no padding and doesn't scroll (graph / diagram canvases fill it) */
  flush?: boolean;
  /** start with the left pane folded to its rail (reading pages); a user's choice is remembered */
  leftCollapsed?: boolean;
}) {
  const [leftWide, setLeftWide] = useCollapsed(id, "left", leftInitial);
  const [rightWide, setRightWide] = useCollapsed(id, "right");
  // Narrow screens: panes float over the center, so they start closed (not remembered) and a click
  // in the center closes them again.
  const narrow = useNarrow();
  const [leftNarrow, setLeftNarrow] = useState(true);
  const [rightNarrow, setRightNarrow] = useState(true);
  const leftCollapsed = narrow ? leftNarrow : leftWide;
  const rightCollapsed = narrow ? rightNarrow : rightWide;
  const setLeftCollapsed = (v: boolean) => {
    if (narrow) {
      setLeftNarrow(v);
      if (!v) setRightNarrow(true);
    } else setLeftWide(v);
  };
  const setRightCollapsed = (v: boolean) => {
    if (narrow) {
      setRightNarrow(v);
      if (!v) setLeftNarrow(true);
    } else setRightWide(v);
  };
  // Fill the viewport below wherever the bench starts (app bar, tabs, crumbs).
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(110);
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (el) setTop(Math.max(0, el.getBoundingClientRect().top + window.scrollY));
    };
    measure();
    // Content above the bench (crumbs, app bar) can change height after mount: re-measure then too.
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    const parent = ref.current?.parentElement;
    if (ro && parent)
      for (const el of [document.body, parent, ...Array.from(parent.children)]) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return (
    <S.Root ref={ref} $top={top}>
      {(header || tabs) && (
        <S.Header $tabs={!!tabs}>
          {header}
          {tabs && <S.Tabs>{tabs}</S.Tabs>}
        </S.Header>
      )}
      <S.Body>
        {left && (
          <SidePane
            side="left"
            pane={left}
            collapsed={leftCollapsed}
            setCollapsed={setLeftCollapsed}
          />
        )}
        <S.Center
          data-wb-center=""
          $flush={flush}
          onPointerDown={() => {
            if (narrow) {
              setLeftNarrow(true);
              setRightNarrow(true);
            }
          }}
        >
          {children}
        </S.Center>
        {right && (
          <SidePane
            side="right"
            pane={right}
            collapsed={rightCollapsed}
            setCollapsed={setRightCollapsed}
          />
        )}
      </S.Body>
      {footer && <S.Footer>{footer}</S.Footer>}
    </S.Root>
  );
}

/**
 * A tab on the Workbench header's bottom edge: a link (`href`) or a button (`onClick`), with an
 * optional count badge (`done` turns it green) and underline colour.
 */
export function WorkbenchTab({
  on,
  href,
  onClick,
  color,
  badge,
  done = false,
  title,
  children,
}: {
  on: boolean;
  href?: string;
  onClick?: () => void;
  color?: string;
  badge?: ReactNode;
  done?: boolean;
  title?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      {children}
      {badge !== undefined && badge !== null && <S.TabBadge $done={done}>{badge}</S.TabBadge>}
    </>
  );
  return href ? (
    <S.Tab
      as="a"
      href={href}
      $on={on}
      $color={color}
      title={title}
      aria-current={on ? "page" : undefined}
    >
      {content}
    </S.Tab>
  ) : (
    <S.Tab type="button" onClick={onClick} $on={on} $color={color} title={title} aria-pressed={on}>
      {content}
    </S.Tab>
  );
}
