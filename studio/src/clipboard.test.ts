import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

afterEach(() => vi.unstubAllGlobals());

describe("copyText", () => {
  it("writes a string with writeText", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await copyText("# page");
    expect(writeText).toHaveBeenCalledWith("# page");
  });

  it("hands a pending text to ClipboardItem so the click's activation is kept", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const items: Record<string, unknown>[] = [];
    vi.stubGlobal("navigator", { clipboard: { write, writeText: vi.fn() } });
    vi.stubGlobal(
      "ClipboardItem",
      class {
        constructor(data: Record<string, unknown>) {
          items.push(data);
        }
      },
    );
    await copyText(Promise.resolve("# page"));
    expect(write).toHaveBeenCalledOnce();
    const blob = await (items[0]?.["text/plain"] as Promise<Blob>);
    expect(await blob.text()).toBe("# page");
  });

  it("falls back to writeText when promise items are unsupported", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const write = vi.fn().mockRejectedValue(new Error("unsupported"));
    vi.stubGlobal("navigator", { clipboard: { write, writeText } });
    vi.stubGlobal("ClipboardItem", class {});
    await copyText(Promise.resolve("# page"));
    expect(writeText).toHaveBeenCalledWith("# page");
  });

  it("rejects when the text can't be loaded", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });
    await expect(copyText(Promise.reject(new Error("404")))).rejects.toThrow("404");
  });

  it("rejects when there is no clipboard at all", async () => {
    vi.stubGlobal("navigator", {});
    await expect(copyText("x")).rejects.toThrow("copy failed");
  });
});
