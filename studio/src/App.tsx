import { useEffect, useState } from "react";
import type { Feedback, Lesson, ProblemCardData, ProblemRow, SubjectsResponse } from "./api";
import { api } from "./api";
import { Dashboard } from "./components/Dashboard";
import { LessonView } from "./components/LessonView";
import { ProblemCard } from "./components/ProblemCard";
import { ProblemsPage } from "./components/ProblemsPage";
import { RootContext } from "./context";
import type { Route } from "./route";
import { parseRoute } from "./route";

type Page =
  | { kind: "lesson"; data: Lesson }
  | { kind: "problem"; data: ProblemCardData }
  | { kind: "problems"; data: ProblemRow[] }
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
    const load =
      route.page === "lesson"
        ? api.lesson(route.subject, route.topic).then((data): Page => ({ kind: "lesson", data }))
        : route.page === "problem"
          ? api.problem(route.subject, route.slug).then((data): Page => ({ kind: "problem", data }))
          : route.page === "problems"
            ? api.problems(route.subject).then((data): Page => ({ kind: "problems", data }))
            : api.feedback(route.subject).then((data): Page => ({ kind: "dashboard", data }));
    load.then(setPage, (e: unknown) => setError(String(e)));
    window.scrollTo(0, 0);
  }, [route]);

  return (
    <RootContext.Provider value={subjects?.root ?? ""}>
      <div className="layout">
        <nav className="sidebar">
          <a className="brand" href="#/">
            kb studio
          </a>
          {subjects?.subjects.map((s) => (
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
              <div className="subject">Patterns & topics</div>
              {[...s.topics]
                .sort((a, b) =>
                  a.kind === b.kind
                    ? (a.order ?? 99) - (b.order ?? 99)
                    : a.kind === "pattern"
                      ? -1
                      : 1,
                )
                .map((t) => {
                  const active = route.page === "lesson" && route.topic === t.id;
                  return (
                    <a
                      key={t.id}
                      href={`#/learn/${s.id}/${t.id}`}
                      className={`topic ${active ? "active" : ""} ${t.has_lesson ? "" : "no-lesson"}`}
                      title={t.usage}
                    >
                      {t.order ? `${t.order}. ` : ""}
                      {t.name}
                      {t.has_lesson && <span className="dot">●</span>}
                    </a>
                  );
                })}
            </div>
          ))}
        </nav>
        <main className="content">
          {error && <ErrorBox msg={error} route={route} />}
          {!error && !page && <p className="muted">loading…</p>}
          {page?.kind === "dashboard" && <Dashboard data={page.data} />}
          {page?.kind === "lesson" && <LessonView lesson={page.data} />}
          {page?.kind === "problem" && <ProblemCard p={page.data} open />}
          {page?.kind === "problems" && (
            <ProblemsPage
              subject={route.subject}
              rows={page.data}
              names={Object.fromEntries(
                (subjects?.subjects.find((s) => s.id === route.subject)?.topics ?? []).map((t) => [
                  t.id,
                  t.name,
                ]),
              )}
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
          No lesson for <b>{route.page === "lesson" ? route.topic : ""}</b> yet. In Claude Code run{" "}
          <code>
            /learn {route.subject} {route.page === "lesson" ? route.topic : ""}
          </code>{" "}
          to generate it.
        </>
      ) : (
        <>
          {msg} — is <code>./kb studio</code> running?
        </>
      )}
    </div>
  );
}
