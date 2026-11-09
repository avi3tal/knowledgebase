import styled, { css } from "styled-components";
import { fadeUp, pop } from "../theme/animations";
import { t } from "../theme/theme";

// ---------------------------------------------------------------- session cards

export const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
`;

// TODO(token): session status accents (amber / indigo / emerald / slate)
const STATUS_ACCENT: Record<string, string> = {
  planned: "#6366f1",
  done: "#10b981",
  abandoned: "#94a3b8",
};

export const SessionCard = styled.a<{ $status: string; $i: number }>`
  --card: ${({ $status }) => STATUS_ACCENT[$status] ?? "#f59e0b"};
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 12px;
  border-radius: ${t.radius};
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadow};
  color: ${t.text};
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  animation: ${fadeUp} 0.4s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 20) * 30}ms;
  ${({ $status }) => $status === "abandoned" && "opacity: 0.8;"}
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: var(--card);
  }
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${t.shadowLift};
    text-decoration: none;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
`;

export const CardIcon = styled.span`
  font-size: 1.4em;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--card) 14%, transparent);
`;

export const CardName = styled.div`
  font-weight: 700;
  font-size: 1.02em;
`;

export const CardGoal = styled.div`
  color: ${t.muted};
  font-size: 0.86em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardFoot = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;
`;

export const FootPill = styled.span`
  font-size: 0.75em;
  border-radius: 999px;
  padding: 1px 9px;
  background: ${t.panel2};
  color: ${t.muted};
`;

// ---------------------------------------------------------------- builder

export const Builder = styled.section`
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: 18px;
  box-shadow: ${t.shadow};
  padding: 18px 22px 22px;
  margin-bottom: 18px;
  animation: ${pop} 0.2s ease both;
  h2 {
    margin-top: 0;
  }
`;

export const Field = styled.div<{ $grow?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
  ${({ $grow }) => $grow && "flex: 1;"}
  & > label {
    font-weight: 700;
    font-size: 0.88em;
  }
`;

export const FieldRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  align-items: flex-start;
`;

export const FocusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
`;

// TODO(token): focus accent pink
export const FocusOption = styled.button<{ $on: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 14px;
  border-radius: 12px;
  text-align: left;
  ${({ $on }) =>
    $on &&
    css`
      border-color: #ec4899;
      background: color-mix(in srgb, #ec4899 9%, ${t.panel});
      box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
    `}
`;

export const FocusIcon = styled.span`
  font-size: 1.4em;
`;

export const Pills = styled.div<{ $spaced?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  ${({ $spaced }) => $spaced && "margin-bottom: 4px;"}
`;

/**
 * Toggle chip. `$color` is the group colour of a topic, `$difficulty` tints a difficulty toggle;
 * both only matter while selected.
 */
export const PillButton = styled.button<{ $on: boolean; $color?: string; $difficulty?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  border: 1px solid ${t.border};
  background: color-mix(in srgb, ${t.muted} 13%, transparent);
  color: ${t.muted};
  ${({ $on, $color, $difficulty }) => {
    if (!$on) return "";
    const c =
      $difficulty === "easy"
        ? t.ok
        : $difficulty === "medium"
          ? t.warn
          : $difficulty === "hard"
            ? t.bad
            : ($color ?? t.accent);
    return css`
      background: ${c};
      border-color: ${c};
      color: #fff;
    `;
  }}
`;

// TODO(token): amber-to-pink call to action
export const GenerateButton = styled.button`
  padding: 10px 22px;
  font-size: 1.05em;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #ec4899);
  border: none;
  color: #fff;
  font-weight: 600;
`;

export const Callout = styled.div`
  background: ${t.panel2};
  border-left: 3px solid ${t.warn};
  padding: 10px 14px;
  border-radius: 6px;
  margin: 12px 0;
`;
