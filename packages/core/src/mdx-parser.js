// @ts-check
import { tags } from "@lezer/highlight";
import { parseAttrPairs } from "./attr-parser.js";

/**
 * @param {number} ch
 * @returns {boolean}
 */
function isTagNameChar(ch) {
  return (
    (ch >= 65 && ch <= 90) ||
    (ch >= 97 && ch <= 122) ||
    (ch >= 48 && ch <= 57) ||
    ch === 95 ||
    ch === 45
  );
}

/**
 * @param {string} text
 * @param {number} start
 * @returns {{ name: string, end: number } | null}
 */
function readTagName(text, start) {
  if (start >= text.length) return null;
  const first = text.charCodeAt(start);
  if (first < 65 || first > 90) return null;
  let i = start + 1;
  while (i < text.length && isTagNameChar(text.charCodeAt(i))) i++;
  return { name: text.slice(start, i), end: i };
}

/**
 * Find the closing `>` of a tag that starts at `ltIndex`.
 * Tags must sit on a single line.
 *
 * @param {string} text
 * @param {number} ltIndex
 * @param {number} [limit]
 * @returns {{ gt: number, selfClosing: boolean, slashPos: number } | null}
 */
function findTagClose(text, ltIndex, limit) {
  let i = ltIndex + 1;
  let inDouble = false;
  let inSingle = false;
  const end = Math.min(text.length, limit ?? text.length);
  while (i < end) {
    const ch = text.charCodeAt(i);
    if (ch === 10 || ch === 13) return null;
    if (ch === 34 && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === 39 && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === 62 && !inDouble && !inSingle) {
      let j = i - 1;
      while (j > ltIndex && (text.charCodeAt(j) === 32 || text.charCodeAt(j) === 9)) j--;
      const selfClosing = text.charCodeAt(j) === 47;
      return { gt: i, selfClosing, slashPos: selfClosing ? j : -1 };
    }
    i++;
  }
  return null;
}

/**
 * True when `text[from..]` is only whitespace through the end of the string.
 * @param {string} text
 * @param {number} from
 */
function restIsBlank(text, from) {
  for (let i = from; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    if (ch !== 32 && ch !== 9 && ch !== 13) return false;
  }
  return true;
}

/**
 * @param {(type: string, from: number, to: number, children?: any[]) => any} elt
 * @param {number} attrAbsStart
 * @param {string} attrStr
 */
function buildAttrElts(elt, attrAbsStart, attrStr) {
  const pairs = parseAttrPairs(attrStr);
  return pairs.map((p) =>
    elt("MdxAttribute", attrAbsStart + p.index, attrAbsStart + p.lastIndex, [
      elt("MdxAttributeName", attrAbsStart + p.nameStart, attrAbsStart + p.nameEnd),
      elt("MdxAttributeValue", attrAbsStart + p.valStart, attrAbsStart + p.valEnd),
    ])
  );
}

/**
 * @param {(type: string, from: number, to: number, children?: any[]) => any} elt
 * @param {number} absFrom
 * @param {string} tagName
 * @param {string} attrStr
 * @param {number} attrAbsStart
 * @param {number} absGt
 * @param {number} slashPos
 */
function buildOpenChildren(elt, absFrom, tagName, attrStr, attrAbsStart, absGt, slashPos) {
  const nameStart = absFrom + 1;
  const nameEnd = nameStart + tagName.length;
  const children = [
    elt("MdxMark", absFrom, absFrom + 1),
    elt("MdxTagName", nameStart, nameEnd),
    ...buildAttrElts(elt, attrAbsStart, attrStr),
  ];
  const markFrom = slashPos >= 0 ? slashPos : absGt;
  children.push(elt("MdxMark", markFrom, absGt + 1));
  return children;
}

/**
 * @param {(type: string, from: number, to: number, children?: any[]) => any} elt
 * @param {number} absFrom
 * @param {string} tagName
 * @param {number} absEnd
 */
function buildCloseChildren(elt, absFrom, tagName, absEnd) {
  const nameStart = absFrom + 2;
  const nameEnd = nameStart + tagName.length;
  return [
    elt("MdxMark", absFrom, absFrom + 2),
    elt("MdxTagName", nameStart, nameEnd),
    elt("MdxMark", absEnd - 1, absEnd),
  ];
}

