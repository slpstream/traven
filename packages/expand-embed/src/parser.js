// @ts-check
import { tags } from "@lezer/highlight";

/**
 * Lezer MarkdownConfig for inline wikilinks:
 *   [[slug]]
 *   [[slug|Label]]
 *   [[!slug]]          embed
 *   [[>slug]]          expand
 *   [[slug#Heading]]
 *   [[>slug^summary]]
 *
 * Trigger is `[[` (before Link) so `[text](url)`, `- [ ]`, and `> [!NOTE]` stay CommonMark.
 * Incomplete `[[…` with no closing `]]` on the same line is left as raw text.
 */
export const Wikilink = {
  defineNodes: [
    { name: "Wikilink" },
    { name: "WikilinkMark", style: tags.processingInstruction },
    { name: "WikilinkMode", style: tags.className },
  ],
  parseInline: [
    {
      name: "Wikilink",
      before: "Link",
      parse(cx, next, pos) {
        if (next !== 91 /* '[' */) return -1;
        if (pos + 1 >= cx.end || cx.char(pos + 1) !== 91) return -1;

        let scan = pos + 2;
        let endPos = -1;
        while (scan < cx.end) {
          const ch = cx.char(scan);
          if (ch === 10 /* '\n' */) break;
          if (ch === 93 && scan + 1 < cx.end && cx.char(scan + 1) === 93) {
            endPos = scan + 2;
            break;
          }
          scan++;
        }
        if (endPos === -1) return -1;

        const children = [];
        children.push(cx.elt("WikilinkMark", pos, pos + 2));
        const innerStart = pos + 2;
        if (innerStart < endPos - 2) {
          const modeCh = cx.char(innerStart);
          if (modeCh === 33 /* '!' */ || modeCh === 62 /* '>' */) {
            children.push(cx.elt("WikilinkMode", innerStart, innerStart + 1));
          }
        }
        children.push(cx.elt("WikilinkMark", endPos - 2, endPos));
        cx.addElement(cx.elt("Wikilink", pos, endPos, children));
        return endPos;
      },
    },
  ],
};

/** @deprecated Use {@link Wikilink}. */
export const ExpandEmbedShortcode = Wikilink;

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
 * Parse a complete `[[…]]` wikilink with a linear scan (no regex).
 * @param {string} raw
 * @returns {{ mode: 'link'|'expand'|'embed', slug: string, heading: string|null, text: string|null, source: string|null }}
 */
export function parseWikilinkAttrs(raw) {
  const empty = {
    mode: /** @type {const} */ ("link"),
    slug: "",
    heading: null,
    text: null,
    source: null,
  };
  const text = String(raw || "").trim();
  if (text.length < 4 || !text.startsWith("[[") || !text.endsWith("]]")) {
    return empty;
  }

  let inner = text.slice(2, -2);
  /** @type {'link'|'expand'|'embed'} */
  let mode = "link";
  if (inner.charCodeAt(0) === 33 /* '!' */) {
    mode = "embed";
    inner = inner.slice(1);
  } else if (inner.charCodeAt(0) === 62 /* '>' */) {
    mode = "expand";
    inner = inner.slice(1);
  }

  const n = inner.length;
  let i = 0;
  while (i < n) {
    const c = inner.charCodeAt(i);
    if (c !== 32 && c !== 9) break;
    i++;
  }

  const slugStart = i;
  while (i < n) {
    const c = inner.charCodeAt(i);
    if (c === 35 /* '#' */ || c === 94 /* '^' */ || c === 124 /* '|' */) break;
    i++;
  }
  const slug = inner.slice(slugStart, i).trim();

  /** @type {string|null} */
  let heading = null;
  /** @type {string|null} */
  let source = null;
  /** @type {string|null} */
  let label = null;

  while (i < n) {
    const c = inner.charCodeAt(i);
    if (c === 124 /* '|' */) {
      label = inner.slice(i + 1);
      break;
    }
    if (c === 35 /* '#' */) {
      i++;
      const hStart = i;
      while (i < n) {
        const d = inner.charCodeAt(i);
        if (d === 94 || d === 124) break;
        i++;
      }
      const h = inner.slice(hStart, i).trim();
      if (h) heading = h;
      continue;
    }
    if (c === 94 /* '^' */) {
      i++;
      const sStart = i;
      while (i < n) {
        const d = inner.charCodeAt(i);
        if (d < 97 || d > 122) break;
        i++;
      }
      const s = inner.slice(sStart, i);
      if (s) source = s;
      continue;
    }
    i++;
  }

  const linkText = label != null ? label.trim() || null : null;
  return { mode, slug, heading, text: linkText, source };
}

/** @deprecated Use {@link parseWikilinkAttrs}. */
export const parseExpandEmbedAttrs = parseWikilinkAttrs;
