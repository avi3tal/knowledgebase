import * as S from "./Ring.style";

/** Animated progress ring: solved (green) then failing (red) arcs over a track. */
export function Ring({
  solved,
  failing = 0,
  total,
  size = 44,
  label,
  labelSize = 10,
  inverse = false,
}: {
  solved: number;
  failing?: number;
  total: number;
  size?: number;
  label?: string;
  /** px of the centre label (10 in lists, 13 in headers) */
  labelSize?: number;
  /** white arcs for coloured hero backgrounds */
  inverse?: boolean;
}) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const frac = (n: number) => (total > 0 ? n / total : 0);
  const arc = (n: number, offset: number, kind: "solved" | "failing") => (
    <S.Arc
      $kind={kind}
      $inverse={inverse}
      cx={size / 2}
      cy={size / 2}
      r={r}
      strokeDasharray={`${frac(n) * c} ${c}`}
      strokeDashoffset={-offset * c}
    />
  );
  return (
    <S.Svg
      $labelSize={labelSize}
      $inverse={inverse}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${solved} of ${total} solved`}
    >
      <S.Track $inverse={inverse} cx={size / 2} cy={size / 2} r={r} />
      {failing > 0 && arc(failing, frac(solved), "failing")}
      {solved > 0 && arc(solved, 0, "solved")}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">
        {label ?? (total > 0 ? `${solved}/${total}` : "–")}
      </text>
    </S.Svg>
  );
}
