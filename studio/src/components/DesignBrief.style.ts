import styled from "styled-components";

export const Card = styled.section`
  margin-bottom: 14px;
  h4 {
    margin: 0 0 6px;
    font-size: 0.85em;
  }
  /* the rendered interviewer notes (Markdown) */
  > div {
    font-size: 0.88em;
  }
  > div ul {
    padding-left: 18px;
    margin: 4px 0;
  }
`;

export const Reqs = styled.div`
  ul {
    list-style: none;
    margin: 4px 0 10px;
    padding: 0;
    font-size: 0.88em;
  }
  li {
    padding: 3px 0;
  }
`;
