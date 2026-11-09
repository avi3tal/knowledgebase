/** Shared animations (styled-components keyframes). Use as `animation: ${fadeUp} 0.3s ease both`. */
import { keyframes } from "styled-components";

export const badgeDone = keyframes`
  0% {
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.35);
  }
  100% {
    transform: none;
  }
`;

export const breathe = keyframes`
  50% {
    opacity: 0.55;
  }
`;

export const dashFlow = keyframes`
  to {
    stroke-dashoffset: -26;
  }
`;

export const fade = keyframes`
  from {
    opacity: 0;
  }
`;

export const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

export const figMarch = keyframes`
  to {
    stroke-dashoffset: -14;
  }
`;

export const figProgress = keyframes`
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
`;

export const float = keyframes`
  50% {
    transform: translateY(-5px);
  }
`;

export const glowPulse = keyframes`
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, #db2777 0%, transparent);
  }
  50% {
    box-shadow: 0 0 0 5px color-mix(in srgb, #db2777 22%, transparent);
  }
`;

export const growX = keyframes`
  from {
    transform: scaleX(0);
  }
`;

export const heroShift = keyframes`
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
`;

export const justPassed = keyframes`
  0% {
    background: color-mix(in srgb, var(--ok) 35%, transparent);
    transform: scale(1.02);
  }
  100% {
    background: transparent;
    transform: none;
  }
`;

export const lbFade = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const lbPop = keyframes`
  from {
    transform: scale(0.6);
  }
  to {
    transform: scale(1);
  }
`;

export const lbPulse = keyframes`
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.5;
  }
`;

export const lbRise = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

export const markPop = keyframes`
  0% {
    transform: scale(0.4) rotate(-30deg);
  }
  60% {
    transform: scale(1.5) rotate(8deg);
  }
  100% {
    transform: none;
  }
`;

export const newGlow = keyframes`
  0%,
  100% {
    filter: drop-shadow(0 0 0 transparent);
  }
  50% {
    filter: drop-shadow(0 0 7px color-mix(in srgb, var(--ok) 70%, transparent));
  }
`;

export const nodeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.85);
  }
`;

export const pbIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

export const pop = keyframes`
  from {
    opacity: 0;
    transform: scale(0.97) translateY(-6px);
  }
`;

export const popChange = keyframes`
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.12);
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.25);
  }
  100% {
    transform: scale(1);
  }
`;

export const pulse = keyframes`
  70% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
`;

export const rdIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

export const ringFill = keyframes`
  from {
    stroke-dasharray: 0 999;
  }
`;

export const shimmer = keyframes`
  to {
    background-position: -200% 0;
  }
`;

export const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const toastIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
`;
