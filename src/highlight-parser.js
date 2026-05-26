import { tags } from "@lezer/highlight";

// Punctuation regex (not exported by @lezer/markdown, so we inline it)
const Punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\u2010-\u2027]/;

const HighlightDelim = { resolve: "Highlight", mark: "HighlightMark" };

export const Highlight = {
  defineNodes: [
    { name: "Highlight", style: { "Highlight/...": tags.special(tags.content) } },
    { name: "HighlightMark", style: tags.processingInstruction }
  ],
  parseInline: [{
    name: "Highlight",
    parse(cx, next, pos) {
      // Must be '=' followed by '=' but NOT '==='
      if (next != 61 /* '=' */ || cx.char(pos + 1) != 61 || cx.char(pos + 2) == 61)
        return -1;
      // Flanking rules (same logic as Strikethrough)
      let before = cx.slice(pos - 1, pos), after = cx.slice(pos + 2, pos + 3);
      let sBefore = /\s|^$/.test(before), sAfter = /\s|^$/.test(after);
      let pBefore = Punctuation.test(before), pAfter = Punctuation.test(after);
      return cx.addDelimiter(HighlightDelim, pos, pos + 2,
        !sAfter && (!pAfter || sBefore || pBefore),   // can open
        !sBefore && (!pBefore || sAfter || pAfter));   // can close
    },
    after: "Emphasis"
  }]
};
