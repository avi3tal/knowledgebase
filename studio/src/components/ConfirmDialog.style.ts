import styled from "styled-components";
import { fade, pop } from "../theme/animations";
import { t } from "../theme/theme";

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  background: rgba(10, 12, 20, 0.45);
  backdrop-filter: blur(3px);
  animation: ${fade} 0.2s ease both;
`;

export const Modal = styled.div`
  width: min(460px, calc(100vw - 32px));
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: ${t.shadowLift};
  animation: ${pop} 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
  h3 {
    margin: 0 0 8px;
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
`;

export const Bar = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 0.85em;
  background: ${t.panel2};
  animation: ${pop} 0.2s ease both;
`;
