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
  SubjectsResponse,
  TopicPageData,
} from "./api";
import { api } from "./api";
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
import { RootContext, SubjectContext } from "./context";
import type { Route } from "./route";
import { parseRoute, problemHref, tabOf } from "./route";
import { TopBar } from "./components/TopBar";
import { isTyping } from "./components/PageHeader";
import { DesignConsole } from "./components/DesignConsole";
import { DesignProblemPage } from "./components/DesignProblemPage";

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
  // An explicit choice (stored) wins; otherwise follow the OS setting.
  const [chosen, setChosen] = useState<Theme | null>(() => {
    const v = localStorage.getItem("kb-theme");
    return v === "dark" || v === "light" ? v : null;
  });
  const [system, setSystem] = useState<Theme>(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const theme = chosen ?? system;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggle = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    localStorage.setItem("kb-theme", next);
    setChosen(next);
  }, [theme]);
  return [theme, toggle];
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
      return api.topic(route.subject, route.topic).then((data) => {
        if ("redirect_problem" in data) {
          // case studies are problems now: old topic links open the problem
          window.location.replace(problemHref(data.subject, data.redirect_problem));
          return new Promise<never>(() => {});
        }
        return { kind: "topic", data };
      });
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

  return (
    <RootContext.Provider value={subjects?.root ?? ""}>
      <SubjectContext.Provider
        value={{ subject: current ?? null, subjects: subjects?.subjects ?? [] }}
      >
        <TopBar
          subjects={subjects?.subjects ?? []}
          current={current}
          tab={tab}
          theme={theme}
          onTheme={toggleTheme}
          onSearch={() => setSearching(true)}
        />
        <main className="content bench" key={window.location.hash}>
          {error && <ErrorBox msg={error} route={route} />}
          {!error && !page && <div className="loader" aria-label="loading" />}
          {page?.kind === "home" && current && (
            <SubjectHome subject={current} feedback={page.data} />
          )}
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
              view={route.page === "design" ? route.view : "problem"}
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
              lessons={
                new Set((current?.topics ?? []).filter((t) => t.has_lesson).map((t) => t.id))
              }
            />
          )}
        </main>
        {searching && subjects && (
          <SearchPalette subjects={subjects.subjects} onClose={() => setSearching(false)} />
        )}
      </SubjectContext.Provider>
    </RootContext.Provider>
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
