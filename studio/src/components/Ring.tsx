/** Animated progress ring: solved (green) then failing (red) arcs over a track. */
export function Ring({
  solved,
  failing = 0,
  total,
  size = 44,
}: {
  solved: number;
  failing?: number;
  total: number;
  size?: number;
}) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const frac = (n: number) => (total > 0 ? n / total : 0);
  const arc = (n: number, offset: number, cls: string) => (
    <circle
      className={`ring-arc ${cls}`}
      cx={size / 2}
      cy={size / 2}
      r={r}
      strokeDasharray={`${frac(n) * c} ${c}`}
      strokeDashoffset={-offset * c}
      style={{ ["--len" as string]: `${frac(n) * c}` }}
    />
  );
  return (
    <svg
      className="ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${solved} of ${total} solved`}
    >
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} />
      {failing > 0 && arc(failing, frac(solved), "failing")}
      {solved > 0 && arc(solved, 0, "solved")}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">
        {total > 0 ? `${solved}/${total}` : "–"}
      </text>
    </svg>
  );
}