/**
 * Parse a capitalized open / self-closing / close tag occupying `text` starting at `rel`.
 * Positions in the returned object are relative to `text`.
 *
 * @param {string} text
 * @param {number} rel
 * @returns {{
 *   kind: "open" | "close" | "selfClosing",
 *   name: string,
 *   relEnd: number,
 *   attrStart: number,
 *   attrEnd: number,
 *   gt: number,
 *   slashPos: number
 * } | null}
 */
function parseTagAt(text, rel) {
  if (rel >= text.length || text.charCodeAt(rel) !== 60) return null;

  if (text.charCodeAt(rel + 1) === 47) {
    const nameInfo = readTagName(text, rel + 2);
    if (!nameInfo) return null;
    let i = nameInfo.end;
    while (i < text.length && (text.charCodeAt(i) === 32 || text.charCodeAt(i) === 9)) i++;
    if (text.charCodeAt(i) !== 62) return null;
    return {
      kind: "close",
      name: nameInfo.name,
      relEnd: i + 1,
      attrStart: nameInfo.end,
      attrEnd: nameInfo.end,
      gt: i,
      slashPos: -1,
    };
  }

  const nameInfo = readTagName(text, rel + 1);
  if (!nameInfo) return null;

  const nextCh = nameInfo.end < text.length ? text.charCodeAt(nameInfo.end) : -1;
  if (
    nextCh !== -1 &&
    nextCh !== 32 &&
    nextCh !== 9 &&
    nextCh !== 62 &&
    nextCh !== 47 &&
    nextCh !== 10 &&
    nextCh !== 13
  ) {
    return null;
  }

  const close = findTagClose(text, rel);
  if (!close) return null;

  return {
    kind: close.selfClosing ? "selfClosing" : "open",
    name: nameInfo.name,
    relEnd: close.gt + 1,
    attrStart: nameInfo.end,
    attrEnd: close.slashPos >= 0 ? close.slashPos : close.gt,
    gt: close.gt,
    slashPos: close.slashPos,
  };
}

/**
 * @param {import("@lezer/markdown").InlineContext} cx
 * @param {number} from
 * @param {string} tagName
 * @returns {{ closeStart: number, closeEnd: number } | null}
 */
function findMatchingCloseInline(cx, from, tagName) {
  const closeStr = `</${tagName}>`;
  const closeLen = closeStr.length;
  const openPrefix = `<${tagName}`;
  const openLen = openPrefix.length;
  let depth = 1;
  let scan = from;

  while (scan <= cx.end - closeLen) {
    let closeMatch = true;
    for (let i = 0; i < closeLen; i++) {
      if (cx.char(scan + i) !== closeStr.charCodeAt(i)) {
        closeMatch = false;
        break;
      }
    }
    if (closeMatch) {
      depth--;
      if (depth === 0) {
        return { closeStart: scan, closeEnd: scan + closeLen };
      }
      scan += closeLen;
      continue;
    }

    if (cx.char(scan) === 60 && cx.char(scan + 1) !== 47) {
      let openMatch = true;
      for (let i = 0; i < openLen; i++) {
        if (cx.char(scan + i) !== openPrefix.charCodeAt(i)) {
          openMatch = false;
          break;
        }
      }
      if (openMatch) {
        const after = cx.char(scan + openLen);
        if (after === 32 || after === 9 || after === 62 || after === 47) {
          depth++;
        }
      }
    }
    scan++;
  }
  return null;
}

/**
 * Lezer MarkdownConfig for capitalized MDX tags (`<[A-Z]\w+>`).
 * Self-closing tags become `MdxMediaTag`; paired tags become `MdxContainerTag`
 * (`MdxContainerOpen` / `MdxContainerBody` / `MdxContainerClose`).
 * Lowercase HTML (`<video>`, `<audio>`, `<image>`) is left to CommonMark.
 */
