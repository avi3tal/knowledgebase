import type { Focus, Session, SessionItem, SessionStatus } from "./api";
import { designHref } from "./route";

/** Pure presentation helpers for study sessions (tested in sessions.test.ts). */

export const STATUS_ORDER: SessionStatus[] = ["active", "planned", "done", "abandoned"];

export const STATUS_LABEL: Record<SessionStatus, string> = {
  active: "In progress",
  planned: "Ready to start",
  done: "Done",
  abandoned: "Abandoned",
};

export const FOCUS_INFO: Record<Focus, { label: string; icon: string; hint: string }> = {
  weak: {
    label: "Weak spots",
    icon: "🩹",
    hint: "failing attempts, complexity misses, old bugs first",
  },
  new: { label: "New ground", icon: "🧭", hint: "problems you have never tried" },
  review: {
    label: "Spaced review",
    icon: "🔁",
    hint: "re-solve what you solved, due topics first",
  },
  mixed: { label: "Balanced", icon: "⚖️", hint: "weak first, then due reviews, then new" },
};

/** Status transitions the user can trigger (mirrors kb/sessions.py TRANSITIONS). */
export function actionsFor(status: SessionStatus): { to: SessionStatus; label: string }[] {
  switch (status) {
    case "planned":
      return [
        { to: "active", label: "▶ Start session" },
        { to: "abandoned", label: "Abandon" },
      ];
    case "active":
      return [
        { to: "done", label: "✓ Mark done" },
        { to: "abandoned", label: "Abandon" },
      ];
    default:
      return [{ to: "active", label: "↻ Resume" }];
  }
}

export function groupByStatus(
  sessions: Session[],
): { status: SessionStatus; sessions: Session[] }[] {
  return STATUS_ORDER.map((status) => ({
    status,
    sessions: sessions.filter((s) => s.status === status),
  })).filter((g) => g.sessions.length > 0);
}

/** Colour band for a 0..100 score. */
export function scoreBand(score: number | null): "none" | "low" | "mid" | "high" {
  if (score === null) return "none";
  return score >= 85 ? "high" : score >= 60 ? "mid" : "low";
}

/** System-design / OOD items open in the design console instead of getting Python/Go attempts. */
export function isDesignItem(item: Pick<SessionItem, "kind">): boolean {
  return item.kind === "sd-problem" || item.kind === "ood-problem";
}

/** Console link for an item's latest attempt (null when it has none). */
export function latestConsoleHref(
  item: Pick<SessionItem, "subject" | "slug" | "attempts">,
): string | null {
  const last = item.attempts[item.attempts.length - 1];
  return last ? designHref(item.subject, item.slug, last) : null;
}

/** The attempt a "new attempt" call created: the first name not seen before (else the last). */
export function createdAttempt(before: string[], after: string[]): string | null {
  const seen = new Set(before);
  return after.find((a) => !seen.has(a)) ?? after[after.length - 1] ?? null;
}

export function runCommand(path: string, root: string): string {
  const rel = root && path.startsWith(root + "/") ? path.slice(root.length + 1) : path;
  return `./kb run ${rel}`;
}
