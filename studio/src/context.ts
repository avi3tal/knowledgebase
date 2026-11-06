import { createContext } from "react";

/** Absolute repo root on disk, used to build vscode://file links. */
export const RootContext = createContext<string>("");
