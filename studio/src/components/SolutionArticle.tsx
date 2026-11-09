import type { ReactNode } from "react";
import type { DesignPart, DesignReference, Diagram } from "../api";
import { addedInVersion, fencedVersions, parseDiagramFence, partDiagram } from "../reader";
import { MutedP } from "../theme/primitives";
import { Article } from "./DesignReaderPanes.style";
import { Chips } from "./DesignReaderPanes";
import { ActionButton } from "./PracticeBench.style";
import * as S from "./SolutionArticle.style";
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
    <S.Gate>
      <S.GateIcon>🔒</S.GateIcon>
      <h2>Practise first?</h2>
      <p>
        The worked solution is always here, but reading it <b>before your first attempt</b> removes
        this problem's <b>first-try bonus</b>. Have a go in the console first if you can.
      </p>
      <MutedP $small>
        Revealing is remembered on this device, so you won't be asked again for this problem.
      </MutedP>
      <S.GateActions>
        <ActionButton $variant="ghost" onClick={onReveal} disabled={busy}>
          📖 Reveal solution
        </ActionButton>
        <ActionButton $variant="primary" onClick={onPractise} disabled={busy}>
          {practiseLabel}
        </ActionButton>
      </S.GateActions>
    </S.Gate>
  );
}

function VersionFigure({ diagrams, d }: { diagrams: Diagram[]; d: Diagram }) {
  const added = addedInVersion(diagrams, d.version);
  return (
    <S.Fig>
      <S.FigCanvas>
        <DiagramCanvas diagram={d} highlight={added} height={380} />
      </S.FigCanvas>
      <figcaption>
        <S.VTag>v{d.version}</S.VTag>
        <S.Why>{d.why || "—"}</S.Why>
        {added.nodes.size > 0 && (
          <S.NewTag title={[...added.nodes].join(", ")}>+{added.nodes.size} new</S.NewTag>
        )}
      </figcaption>
    </S.Fig>
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
    <S.Part>
      <S.PartHeader>
        <S.PartId>{part.id}</S.PartId>
        <S.PartTitle>{part.title}</S.PartTitle>
        {part.covers.length > 0 && (
          <Chips ids={part.covers} subject={subject} names={names} kind="covers" />
        )}
      </S.PartHeader>
      {part.choice && (
        <S.PartChoice>
          <S.Label $inline>Choice</S.Label> {part.choice}
        </S.PartChoice>
      )}
      {(part.technologies.length > 0 || part.patterns.length > 0) && (
        <S.PartChips>
          {part.technologies.length > 0 && (
            <Chips ids={part.technologies} subject={subject} names={names} kind="tech" />
          )}
          {part.patterns.length > 0 && (
            <Chips ids={part.patterns} subject={subject} names={names} kind="pattern" />
          )}
        </S.PartChips>
      )}
      {part.diagram.nodes.length > 0 && (
        <S.FigCanvas>
          <DiagramCanvas diagram={partDiagram(part)} height={300} />
        </S.FigCanvas>
      )}
    </S.Part>
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
    <div>
      {hasBand && (
        <S.Band>
          {solution.technologies.length > 0 && (
            <div>
              <S.Label>Technologies</S.Label>
              <Chips ids={solution.technologies} subject={subject} names={names} kind="tech" />
            </div>
          )}
          {solution.patterns.length > 0 && (
            <div>
              <S.Label>Patterns</S.Label>
              <Chips ids={solution.patterns} subject={subject} names={names} kind="pattern" />
            </div>
          )}
          {solution.pattern && (
            <S.BandPattern>
              <S.Label>Transferable pattern</S.Label>
              <p>{solution.pattern}</p>
            </S.BandPattern>
          )}
        </S.Band>
      )}
      <Article>
        <Markdown text={solution.walkthrough} path={path} fence={fence} anchors />
      </Article>
      {gallery && (
        <Article as="section">
          <h2 id={VERSIONS_ID}>Design versions</h2>
          {[...diagrams]
            .sort((a, b) => a.version - b.version)
            .map((d) => (
              <VersionFigure key={d.version} diagrams={diagrams} d={d} />
            ))}
        </Article>
      )}
    </div>
  );
}
