import { useCallback, useEffect, useState } from "react";
import type {
  DesignAttempt,
  DesignProblemData,
  Feedback,
  Graph,
  Lesson,
  ProblemCardData,
  ProblemRow,
  Session,
  Subject,
  SubjectsResponse,
  TopicPageData,
} from "./api";
import { api } from "./api";
import { SUBJECT_ICON, SUBJECT_SHORT, topicIcon } from "./catalog";
import { Dashboard } from "./components/Dashboard";
import { LessonView } from "./components/LessonView";
import { ProblemCard } from "./components/ProblemCard";
import { ProblemsPage } from "./components/ProblemsPage";
import { SearchPalette } from "./components/SearchPalette";
import { SessionView } from "./components/SessionView";
import { SessionsPage } from "./components/SessionsPage";
import { SubjectHome } from "./components/SubjectHome";
import { SubjectMap } from "./components/SubjectMap";
import { TopicPage } from "./components/TopicPage";
import { RootContext } from "./context";
import type { Route, Tab } from "./route";
import { TAB_HREF, designHref, parseRoute, tabOf } from "./route";
import { DesignConsole } from "./components/DesignConsole";
import { DesignProblemPage } from "./components/DesignProblemPage";

/** True when a key press is going into a text field (so global hotkeys must not steal it). */
function isTyping(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement ||
    (t instanceof HTMLElement && t.isContentEditable)
  );
}

type Page =
  | { kind: "home"; data: Feedback | null }
  | { kind: "lesson"; data: Lesson }
  | { kind: "problem"; data: ProblemCardData }
  | { kind: "problems"; data: ProblemRow[] }
  | { kind: "topic"; data: TopicPageData }
  | { kind: "map"; data: Graph }
  | { kind: "dashboard"; data: Feedback }
  | { kind: "sessions"; data: Session[] }
  | { kind: "session"; data: Session }
  | { kind: "design"; data: DesignProblemData }
  | { kind: "console"; data: { problem: DesignProblemData; attempt: DesignAttempt } };

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

type Theme = "light" | "dark";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("kb-theme") === "dark" ? "dark" : "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kb-theme", theme);
  }, [theme]);
  return [theme, useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), [])];
}

function load(route: Route): Promise<Page> {
  switch (route.page) {
    case "home":
      return api.feedback(route.subject).then(
        (data) => ({ kind: "home", data }),
        () => ({ kind: "home", data: null }),
      );
    case "lesson":
      return api.lesson(route.subject, route.topic).then((data) => ({ kind: "lesson", data }));
    case "problem":
      return api.problem(route.subject, route.slug).then((data) => ({ kind: "problem", data }));
    case "problems":
      return api.problems(route.subject).then((data) => ({ kind: "problems", data }));
    case "topic":
      return api.topic(route.subject, route.topic).then((data) => ({ kind: "topic", data }));
    case "map":
      return api.graph(route.subject).then((data) => ({ kind: "map", data }));
    case "sessions":
      return api.sessions().then((data) => ({ kind: "sessions", data }));
    case "design":
      return api.design(route.subject, route.slug).then((data) => ({ kind: "design", data }));
    case "console":
      return Promise.all([
        api.design(route.subject, route.slug),
        api.designAttempt(route.subject, route.slug, route.attempt),
      ]).then(([problem, attempt]) => ({ kind: "console", data: { problem, attempt } }));
    case "session":
      return api.session(route.id).then((data) => ({ kind: "session", data }));
    default:
      return api.feedback(route.subject).then((data) => ({ kind: "dashboard", data }));
  }
}

const TABS: { tab: Tab; label: string; icon: string; open?: boolean }[] = [
  { tab: "learn", label: "Learn", icon: "📖" },
  { tab: "problems", label: "Problems", icon: "🧪", open: true },
  { tab: "map", label: "Knowledge map", icon: "🗺️" },
  { tab: "progress", label: "Progress", icon: "📈", open: true },
];

