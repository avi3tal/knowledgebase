/**
 * Design tokens: the only place colours, fonts, spacing, radii and shadows are defined.
 *
 * `lightTheme` / `darkTheme` hold the values. GlobalStyle publishes them as CSS custom properties
 * (`:root` for light, `:root[data-theme="dark"]` for dark), and style files reference them through
 * `t` — typed `var(--…)` strings — so a theme switch needs no re-render and every token is checked
 * by the compiler.
 */

/** Group / series palette (catalog groups, map rings, charts), referenced by index or key. */
export const PALETTE = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
] as const;

export interface Colors {
  bg: string;
  panel: string;
  panel2: string;
  border: string;
  borderStrong: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  ok: string;
  bad: string;
  warn: string;
  window: string;
  onAccent: string;
  tech: string;
  pattern: string;
  core: string;
  violet: string;
  cyan: string;
  shadow: string;
  shadowLift: string;
}

export const lightColors: Colors = {
  bg: "#f7f7f9",
  panel: "#ffffff",
  panel2: "#f2f3f6",
  border: "#e5e6eb",
  borderStrong: "#d4d6de",
  text: "#17181c",
  muted: "#696d7a",
  faint: "#9a9ead",
  accent: "#4f46e5",
  accentSoft: "rgba(79, 70, 229, 0.09)",
  ok: "#059669",
  bad: "#dc2626",
  warn: "#d97706",
  window: "rgba(79, 70, 229, 0.12)",
  onAccent: "#ffffff",
  tech: "#0ea5e9",
  pattern: "#a855f7",
  core: "#ec4899",
  violet: "#9333ea",
  cyan: "#0891b2",
  shadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
  shadowLift: "0 12px 32px rgba(16, 24, 40, 0.12), 0 2px 6px rgba(16, 24, 40, 0.06)",
};

export const darkColors: Colors = {
  bg: "#0c0d10",
  panel: "#141519",
  panel2: "#1c1d23",
  border: "#26282f",
  borderStrong: "#353843",
  text: "#ececf0",
  muted: "#9b9eab",
  faint: "#6c6f7c",
  accent: "#8b93ff",
  accentSoft: "rgba(139, 147, 255, 0.13)",
  ok: "#4cc38a",
  bad: "#ef6b6b",
  warn: "#f3b54a",
  window: "rgba(139, 147, 255, 0.16)",
  onAccent: "#0b0d12",
  tech: "#38bdf8",
  pattern: "#c084fc",
  core: "#f472b6",
  violet: "#a78bfa",
  cyan: "#22d3ee",
  shadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
  shadowLift: "0 16px 40px rgba(0, 0, 0, 0.55)",
};

/** Mode-independent tokens. */
export const tokens = {
  fontSans: `"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`,
  fontMono: `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`,
  space: { s1: "4px", s2: "8px", s3: "12px", s4: "16px", s5: "24px", s6: "32px", s7: "48px" },
  radius: "10px",
  radiusSm: "6px",
  topbarH: "52px",
  readW: "78ch",
} as const;

export interface AppTheme {
  mode: "light" | "dark";
  colors: Colors;
  palette: readonly string[];
}

export const lightTheme: AppTheme = { mode: "light", colors: lightColors, palette: PALETTE };
export const darkTheme: AppTheme = { mode: "dark", colors: darkColors, palette: PALETTE };

/** kebab-case custom property name of a colour key: panel2 → --panel-2, accentSoft → --accent-soft. */
export function cssVarName(key: string): string {
  return `--${key
    .replace(/([A-Z])/g, "-$1")
    .replace(/(\d+)/g, "-$1")
    .toLowerCase()}`;
}

const colorVars = Object.fromEntries(
  (Object.keys(lightColors) as (keyof Colors)[]).map((k) => [k, `var(${cssVarName(k)})`]),
) as Record<keyof Colors, string>;

/**
 * Typed token references for style files: `${t.accent}`, `${t.s4}`, `${t.fontMono}`.
 * Colours resolve per theme through CSS variables; the rest are constants.
 */
export const t = {
  ...colorVars,
  fontSans: tokens.fontSans,
  fontMono: tokens.fontMono,
  ...tokens.space,
  radius: tokens.radius,
  radiusSm: tokens.radiusSm,
  topbarH: tokens.topbarH,
  readW: tokens.readW,
  /** difficulty colours */
  easy: colorVars.ok,
  medium: colorVars.warn,
  hard: colorVars.bad,
} as const;

/** The `:root` declarations of a colour set (used by GlobalStyle). */
export function colorDeclarations(c: Colors): string {
  return (Object.keys(c) as (keyof Colors)[]).map((k) => `${cssVarName(k)}: ${c[k]};`).join("\n");
}
