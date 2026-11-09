import { useState } from "react";
import type { QuizItem, QuizResult } from "../api";
import { api } from "../api";
import { Muted } from "../theme/primitives";
import * as S from "./Quiz.style";

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
    <S.Root>
      <h3>
        🧠 Which pattern? <Muted>— recognise it before you code it</Muted>
      </h3>
      {items.map((item, i) => {
        const r = results[item.id];
        return (
          <S.Item key={item.id}>
            <p>
              <b>{i + 1}.</b> {item.prompt}
            </p>
            <S.Options>
              {item.options.map((opt) => {
                const state = !r
                  ? undefined
                  : opt === r.answer
                    ? "right"
                    : opt === r.choice
                      ? "wrong"
                      : "dim";
                return (
                  <S.Option
                    key={opt}
                    $state={state}
                    disabled={!!r}
                    onClick={() => void choose(item, opt)}
                  >
                    {names[opt] ?? opt}
                  </S.Option>
                );
              })}
            </S.Options>
            {r && (
              <S.Why $right={r.correct}>
                {r.correct ? "✓ " : "✗ "}
                {r.why}
              </S.Why>
            )}
          </S.Item>
        );
      })}
      {answered.length > 0 && (
        <S.Score>
          Score: {score}/{answered.length}
          {answered.length === items.length && (
            <S.Retake onClick={() => setResults({})}>retake</S.Retake>
          )}
        </S.Score>
      )}
      {error && <S.Why $right={false}>{error}</S.Why>}
    </S.Root>
  );
}
