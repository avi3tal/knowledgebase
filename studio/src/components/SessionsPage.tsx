import { useMemo, useState } from "react";
import type { Focus, Session, SessionSpec, Subject } from "../api";
import { api } from "../api";
import { groupTopics, topicIcon } from "../catalog";
import { sessionsSummary } from "../practice-bench";
import { FOCUS_INFO, STATUS_LABEL, groupByStatus, scoreBand } from "../sessions";
import { NavList } from "./panes";
import { PlanWithClaude, Stat, sessionNavGroups, useSessions } from "./PracticeBench";
import { Ring } from "./Ring";
import { Workbench } from "./Workbench";

/** All study sessions on the Workbench: the list left, cards or the builder center, totals right. */
export function SessionsPage({ sessions, subjects }: { sessions: Session[]; subjects: Subject[] }) {
  const [building, setBuilding] = useState(sessions.length === 0);
  const list = useSessions(sessions) ?? sessions;
  const nav = useMemo(() => sessionNavGroups(list), [list]);
  const sum = sessionsSummary(sessions);
  const claude = sessions.filter((s) => s.generator === "claude").length;

  const header = (
    <div className="rd-header pb-head">
      <div className="rd-icon">🎯</div>
      <div className="rd-head-main">
        <div className="rd-kicker">
          <span className="pb-kicker">Practice</span>
          <span className="muted small">stored privately in _workspace/sessions</span>
        </div>
        <h1>Study sessions</h1>
        <div className="pb-stats">
          <Stat n={sum.total} label="sessions" />
          <Stat n={sum.active} label="in progress" tone="accent" />
          <Stat n={sum.done} label="done" tone="ok" />
          <Stat n={sum.average ?? "—"} label="avg score" />
        </div>
      </div>
      <button className="rd-btn primary big" onClick={() => setBuilding((b) => !b)}>
        {building ? "✕ Close builder" : "＋ New session"}
        <span className="rd-btn-sub">
          {building ? "back to your sessions" : "kb picks the problems"}
        </span>
      </button>
    </div>
  );

  const tabs = (
    <>
      <button
        className={`wb-tab pb-tab-list ${building ? "" : "on"}`}
        onClick={() => setBuilding(false)}
      >
        🗂️ Sessions <span className="wb-tab-badge">{sessions.length}</span>
      </button>
      <button
        className={`wb-tab pb-tab-new ${building ? "on" : ""}`}
        onClick={() => setBuilding(true)}
      >
        ✨ New session
      </button>
    </>
  );

  const right = (
    <div className="pb-side">
      <section className="rd-card pb-score-card">
        <h4>Average score</h4>
        <div className="pb-score-ring">
          <Ring
            solved={sum.average ?? 0}
            total={100}
            size={96}
            label={sum.average === null ? "–" : `${sum.average}`}
          />
        </div>
        <div className="progress-bar" title={`${Math.round(sum.completion * 100)}% attempted`}>
          <span style={{ width: `${sum.completion * 100}%` }} />
        </div>
        <div className="muted small">
          {Math.round(sum.completion * 100)}% of live sessions attempted
        </div>
      </section>
      <section className="rd-card">
        <h4>Planned by</h4>
        <div className="rd-practice-stats">
          <span>
            <b>{claude}</b> 🤖 Claude
          </span>
          <span>
            <b>{sessions.length - claude}</b> ⚙️ kb
          </span>
        </div>
      </section>
      <PlanWithClaude />
    </div>
  );

  const footer = (
    <div className="pb-footer">
      <span>
        <b>{sum.total}</b> sessions · <b>{sum.active}</b> in progress · <b>{sum.done}</b> done
      </span>
      <span className="grow" />
      <span className="muted">scores come from your kb runs, never stored</span>
    </div>
  );

  return (
    <Workbench
      id="sessions"
      header={header}
      tabs={tabs}
      left={{
        title: "Sessions",
        icon: "🎯",
        content: (
          <NavList groups={nav} placeholder="Filter sessions…" emptyText="No sessions yet." />
        ),
      }}
      right={{ title: "Overview", icon: "📊", content: right }}
      footer={footer}
    >
      <div className="pb-center sessions pb-sessions">
        {building && <SessionBuilder subjects={subjects} />}
        {!building && sessions.length === 0 && (
          <div className="pb-empty">
            <div className="pb-empty-icon">🎯</div>
            <p>No sessions yet.</p>
            <button className="rd-btn primary" onClick={() => setBuilding(true)}>
              ✨ Build your first session
            </button>
          </div>
        )}
        {!building &&
          groupByStatus(sessions).map((g) => (
            <section key={g.status}>
              <h2 className="group-title">
                <span className={`status-dot ${g.status}`} /> {STATUS_LABEL[g.status]}
                <span className="muted small"> {g.sessions.length}</span>
              </h2>
              <div className="cards">
                {g.sessions.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#/session/${s.id}`}
                    className={`session-card ${s.status}`}
                    style={{ ["--i" as string]: i }}
                  >
                    <div className="tc-head">
                      <span className="tc-icon">{FOCUS_INFO[s.target.focus].icon}</span>
                      <span className="grow" />
                      <span className={`score-chip ${scoreBand(s.score)}`}>
                        {s.score === null ? "no score yet" : `${s.score}/100`}
                      </span>
                    </div>
                    <div className="tc-name">{s.title}</div>
                    {s.target.goal && <div className="tc-usage">🎯 {s.target.goal}</div>}
                    <div
                      className="progress-bar"
                      title={`${Math.round(s.completion * 100)}% attempted`}
                    >
                      <span style={{ width: `${s.completion * 100}%` }} />
                    </div>
                    <div className="tc-foot">
                      <span className="tc-pill">{s.items.length} problems</span>
                      <span className="tc-pill">{s.materials.length} lessons</span>
                      <span className="tc-pill">
                        {s.generator === "claude" ? "🤖 Claude plan" : "⚙️ kb"}
                      </span>
                      <span className="tc-pill">{s.created.slice(0, 10)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
      </div>
    </Workbench>
  );
}

function SessionBuilder({ subjects }: { subjects: Subject[] }) {
  const open = subjects.filter((s) => s.status !== "locked");
  const [spec, setSpec] = useState<SessionSpec>({
    subject: open[0]?.id ?? "algo",
    topics: [],
    difficulty: [],
    count: 5,
    focus: "mixed",
    goal: "",
    title: "",
    minutes: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const subject = subjects.find((s) => s.id === spec.subject);
  const toggle = (key: "topics" | "difficulty", v: string) =>
    setSpec((prev) => ({
      ...prev,
      [key]: prev[key].includes(v) ? prev[key].filter((x) => x !== v) : [...prev[key], v],
    }));

  const create = () => {
    setBusy(true);
    setError(null);
    api.newSession(spec).then(
      (s) => (window.location.hash = `#/session/${s.id}`),
      (e: unknown) => {
        setError(String(e));
        setBusy(false);
      },
    );
  };

  return (
    <section className="builder">
      <h2>New session</h2>
      <p className="muted">
        kb picks the problems deterministically from your history (same choices → same session). For
        a plan that reasons about your strengths and weaknesses, ask Claude Code:{" "}
        <code>/session</code>.
      </p>

      <div className="field">
        <label>Focus</label>
        <div className="focus-grid">
          {(Object.keys(FOCUS_INFO) as Focus[]).map((f) => (
            <button
              key={f}
              className={`focus-opt ${spec.focus === f ? "on" : ""}`}
              onClick={() => setSpec((prev) => ({ ...prev, focus: f }))}
            >
              <span className="focus-icon">{FOCUS_INFO[f].icon}</span>
              <b>{FOCUS_INFO[f].label}</b>
              <span className="muted small">{FOCUS_INFO[f].hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Subject</label>
          <select
            value={spec.subject}
            onChange={(e) => setSpec((prev) => ({ ...prev, subject: e.target.value, topics: [] }))}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id} disabled={s.status === "locked"}>
                {s.title}
                {s.status === "locked" ? " (coming)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Problems: {spec.count}</label>
          <input
            type="range"
            min={1}
            max={15}
            value={spec.count}
            onChange={(e) => setSpec((prev) => ({ ...prev, count: Number(e.target.value) }))}
          />
        </div>
        <div className="field">
          <label>Difficulty</label>
          <div className="pills">
            {["easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                className={`pill diff-${d} ${spec.difficulty.includes(d) ? "on" : ""}`}
                onClick={() => toggle("difficulty", d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Time budget (min)</label>
          <input
            type="number"
            min={15}
            step={15}
            placeholder="optional"
            value={spec.minutes ?? ""}
            onChange={(e) =>
              setSpec((prev) => ({
                ...prev,
                minutes: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </div>
      </div>

      <div className="field">
        <label>
          Topics{" "}
          <span className="muted small">
            {spec.topics.length ? `${spec.topics.length} selected` : "none selected = everything"}
          </span>
        </label>
        {subject &&
          groupTopics(subject.topics).map((g) => (
            <div key={g.group} className="pills topic-pills" style={{ ["--c" as string]: g.color }}>
              {g.topics.map((t) => (
                <button
                  key={t.id}
                  className={`pill ${spec.topics.includes(t.id) ? "on" : ""}`}
                  onClick={() => toggle("topics", t.id)}
                >
                  {topicIcon(t)} {t.name}
                </button>
              ))}
            </div>
          ))}
      </div>

      <div className="field-row">
        <div className="field grow">
          <label>Goal</label>
          <input
            placeholder="e.g. onsite at a big tech company in 2 weeks"
            value={spec.goal}
            onChange={(e) => setSpec((prev) => ({ ...prev, goal: e.target.value }))}
          />
        </div>
        <div className="field grow">
          <label>Title</label>
          <input
            placeholder="optional — generated from the topics"
            value={spec.title}
            onChange={(e) => setSpec((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>
      </div>
      {error && <div className="callout">{error}</div>}
      <button className="primary big" disabled={busy} onClick={create}>
        {busy ? "Generating…" : "✨ Generate session"}
      </button>
    </section>
  );
}
