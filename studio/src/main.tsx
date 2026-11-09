import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { App } from "./App";
import "./styles.css";
import "./console.css";
import "./workbench.css";
import "./learn-bench.css";
import "./practice-bench.css";
import "./reader.css";
import "./figures.css";
import "./codeblock.css";

const el = document.getElementById("root");
if (!el) throw new Error("missing #root");
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
