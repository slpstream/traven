import { describe, it, expect } from "vitest";
import { parseExpandEmbedAttrs, expandEmbedLabel } from "../src/parser.js";
import { buildExpandEmbedShortcode } from "../src/shortcode-build.js";

describe("parseExpandEmbedAttrs", () => {
  it("parses slug and heading attributes", () => {
    const r = parseExpandEmbedAttrs('[expand slug="the-spark" heading="The Spark"]');
    expect(r.mode).toBe("expand");
    expect(r.slug).toBe("the-spark");
    expect(r.heading).toBe("The Spark");
    expect(r.text).toBeNull();
  });

  it("parses shorthand expand=slug#heading", () => {
    const r = parseExpandEmbedAttrs('[expand="the-spark#section-one"]');
    expect(r.slug).toBe("the-spark");
    expect(r.heading).toBe("section-one");
  });

  it("parses embed mode", () => {
    const r = parseExpandEmbedAttrs('[embed slug="other-post"]');
    expect(r.mode).toBe("embed");
    expect(r.slug).toBe("other-post");
    expect(r.heading).toBeNull();
    expect(r.text).toBeNull();
  });

  it("parses text alone", () => {
    const r = parseExpandEmbedAttrs('[expand slug="christmas-in-finland" text="Finland"]');
    expect(r.slug).toBe("christmas-in-finland");
    expect(r.text).toBe("Finland");
    expect(r.heading).toBeNull();
  });

  it("parses text and heading independently", () => {
    const r = parseExpandEmbedAttrs(
      '[expand slug="christmas-in-finland" text="Click to expand…" heading="Rovaniemi: The Official Home of Santa Claus"]'
    );
    expect(r.slug).toBe("christmas-in-finland");
    expect(r.text).toBe("Click to expand…");
    expect(r.heading).toBe("Rovaniemi: The Official Home of Santa Claus");
  });
});

describe("expandEmbedLabel", () => {
  it("prefers text over heading over slug", () => {
    expect(expandEmbedLabel({ text: "A", heading: "B", slug: "c" })).toBe("A");
    expect(expandEmbedLabel({ text: null, heading: "B", slug: "c" })).toBe("B");
    expect(expandEmbedLabel({ text: null, heading: null, slug: "c" })).toBe("c");
  });
});

describe("buildExpandEmbedShortcode", () => {
  it("builds expand with slug only", () => {
    expect(buildExpandEmbedShortcode("expand", "hello")).toBe('[expand slug="hello"]');
  });

  it("builds embed with heading", () => {
    expect(buildExpandEmbedShortcode("embed", "hello", "Sec")).toBe(
      '[embed slug="hello" heading="Sec"]'
    );
  });

  it("builds expand with text only", () => {
    expect(buildExpandEmbedShortcode("expand", "hello", null, "Finland")).toBe(
      '[expand slug="hello" text="Finland"]'
    );
  });

  it("builds expand with text and heading", () => {
    expect(
      buildExpandEmbedShortcode("expand", "hello", "Section One", "Click here")
    ).toBe('[expand slug="hello" text="Click here" heading="Section One"]');
  });
});
