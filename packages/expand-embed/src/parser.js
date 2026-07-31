// @ts-check
import { tags } from "@lezer/highlight";

/**
 * Lezer MarkdownConfig for self-closing [expand] / [embed] shortcodes.
 * Supports:
 *   [expand slug="x" heading="Y"]
 *   [expand="x#Y"]  (shorthand default attr)
 *   [embed slug="x"]
 */
export const ExpandEmbedShortcode = {
  defineNodes: [
    { name: "ExpandEmbedShortcode" },
    { name: "ExpandEmbedTagName", style: tags.className },
    { name: "ExpandEmbedAttribute", style: tags.propertyName },
    { name: "ExpandEmbedAttributeName", style: tags.propertyName },
    { name: "ExpandEmbedAttributeValue", style: tags.string },
    { name: "ExpandEmbedMark", style: tags.processingInstruction },
  ],
  parseInline: [
    {
      name: "ExpandEmbedShortcode",
      before: "Link",
      parse(cx, next, pos) {
        if (next !== 91 /* '[' */) return -1;

        const slice = cx.slice(pos + 1, pos + 10);
        let tagName = "";
        if (slice.startsWith("expand")) tagName = "expand";
        else if (slice.startsWith("embed")) tagName = "embed";
        else return -1;

        const nextChar = cx.char(pos + 1 + tagName.length);
        // space, ], or = (shorthand [expand="slug"])
        if (nextChar !== 32 && nextChar !== 93 && nextChar !== 61) return -1;

        let scan = pos + 1 + tagName.length;
        let endPos = -1;
        let inDoubleQuote = false;
        let inSingleQuote = false;
        while (scan < cx.end) {
          const ch = cx.char(scan);
          if (ch === 10 /* '\n' */) break;
          if (ch === 34 && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
          else if (ch === 39 && !inDoubleQuote) inSingleQuote = !inSingleQuote;
          else if (ch === 93 && !inDoubleQuote && !inSingleQuote) {
            endPos = scan + 1;
            break;
          }
          scan++;
        }
        if (endPos === -1) return -1;

        const children = [];
        children.push(cx.elt("ExpandEmbedMark", pos, pos + 1));
        children.push(
          cx.elt("ExpandEmbedTagName", pos + 1, pos + 1 + tagName.length)
        );

        const attrStart = pos + 1 + tagName.length;
        const attrEnd = endPos - 1;
        const attrStr = cx.slice(attrStart, attrEnd);

        // Shorthand: ="slug" or ="slug#heading" (no key)
        const shorthand = attrStr.match(/^\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/);
        if (shorthand) {
          const valStr = shorthand[1] ?? shorthand[2] ?? shorthand[3] ?? "";
          const matchStart = attrStart + (shorthand.index || 0);
          const eqIdx = shorthand[0].indexOf("=");
          const valIdxInMatch = shorthand[0].indexOf(valStr, eqIdx);
          const valStart = matchStart + Math.max(0, valIdxInMatch);
          const valEnd = valStart + valStr.length;
          children.push(
            cx.elt("ExpandEmbedAttribute", matchStart, matchStart + shorthand[0].length, [
              cx.elt("ExpandEmbedAttributeValue", valStart, valEnd),
            ])
          );
        }

        const attrRegex =
          /\s*([a-zA-Z0-9_-]+)\s*=\s*(?:"([\s\S]*?)"(?=\s+[a-zA-Z0-9_-]+\s*=|\s*\]|\s*$)|'([\s\S]*?)'(?=\s+[a-zA-Z0-9_-]+\s*=|\s*\]|\s*$)|([^\s\]]+))/g;
        let match;
        while ((match = attrRegex.exec(attrStr)) !== null) {
          // Skip if this overlaps the shorthand "=" at start without a name
          if (shorthand && match.index < shorthand[0].length) continue;

          const matchStart = attrStart + match.index;
          const matchEnd = attrStart + attrRegex.lastIndex;
          const nameStr = match[1];
          const nameStart = matchStart + match[0].indexOf(nameStr);
          const nameEnd = nameStart + nameStr.length;
          const valStr =
            match[2] !== undefined
              ? match[2]
              : match[3] !== undefined
                ? match[3]
                : match[4] || "";
          const eqIdx = match[0].indexOf("=");
          const valIdxInMatch = match[0].indexOf(valStr, eqIdx);
          const valStart = matchStart + valIdxInMatch;
          const valEnd = valStart + valStr.length;

          children.push(
            cx.elt("ExpandEmbedAttribute", matchStart, matchEnd, [
              cx.elt("ExpandEmbedAttributeName", nameStart, nameEnd),
              cx.elt("ExpandEmbedAttributeValue", valStart, valEnd),
            ])
          );
        }

        children.push(cx.elt("ExpandEmbedMark", endPos - 1, endPos));
        cx.addElement(cx.elt("ExpandEmbedShortcode", pos, endPos, children));
        return endPos;
      },
    },
  ],
};

/**
 * Visible chip / trigger label: text → heading → slug.
 * @param {{ text?: string|null, heading?: string|null, slug?: string|null }} attrs
 * @returns {string}
 */
export function expandEmbedLabel(attrs) {
  const text = String(attrs?.text || "").trim();
  if (text) return text;
  const heading = String(attrs?.heading || "").trim();
  if (heading) return heading;
  const slug = String(attrs?.slug || "").trim();
  return slug || "(missing slug)";
}

/**
 * Parse attribute map from raw shortcode source text.
 * @param {string} raw
 * @returns {{ mode: 'expand'|'embed', slug: string, heading: string|null, text: string|null, source: string|null }}
 */
export function parseExpandEmbedAttrs(raw) {
  const text = String(raw || "").trim();
  const mode = text.startsWith("[embed") ? "embed" : "expand";
  /** @type {Record<string, string>} */
  const attrs = {};

  const shorthand = text.match(/\[(?:expand|embed)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/i);
  if (shorthand) {
    attrs.default = shorthand[1] ?? shorthand[2] ?? shorthand[3] ?? "";
  }

  const attrRegex =
    /([a-zA-Z0-9_-]+)\s*=\s*(?:"([\s\S]*?)"|'([\s\S]*?)'|([^\s\]]+))/g;
  let m;
  while ((m = attrRegex.exec(text)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  }

  let slug = (attrs.slug || attrs.default || "").trim();
  let heading = (attrs.heading || "").trim() || null;
  const linkText = (attrs.text || "").trim() || null;
  const source = (attrs.source || "").trim() || null;

  if (slug.includes("#") && !heading) {
    const parts = slug.split("#");
    slug = parts[0];
    heading = parts.slice(1).join("#") || null;
  }

  return { mode, slug, heading, text: linkText, source };
}
