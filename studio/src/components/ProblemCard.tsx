import { useState } from "react";
import type { ProblemCardData } from "../api";
import { Markdown } from "./Markdown";

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <code
      className="cmd"
      title="click to copy"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? "copied ✓" : text}
    </code>
  );
}

export function ProblemCard({
  p,
  pattern,
  open: initiallyOpen = false,
}: {
  p: ProblemCardData;
  pattern?: string;
  open?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const practice = p.attempts.filter((a) => !a.name.includes("_legacy"));
  return (
    <div className="card">
      <div className="card-head" onClick={() => setOpen((o) => !o)}>
        <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
        <b>{p.title}</b>
        <span className="muted">
          {p.expected_complexity.time} · {p.patterns.join(", ")}
        </span>
        <span className="grow" />
        <span className="muted">{open ? "▾" : "▸"}</span>
      </div>
      <div className="attempts">
        {p.attempts.length === 0 && <span className="muted">no attempts yet</span>}
        {p.attempts.map((a) => {
          const r = a.last_run;
          const ok = r && !r.error && r.total > 0 && r.passed === r.total;
          return (
            <span
              key={a.name}
              className={`attempt ${!r ? "" : ok ? "ok" : "fail"}`}
              title={r ? `${r.ts}${r.fit ? " · ≈" + r.fit : ""}` : "not run"}
            >
              {a.name} {r ? `${r.passed}/${r.total}` : ""}
            </span>
          );
        })}
      </div>
      <div className="cmds">
        <Copy text={`./kb attempt ${p.slug} --lang go${pattern ? ` --pattern ${pattern}` : ""}`} />
        <Copy
          text={`./kb attempt ${p.slug} --lang python${pattern ? ` --pattern ${pattern}` : ""}`}
        />
        <Copy text={`./kb run ${p.slug}`} />
        {practice.length > 0 && (
          <span className="muted">{practice.length} practice attempt(s)</span>
        )}
      </div>
      {open && <Markdown text={p.readme} path={p.readme_path} />}
    </div>
  );
}
