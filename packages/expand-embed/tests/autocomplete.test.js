import { describe, it, expect } from "vitest";
import {
  findOpenWikilink,
  formatWikilinkCompletion,
} from "../src/wikilink-complete.js";

describe("findOpenWikilink", () => {
  it("finds [[ at the cursor", () => {
    const doc = "See [[";
    const found = findOpenWikilink(doc, doc.length);
    expect(found).toEqual({ from: 4, prefix: "", query: "" });
  });

  it("captures a query after [[", () => {
    const doc = "See [[fin";
    const found = findOpenWikilink(doc, doc.length);
    expect(found).toEqual({ from: 4, prefix: "", query: "fin" });
  });

  it("keeps the bang embed prefix", () => {
    const doc = "[[!san";
    const found = findOpenWikilink(doc, doc.length);
    expect(found).toEqual({ from: 0, prefix: "!", query: "san" });
  });

  it("keeps the gt expand prefix", () => {
    const doc = "[[>fin";
    const found = findOpenWikilink(doc, doc.length);
    expect(found).toEqual({ from: 0, prefix: ">", query: "fin" });
  });

  it("stops the query at | # ^", () => {
    expect(findOpenWikilink("[[slug|Lab", 10)?.query).toBe("slug");
    expect(findOpenWikilink("[[slug#He", 9)?.query).toBe("slug");
    expect(findOpenWikilink("[[slug^su", 9)?.query).toBe("slug");
  });

  it("returns null after a completed ]]", () => {
    const doc = "[[slug]] more";
    expect(findOpenWikilink(doc, doc.length)).toBeNull();
    expect(findOpenWikilink("[[slug]]", 8)).toBeNull();
  });

  it("returns null when the cursor is inside a completed wikilink", () => {
    const doc = "[[slug]]";
    expect(findOpenWikilink(doc, 4)).toBeNull();
  });

  it("does not cross a newline", () => {
    const doc = "[[slug\nmore";
    expect(findOpenWikilink(doc, doc.length)).toBeNull();
  });
});

describe("formatWikilinkCompletion", () => {
  it("emits slug only", () => {
    expect(formatWikilinkCompletion({ slug: "post-slug" })).toBe("[[post-slug]]");
  });

  it("emits slug|title when title is set", () => {
    expect(
      formatWikilinkCompletion({ slug: "post-slug", title: "Display Title" })
    ).toBe("[[post-slug|Display Title]]");
  });

  it("preserves bang and gt prefixes", () => {
    expect(
      formatWikilinkCompletion({ prefix: "!", slug: "post-slug", title: "T" })
    ).toBe("[[!post-slug|T]]");
    expect(formatWikilinkCompletion({ prefix: ">", slug: "post-slug" })).toBe(
      "[[>post-slug]]"
    );
  });
});
