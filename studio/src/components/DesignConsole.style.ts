import styled, { css } from "styled-components";
import { breathe, fadeUp, shimmer, toastIn } from "../theme/animations";
import { t } from "../theme/theme";
import { ErrorLine } from "./DesignShared.style";

/**
 * The console shell. It sits around the shared `Workbench`, whose header and footer are the first /
 * last element children of its root; they are tightened here (one dense row, a colour strip).
 */
export const Root = styled.div`
  position: relative;
  & > div > header {
    gap: 10px;
    padding: 8px 16px;
    position: relative;
    &::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 2px;
      background: linear-gradient(90deg, #4f46e5, #0ea5e9, #db2777, #f59e0b);
      opacity: 0.8;
    }
    button {
      white-space: nowrap;
    }
    > nav {
      padding: 0 12px;
      > * {
        padding: 9px 12px;
        font-size: 0.92em;
        @media (max-width: 1440px) {
          padding: 9px 7px;
          gap: 5px;
        }
      }
    }
  }
  & > div > footer {
    gap: 10px;
    padding: 6px 14px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
`;

// ------------------------------------------------------------------ header

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.s3};
  flex-wrap: wrap;
  min-width: 0;
`;

export const Back = styled.a`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: ${t.panel2};
  color: ${t.text};
  text-decoration: none;
  font-weight: 700;
  flex: none;
  &:hover {
    background: ${t.accentSoft};
    color: ${t.accent};
    text-decoration: none;
  }
`;

export const Title = styled.h1`
  margin: 0;
  flex-shrink: 0;
  font-size: 1.08em;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  min-width: 0;
`;

export const Difficulty = styled.span<{ $difficulty: string }>`
  font-size: 0.72em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 1px 8px;
  font-weight: 700;
  color: ${({ $difficulty }) =>
    $difficulty === "easy" ? t.easy : $difficulty === "medium" ? t.medium : t.hard};
  background: color-mix(
    in srgb,
    ${({ $difficulty }) =>
        $difficulty === "easy" ? t.easy : $difficulty === "medium" ? t.medium : t.hard}
      20%,
    transparent
  );
`;

export const SubmittedTag = styled.span`
  font-size: 0.7em;
  border-radius: 4px;
  padding: 0 5px;
  margin-left: 6px;
  background: color-mix(in srgb, ${t.ok} 15%, transparent);
  color: ${t.ok};
`;

export const Attempt = styled.code`
  color: ${t.muted};
  font-size: 0.85em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 190px;
  @media (max-width: 1360px) {
    max-width: 130px;
  }
`;

export const VsCode = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  white-space: nowrap;
`;

export const Command = styled.code`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
  min-width: 60px;
  cursor: copy;
  @media (max-width: 1180px) {
    display: none;
  }
`;

export const HeaderError = styled(ErrorLine).attrs({ $flat: true })`
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Timer = styled.button<{ $over: boolean; $paused: boolean }>`
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  ${({ $over }) =>
    $over &&
    css`
      color: ${t.warn};
      border-color: ${t.warn};
    `}
  ${({ $paused }) => $paused && "opacity: 0.6;"}
`;

export const SaveState = styled.span<{ $state: "idle" | "pending" | "saving" | "saved" | "error" }>`
  font-size: 0.82em;
  padding: 3px 10px;
  border-radius: 999px;
  background: ${t.panel2};
  color: ${t.muted};
  min-width: 82px;
  text-align: center;
  white-space: nowrap;
  transition:
    background 0.2s,
    color 0.2s;
  ${({ $state }) =>
    $state === "pending" || $state === "saving"
      ? css`
          color: ${t.accent};
        `
      : $state === "saved"
        ? css`
            color: ${t.ok};
            background: color-mix(in srgb, ${t.ok} 12%, transparent);
          `
        : $state === "error"
          ? css`
              color: #fff;
              background: ${t.bad};
            `
          : ""}
  ${({ $state }) =>
    $state === "saving" &&
    css`
      animation: ${breathe} 1s ease-in-out infinite;
      @media (prefers-reduced-motion: reduce) {
        animation: none !important;
      }
    `}
`;

export const CheckButton = styled.button`
  font-weight: 600;
  border-color: ${t.ok};
  color: ${t.ok};
  &:hover:not(:disabled) {
    background: color-mix(in srgb, ${t.ok} 10%, transparent);
    border-color: ${t.ok};
  }
`;

export const SubmitButton = styled.button`
  background-image: linear-gradient(120deg, #4f46e5, #db2777);
  border: none;
  color: #fff;
  font-weight: 600;
`;

// ------------------------------------------------------------------ tabs

export const TabNum = styled.span<{ $on: boolean; $done: boolean; $color: string }>`
  display: inline-grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  font-size: 0.75em;
  font-weight: 800;
  background: ${t.panel2};
  color: ${t.muted};
  transition:
    background 0.2s,
    color 0.2s;
  ${({ $on, $done, $color }) =>
    $done
      ? css`
          background: ${t.ok};
          color: #fff;
        `
      : $on &&
        css`
          background: ${$color};
          color: #fff;
        `}
`;

export const RefLabel = styled.span`
  color: ${t.warn};
`;

// ------------------------------------------------------------------ centre

export const Form = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  animation: ${fadeUp} 0.3s ease both;
  h3 {
    margin: 16px 0 8px;
    font-size: 1em;
  }
`;

export const StageTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 1.15em;
`;

// ------------------------------------------------------------------ footer

export const Progress = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Bar = styled.div`
  width: 160px;
  height: 8px;
  border-radius: 999px;
  background: ${t.panel2};
  overflow: hidden;
  @media (max-width: 1180px) {
    width: 90px;
  }
`;

export const BarFill = styled.span<{ $pct: number }>`
  display: block;
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${t.ok}, #0ea5e9, #6366f1);
  background-size: 200% 100%;
  transition: width 0.6s cubic-bezier(0.2, 0.9, 0.3, 1);
  animation: ${shimmer} 3s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

export const Chip = styled.span<{ $tone?: "bad" | "ok" }>`
  font-size: 0.9em;
  padding: 2px 10px;
  border-radius: 999px;
  background: ${t.panel2};
  ${({ $tone }) =>
    $tone === "bad"
      ? css`
          color: ${t.bad};
          background: color-mix(in srgb, ${t.bad} 10%, transparent);
        `
      : $tone === "ok"
        ? css`
            color: ${t.ok};
          `
        : ""}
`;

// ------------------------------------------------------------------ toast

export const Toast = styled.div<{ $good: boolean }>`
  position: fixed;
  right: 24px;
  bottom: 64px;
  z-index: 60;
  padding: 12px 18px;
  border-radius: 12px;
  background: ${t.text};
  color: ${t.bg};
  box-shadow: ${t.shadowLift};
  font-weight: 600;
  animation: ${toastIn} 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
  ${({ $good }) =>
    $good &&
    css`
      background: linear-gradient(120deg, ${t.ok}, #0ea5e9);
      color: #fff;
    `}
`;
