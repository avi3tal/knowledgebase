import { useState } from "react";
import type { QuizItem, QuizResult } from "../api";
import { api } from "../api";

export function Quiz(props: {
  subject: string;
  topic: string;
  items: QuizItem[];
  names: Record<string, string>;
}) {
  const { subject, topic, items, names } = props;
  const [results, setResults] = useState<Record<string, QuizResult & { choice: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const answered = Object.values(results);
  const score = answered.filter((r) => r.correct).length;

  const choose = async (item: QuizItem, choice: string) => {
    if (results[item.id]) return;
    try {
      const r = await api.answer(subject, topic, item.id, choice);
      setResults((prev) => ({ ...prev, [item.id]: { ...r, choice } }));
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <section className="quiz">
      <h3>
        🧠 Which pattern? <span className="muted">— recognise it before you code it</span>
      </h3>
      {items.map((item, i) => {
        const r = results[item.id];
        return (
          <div key={item.id} className="quiz-item">
            <p>
              <b>{i + 1}.</b> {item.prompt}
            </p>
            <div className="options">
              {item.options.map((opt) => {
                const cls = !r
                  ? ""
                  : opt === r.answer
                    ? "right"
                    : opt === r.choice
                      ? "wrong"
                      : "dim";
                return (
                  <button
                    key={opt}
                    className={`option ${cls}`}
                    disabled={!!r}
                    onClick={() => void choose(item, opt)}
                  >
                    {names[opt] ?? opt}
                  </button>
                );
              })}
            </div>
            {r && (
              <p className={r.correct ? "why right" : "why wrong"}>
                {r.correct ? "✓ " : "✗ "}
                {r.why}
              </p>
            )}
          </div>
        );
      })}
      {answered.length > 0 && (
        <p className="score">
          Score: {score}/{answered.length}
          {answered.length === items.length && (
            <button className="link" onClick={() => setResults({})}>
              retake
            </button>
          )}
        </p>
      )}
      {error && <p className="why wrong">{error}</p>}
    </section>
  );
}
