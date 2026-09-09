import { describe, it, expect } from "vitest";
import { parseWikilinkAttrs, expandEmbedLabel } from "../src/parser.js";
import { buildWikilink, buildExpandEmbedShortcode } from "../src/shortcode-build.js";

describe("parseWikilinkAttrs", () => {
  it("parses a plain wikilink", () => {
    const r = parseWikilinkAttrs("[[the-spark]]");
    expect(r.mode).toBe("link");
    expect(r.slug).toBe("the-spark");
    expect(r.heading).toBeNull();
    expect(r.text).toBeNull();
    expect(r.source).toBeNull();
  });

  it("parses a labeled wikilink", () => {
    const r = parseWikilinkAttrs("[[christmas-in-finland|Finland]]");
    expect(r.mode).toBe("link");
    expect(r.slug).toBe("christmas-in-finland");
    expect(r.text).toBe("Finland");
  });

  it("parses embed bang prefix", () => {
    const r = parseWikilinkAttrs("[[!other-post]]");
    expect(r.mode).toBe("embed");
    expect(r.slug).toBe("other-post");
  });

  it("parses expand gt prefix with heading and label", () => {
    const r = parseWikilinkAttrs(
      "[[>christmas-in-finland#Rovaniemi: The Official Home of Santa Claus|Click to expand…]]"
    );
    expect(r.mode).toBe("expand");
    expect(r.slug).toBe("christmas-in-finland");
    expect(r.heading).toBe("Rovaniemi: The Official Home of Santa Claus");
    expect(r.text).toBe("Click to expand…");
    expect(r.source).toBeNull();
  });

  it("parses heading on a plain link", () => {
    const r = parseWikilinkAttrs("[[the-spark#The Spark]]");
    expect(r.mode).toBe("link");
    expect(r.slug).toBe("the-spark");
    expect(r.heading).toBe("The Spark");
  });

  it("parses source=deck", () => {
    const r = parseWikilinkAttrs("[[>finland^deck|Finland]]");
    expect(r.slug).toBe("finland");
    expect(r.text).toBe("Finland");
    expect(r.source).toBe("deck");
    expect(r.heading).toBeNull();
    expect(r.mode).toBe("expand");
  });

  it("parses source=summary", () => {
    const r = parseWikilinkAttrs("[[>finland^summary|Finland]]");
    expect(r.source).toBe("summary");
    expect(r.heading).toBeNull();
  });

  it("parses embed with source", () => {
    const r = parseWikilinkAttrs("[[!finland^deck]]");
    expect(r.mode).toBe("embed");
    expect(r.source).toBe("deck");
  });

  it("keeps both heading and source when written together", () => {
    const r = parseWikilinkAttrs("[[>finland#Origins^deck|Finland]]");
    expect(r.heading).toBe("Origins");
    expect(r.source).toBe("deck");
    expect(r.text).toBe("Finland");
  });

  it("does not treat legacy shortcodes as wikilinks", () => {
    const r = parseWikilinkAttrs('[expand slug="the-spark"]');
    expect(r.slug).toBe("");
    expect(r.mode).toBe("link");
  });
});

describe("expandEmbedLabel", () => {
  it("prefers text over heading over slug", () => {
    expect(expandEmbedLabel({ text: "A", heading: "B", slug: "c" })).toBe("A");
    expect(expandEmbedLabel({ text: null, heading: "B", slug: "c" })).toBe("B");
    expect(expandEmbedLabel({ text: null, heading: null, slug: "c" })).toBe("c");
  });
});

describe("buildWikilink", () => {
  it("builds expand with slug only", () => {
    expect(buildWikilink("expand", "hello")).toBe("[[>hello]]");
  });

  it("builds embed with heading", () => {
    expect(buildWikilink("embed", "hello", "Sec")).toBe("[[!hello#Sec]]");
  });

  it("builds a labeled link", () => {
    expect(buildWikilink("link", "hello", null, "Finland")).toBe("[[hello|Finland]]");
  });

  it("builds expand with text and heading", () => {
    expect(buildWikilink("expand", "hello", "Section One", "Click here")).toBe(
      "[[>hello#Section One|Click here]]"
    );
  });

  it("builds expand with source=deck", () => {
    expect(buildWikilink("expand", "finland", null, "Finland", "deck")).toBe(
      "[[>finland^deck|Finland]]"
    );
  });

  it("builds expand with source=summary", () => {
    expect(buildWikilink("expand", "finland", null, "Finland", "summary")).toBe(
      "[[>finland^summary|Finland]]"
    );
  });

  it("omits heading when source is set", () => {
    expect(buildWikilink("embed", "finland", "Origins", "Finland", "deck")).toBe(
      "[[!finland^deck|Finland]]"
    );
    expect(buildWikilink("embed", "finland", "Origins", "Finland", "summary")).toBe(
      "[[!finland^summary|Finland]]"
    );
  });

  it("keeps buildExpandEmbedShortcode as an alias", () => {
    expect(buildExpandEmbedShortcode("expand", "hello")).toBe("[[>hello]]");
  });
});
