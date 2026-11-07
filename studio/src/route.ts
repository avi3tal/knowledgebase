export type Route =
  | { page: "home"; subject: string }
  | { page: "dashboard"; subject: string }
  | { page: "lesson"; subject: string; topic: string }
  | { page: "problem"; subject: string; slug: string }
  | { page: "problems"; subject: string }
  | { page: "topic"; subject: string; topic: string }
  | { page: "map"; subject: string }
  | { page: "sessions"; subject: string }
  | { page: "session"; subject: string; id: string }
  | { page: "design"; subject: string; slug: string; view: DesignView }
  | { page: "console"; subject: string; slug: string; attempt: string };

/** Tabs of the design reader: the prompt, the worked solution (Read mode) and your attempts. */
export type DesignView = "problem" | "solution" | "attempts";
const DESIGN_VIEWS: DesignView[] = ["problem", "solution", "attempts"];

/** The subject's sub-tabs; every page belongs to exactly one. */
export type Tab = "learn" | "problems" | "map" | "progress" | "sessions";

const ID = /^[a-z0-9-]+$/;
/** Attempt dirs look like 2026-11-07_design_practice-2: no dots, so ".." can't get through. */
const ATTEMPT = /^[A-Za-z0-9_-]+$/;

/** Subjects whose problems open in the design console rather than the code problem page. */
export const DESIGN_SUBJECTS = new Set(["system-design", "ood"]);

export function designHref(subject: string, slug: string, attempt?: string): string {
  return `#/design/${subject}/${slug}${attempt ? `/${attempt}` : ""}`;
}

/** Reader tab of a design problem ("problem" is the bare problem URL). */
export function designViewHref(subject: string, slug: string, view: DesignView): string {
  return view === "problem" ? designHref(subject, slug) : `#/design/${subject}/${slug}/${view}`;
}

/** Where a problem row links: the design page for design subjects, else the problem card. */
export function problemHref(subject: string, slug: string): string {
  return DESIGN_SUBJECTS.has(subject) ? designHref(subject, slug) : `#/problem/${subject}/${slug}`;
}

export function parseRoute(hash: string): Route {
  const [kind = "", subject = "algo", id = "", attempt = ""] = hash.replace(/^#\/?/, "").split("/");
  const s = ID.test(subject) ? subject : "algo";
  if (kind === "design" && ID.test(subject) && ID.test(id)) {
    if (!attempt) return { page: "design", subject, slug: id, view: "problem" };
    if ((DESIGN_VIEWS as string[]).includes(attempt))
      return { page: "design", subject, slug: id, view: attempt as DesignView };
    if (ATTEMPT.test(attempt)) return { page: "console", subject, slug: id, attempt };
    return { page: "home", subject };
  }
  if (kind === "learn" && ID.test(subject) && ID.test(id))
    return { page: "lesson", subject, topic: id };
  if (kind === "learn" || kind === "home") return { page: "home", subject: s };
  if (kind === "problem" && ID.test(subject) && ID.test(id))
    return { page: "problem", subject, slug: id };
  if (kind === "problems" && ID.test(subject)) return { page: "problems", subject };
  if (kind === "topic" && ID.test(subject) && ID.test(id))
    return { page: "topic", subject, topic: id };
  if (kind === "map" && ID.test(subject)) return { page: "map", subject };
  if (kind === "progress") return { page: "dashboard", subject: s };
  if (kind === "sessions") return { page: "sessions", subject: "algo" };
  if (kind === "session" && ID.test(subject))
    return { page: "session", subject: "algo", id: subject };
  return { page: "home", subject: "algo" };
}

export function tabOf(route: Route): Tab {
  switch (route.page) {
    case "problems":
    case "problem":
    case "design":
    case "console":
      return "problems";
    case "map":
      return "map";
    case "dashboard":
      return "progress";
    case "sessions":
    case "session":
      return "sessions";
    default:
      return "learn";
  }
}

export const TAB_HREF: Record<Tab, (subject: string) => string> = {
  learn: (s) => `#/home/${s}`,
  problems: (s) => `#/problems/${s}`,
  map: (s) => `#/map/${s}`,
  progress: (s) => `#/progress/${s}`,
  sessions: () => "#/sessions",
};
