// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TravenEditor } from "@freedomware/traven";
import { ExpandEmbedPlugin } from "../src/plugin.js";

if (typeof window !== "undefined") {
  window.Range.prototype.getClientRects = function () {
    return { length: 0, item: () => null, [Symbol.iterator]: function* () {} };
  };
  window.Range.prototype.getBoundingClientRect = function () {
    return { bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0 };
  };
}

function tick(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("in-editor [[ autocomplete", () => {
  let container;
  /** @type {TravenEditor} */
  let editor;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (editor && typeof editor.destroy === "function") editor.destroy();
    container.remove();
  });

  it("shows typeahead and inserts [[slug|Title]]", async () => {
    editor = new TravenEditor({
      element: container,
      initialValue: "",
      onSuggestLinks: async () => [
        { title: "Finland", url: "/finland", slug: "finland" },
      ],
      plugins: [new ExpandEmbedPlugin()],
    });

    await tick(0);
    editor.replaceSelection("[[fin");
    await tick(250);

    const list = document.getElementById("traven-wikilink-suggest-list");
    expect(list).toBeTruthy();
    const item = list.querySelector(".traven-link-suggest-item");
    expect(item).toBeTruthy();
    item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(editor.getValue()).toBe("[[finland|Finland]]");
  });

  it("keeps the expand prefix on complete", async () => {
    editor = new TravenEditor({
      element: container,
      initialValue: "",
      onSuggestLinks: async () => [
        { title: "Finland", url: "/finland", slug: "finland" },
      ],
      plugins: [new ExpandEmbedPlugin()],
    });

    await tick(0);
    editor.replaceSelection("[[>fin");
    await tick(250);

    const list = document.getElementById("traven-wikilink-suggest-list");
    expect(list).toBeTruthy();
    list.querySelector(".traven-link-suggest-item").dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    );

    expect(editor.getValue()).toBe("[[>finland|Finland]]");
  });
});
