/**
 * Copy text to the clipboard. `text` may be a promise (e.g. a fetch started by the click): it is
 * handed to `ClipboardItem` so Safari keeps the click's user activation while the text loads.
 * Falls back to `writeText`, then to a hidden textarea + `execCommand("copy")`.
 * Rejects when the text can't be produced or nothing could be copied.
 */
export async function copyText(text: string | Promise<string>): Promise<void> {
  const clip = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (typeof text !== "string" && clip?.write && typeof ClipboardItem !== "undefined") {
    const blob = text.then((s) => new Blob([s], { type: "text/plain" }));
    try {
      await clip.write([new ClipboardItem({ "text/plain": blob })]);
      return;
    } catch {
      // promise-valued items unsupported (or denied): copy the resolved text below
    }
  }
  const s = await text;
  try {
    if (!clip?.writeText) throw new Error("no clipboard API");
    await clip.writeText(s);
  } catch {
    if (!execCopy(s)) throw new Error("copy failed");
  }
}

function execCopy(s: string): boolean {
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = s;
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand("copy");
  } finally {
    ta.remove();
  }
}
