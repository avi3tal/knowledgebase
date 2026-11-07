import type { ReactNode } from "react";
import type { DesignPart, DesignReference, Diagram } from "../api";
import { addedInVersion, fencedVersions, parseDiagramFence, partDiagram } from "../reader";
import { Chips } from "./DesignReaderPanes";
import { DiagramCanvas } from "./DiagramCanvas";
import { Markdown } from "./Markdown";

export const VERSIONS_ID = "design-versions";

/** Reveal prompt shown before the worked solution. */
export function RevealGate({
  onReveal,
  onPractise,
  busy,
  practiseLabel,
}: {
  onReveal: () => void;
  onPractise: () => void;
  busy: boolean;
  practiseLabel: string;
}) {
  return (
    <section className="rd-gate">
      <div className="rd-gate-icon">🔒</div>
      <h2>Practise first?</h2>
      <p>
        The worked solution is always here, but reading it <b>before your first attempt</b> removes
        this problem's <b>first-try bonus</b>. Have a go in the console first if you can.
      </p>
      <p className="muted small">
        Revealing is remembered on this device, so you won't be asked again for this problem.
      </p>
      <div className="rd-gate-actions">
        <button className="rd-btn ghost" onClick={onReveal} disabled={busy}>
          📖 Reveal solution
        </button>
        <button className="rd-btn primary" onClick={onPractise} disabled={busy}>
          {practiseLabel}
        </button>
      </div>
    </section>
  );
}

function VersionFigure({ diagrams, d }: { diagrams: Diagram[]; d: Diagram }) {
  const added = addedInVersion(diagrams, d.version);
  return (
    <figure className="rd-fig">
      <div className="rd-fig-canvas">
        <DiagramCanvas diagram={d} highlight={added} height={380} />
      </div>
      <figcaption>
        <span className="rd-vtag">v{d.version}</span>
        <span className="rd-why">{d.why || "—"}</span>
        {added.nodes.size > 0 && (
          <span className="rd-new" title={[...added.nodes].join(", ")}>
            +{added.nodes.size} new
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function PartCard({
  part,
  subject,
  names,
}: {
  part: DesignPart;
  subject: string;
  names: Record<string, string>;
}) {
  return (
    <figure className="rd-part">
      <header>
        <span className="rd-part-id">{part.id}</span>
        <span className="rd-part-title">{part.title}</span>
        {part.covers.length > 0 && (
          <Chips ids={part.covers} subject={subject} names={names} kind="covers" />
        )}
      </header>
      {part.choice && (
        <p className="rd-part-choice">
          <span className="rd-label">Choice</span> {part.choice}
        </p>
      )}
      {(part.technologies.length > 0 || part.patterns.length > 0) && (
        <div className="rd-part-chips">
          {part.technologies.length > 0 && (
            <Chips ids={part.technologies} subject={subject} names={names} kind="tech" />
          )}
          {part.patterns.length > 0 && (
            <Chips ids={part.patterns} subject={subject} names={names} kind="pattern" />
          )}
        </div>
      )}
      {part.diagram.nodes.length > 0 && (
        <div className="rd-fig-canvas">
          <DiagramCanvas diagram={partDiagram(part)} height={300} />
        </div>
      )}
    </figure>
  );
}

/** The worked solution: summary band, walkthrough with live diagrams, versions gallery for old layouts. */
export function SolutionArticle({
  solution,
  subject,
  names,
  path,
}: {
  solution: DesignReference;
  subject: string;
  names: Record<string, string>;
  path: string;
}) {
  const diagrams = solution.diagrams;
  const parts = solution.design.parts ?? [];
  const fence = (lang: string, body: string): ReactNode | undefined => {
    if (lang !== "diagram") return undefined;
    const ref = parseDiagramFence(body);
    if (ref?.kind === "version") {
      const d = diagrams.find((x) => x.version === ref.version);
      return d ? <VersionFigure diagrams={diagrams} d={d} /> : undefined;
    }
    if (ref?.kind === "part") {
      const part = parts.find((x) => x.id === ref.id);
      return part ? <PartCard part={part} subject={subject} names={names} /> : undefined;
    }
    return undefined;
  };
  // Older layouts have no ```diagram vN fences: show the versions after the article instead.
  const gallery = diagrams.length > 0 && fencedVersions(solution.walkthrough).size === 0;
  const hasBand =
    solution.technologies.length > 0 || solution.patterns.length > 0 || Boolean(solution.pattern);

  return (
    <div className="rd-solution">
      {hasBand && (
        <section className="rd-band">
          {solution.technologies.length > 0 && (
            <div>
              <span className="rd-label">Technologies</span>
              <Chips ids={solution.technologies} subject={subject} names={names} kind="tech" />
            </div>
          )}
          {solution.patterns.length > 0 && (
            <div>
              <span className="rd-label">Patterns</span>
              <Chips ids={solution.patterns} subject={subject} names={names} kind="pattern" />
            </div>
          )}
          {solution.pattern && (
            <div className="rd-band-pattern">
              <span className="rd-label">Transferable pattern</span>
              <p>{solution.pattern}</p>
            </div>
          )}
        </section>
      )}
      <article className="rd-article">
        <Markdown text={solution.walkthrough} path={path} fence={fence} anchors />
      </article>
      {gallery && (
        <section className="rd-article rd-gallery">
          <h2 id={VERSIONS_ID}>Design versions</h2>
          {[...diagrams]
            .sort((a, b) => a.version - b.version)
            .map((d) => (
              <VersionFigure key={d.version} diagrams={diagrams} d={d} />
            ))}
        </section>
      )}
    </div>
  );
}