export function App() {
  const route = useRoute();
  const [theme, toggleTheme] = useTheme();
  const [subjects, setSubjects] = useState<SubjectsResponse | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.subjects().then(setSubjects, (e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    setPage(null);
    setError(null);
    load(route).then(setPage, (e: unknown) => setError(String(e)));
    window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearching((s) => !s);
      } else if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = subjects?.subjects.find((s) => s.id === route.subject);
  const tab = tabOf(route);
  const locked = current?.status === "locked";

  return (
    <RootContext.Provider value={subjects?.root ?? ""}>
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark">kb</span> studio
        </a>
        <nav className="subject-tabs">
          {subjects?.subjects.map((s) => (
            <a
              key={s.id}
              href={TAB_HREF.learn(s.id)}
              className={`subject-tab ${s.id === route.subject && tab !== "sessions" ? "on" : ""} ${s.status === "locked" ? "locked" : ""}`}
              title={s.status === "locked" ? "Lessons coming — map and resources ready" : s.title}
            >
              <span>{SUBJECT_ICON[s.id] ?? "📘"}</span> {SUBJECT_SHORT[s.id] ?? s.title}
              {s.status === "locked" && <span className="lock">🔒</span>}
            </a>
          ))}
        </nav>
        <span className="grow" />
        <a href="#/sessions" className={`sessions-link ${tab === "sessions" ? "on" : ""}`}>
          🎯 Sessions
        </a>
        <button className="search-trigger" onClick={() => setSearching(true)}>
          🔍 Search <kbd>⌘K</kbd>
        </button>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </header>
      <nav className={`subtabs ${tab === "sessions" ? "hidden" : ""}`}>
        {TABS.filter((t) => !(locked && t.open)).map((t) => (
          <a
            key={t.tab}
            href={TAB_HREF[t.tab](route.subject)}
            className={`subtab ${t.tab === tab ? "on" : ""}`}
          >
            {t.icon} {t.label}
          </a>
        ))}
      </nav>
      <main
        className={`content ${route.page === "console" ? "wide" : ""}`}
        key={window.location.hash}
      >
        {current && <Crumbs route={route} subject={current} page={page} />}
        {error && <ErrorBox msg={error} route={route} />}
        {!error && !page && <div className="loader" aria-label="loading" />}
        {page?.kind === "home" && current && <SubjectHome subject={current} feedback={page.data} />}
        {page?.kind === "dashboard" && (
          <Dashboard data={page.data} topics={current?.topics ?? []} />
        )}
        {page?.kind === "sessions" && subjects && (
          <SessionsPage sessions={page.data} subjects={subjects.subjects} />
        )}
        {page?.kind === "session" && <SessionView key={page.data.id} initial={page.data} />}
        {page?.kind === "lesson" && <LessonView lesson={page.data} />}
        {page?.kind === "problem" && <ProblemCard p={page.data} open />}
        {page?.kind === "design" && (
          <DesignProblemPage
            p={page.data}
            names={Object.fromEntries((current?.topics ?? []).map((t) => [t.id, t.name]))}
          />
        )}
        {page?.kind === "console" && (
          <DesignConsole
            key={page.data.attempt.name}
            problem={page.data.problem}
            initial={page.data.attempt}
          />
        )}
        {page?.kind === "topic" && <TopicPage data={page.data} />}
        {page?.kind === "map" && current && <SubjectMap subject={current} graph={page.data} />}
        {page?.kind === "problems" && (
          <ProblemsPage
            subject={route.subject}
            rows={page.data}
            names={Object.fromEntries((current?.topics ?? []).map((t) => [t.id, t.name]))}
            lessons={new Set((current?.topics ?? []).filter((t) => t.has_lesson).map((t) => t.id))}
          />
        )}
      </main>
      {searching && subjects && (
        <SearchPalette subjects={subjects.subjects} onClose={() => setSearching(false)} />
      )}
    </RootContext.Provider>
  );
}

/** Breadcrumbs for detail pages (lesson, topic, problem) back to the subject's grid. */
function Crumbs({ route, subject, page }: { route: Route; subject: Subject; page: Page | null }) {
  let leaf: string | null = null;
  if (route.page === "lesson" || route.page === "topic") {
    const t = subject.topics.find((x) => x.id === route.topic);
    leaf = t ? `${topicIcon(t)} ${t.name}` : route.topic;
  } else if (route.page === "problem") {
    leaf = page?.kind === "problem" ? page.data.title : route.slug;
  } else if (route.page === "design") {
    leaf = page?.kind === "design" ? page.data.title : route.slug;
  } else if (route.page === "console") {
    return (
      <div className="crumbs">
        <a href={`#/problems/${subject.id}`}>Problems</a> <span>›</span>
        <a href={designHref(subject.id, route.slug)}>
          {page?.kind === "console" ? page.data.problem.title : route.slug}
        </a>{" "}
        <span>›</span> <b>{route.attempt}</b>
      </div>
    );
  }
  if (!leaf) return null;
  const parent =
    route.page === "problem" || route.page === "design"
      ? ["problems", "Problems"]
      : ["home", "Learn"];
  return (
    <div className="crumbs">
      <a href={`#/${parent[0]}/${subject.id}`}>{parent[1]}</a> <span>›</span> <b>{leaf}</b>
    </div>
  );
}
function ErrorBox({ msg, route }: { msg: string; route: Route }) {
  const missingLesson = route.page === "lesson" && msg.includes("404");
  return (
    <div className="callout">
      {missingLesson ? (
        <>
          No lesson for <b>{route.page === "lesson" ? route.topic : ""}</b> yet —{" "}
          <a href={`#/topic/${route.subject}/${route.page === "lesson" ? route.topic : ""}`}>
            see the topic page
          </a>
          , or run{" "}
          <code>
            /learn {route.subject} {route.page === "lesson" ? route.topic : ""}
          </code>{" "}
          in Claude Code.
        </>
      ) : (
        <>
          {msg} — is <code>./kb studio</code> running?
        </>
      )}
    </div>
  );
}
