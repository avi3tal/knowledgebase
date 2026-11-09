import styled from "styled-components";
import { fadeUp, pop } from "../theme/animations";
import { t } from "../theme/theme";
import { IdChip, monoText } from "./DesignShared.style";

/** Colour of each scope list (functional, non-functional, assumptions, out of scope). */
const SCOPE_COLORS: Record<string, string> = {
  functional: t.accent,
  non_functional: t.cyan,
  assumptions: "#ca8a04", // TODO(token)
  out_of_scope: "#64748b", // TODO(token)
};
export const scopeColor = (key: string): string => SCOPE_COLORS[key] ?? t.accent;

// ------------------------------------------------------------------ scope

export const ScopeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
`;

export const ScopeCol = styled.section<{ $color: string; $i: number }>`
  border-radius: 14px;
  padding: 10px 12px 12px;
  background: color-mix(in srgb, ${({ $color }) => $color} 6%, ${t.panel});
  border: 1px solid color-mix(in srgb, ${({ $color }) => $color} 25%, ${t.border});
  border-top: 4px solid ${({ $color }) => $color};
  animation: ${fadeUp} 0.35s ease both;
  animation-delay: ${({ $i }) => $i * 50}ms;
`;

export const ScopeHeader = styled.header`
  margin-bottom: 8px;
`;

export const ScopeItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px;
  align-items: start;
  margin-bottom: 6px;
  animation: ${pop} 0.2s ease both;
`;

export const ScopeId = styled(IdChip)`
  margin-top: 7px;
`;

export const StageFoot = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  color: ${t.muted};
  font-size: 0.85em;
`;

// ------------------------------------------------------------------ estimates

export const Estimates = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
  align-items: start;
  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }
`;

export const RowMoves = styled.td`
  white-space: nowrap;
  button {
    padding: 1px 6px;
    font-size: 0.8em;
  }
`;

export const ValueCell = styled.td<{ $stale: boolean }>`
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  ${({ $stale }) => $stale && "opacity: 0.45;"}
  b {
    font-size: 1.05em;
  }
`;

export const CellError = styled.span`
  color: ${t.bad};
  white-space: normal;
  font-size: 0.85em;
  display: inline-block;
  max-width: 260px;
  text-align: left;
`;

export const RefCard = styled.aside`
  background: linear-gradient(160deg, color-mix(in srgb, #0ea5e9 10%, ${t.panel}), ${t.panel});
  border: 1px solid ${t.border};
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 0.85em;
  h4 {
    margin: 10px 0 4px;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${t.muted};
  }
  dl {
    margin: 0;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 2px 0;
    border-bottom: 1px dashed ${t.border};
  }
  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  ul {
    margin: 0;
    padding-left: 18px;
  }
`;

export const Mono = styled.dt`
  ${monoText}
`;

// ------------------------------------------------------------------ API & data

const METHOD_COLORS: Record<string, string> = {
  get: t.ok,
  post: "#2563eb", // TODO(token)
  put: "#ca8a04", // TODO(token)
  patch: "#ca8a04", // TODO(token)
  delete: t.bad,
};

export const MethodSelect = styled.select<{ $method: string }>`
  font-weight: 700;
  font-family: "JetBrains Mono", ui-monospace, Menlo, monospace;
  font-size: 0.85em;
  color: ${({ $method }) => METHOD_COLORS[$method.toLowerCase()] ?? t.text};
`;

// ------------------------------------------------------------------ deep dives

export const Dives = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const DiveCard = styled.section<{ $i: number }>`
  border: 1px solid ${t.border};
  border-left: 4px solid #db2777; /* TODO(token) */
  border-radius: 14px;
  padding: 12px 14px;
  background: color-mix(in srgb, #db2777 4%, ${t.panel}); /* TODO(token) */
  animation: ${fadeUp} 0.35s ease both;
  animation-delay: ${({ $i }) => $i * 50}ms;
`;

export const DiveHeader = styled.header`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

export const DiveTitle = styled.input`
  flex: 1;
  font-weight: 600;
`;

export const DiveDecision = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
  align-items: flex-start;
  label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
`;

export const GrowField = styled.label`
  flex: 1;
`;

// ------------------------------------------------------------------ wrap-up

export const Wrapup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
`;

export const WrapCard = styled.label<{ $i: number }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid ${t.border};
  border-radius: 14px;
  background: ${t.panel2};
  animation: ${fadeUp} 0.35s ease both;
  animation-delay: ${({ $i }) => $i * 50}ms;
`;

export const WrapTitle = styled.span`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const Chars = styled.span<{ $ok: boolean }>`
  margin-left: auto;
  font-size: 0.75em;
  font-weight: 400;
  color: ${({ $ok }) => ($ok ? t.ok : t.muted)};
`;
