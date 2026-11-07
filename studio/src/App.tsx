import { useEffect, useState } from "react";
import type {
  Feedback,
  Graph,
  Lesson,
  ProblemCardData,
  ProblemRow,
  Subject,
  SubjectsResponse,
  TopicPageData,
} from "./api";
import { api } from "./api";
import { Dashboard } from "./components/Dashboard";
import { LessonView } from "./components/LessonView";
import { ProblemCard } from "./components/ProblemCard";
import { ProblemsPage } from "./components/ProblemsPage";
import { SubjectMap } from "./components/SubjectMap";
import { TopicPage } from "./components/TopicPage";
import { RootContext } from "./context";
import type { Route } from "./route";
import { parseRoute } from "./route";

type Page =
  | { kind: "lesson"; data: Lesson }
  | { kind: "problem"; data: ProblemCardData }
  | { kind: "problems"; data: ProblemRow[] }
  | { kind: "topic"; data: TopicPageData }
  | { kind: "map"; data: Graph }
  | { kind: "dashboard"; data: Feedback };

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

function load(route: Route): Promise<Page> {
  switch (route.page) {
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
    default:
      return api.feedback(route.subject).then((data) => ({ kind: "dashboard", data }));
  }
}

const byOrder = (a: Subject["topics"][number], b: Subject["topics"][number]) =>
  a.kind === b.kind ? (a.order ?? 99) - (b.order ?? 99) : a.kind === "pattern" ? -1 : 1;

export function App() {
  const route = useRoute();
  const [subjects, setSubjects] = useState<SubjectsResponse | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.subjects().then(setSubjects, (e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    setPage(null);
    setError(null);
    load(route).then(setPage, (e: unknown) => setError(String(e)));
    window.scrollTo(0, 0);
  }, [route]);

  const current = subjects?.subjects.find((s) => s.id === route.subject);
  const activeTopic = route.page === "lesson" || route.page === "topic" ? route.topic : null;

  return (
    <RootContext.Provider value={subjects?.root ?? ""}>
      <div className="layout">
        <nav className="sidebar">
          <a className="brand" href="#/">
            kb studio
          </a>
          {subjects?.subjects
            .filter((s) => s.status !== "locked")
            .map((s) => (
              <div key={s.id}>
                <div className="subject">{s.title}</div>
                <a href="#/" className={`topic ${route.page === "dashboard" ? "active" : ""}`}>
                  📊 Progress
                </a>
                <a
                  href={`#/problems/${s.id}`}
                  className={`topic ${route.page === "problems" ? "active" : ""}`}
                >
                  📚 All problems
                </a>
                <a
                  href={`#/map/${s.id}`}
                  className={`topic ${route.page === "map" && route.subject === s.id ? "active" : ""}`}
                >
                  🗺️ Knowledge map
                </a>
                <div className="subject">Patterns & topics</div>
                {[...s.topics].sort(byOrder).map((t) => (
                  <a
                    key={t.id}
                    href={t.has_lesson ? `#/learn/${s.id}/${t.id}` : `#/topic/${s.id}/${t.id}`}
                    className={`topic ${activeTopic === t.id && route.subject === s.id ? "active" : ""} ${t.has_lesson ? "" : "no-lesson"}`}
                    title={t.usage}
                  >
                    {t.order ? `${t.order}. ` : ""}
                    {t.name}
                    {t.has_lesson && <span className="dot">●</span>}
                  </a>
                ))}
              </div>
            ))}
          {subjects?.subjects.some((s) => s.status === "locked") && (
            <div className="subject">Coming next</div>
          )}
          {subjects?.subjects
            .filter((s) => s.status === "locked")
            .map((s) => (
              <a
                key={s.id}
                href={`#/map/${s.id}`}
                className={`topic no-lesson ${route.subject === s.id ? "active" : ""}`}
                title="Locked: topic map and resources only, lessons coming"
              >
                🔒 {s.title} <span className="muted">{s.topics.length}</span>
              </a>
            ))}
        </nav>
        <main className="content">
          {error && <ErrorBox msg={error} route={route} />}
          {!error && !page && <p className="muted">loading…</p>}
          {page?.kind === "dashboard" && <Dashboard data={page.data} />}
          {page?.kind === "lesson" && <LessonView lesson={page.data} />}
          {page?.kind === "problem" && <ProblemCard p={page.data} open />}
          {page?.kind === "topic" && <TopicPage data={page.data} />}
          {page?.kind === "map" && current && <SubjectMap subject={current} graph={page.data} />}
          {page?.kind === "problems" && (
            <ProblemsPage
              subject={route.subject}
              rows={page.data}
              names={Object.fromEntries((current?.topics ?? []).map((t) => [t.id, t.name]))}
            />
          )}
        </main>
      </div>
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