export const MdxComponents = {
  defineNodes: [
    { name: "MdxMediaTag" },
    { name: "MdxContainerTag" },
    { name: "MdxContainerOpen", block: true },
    { name: "MdxContainerClose", block: true },
    { name: "MdxContainerBody" },
    { name: "MdxTagName", style: tags.className },
    { name: "MdxAttribute", style: tags.propertyName },
    { name: "MdxAttributeName", style: tags.propertyName },
    { name: "MdxAttributeValue", style: tags.string },
    { name: "MdxMark", style: tags.processingInstruction },
  ],
  parseBlock: [
    {
      name: "MdxTagBlock",
      before: "HTMLBlock",
      // Quote/Callout/Component are not HTML Type 6 tags, so without endLeaf
      // a following </Quote> is swallowed into the previous paragraph.
      endLeaf(_cx, line) {
        if (line.next !== 60) return false;
        const parsed = parseTagAt(line.text, line.pos);
        if (!parsed) return false;
        return restIsBlank(line.text, parsed.relEnd);
      },
      parse(cx, line) {
        if (line.next !== 60) return false;

        const text = line.text;
        const rel = line.pos;
        const parsed = parseTagAt(text, rel);
        if (!parsed) return false;
        if (!restIsBlank(text, parsed.relEnd)) return false;

        const absFrom = cx.lineStart + rel;
        const absEnd = cx.lineStart + parsed.relEnd;
        const attrStr = text.slice(parsed.attrStart, parsed.attrEnd);
        const attrAbsStart = cx.lineStart + parsed.attrStart;
        const absGt = cx.lineStart + parsed.gt;
        const slashPos = parsed.slashPos >= 0 ? cx.lineStart + parsed.slashPos : -1;

        if (parsed.kind === "selfClosing") {
          const children = buildOpenChildren(
            (type, from, to, kids) => cx.elt(type, from, to, kids),
            absFrom,
            parsed.name,
            attrStr,
            attrAbsStart,
            absGt,
            slashPos
          );
          cx.addElement(cx.elt("MdxMediaTag", absFrom, absEnd, children));
          cx.nextLine();
          return true;
        }

        if (parsed.kind === "open") {
          const children = buildOpenChildren(
            (type, from, to, kids) => cx.elt(type, from, to, kids),
            absFrom,
            parsed.name,
            attrStr,
            attrAbsStart,
            absGt,
            -1
          );
          cx.addElement(cx.elt("MdxContainerOpen", absFrom, absEnd, children));
          cx.nextLine();
          return true;
        }

        const children = buildCloseChildren(
          (type, from, to, kids) => cx.elt(type, from, to, kids),
          absFrom,
          parsed.name,
          absEnd
        );
        cx.addElement(cx.elt("MdxContainerClose", absFrom, absEnd, children));
        cx.nextLine();
        return true;
      },
    },
  ],
  parseInline: [
    {
      name: "MdxTag",
      before: "HTMLTag",
      parse(cx, next, pos) {
        if (next !== 60) return -1;

        const first = cx.char(pos + 1);
        // Close tags are only paired from an opening parse; skip them here.
        if (first === 47) return -1;
        if (first < 65 || first > 90) return -1;

        let lineEnd = pos;
        while (lineEnd < cx.end) {
          const ch = cx.char(lineEnd);
          if (ch === 10 || ch === 13) break;
          lineEnd++;
        }
        const lineText = cx.slice(pos, lineEnd);
        const parsed = parseTagAt(lineText, 0);
        if (!parsed || parsed.kind === "close") return -1;

        const absEnd = pos + parsed.relEnd;
        const attrStr = lineText.slice(parsed.attrStart, parsed.attrEnd);
        const attrAbsStart = pos + parsed.attrStart;
        const absGt = pos + parsed.gt;
        const slashPos = parsed.slashPos >= 0 ? pos + parsed.slashPos : -1;

        if (parsed.kind === "selfClosing") {
          const children = buildOpenChildren(
            (type, from, to, kids) => cx.elt(type, from, to, kids),
            pos,
            parsed.name,
            attrStr,
            attrAbsStart,
            absGt,
            slashPos
          );
          cx.addElement(cx.elt("MdxMediaTag", pos, absEnd, children));
          return absEnd;
        }

        const match = findMatchingCloseInline(cx, absEnd, parsed.name);
        if (!match) return -1;

        const openChildren = buildOpenChildren(
          (type, from, to, kids) => cx.elt(type, from, to, kids),
          pos,
          parsed.name,
          attrStr,
          attrAbsStart,
          absGt,
          -1
        );
        const openNode = cx.elt("MdxContainerOpen", pos, absEnd, openChildren);
        const bodyNode = cx.elt("MdxContainerBody", absEnd, match.closeStart);
        const closeChildren = buildCloseChildren(
          (type, from, to, kids) => cx.elt(type, from, to, kids),
          match.closeStart,
          parsed.name,
          match.closeEnd
        );
        const closeNode = cx.elt("MdxContainerClose", match.closeStart, match.closeEnd, closeChildren);
        cx.addElement(cx.elt("MdxContainerTag", pos, match.closeEnd, [openNode, bodyNode, closeNode]));
        return match.closeEnd;
      },
    },
  ],
};
