import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./console.css";
import "./workbench.css";
import "./learn-bench.css";
import "./practice-bench.css";
import "./reader.css";
import "./figures.css";

const el = document.getElementById("root");
if (!el) throw new Error("missing #root");
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
