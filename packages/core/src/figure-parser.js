// @ts-check
import { tags } from "@lezer/highlight";
import { parseAttrPairs } from "./attr-parser.js";

export const FigureShortcode = {
  defineNodes: [
    { name: "FigureShortcode" },
    { name: "FigureShortcodeOpen" },
    { name: "FigureShortcodeClose" },
    { name: "FigureShortcodeBody" },
    { name: "FigureShortcodeTagName", style: tags.className },
    { name: "FigureShortcodeAttribute", style: tags.propertyName },
    { name: "FigureShortcodeAttributeName", style: tags.propertyName },
    { name: "FigureShortcodeAttributeValue", style: tags.string },
    { name: "FigureShortcodeMark", style: tags.processingInstruction }
  ],
  parseInline: [{
    name: "FigureShortcode",
    before: "Link",
    parse(cx, next, pos) {
      if (next !== 91 /* '[' */) return -1;

      const slice = cx.slice(pos + 1, pos + 10);
      let tagName = "";
      if (slice.startsWith("figure")) tagName = "figure";
      else return -1;

      const nextChar = cx.char(pos + 1 + tagName.length);
      if (nextChar !== 32 && nextChar !== 93 && nextChar !== 61) return -1;

      // Find the closing ']' of the open tag (must be on the same line)
      let scan = pos + 1 + tagName.length;
      let openTagEnd = -1;
      let inDoubleQuote = false;
      let inSingleQuote = false;
      while (scan < cx.end) {
        const ch = cx.char(scan);
        if (ch === 10 || ch === 13) break; // Opening tag must be on one line
        if (ch === 34 && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
        } else if (ch === 39 && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
        } else if (ch === 93 && !inDoubleQuote && !inSingleQuote) {
          openTagEnd = scan + 1;
          break;
        }
        scan++;
      }
      if (openTagEnd === -1) return -1;

      // Determine the matching closing tag string
      const closeTagStr = `[/${tagName}]`;
      const closeLen = closeTagStr.length;

      // Find the matching closing tag, respecting nesting
      let bodyEnd = -1;
      let closeTagStart = -1;
      let closeTagEnd = -1;
      let depth = 1;

      scan = openTagEnd;
      while (scan <= cx.end - closeLen) {
        // Check for closing tag
        let closeMatch = true;
        for (let i = 0; i < closeLen; i++) {
          if (cx.char(scan + i) !== closeTagStr.charCodeAt(i)) {
            closeMatch = false;
            break;
          }
        }
        if (closeMatch) {
          depth--;
          if (depth === 0) {
            bodyEnd = scan;
            closeTagStart = scan;
            closeTagEnd = scan + closeLen;
            break;
          }
          scan += closeLen;
          continue;
        }

        // Check for nested opening tag: `[tagName`
        if (cx.char(scan) === 91 /* '[' */) {
          let openMatch = true;
          for (let i = 0; i < tagName.length; i++) {
            if (cx.char(scan + 1 + i) !== tagName.charCodeAt(i)) {
              openMatch = false;
              break;
            }
          }
          if (openMatch) {
            const nextCh = cx.char(scan + 1 + tagName.length);
            if (nextCh === 32 || nextCh === 93 || nextCh === 61) {
              depth++;
              scan += 1 + tagName.length;
              continue;
            }
          }
        }
        scan++;
      }

      if (closeTagEnd === -1) return -1;

      // Build AST nodes for the opening tag
      const openChildren = [];
      openChildren.push(cx.elt("FigureShortcodeMark", pos, pos + 1));
      openChildren.push(cx.elt("FigureShortcodeTagName", pos + 1, pos + 1 + tagName.length));

      const attrStart = pos + 1 + tagName.length;
      const attrEnd = openTagEnd - 1;
      const attrStr = cx.slice(attrStart, attrEnd);

      const pairs = parseAttrPairs(attrStr);
      for (const p of pairs) {
        const matchStart = attrStart + p.index;
        const matchEnd = attrStart + p.lastIndex;
        const nameStart = attrStart + p.nameStart;
        const nameEnd = attrStart + p.nameEnd;
        const valStart = attrStart + p.valStart;
        const valEnd = attrStart + p.valEnd;

        const attrChildren = [
          cx.elt("FigureShortcodeAttributeName", nameStart, nameEnd),
          cx.elt("FigureShortcodeAttributeValue", valStart, valEnd)
        ];
        openChildren.push(cx.elt("FigureShortcodeAttribute", matchStart, matchEnd, attrChildren));
      }

      openChildren.push(cx.elt("FigureShortcodeMark", openTagEnd - 1, openTagEnd));
      const openNode = cx.elt("FigureShortcodeOpen", pos, openTagEnd, openChildren);

      // Build AST node for the body (opaque content)
      const bodyNode = cx.elt("FigureShortcodeBody", openTagEnd, closeTagStart);

      // Build AST nodes for the closing tag
      const closeChildren = [];
      closeChildren.push(cx.elt("FigureShortcodeMark", closeTagStart, closeTagStart + 2)); // "[/"
      closeChildren.push(cx.elt("FigureShortcodeTagName", closeTagStart + 2, closeTagEnd - 1));
      closeChildren.push(cx.elt("FigureShortcodeMark", closeTagEnd - 1, closeTagEnd)); // "]"
      const closeNode = cx.elt("FigureShortcodeClose", closeTagStart, closeTagEnd, closeChildren);

      // Combine under parent FigureShortcode node
      cx.addElement(cx.elt("FigureShortcode", pos, closeTagEnd, [openNode, bodyNode, closeNode]));

      return closeTagEnd;
    }
  }]
};
