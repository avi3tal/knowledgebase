import styled from "styled-components";
import { t } from "../theme/theme";

/**
 * The reading typography of rendered markdown (lessons, READMEs, solutions, design pages). Other
 * pages that show prose wrap their content in `Prose` (or `<Markdown>`, which does) and tweak it
 * with `${Prose} { … }` from their own style file.
 */
export const Prose = styled.div`
  font-size: 15.5px;
  line-height: 1.7;
  color: ${t.text};

  h1 {
    margin-top: 0;
  }
  h2 {
    margin: 2.2em 0 0.6em;
    font-size: 1.4em;
    line-height: 1.3;
    font-weight: 650;
    letter-spacing: -0.012em;
    scroll-margin-top: 12px;
  }
  h3 {
    margin: 1.8em 0 0.5em;
    font-size: 1.12em;
    font-weight: 650;
    scroll-margin-top: 12px;
  }
  h4 {
    margin: 1.5em 0 0.4em;
    font-size: 1em;
    font-weight: 650;
  }
  & > :first-child {
    margin-top: 0.2em;
  }
  h2:first-child {
    margin-top: 0.4em;
  }
  p,
  ul,
  ol {
    margin: 0 0 1em;
  }
  li + li {
    margin-top: 0.3em;
  }
  li > p {
    margin: 0;
  }
  strong {
    font-weight: 650;
  }
  hr {
    border: 0;
    border-top: 1px solid ${t.border};
    margin: 2em 0;
  }

  /* inline code (fenced blocks render through CodeBlock, which styles its own <pre>/<code>) */
  :not(pre) > code {
    font-family: ${t.fontMono};
    font-size: 0.86em;
    background: ${t.panel2};
    border: 1px solid color-mix(in srgb, ${t.border} 70%, transparent);
    padding: 0.08em 0.38em;
    border-radius: 6px;
  }
  pre {
    background: ${t.panel};
    border: 1px solid ${t.border};
    border-radius: 8px;
    padding: 12px 14px;
    overflow-x: auto;
  }

  blockquote {
    margin: 0;
    color: ${t.muted};
    border-left: 3px solid ${t.accent};
    background: ${t.accentSoft};
    padding: 8px 14px;
    border-radius: 0 8px 8px 0;
  }

  details {
    background: ${t.panel};
    border: 1px solid ${t.border};
    border-radius: 6px;
    padding: 6px 12px;
    margin: 6px 0;
  }
  summary {
    cursor: pointer;
    color: ${t.accent};
  }

  /* comparison tables */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 12px 0 16px;
    font-size: 0.92em;
    border: 1px solid ${t.border};
    border-radius: 10px;
    overflow: hidden;
    background: ${t.panel};
    box-shadow: ${t.shadow};
  }
  th {
    text-align: left;
    padding: 8px 12px;
    font-size: 0.8em;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${t.muted};
    background: ${t.panel2};
    border-bottom: 1px solid ${t.border};
  }
  td {
    padding: 8px 12px;
    vertical-align: top;
    border-bottom: 1px solid ${t.border};
  }
  td:first-child {
    font-weight: 600;
  }
  tr:last-child td {
    border-bottom: 0;
  }
  tbody tr:nth-child(even) td {
    background: color-mix(in srgb, ${t.panel2} 45%, transparent);
  }
  tbody tr:hover td {
    background: ${t.accentSoft};
  }
  /* options tables: the chosen option is bold in the first column */
  td:first-child:has(strong) {
    box-shadow: inset 3px 0 0 ${t.ok};
  }
  tr:has(td:first-child strong) td {
    background: color-mix(in srgb, ${t.ok} 9%, transparent);
  }
`;
