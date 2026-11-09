import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { DesignCheck, DesignReference as Ref } from "../api";
import { api } from "../api";
import {
  STAGE_INFO,
  diffDiagrams,
  formatSI,
  newParts,
  partToDiagram,
  sortVersions,
} from "../design";
import { Loader, Muted } from "../theme/primitives";
import * as S from "./DesignReference.style";
import { DiagramCanvas } from "./DiagramCanvas";
import { VersionPills } from "./DesignHighLevel";
import { Markdown } from "./Markdown";

/**
 * `Markdown` fence renderer for reference.md: a diagram fence containing `v2` draws that diagram
 * version (new parts highlighted); `part:P1` draws that part's sub-diagram. Read-only, same canvas.
 */
export function diagramFence(ref: Pick<Ref, "diagrams" | "design">, height = 340) {
  const diagrams = sortVersions(ref.diagrams);
  return (lang: string, body: string): ReactNode | undefined => {
    if (lang !== "diagram") return undefined;
    const name = body.trim();
    const v = /^v(\d+)$/.exec(name);
    if (v) {
      const idx = diagrams.findIndex((d) => d.version === Number(v[1]));
      const d = diagrams[idx];
      if (!d) return <S.Callout>Diagram {name} is missing.</S.Callout>;
      const hl = newParts(diffDiagrams(diagrams[idx - 1] ?? null, d), idx === 0);
      return (
        <S.MdDiagram>
          <DiagramCanvas diagram={d} highlight={hl} height={height} />
          <figcaption>
            <S.WhyTag>v{d.version}</S.WhyTag> {d.why}
          </figcaption>
        </S.MdDiagram>
      );
    }
    const p = /^part:(.+)$/.exec(name);
    const part = p ? (ref.design.parts ?? []).find((x) => x.id === p[1]) : undefined;
    if (!part) return <S.Callout>Diagram {name} is missing.</S.Callout>;
    return (
      <S.MdDiagram>
        <DiagramCanvas diagram={partToDiagram(part)} height={Math.round(height * 0.75)} />
        <figcaption>
          <S.WhyTag>{part.id}</S.WhyTag> {part.title}
        </figcaption>
      </S.MdDiagram>
    );
  };
}

/** After submit: the reference walkthrough, its diagrams (same renderer) and the answer per check. */
export function DesignReferenceView({
  subject,
  slug,
  attempt,
  check,
}: {
  subject: string;
  slug: string;
  attempt: string;
  check: DesignCheck;
}) {
  const [ref, setRef] = useState<Ref | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    api.designReference(subject, slug, attempt).then(
      (r) => {
        setRef(r);
        const vs = sortVersions(r.diagrams);
        setShown(vs[vs.length - 1]?.version ?? 1);
      },
      (e: unknown) => setError(String(e)),
    );
  }, [subject, slug, attempt]);

  const diagrams = useMemo(() => sortVersions(ref?.diagrams ?? []), [ref]);
  const idx = diagrams.findIndex((d) => d.version === shown);
  const diagram = diagrams[idx];
  const highlight = useMemo(
    () =>
      diagram ? newParts(diffDiagrams(diagrams[idx - 1] ?? null, diagram), idx === 0) : undefined,
    [diagrams, diagram, idx],
  );

  const fence = useMemo(() => (ref ? diagramFence(ref) : undefined), [ref]);

  if (error) {
    return (
      <S.Notice>
        {error.includes("409") ? "Submit your attempt to unlock the reference." : error}
      </S.Notice>
    );
  }
  if (!ref) return <Loader aria-label="loading" />;
  return (
    <S.RefView>
      <S.PatternCard>
        <S.PatternKicker>🧠 Transferable pattern</S.PatternKicker>
        <p>{ref.pattern}</p>
      </S.PatternCard>

      <section>
        <h3>🗺️ Reference diagrams</h3>
        <VersionPills versions={diagrams.map((d) => d.version)} shown={shown} onShow={setShown} />
        {diagram && (
          <>
            <S.WhyRead>
              <S.WhyTag>why v{diagram.version}?</S.WhyTag> {diagram.why}
            </S.WhyRead>
            <DiagramCanvas key={shown} diagram={diagram} highlight={highlight} height={420} />
          </>
        )}
      </section>

      {ref.estimates.length > 0 && (
        <section>
          <h3>🧮 Reference estimates</h3>
          <S.Sheet>
            <tbody>
              {ref.estimates.map((e) => (
                <S.Row key={e.name}>
                  <S.Cell $mono>{e.name}</S.Cell>
                  <S.Cell $mono $muted>
                    {e.formula}
                  </S.Cell>
                  <S.Cell $num>
                    <b>{formatSI(e.value)}</b> <Muted>{e.unit}</Muted>
                  </S.Cell>
                </S.Row>
              ))}
            </tbody>
          </S.Sheet>
        </section>
      )}

      <section>
        <h3>✅ The answer per check</h3>
        <S.Answers>
          {check.checks.map((c) => (
            <S.Answer key={c.id}>
              <S.Mark $pass={c.passed}>{c.passed ? "✓" : "✗"}</S.Mark>
              <div>
                <b>{c.label}</b>{" "}
                <Muted $small>
                  {STAGE_INFO[c.stage].icon} {STAGE_INFO[c.stage].label}
                </Muted>
                <div>{ref.tips[c.id] ?? "—"}</div>
              </div>
            </S.Answer>
          ))}
        </S.Answers>
      </section>

      <S.Walkthrough>
        <Markdown
          text={ref.walkthrough}
          path={`${subject}/problems/${slug}/reference.md`}
          fence={fence}
        />
      </S.Walkthrough>
    </S.RefView>
  );
}
