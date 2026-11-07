import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * The shared page layout of the design reader and the design console:
 *
 *   header
 *   tabs
 *   left pane | center | right pane
 *   footer
 *
 * The page fills the viewport below the app bar; each pane scrolls on its own. Side panes collapse to
 * a thin rail (remembered per `id` + side in localStorage) and become overlays on narrow screens.
 */
export interface Pane {
  title: string;
  icon?: string;
  content: ReactNode;
  /** px; default 280 (left) / 320 (right) */
  width?: number;
}

const KEY = (id: string, side: string) => `kb.workbench.${id}.${side}`;

function useCollapsed(id: string, side: "left" | "right"): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => {
    try {
      return localStorage.getItem(KEY(id, side)) === "1";
    } catch {
      return false;
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
      <button
        className={`wb-rail wb-rail-${side}`}
        onClick={() => setCollapsed(false)}
        title={`Show ${pane.title}`}
        aria-label={`Show ${pane.title}`}
      >
        <span className="wb-rail-icon">{pane.icon ?? (side === "left" ? "»" : "«")}</span>
        <span className="wb-rail-title">{pane.title}</span>
      </button>
    );
  return (
    <aside
      className={`wb-pane wb-${side}`}
      style={{ ["--w" as string]: `${pane.width ?? (side === "left" ? 280 : 320)}px` }}
      aria-label={pane.title}
    >
      <div className="wb-pane-head">
        <span className="wb-pane-title">
          {pane.icon && <span className="wb-pane-icon">{pane.icon}</span>}
          {pane.title}
        </span>
        <button
          className="wb-collapse"
          onClick={() => setCollapsed(true)}
          title={`Hide ${pane.title}`}
          aria-label={`Hide ${pane.title}`}
        >
          {side === "left" ? "«" : "»"}
        </button>
      </div>
      <div className="wb-pane-body">{pane.content}</div>
    </aside>
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
  centerClass = "",
}: {
  /** remembers collapsed panes per page kind, e.g. "reader" / "console" */
  id: string;
  header?: ReactNode;
  tabs?: ReactNode;
  left?: Pane;
  right?: Pane;
  footer?: ReactNode;
  children: ReactNode;
  centerClass?: string;
}) {
  const [leftWide, setLeftWide] = useCollapsed(id, "left");
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
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return (
    <div className="workbench" ref={ref} style={{ ["--wb-top" as string]: `${top}px` }}>
      {header && <header className="wb-header">{header}</header>}
      {tabs && <nav className="wb-tabs">{tabs}</nav>}
      <div className="wb-body">
        {left && (
          <SidePane
            side="left"
            pane={left}
            collapsed={leftCollapsed}
            setCollapsed={setLeftCollapsed}
          />
        )}
        <main
          className={`wb-center ${centerClass}`}
          onPointerDown={() => {
            if (narrow) {
              setLeftNarrow(true);
              setRightNarrow(true);
            }
          }}
        >
          {children}
        </main>
        {right && (
          <SidePane
            side="right"
            pane={right}
            collapsed={rightCollapsed}
            setCollapsed={setRightCollapsed}
          />
        )}
      </div>
      {footer && <footer className="wb-footer">{footer}</footer>}
    </div>
  );
}
