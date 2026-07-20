import { describe, it, expect } from "vitest";
import { parseExpandEmbedAttrs } from "../src/parser.js";
import { buildExpandEmbedShortcode } from "../src/shortcode-build.js";

describe("parseExpandEmbedAttrs", () => {
  it("parses slug and heading attributes", () => {
    const r = parseExpandEmbedAttrs('[expand slug="the-spark" heading="The Spark"]');
    expect(r.mode).toBe("expand");
    expect(r.slug).toBe("the-spark");
    expect(r.heading).toBe("The Spark");
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
});
