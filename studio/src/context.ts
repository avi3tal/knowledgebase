import { createContext } from "react";
import type { Subject } from "./api";

/** Absolute repo root on disk, used to build vscode://file links. */
export const RootContext = createContext<string>("");

/**
 * The subject being viewed (topics with names, groups, has_lesson…) and every subject, so any page can
 * build its Workbench left pane without extra fetches. `subject` is null while loading.
 */
export const SubjectContext = createContext<{ subject: Subject | null; subjects: Subject[] }>({
  subject: null,
  subjects: [],
});
