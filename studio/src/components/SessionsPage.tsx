import { useMemo, useState } from "react";
import type { Focus, Session, SessionSpec, Subject } from "../api";
import { api } from "../api";
import { groupTopics, topicIcon } from "../catalog";
import { sessionsSummary } from "../practice-bench";
import { FOCUS_INFO, STATUS_LABEL, groupByStatus, scoreBand } from "../sessions";
import { NavList } from "./panes";
import { PlanWithClaude, sessionNavGroups, useSessions } from "./PracticeBench";
import { Ring } from "./Ring";
import { Workbench, WorkbenchTab } from "./Workbench";
import { Button, Card, Grow, Muted, MutedP, Tinted } from "../theme/primitives";
import { t } from "../theme/theme";
import {
  ActionButton,
  Center,
  Empty,
  EmptyIcon,
  FooterRow,
  GroupTitle,
  PracticeStats,
  ProgressFill,
  ProgressTrack,
  ScoreCard,
  ScoreChip,
  ScoreRing,
  Side,
  StatusDot,
} from "./PracticeBench.style";
import * as S from "./SessionsPage.style";
import { PageHeader } from "./PageHeader";

/** All study sessions on the Workbench: the list left, cards or the builder center, totals right. */
export function SessionsPage({ sessions, subjects }: { sessions: Session[]; subjects: Subject[] }) {
  const [building, setBuilding] = useState(sessions.length === 0);
  const list = useSessions(sessions) ?? sessions;
  const nav = useMemo(() => sessionNavGroups(list), [list]);
  const sum = sessionsSummary(sessions);
  const claude = sessions.filter((s) => s.generator === "claude").length;

  const header = (
    <PageHeader
      title="Study sessions"
      meta={[
        <span>{sum.total} sessions</span>,
        sum.active > 0 && <Tinted $tone="warn">{sum.active} in progress</Tinted>,
        <Tinted $tone="ok">{sum.done} done</Tinted>,
        <span>avg score {sum.average ?? "—"}</span>,
      ]}
      actions={
        <Button $variant="primary" onClick={() => setBuilding((b) => !b)}>
          {building ? "Close builder" : "New session"}
        </Button>
      }
    />
  );

  const tabs = (
    <>
      <WorkbenchTab on={!building} onClick={() => setBuilding(false)} badge={sessions.length}>
        Sessions
      </WorkbenchTab>
      <WorkbenchTab on={building} onClick={() => setBuilding(true)} color={t.pattern}>
        New session
      </WorkbenchTab>
    </>
  );

  const right = (
    <Side>
      <ScoreCard>
        <h4>Average score</h4>
        <ScoreRing>
          <Ring
            solved={sum.average ?? 0}
            total={100}
            size={96}
            label={sum.average === null ? "–" : `${sum.average}`}
          />
        </ScoreRing>
        <ProgressTrack title={`${Math.round(sum.completion * 100)}% attempted`}>
          <ProgressFill $fraction={sum.completion} />
        </ProgressTrack>
        <Muted as="div" $small>
          {Math.round(sum.completion * 100)}% of live sessions attempted
        </Muted>
      </ScoreCard>
      <Card>
        <h4>Planned by</h4>
        <PracticeStats>
          <span>
            <b>{claude}</b> 🤖 Claude
          </span>
          <span>
            <b>{sessions.length - claude}</b> ⚙️ kb
          </span>
        </PracticeStats>
      </Card>
      <PlanWithClaude />
    </Side>
  );

  const footer = (
    <FooterRow>
      <span>
        <b>{sum.total}</b> sessions · <b>{sum.active}</b> in progress · <b>{sum.done}</b> done
      </span>
      <Grow />
      <Muted>scores come from your kb runs, never stored</Muted>
    </FooterRow>
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
      <Center>
        {building && <SessionBuilder subjects={subjects} />}
        {!building && sessions.length === 0 && (
          <Empty>
            <EmptyIcon>🎯</EmptyIcon>
            <p>No sessions yet.</p>
            <ActionButton $variant="primary" onClick={() => setBuilding(true)}>
              ✨ Build your first session
            </ActionButton>
          </Empty>
        )}
        {!building &&
          groupByStatus(sessions).map((g) => (
            <section key={g.status}>
              <GroupTitle>
                <StatusDot $status={g.status} /> {STATUS_LABEL[g.status]}
                <Muted $small> {g.sessions.length}</Muted>
              </GroupTitle>
              <S.Cards>
                {g.sessions.map((s, i) => (
                  <S.SessionCard key={s.id} href={`#/session/${s.id}`} $status={s.status} $i={i}>
                    <S.CardHead>
                      <S.CardIcon>{FOCUS_INFO[s.target.focus].icon}</S.CardIcon>
                      <Grow />
                      <ScoreChip $band={scoreBand(s.score)}>
                        {s.score === null ? "no score yet" : `${s.score}/100`}
                      </ScoreChip>
                    </S.CardHead>
                    <S.CardName>{s.title}</S.CardName>
                    {s.target.goal && <S.CardGoal>🎯 {s.target.goal}</S.CardGoal>}
                    <ProgressTrack title={`${Math.round(s.completion * 100)}% attempted`}>
                      <ProgressFill $fraction={s.completion} />
                    </ProgressTrack>
                    <S.CardFoot>
                      <S.FootPill>{s.items.length} problems</S.FootPill>
                      <S.FootPill>{s.materials.length} lessons</S.FootPill>
                      <S.FootPill>
                        {s.generator === "claude" ? "🤖 Claude plan" : "⚙️ kb"}
                      </S.FootPill>
                      <S.FootPill>{s.created.slice(0, 10)}</S.FootPill>
                    </S.CardFoot>
                  </S.SessionCard>
                ))}
              </S.Cards>
            </section>
          ))}
      </Center>
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
    <S.Builder>
      <h2>New session</h2>
      <MutedP>
        kb picks the problems deterministically from your history (same choices → same session). For
        a plan that reasons about your strengths and weaknesses, ask Claude Code:{" "}
        <code>/session</code>.
      </MutedP>

      <S.Field>
        <label>Focus</label>
        <S.FocusGrid>
          {(Object.keys(FOCUS_INFO) as Focus[]).map((f) => (
            <S.FocusOption
              key={f}
              $on={spec.focus === f}
              onClick={() => setSpec((prev) => ({ ...prev, focus: f }))}
            >
              <S.FocusIcon>{FOCUS_INFO[f].icon}</S.FocusIcon>
              <b>{FOCUS_INFO[f].label}</b>
              <Muted $small>{FOCUS_INFO[f].hint}</Muted>
            </S.FocusOption>
          ))}
        </S.FocusGrid>
      </S.Field>

      <S.FieldRow>
        <S.Field>
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
        </S.Field>
        <S.Field>
          <label>Problems: {spec.count}</label>
          <input
            type="range"
            min={1}
            max={15}
            value={spec.count}
            onChange={(e) => setSpec((prev) => ({ ...prev, count: Number(e.target.value) }))}
          />
        </S.Field>
        <S.Field>
          <label>Difficulty</label>
          <S.Pills>
            {["easy", "medium", "hard"].map((d) => (
              <S.PillButton
                key={d}
                $on={spec.difficulty.includes(d)}
                $difficulty={d}
                onClick={() => toggle("difficulty", d)}
              >
                {d}
              </S.PillButton>
            ))}
          </S.Pills>
        </S.Field>
        <S.Field>
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
        </S.Field>
      </S.FieldRow>

      <S.Field>
        <label>
          Topics{" "}
          <Muted $small>
            {spec.topics.length ? `${spec.topics.length} selected` : "none selected = everything"}
          </Muted>
        </label>
        {subject &&
          groupTopics(subject.topics).map((g) => (
            <S.Pills key={g.group} $spaced>
              {g.topics.map((t) => (
                <S.PillButton
                  key={t.id}
                  $on={spec.topics.includes(t.id)}
                  $color={g.color}
                  onClick={() => toggle("topics", t.id)}
                >
                  {topicIcon(t)} {t.name}
                </S.PillButton>
              ))}
            </S.Pills>
          ))}
      </S.Field>

      <S.FieldRow>
        <S.Field $grow>
          <label>Goal</label>
          <input
            placeholder="e.g. onsite at a big tech company in 2 weeks"
            value={spec.goal}
            onChange={(e) => setSpec((prev) => ({ ...prev, goal: e.target.value }))}
          />
        </S.Field>
        <S.Field $grow>
          <label>Title</label>
          <input
            placeholder="optional — generated from the topics"
            value={spec.title}
            onChange={(e) => setSpec((prev) => ({ ...prev, title: e.target.value }))}
          />
        </S.Field>
      </S.FieldRow>
      {error && <S.Callout>{error}</S.Callout>}
      <S.GenerateButton disabled={busy} onClick={create}>
        {busy ? "Generating…" : "✨ Generate session"}
      </S.GenerateButton>
    </S.Builder>
  );
}
