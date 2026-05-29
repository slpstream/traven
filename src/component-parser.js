import { tags } from "@lezer/highlight";

export const ComponentShortcode = {
  defineNodes: [
    { name: "ComponentShortcode" },
    { name: "ComponentShortcodeOpen" },
    { name: "ComponentShortcodeClose" },
    { name: "ComponentShortcodeBody" },
    { name: "ComponentShortcodeTagName", style: tags.className },
    { name: "ComponentShortcodeAttribute", style: tags.propertyName },
    { name: "ComponentShortcodeAttributeName", style: tags.propertyName },
    { name: "ComponentShortcodeAttributeValue", style: tags.string },
    { name: "ComponentShortcodeMark", style: tags.processingInstruction }
  ],
  parseInline: [{
    name: "ComponentShortcode",
    before: "Link",
    parse(cx, next, pos) {
      if (next !== 91 /* '[' */) return -1;

      const slice = cx.slice(pos + 1, pos + 15);
      let tagName = "";
      if (slice.startsWith("component")) tagName = "component";
      else if (slice.startsWith("quote")) tagName = "quote";
      else if (slice.startsWith("pullquote")) tagName = "pullquote";
      else if (slice.startsWith("blockquote")) tagName = "blockquote";
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
      openChildren.push(cx.elt("ComponentShortcodeMark", pos, pos + 1));
      openChildren.push(cx.elt("ComponentShortcodeTagName", pos + 1, pos + 1 + tagName.length));

      // Parse attributes
      let defaultAttr = null;
      if (tagName === "component" && cx.char(pos + 1 + tagName.length) === 61 /* '=' */) {
        let valStart = pos + 1 + tagName.length + 1;
        let valEnd = -1;
        const quoteChar = cx.char(valStart);
        const hasQuotes = quoteChar === 34 || quoteChar === 39;
        if (hasQuotes) {
          valStart++;
          let scanVal = valStart;
          while (scanVal < openTagEnd) {
            if (cx.char(scanVal) === quoteChar) {
              valEnd = scanVal;
              break;
            }
            scanVal++;
          }
        } else {
          let scanVal = valStart;
          while (scanVal < openTagEnd) {
            const ch = cx.char(scanVal);
            if (ch === 32 || ch === 93) {
              valEnd = scanVal;
              break;
            }
            scanVal++;
          }
        }
        if (valEnd !== -1) {
          defaultAttr = {
            start: pos + 1 + tagName.length,
            end: hasQuotes ? valEnd + 1 : valEnd,
            valStart,
            valEnd
          };
          const attrChildren = [
            cx.elt("ComponentShortcodeAttributeName", defaultAttr.start, defaultAttr.start),
            cx.elt("ComponentShortcodeAttributeValue", defaultAttr.valStart, defaultAttr.valEnd)
          ];
          openChildren.push(cx.elt("ComponentShortcodeAttribute", defaultAttr.start, defaultAttr.end, attrChildren));
        }
      }

      const attrStart = defaultAttr ? defaultAttr.end : (pos + 1 + tagName.length);
      const attrEnd = openTagEnd - 1;
      const attrStr = cx.slice(attrStart, attrEnd);

      const attrRegex = /\s*([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=]+))/g;
      let match;
      while ((match = attrRegex.exec(attrStr)) !== null) {
        const matchStart = attrStart + match.index;
        const matchEnd = attrStart + attrRegex.lastIndex;

        const nameStr = match[1];
        const nameStart = matchStart + match[0].indexOf(nameStr);
        const nameEnd = nameStart + nameStr.length;

        const valStr = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] || ""));
        const eqIdx = match[0].indexOf("=");
        const valIdxInMatch = match[0].indexOf(valStr, eqIdx);
        const valStart = matchStart + valIdxInMatch;
        const valEnd = valStart + valStr.length;

        const attrChildren = [
          cx.elt("ComponentShortcodeAttributeName", nameStart, nameEnd),
          cx.elt("ComponentShortcodeAttributeValue", valStart, valEnd)
        ];
        openChildren.push(cx.elt("ComponentShortcodeAttribute", matchStart, matchEnd, attrChildren));
      }

      openChildren.push(cx.elt("ComponentShortcodeMark", openTagEnd - 1, openTagEnd));
      const openNode = cx.elt("ComponentShortcodeOpen", pos, openTagEnd, openChildren);

      // Build AST node for the body (opaque content)
      const bodyNode = cx.elt("ComponentShortcodeBody", openTagEnd, closeTagStart);

      // Build AST nodes for the closing tag
      const closeChildren = [];
      closeChildren.push(cx.elt("ComponentShortcodeMark", closeTagStart, closeTagStart + 2)); // "[/"
      closeChildren.push(cx.elt("ComponentShortcodeTagName", closeTagStart + 2, closeTagEnd - 1));
      closeChildren.push(cx.elt("ComponentShortcodeMark", closeTagEnd - 1, closeTagEnd)); // "]"
      const closeNode = cx.elt("ComponentShortcodeClose", closeTagStart, closeTagEnd, closeChildren);

      // Combine under parent ComponentShortcode node
      cx.addElement(cx.elt("ComponentShortcode", pos, closeTagEnd, [openNode, bodyNode, closeNode]));

      return closeTagEnd;
    }
  }]
};
