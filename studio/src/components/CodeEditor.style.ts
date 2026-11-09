import styled, { css } from "styled-components";
import { t } from "../theme/theme";

/** Both layers must share metrics exactly so the underlay lines up with the textarea's text. */
const layer = css`
  position: absolute;
  inset: 0;
  margin: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 12px 16px;
  border: 0;
  border-radius: 0;
  font-family: ${t.fontMono};
  font-size: 13.5px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: normal;
  tab-size: 4;
  white-space: pre;
  word-spacing: normal;
  text-indent: 0;
`;

export const Editor = styled.div`
  position: relative;
  height: 460px;
  min-height: 420px;
  background: ${t.panel2};
  border: 1px solid ${t.border};
  border-radius: 10px;
  overflow: hidden;
  &:focus-within {
    border-color: ${t.accent};
    box-shadow: 0 0 0 3px ${t.accentSoft};
  }
`;

export const Under = styled.pre`
  ${layer}
  overflow: hidden;
  /* room so the mirrored scroll range matches the textarea's (which has scrollbars) */
  padding-right: 32px;
  padding-bottom: 32px;
  color: ${t.text};
  background: none;
  pointer-events: none;
  code {
    font: inherit;
    display: block;
    width: max-content;
    min-width: 100%;
    background: none;
    border: 0;
    padding: 0;
  }
`;

export const Line = styled.span`
  display: block;
`;

export const Input = styled.textarea`
  ${layer}
  resize: none;
  field-sizing: fixed;
  overflow: auto;
  background: transparent;
  color: transparent;
  caret-color: ${t.text};
  outline: none;
  min-height: 0;
  &:focus {
    outline: none;
    border: 0;
  }
  &::selection {
    background: ${t.accentSoft};
    color: transparent;
  }
`;
