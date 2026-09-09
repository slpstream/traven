// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@freedomware/traven";
import { ExpandEmbedPlugin } from "../src/plugin.js";

if (typeof window !== "undefined") {
  window.Range.prototype.getClientRects = function () {
    return { length: 0, item: () => null, [Symbol.iterator]: function* () {} };
  };
  window.Range.prototype.getBoundingClientRect = function () {
    return { bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0 };
  };
}

function render(md, resolve) {
  const plugin = new ExpandEmbedPlugin(
    resolve ? { resolve } : { resolve: () => "<p>body</p>" }
  );
  return renderMarkdown(md, [plugin]);
}

describe("ExpandEmbedPlugin renderToHTML", () => {
  it("renders [[>slug]] as an expand trigger", () => {
    const html = render("See [[>my-post]] here.");
    expect(html).toContain('class="traven-expand-trigger"');
    expect(html).toContain('data-slug="my-post"');
    expect(html).toContain("<template");
    expect(html).not.toContain("traven-embed");
  });

  it("renders [[!slug]] as .traven-embed", () => {
    const html = render("[[!my-post]]");
    expect(html).toContain('class="traven-embed"');
    expect(html).toContain('data-slug="my-post"');
    expect(html).not.toContain("traven-expand-trigger");
  });

  it("renders [[slug|Label]] as a wikilink anchor", () => {
    const html = render("See [[my-post|Finland]] today.");
    expect(html).toContain('<a class="traven-wikilink"');
    expect(html).toContain('data-slug="my-post"');
    expect(html).toContain(">Finland</a>");
    expect(html).not.toContain("traven-expand-trigger");
    expect(html).not.toContain("traven-embed");
  });

  it("does not dump transclusion HTML for a plain wikilink even when resolve exists", () => {
    const html = render("[[my-post|Finland]]", () => "<p>transcluded</p>");
    expect(html).toContain("traven-wikilink");
    expect(html).not.toContain("transcluded");
  });

  it("omits expand/embed when resolve returns null", () => {
    const html = render("Hello [[>missing]] world", () => null);
    expect(html).not.toContain("traven-expand-trigger");
    expect(html).toContain("Hello");
    expect(html).toContain("world");
  });

  it("passes heading and source to resolve", () => {
    /** @type {object|null} */
    let args = null;
    render("[[>finland^deck|Finland]]", (a) => {
      args = a;
      return "<p>ok</p>";
    });
    expect(args).toMatchObject({
      slug: "finland",
      source: "deck",
      mode: "expand",
    });
  });

  it("includes heading on expand markup", () => {
    const html = render("[[>my-post#Origins|Go]]");
    expect(html).toContain('data-heading="Origins"');
    expect(html).toContain(">Go</button>");
  });

  it("leaves incomplete [[ as text so autocomplete can run", () => {
    const html = render("See [[fin");
    expect(html).not.toContain("traven-wikilink");
    expect(html).not.toContain("traven-expand-trigger");
    expect(html).toContain("[[fin");
  });
});

describe("CommonMark collisions", () => {
  it("leaves [text](url) as a Link", () => {
    const html = render("Go [Google](https://google.com) now.");
    expect(html).toContain('href="https://google.com"');
    expect(html).toContain("Google");
    expect(html).not.toContain("traven-wikilink");
    expect(html).not.toContain("traven-expand-trigger");
  });

  it("leaves task list markers alone", () => {
    const html = render("- [ ] todo\n- [x] done");
    expect(html).toMatch(/checkbox|task|unchecked|checked/i);
    expect(html).not.toContain("traven-expand-trigger");
    expect(html).not.toContain("traven-wikilink");
  });

  it("does not treat [expand slug=\"x\"] as a widget", () => {
    const html = render('Hello [expand slug="x"] world');
    expect(html).not.toContain("traven-expand-trigger");
    expect(html).not.toContain("traven-embed");
    expect(html).toContain("expand");
  });

  it("does not tokenize [[slug]] inside inline code", () => {
    const html = render("Use `[[slug]]` in docs.");
    expect(html).toContain("<code>");
    expect(html).not.toContain("traven-wikilink");
    expect(html).not.toContain("traven-expand-trigger");
  });

  it("does not tokenize [[slug]] inside fenced code", () => {
    const html = render("```\n[[slug]]\n```");
    expect(html).toContain("<pre>");
    expect(html).not.toContain("traven-wikilink");
    expect(html).not.toContain("traven-expand-trigger");
  });

  it("does not regress GitHub alerts", () => {
    const html = render("> [!NOTE]\n> This is a note.");
    expect(html).toContain("traven-alert");
    expect(html).not.toContain("[!NOTE]");
    expect(html).not.toContain("traven-wikilink");
  });
});
