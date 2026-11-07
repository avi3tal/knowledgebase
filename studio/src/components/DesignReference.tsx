import { useEffect, useMemo, useState } from "react";
import type { DesignCheck, DesignReference as Ref } from "../api";
import { api } from "../api";
import { STAGE_INFO, diffDiagrams, formatSI, newParts, sortVersions } from "../design";
import { DiagramCanvas } from "./DiagramCanvas";
import { VersionPills } from "./DesignHighLevel";
import { Markdown } from "./Markdown";

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

  if (error) {
    return (
      <div className="callout">
        {error.includes("409") ? "Submit your attempt to unlock the reference." : error}
      </div>
    );
  }
  if (!ref) return <div className="loader" aria-label="loading" />;
  return (
    <div className="ref-view">
      <section className="pattern-card">
        <span className="pattern-kicker">🧠 Transferable pattern</span>
        <p>{ref.pattern}</p>
      </section>

      <section>
        <h3>🗺️ Reference diagrams</h3>
        <VersionPills versions={diagrams.map((d) => d.version)} shown={shown} onShow={setShown} />
        {diagram && (
          <>
            <p className="why-read">
              <span className="why-tag">why v{diagram.version}?</span> {diagram.why}
            </p>
            <DiagramCanvas key={shown} diagram={diagram} highlight={highlight} height={420} />
          </>
        )}
      </section>

      {ref.estimates.length > 0 && (
        <section>
          <h3>🧮 Reference estimates</h3>
          <table className="sheet readonly">
            <tbody>
              {ref.estimates.map((e) => (
                <tr key={e.name}>
                  <td className="mono">{e.name}</td>
                  <td className="mono muted">{e.formula}</td>
                  <td className="num">
                    <b>{formatSI(e.value)}</b> <span className="muted">{e.unit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h3>✅ The answer per check</h3>
        <ul className="answers">
          {check.checks.map((c) => (
            <li key={c.id} className={c.passed ? "pass" : "fail"}>
              <span className="cl-mark">{c.passed ? "✓" : "✗"}</span>
              <div>
                <b>{c.label}</b>{" "}
                <span className="muted small">
                  {STAGE_INFO[c.stage].icon} {STAGE_INFO[c.stage].label}
                </span>
                <div>{ref.tips[c.id] ?? "—"}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="walkthrough">
        <Markdown text={ref.walkthrough} path={`${subject}/problems/${slug}/reference.md`} />
      </section>
    </div>
  );
}
