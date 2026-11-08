/**
 * GitHub-style callouts in lesson markdown → styled boxes (pure; tested in callouts.test.ts).
 *
 *   > [!TIP] optional title          kinds: NOTE TIP PITFALL WARNING PROS CONS INTERVIEW NUMBERS
 *   > body markdown…
 *
 *   > [!DIALOGUE]                     each "**Who:** text" line becomes a chat bubble
 *   > **Candidate:** What scale?
 *   > **Interviewer:** 100M DAU.
 *
 * Output is raw HTML wrappers around markdown (blank lines keep the body parsed as markdown;
 * Markdown.tsx renders raw HTML via rehype-raw — lesson content is trusted, authored in the repo).
 */

export const CALLOUTS: Record<string, { icon: string; title: string }> = {
  NOTE: { icon: "ℹ️", title: "Note" },
  TIP: { icon: "💡", title: "Tip" },
  PITFALL: { icon: "⚠️", title: "Pitfall" },
  WARNING: { icon: "⚠️", title: "Warning" },
  PROS: { icon: "👍", title: "Pros" },
  CONS: { icon: "👎", title: "Cons" },
  INTERVIEW: { icon: "🎤", title: "In the interview" },
  NUMBERS: { icon: "🔢", title: "Numbers to remember" },
  DIALOGUE: { icon: "💬", title: "Scoping the problem" },
};

const START = /^>\s*\[!([A-Z]+)\]\s*(.*)$/;
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function dialogue(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const m = /^\*\*([^*:]+):\*\*\s*(.*)$/.exec(line.trim());
    if (!m) {
      if (line.trim()) out.push(line, "");
      continue;
    }
    const who = m[1] ?? "";
    const role = who.toLowerCase().replace(/[^a-z]+/g, "-");
    out.push(
      `<div class="dlg-line dlg-${role}"><span class="dlg-who">${escape(who)}</span>`,
      "",
      m[2] ?? "",
      "",
      "</div>",
    );
  }
  return out;
}

/** Rewrite every `> [!KIND]` blockquote (outside code fences) into a callout wrapper. */
export function expandCallouts(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (/^\s*```/.test(line)) fence = !fence;
    const m = fence ? null : START.exec(line);
    const kind = m?.[1] ?? "";
    if (!m || !CALLOUTS[kind]) {
      out.push(line);
      continue;
    }
    const body: string[] = [];
    while (i + 1 < lines.length && /^>/.test(lines[i + 1] ?? "")) {
      body.push((lines[++i] ?? "").replace(/^>\s?/, ""));
    }
    const c = CALLOUTS[kind];
    const title = (m[2] ?? "").trim() || c.title;
    out.push(
      "",
      `<div class="callout callout-${kind.toLowerCase()}"><div class="callout-title"><span aria-hidden="true">${c.icon}</span> ${escape(title)}</div>`,
      "",
      ...(kind === "DIALOGUE" ? dialogue(body) : body),
      "",
      "</div>",
      "",
    );
  }
  return out.join("\n");
}
