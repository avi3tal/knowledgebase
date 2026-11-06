import type { Lesson } from "../api";
import { isTrace } from "../trace";
import { Markdown } from "./Markdown";
import { ProblemCard } from "./ProblemCard";
import { Quiz } from "./Quiz";
import { TracePlayer } from "./TracePlayer";

export function LessonView({ lesson }: { lesson: Lesson }) {
  return (
    <article className="lesson">
      {lesson.blocks.map((b, i) => {
        switch (b.type) {
          case "markdown":
            return <Markdown key={i} text={b.text} path={b.path} />;
          case "trace":
            return isTrace(b.trace) ? (
              <TracePlayer key={i} trace={b.trace} />
            ) : (
              <p key={i} className="why wrong">
                Unsupported trace format — rebuild with <code>./kb learn build</code>.
              </p>
            );
          case "quiz":
            return (
              <Quiz
                key={i}
                subject={lesson.subject}
                topic={lesson.topic}
                items={b.items}
                names={lesson.names}
              />
            );
          case "problems":
            return (
              <section key={i}>
                <h2>Practice</h2>
                <p className="muted">
                  Easy → hard. Start an attempt, solve it in VS Code, then <code>./kb run</code> it.
                  Each run feeds your progress.
                </p>
                {b.problems.map((p) => (
                  <ProblemCard key={p.slug} p={p} pattern={lesson.topic} />
                ))}
              </section>
            );
        }
      })}
    </article>
  );
}
