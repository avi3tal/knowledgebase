import { createGlobalStyle } from "styled-components";
import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2";
import monoUrl from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2";
import { colorDeclarations, darkColors, lightColors, t, tokens } from "./theme";

/**
 * App-wide rules: fonts, the theme's CSS variables (light on :root, dark on [data-theme="dark"]),
 * a small reset and the default look of bare elements (links, code, form controls). Everything
 * component-specific lives in that component's `.style.ts`.
 */
export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "Inter Variable";
    font-style: normal;
    font-display: swap;
    font-weight: 100 900;
    src: url(${interUrl}) format("woff2-variations");
  }
  @font-face {
    font-family: "JetBrains Mono Variable";
    font-style: normal;
    font-display: swap;
    font-weight: 100 800;
    src: url(${monoUrl}) format("woff2-variations");
  }

  :root {
    ${colorDeclarations(lightColors)}
    color-scheme: light;
    font-family: ${tokens.fontSans};
    font-size: 14px;
    font-feature-settings: "cv11", "ss01";
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
    color: ${t.text};
    background: ${t.bg};
  }
  :root[data-theme="dark"] {
    ${colorDeclarations(darkColors)}
    color-scheme: dark;
  }

  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
  }
  a {
    color: ${t.accent};
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  code,
  pre,
  kbd {
    font-family: ${t.fontMono};
    font-size: 0.88em;
  }
  button,
  select,
  input,
  textarea {
    background: ${t.panel};
    color: ${t.text};
    border: 1px solid ${t.border};
    border-radius: ${t.radiusSm};
    padding: 5px 11px;
    cursor: pointer;
    font: inherit;
    transition:
      border-color 0.15s,
      background 0.15s,
      transform 0.15s;
  }
  input,
  textarea {
    cursor: text;
  }
  textarea {
    width: 100%;
    resize: vertical;
    min-height: 34px;
    field-sizing: content;
  }
  input:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid ${t.accentSoft};
    border-color: ${t.accent};
  }
  button:hover:not(:disabled) {
    border-color: ${t.accent};
  }
  button:active:not(:disabled) {
    transform: scale(0.97);
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;
