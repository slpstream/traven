// @ts-check
import { tags } from "@lezer/highlight";

export const AudioShortcode = {
  defineNodes: [
    { name: "AudioShortcode" },
    { name: "AudioShortcodeTagName", style: tags.className },
    { name: "AudioShortcodeAttribute", style: tags.propertyName },
    { name: "AudioShortcodeAttributeName", style: tags.propertyName },
    { name: "AudioShortcodeAttributeValue", style: tags.string },
    { name: "AudioShortcodeMark", style: tags.processingInstruction }
  ],
  parseInline: [{
    name: "AudioShortcode",
    before: "Link",
    parse(cx, next, pos) {
      if (next !== 91 /* '[' */) return -1;
      
      // Check if it matches "[audio"
      if (
        cx.char(pos + 1) !== 97 ||  // 'a'
        cx.char(pos + 2) !== 117 || // 'u'
        cx.char(pos + 3) !== 100 || // 'd'
        cx.char(pos + 4) !== 105 || // 'i'
        cx.char(pos + 5) !== 111    // 'o'
      ) {
        return -1;
      }

      // Next character must be space or ']'
      const nextChar = cx.char(pos + 6);
      if (nextChar !== 32 && nextChar !== 93) return -1;

      // Find the closing ']' on the same line
      let scan = pos + 6;
      let endPos = -1;
      while (scan < cx.end) {
        const ch = cx.char(scan);
        if (ch === 10 /* '\n' */) break;
        if (ch === 93 /* ']' */) {
          endPos = scan + 1; // position after ']'
          break;
        }
        scan++;
      }
      if (endPos === -1) return -1;

      const children = [];

      // 1. Opening bracket '['
      children.push(cx.elt("AudioShortcodeMark", pos, pos + 1));

      // 2. Tag name "audio"
      children.push(cx.elt("AudioShortcodeTagName", pos + 1, pos + 6));

      // 3. Parse attributes between pos + 6 and endPos - 1
      const attrStart = pos + 6;
      const attrEnd = endPos - 1;
      const attrStr = cx.slice(attrStart, attrEnd);

      // Regex to match attribute key-value pairs (e.g. name="value", name='value', name=value)
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
          cx.elt("AudioShortcodeAttributeName", nameStart, nameEnd),
          cx.elt("AudioShortcodeAttributeValue", valStart, valEnd)
        ];

        children.push(cx.elt("AudioShortcodeAttribute", matchStart, matchEnd, attrChildren));
      }

      // 4. Closing bracket ']'
      children.push(cx.elt("AudioShortcodeMark", endPos - 1, endPos));

      // Add the parent AudioShortcode element
      cx.addElement(cx.elt("AudioShortcode", pos, endPos, children));

      return endPos;
    }
  }]
};
