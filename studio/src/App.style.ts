import styled from "styled-components";
import { t } from "./theme/theme";

/** Page area under the top bar; each page is a full-height Workbench. */
export const Content = styled.main`
  max-width: none;
  padding: 0;
  margin: 0 auto;
`;

export const ErrorCallout = styled.div`
  margin: 24px;
  padding: 10px 14px;
  border-radius: 6px;
  border-left: 3px solid ${t.warn};
  background: ${t.panel2};
`;
