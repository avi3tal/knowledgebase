import type { ReactNode } from "react";
import { useEffect } from "react";
import { navKey } from "../reader";
import { Tinted, statusTone } from "../theme/primitives";
import * as S from "./PageHeader.style";
import { Icon } from "./Icon";

/**
 * The page chrome every Workbench page shares (styles in PageHeader.style.ts):
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
    <S.Root>
      {icon && <S.IconTile $color={accent}>{icon}</S.IconTile>}
      <S.Main>
        <S.Title>{title}</S.Title>
        {items.length > 0 && (
          <S.Meta>
            {items.map((m, i) => (
              <S.MetaItem key={i}>{m}</S.MetaItem>
            ))}
          </S.Meta>
        )}
        {sub && <S.Sub>{sub}</S.Sub>}
      </S.Main>
      {actions && <S.Actions>{actions}</S.Actions>}
    </S.Root>
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
    <S.Tags>
      {shown.map((t) =>
        t.href ? (
          <S.Tag as="a" key={t.key} href={t.href}>
            {t.label}
          </S.Tag>
        ) : (
          <S.Tag key={t.key}>{t.label}</S.Tag>
        ),
      )}
      {rest.length > 0 && <S.Tag title={rest.map((t) => t.key).join(", ")}>+{rest.length}</S.Tag>}
    </S.Tags>
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
    <Tinted $tone={statusTone(status)}>
      {status !== "untried" && <Icon name={icon} size={13} />}
      {STATUS_TEXT[status] ?? status}
    </Tinted>
  );
}

/** A topic group's name in the meta line, in the group's colour. */
export function MetaGroup({ color, children }: { color?: string; children: ReactNode }) {
  return <S.Group $color={color}>{children}</S.Group>;
}

/** The title's quieter suffix ("Problems · Two Pointers"). */
export function TitleSuffix({ children }: { children: ReactNode }) {
  return <S.TitleSub>{children}</S.TitleSub>;
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
    <S.PrevNext>
      {prev ? (
        <S.PrevNextLink href={prev.href} title={`Previous ${noun} ( [ )`}>
          <Icon name="arrowLeft" size={14} />
          <span>{prev.title}</span>
        </S.PrevNextLink>
      ) : (
        <span />
      )}
      {next ? (
        <S.PrevNextLink href={next.href} title={`Next ${noun} ( ] )`}>
          <span>{next.title}</span>
          <Icon name="arrowRight" size={14} />
        </S.PrevNextLink>
      ) : (
        <span />
      )}
    </S.PrevNext>
  );
}
