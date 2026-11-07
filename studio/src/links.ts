import { problemHref } from "./route";

// Resolve relative links inside repo markdown to in-app routes or VS Code file links.

export function resolveRepoPath(fromFile: string, href: string): string {
  const parts = fromFile.split("/").slice(0, -1);
  for (const seg of href.split("#")[0]!.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== "." && seg !== "") parts.push(seg);
  }
  return parts.join("/");
}

export type LinkTarget =
  | { kind: "external"; href: string }
  | { kind: "route"; href: string }
  | { kind: "file"; href: string; path: string };

export function linkTarget(fromFile: string, href: string, root: string): LinkTarget {
  if (/^[a-z]+:/i.test(href) || href.startsWith("#")) return { kind: "external", href };
  const path = resolveRepoPath(fromFile, href);
  const lesson = /^([a-z0-9-]+)\/learn\/([a-z0-9-]+)\//.exec(path);
  if (lesson) return { kind: "route", href: `#/learn/${lesson[1]}/${lesson[2]}` };
  const problem = /^([a-z0-9-]+)\/problems\/([a-z0-9-]+)(\/README\.md)?$/.exec(path);
  if (problem) return { kind: "route", href: problemHref(problem[1]!, problem[2]!) };
  return { kind: "file", href: `vscode://file${root}/${path}`, path };
}
