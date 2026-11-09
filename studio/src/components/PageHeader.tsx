import type { ReactNode } from "react";
import { useEffect } from "react";
import { navKey } from "../reader";
import { Icon } from "./Icon";

/**
 * The page chrome every Workbench page shares (styles in workbench.css):
 *
 *   [icon] Title                                  [actions]
 *          meta · meta · meta · tag tag +2
 *   ── tabs (rendered by the Workbench, on the header's bottom edge) ──
 *
 * One title block instead of kicker / title / chips rows; the footer is a slim prev / next bar.
 */
export function PageHeader({
  icon,
  title,
  meta,
  actions,
  sub,
  accent,
}: {
  icon?: ReactNode;
  title: ReactNode;
  /** short items joined with "·" on one line (difficulty pill, status, time…) */
  meta?: ReactNode[];
  actions?: ReactNode;
  /** one optional sentence under the meta line (a topic's usage, a page description) */
  sub?: ReactNode;
  /** colour of the icon tile (a topic's group colour) */
  accent?: string;
}) {
  const items = (meta ?? []).filter((m) => m !== null && m !== undefined && m !== false);
  return (
    <div className="ph" style={accent ? { ["--c" as string]: accent } : undefined}>
      {icon && <div className="ph-icon">{icon}</div>}
      <div className="ph-main">
        <h1 className="ph-title">{title}</h1>
        {items.length > 0 && (
          <div className="ph-meta">
            {items.map((m, i) => (
              <span className="ph-meta-item" key={i}>
                {m}
              </span>
            ))}
          </div>
        )}
        {sub && <p className="ph-sub">{sub}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

/** Tags in a meta line: the first `max` as quiet chips, then "+n" (all names in its tooltip). */
export function MetaTags({
  tags,
  max = 3,
}: {
  tags: { key: string; label: ReactNode; href?: string }[];
  max?: number;
}) {
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);
  const rest = tags.slice(max);
  return (
    <span className="ph-tags">
      {shown.map((t) =>
        t.href ? (
          <a key={t.key} className="ph-tag" href={t.href}>
            {t.label}
          </a>
        ) : (
          <span key={t.key} className="ph-tag">
            {t.label}
          </span>
        ),
      )}
      {rest.length > 0 && (
        <span className="ph-tag more" title={rest.map((t) => t.key).join(", ")}>
          +{rest.length}
        </span>
      )}
    </span>
  );
}

const STATUS_TEXT: Record<string, string> = {
  solved: "Solved",
  done: "Done",
  failing: "Failing",
  started: "In progress",
  untried: "Not started",
  submitted: "Submitted",
};

/** A problem's status for the meta line: a coloured icon and a word. */
export function StatusLabel({ status }: { status: string }) {
  const icon =
    status === "solved" || status === "done" || status === "submitted"
      ? "check"
      : status === "failing"
        ? "x"
        : "clock";
  return (
    <span className={`status ${status}`}>
      {status !== "untried" && <Icon name={icon} size={13} />}
      {STATUS_TEXT[status] ?? status}
    </span>
  );
}

/** True when a key press is going into a text field (so global hotkeys must not steal it). */
export function isTyping(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement ||
    (t instanceof HTMLElement && t.isContentEditable)
  );
}

/** `[` / `]` go to the previous / next href (ignored while typing or with modifiers). */
export function usePrevNextKeys(prev: string | null, next: string | null) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const dir = navKey(e);
      const target = dir === "prev" ? prev : dir === "next" ? next : null;
      if (!target) return;
      e.preventDefault();
      window.location.hash = target.replace(/^#/, "");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);
}

/** Slim footer: ← previous title · next title → (keys [ and ]). */
export function PrevNextFooter({
  prev,
  next,
  noun,
}: {
  prev: { title: string; href: string } | null;
  next: { title: string; href: string } | null;
  noun: string;
}) {
  return (
    <div className="pn">
      {prev ? (
        <a className="pn-link prev" href={prev.href} title={`Previous ${noun} ( [ )`}>
          <Icon name="arrowLeft" size={14} />
          <span>{prev.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="pn-link next" href={next.href} title={`Next ${noun} ( ] )`}>
          <span>{next.title}</span>
          <Icon name="arrowRight" size={14} />
        </a>
      ) : (
        <span />
      )}
    </div>
  );
}
