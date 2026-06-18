// @ts-check
import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder, StateField, StateEffect } from "@codemirror/state";
import {
  Decoration,
  ViewPlugin,
  ViewUpdate,
  EditorView,
  WidgetType
} from "@codemirror/view";
import { viewToEditor } from "./bridge.js";
import { parseMarkdownTable, openTableModal, openImageModal, openComponentModal, openVideoModal, openAudioModal, openFigureModal } from "./toolbar/modal.js";
import { sanitizeUrl, parseVideoUrl } from "./security.js";
import { ensureKatex } from "./math-parser.js";
import { ensureMermaid } from "./mermaid-parser.js";

// --- Custom Widget Types ---



function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderInlineMarkdown(text) {
  if (!text) return "";

  // Protect math blocks first (before any HTML escaping!)
  const mathBlocks = [];
  let html = text;
  
  // 1. Display math $$...$$
  html = html.replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (match, math) => {
    const index = mathBlocks.length;
    let rendered = "";
    const katex = typeof window !== "undefined" ? window["katex"] : null;
    if (katex) {
      try {
        rendered = katex.renderToString(math, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        rendered = `<div class="katex-display-fallback">$$${math}$$</div>`;
      }
    } else {
      rendered = `<div class="katex-display-fallback">$$${math}$$</div>`;
    }
    mathBlocks.push(rendered);
    return `MATHSPANXPLACEHOLDERX${index}`;
  });

  // 2. Inline math $...$
  html = html.replace(/(?<!\\)\$((?!\s)[^\$\n\r]+?(?<!\s)(?<!\\))\$/g, (match, math) => {
    const index = mathBlocks.length;
    let rendered = "";
    const katex = typeof window !== "undefined" ? window["katex"] : null;
    if (katex) {
      try {
        rendered = katex.renderToString(math, {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        rendered = `<span class="katex-inline-fallback">$${math}$</span>`;
      }
    } else {
      rendered = `<span class="katex-inline-fallback">$${math}$</span>`;
    }
    mathBlocks.push(rendered);
    return `MATHSPANXPLACEHOLDERX${index}`;
  });

  // Now escape HTML characters in the remaining non-math text to prevent XSS
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Protect inline code spans first to prevent formatting parsing inside them
  const codeSpans = [];
  html = html.replace(/`(.*?)`/g, (match, code) => {
    const index = codeSpans.length;
    codeSpans.push(`<code>${code}</code>`);
    return `CODESPANXPLACEHOLDERX${index}`;
  });

  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => `<img src="${sanitizeUrl(src)}" alt="${alt}" style="max-width: 100%; height: auto; display: inline-block;">`);
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => `<a href="${sanitizeUrl(url)}" target="_blank">${text}</a>`);
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");
  html = html.replace(/==(.*?)==/g, '<span class="cm-wysiwym-highlight">$1</span>');

  // Restore inline code spans
  html = html.replace(/CODESPANXPLACEHOLDERX(\d+)/g, (match, index) => {
    return codeSpans[parseInt(index, 10)];
  });

  // Restore math blocks
  html = html.replace(/MATHSPANXPLACEHOLDERX(\d+)/g, (match, index) => {
    return mathBlocks[parseInt(index, 10)];
  });

  return html;
}


// --- Helper Functions ---

/**
 * Check if cursor is within the given range
 * @param {import("@codemirror/state").EditorState} state
 * @param {number} from
 * @param {number} to
 * @returns {boolean}
 */
export function cursorInRange(state, from, to) {
  const selection = state.selection.main;
  return selection.from <= to && selection.to >= from;
}

/**
 * Check if any selection overlaps with the given range
 * @param {import("@codemirror/state").EditorState} state
 * @param {number} from
 * @param {number} to
 * @returns {boolean}
 */
export function selectionOverlapsRange(state, from, to) {
  for (const range of state.selection.ranges) {
    if (range.from <= to && range.to >= from) {
      return true;
    }
  }
  return false;
}

// --- Decoration Tokens ---

export const collapseDeco = Decoration.replace({});
// Inline styles
export const boldDeco = Decoration.mark({ class: "cm-wysiwym-bold" });
export const italicDeco = Decoration.mark({ class: "cm-wysiwym-italic" });
export const strikethroughDeco = Decoration.mark({ class: "cm-wysiwym-strikethrough" });
export const codeDeco = Decoration.mark({ class: "cm-wysiwym-inline-code" });
export const highlightDeco = Decoration.mark({ class: "cm-wysiwym-highlight" });
export const linkDeco = Decoration.mark({ class: "cm-wysiwym-link-anchor" });

// Block/Frontmatter styled decorations
export const frontmatterLineDeco = Decoration.line({ class: "cm-wysiwym-frontmatter" });
export const frontmatterActiveLineDeco = Decoration.line({ class: "cm-wysiwym-frontmatter-active" });

// Blockquote line style
export const blockquoteLineDeco = Decoration.line({ class: "cm-wysiwym-blockquote" });

// Block code line styles
export const codeBlockLineDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line" });
export const codeBlockLineFirstDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-first" });
export const codeBlockLineLastDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-last" });
export const codeBlockLineSingleDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-first cm-wysiwym-codeblock-line-last" });

// Table line styles
export const tableRowLineDeco = Decoration.line({ class: "cm-wysiwym-table-row" });

// Collapsed fenced code line style
export const collapsedFenceLineDeco = Decoration.line({ class: "cm-wysiwym-collapsed-fence" });


// --- Suppression StateField ---
/** @type {import("@codemirror/state").StateEffectType<any>} */
export const setSuppression = StateEffect.define();
/** @type {import("@codemirror/state").StateEffectType<any>} */
export const clearSuppression = StateEffect.define();

export const suppressionField = StateField.define({
  create() {
    return null;
  },
  update(value, tr) {
    if (tr.docChanged) return null;
    for (const effect of tr.effects) {
      const eff = /** @type {any} */ (effect);
      if (eff.is(setSuppression)) {
        // Normalize to array for backwards compatibility
        const val = eff.value;
        return Array.isArray(val) ? val : [val];
      }
      if (eff.is(clearSuppression)) return null;
    }
    return value;
  }
});

// --- Focus StateField ---
/** @type {import("@codemirror/state").StateEffectType<boolean>} */
export const setFocusEffect = StateEffect.define();

export const focusField = StateField.define({
  create() {
    return false;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setFocusEffect)) {
        return effect.value;
      }
    }
    return value;
  }
});

export function getActiveFigureRanges(state, cursorHead) {
  const activeFigureRanges = [];
  const docText = state.doc.toString();
  const figureRegex = /\[figure((?:\s+[^\]]*|=\s*(?:"[^"]*"|'[^']*'|[^\s\]]+)(?:\s+[^\]]*)?)?)\]([\s\S]*?)\[\/figure\]/g;
  let match;
  while ((match = figureRegex.exec(docText)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    const isCursorInside = cursorHead > from && cursorHead < to;
    if (!isCursorInside) {
      activeFigureRanges.push({ from, to });
    }
  }
  return activeFigureRanges;
}



// --- Ctrl/Cmd+Click handler for opening links ---
const linkClickHandler = EditorView.domEventHandlers({
  click(event, view) {
    if (!event.ctrlKey && !event.metaKey) return false;

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) return false;

    let linkUrl = null;
    syntaxTree(view.state).iterate({
      from: pos,
      to: pos,
      enter(node) {
        if (node.name === "Link") {
          const c = node.node.cursor();
          if (c.firstChild()) {
            do {
              if (c.name === "URL") {
                linkUrl = view.state.sliceDoc(c.from, c.to);
                break;
              }
            } while (c.nextSibling());
          }
        }
        if (node.name === "Autolink") {
          const text = view.state.sliceDoc(node.from, node.to);
          if (text.startsWith("<") && text.endsWith(">")) {
            linkUrl = text.slice(1, -1);
          } else {
            linkUrl = text;
          }
        }
        if (node.name === "URL") {
          const parent = node.node.parent;
          const isNaked = parent && parent.name !== "Link" && parent.name !== "Image" && parent.name !== "Autolink";
          if (isNaked) {
            linkUrl = view.state.sliceDoc(node.from, node.to);
          }
        }
      }
    });

    if (linkUrl) {
      window.open(linkUrl, "_blank", "noopener,noreferrer");
      event.preventDefault();
      return true;
    }
    return false;
  }
});

export const wysiwymPlugin = () => {
  return [
    suppressionField,
    focusField,
    EditorView.focusChangeEffect.of((state, focusing) => setFocusEffect.of(focusing)),
    linkClickHandler
  ];
};

export function getListPrefixAt(state, pos) {
  const line = state.doc.lineAt(pos);
  const leadingMatch = line.text.match(/^([\s>]*)/);
  const leadLen = leadingMatch ? leadingMatch[1].length : 0;
  const startPos = line.from + leadLen;

  if (startPos > line.to) return null;

  const tree = syntaxTree(state);
  let node = tree.resolveInner(startPos, 1);
  
  // Walk up to find a ListItem node starting on this line
  let listItemNode = null;
  while (node) {
    if (node.name === "ListItem") {
      const itemLine = state.doc.lineAt(node.from).number;
      if (itemLine === line.number) {
        listItemNode = node;
        break;
      }
    }
    node = node.parent;
  }

  if (!listItemNode) {
    return null;
  }

  // Now let's extract details from the ListItem node
  let listMarkNode = null;
  let taskMarkerNode = null;
  
  const c = listItemNode.cursor();
  while (c.next() && c.from < listItemNode.to) {
    if (c.name === "ListMark" && c.from === startPos) {
      listMarkNode = c.node;
    } else if (c.name === "TaskMarker") {
      if (listMarkNode && c.from === listMarkNode.to + 1) {
        taskMarkerNode = c.node;
      }
    }
  }

  if (!listMarkNode || listMarkNode.from !== startPos) {
    return null;
  }

  // Determine type
  let type = null;
  const parentName = listItemNode.parent ? listItemNode.parent.name : "";
  if (taskMarkerNode) {
    type = "task";
  } else if (parentName === "BulletList") {
    type = "ul";
  } else if (parentName === "OrderedList") {
    type = "ol";
  }

  if (!type) return null;

  // Calculate prefix length (from startPos to end of list marker / task marker + trailing space)
  let endPos = startPos;
  if (taskMarkerNode) {
    endPos = taskMarkerNode.to;
  } else if (listMarkNode) {
    endPos = listMarkNode.to;
  } else {
    return null;
  }

  // Consume one trailing space if present
  if (endPos < line.to && state.sliceDoc(endPos, endPos + 1) === " ") {
    endPos++;
  }

  const prefixLen = endPos - startPos;

  return {
    type,
    from: startPos,
    prefixLen,
    taskMarker: taskMarkerNode ? { from: taskMarkerNode.from, to: taskMarkerNode.to } : null
  };
}

export function getListStrippingRanges(state, from, to) {
  const startLineNum = state.doc.lineAt(from).number;
  const endLineNum = state.doc.lineAt(to).number;
  const ranges = [];

  for (let l = startLineNum; l <= endLineNum; l++) {
    const line = state.doc.line(l);
    const listInfo = getListPrefixAt(state, line.from);
    if (listInfo) {
      const prefixEnd = listInfo.from + listInfo.prefixLen;
      
      const bqMatch = line.text.match(/^(\s*>\s*)+/);
      const indentStart = line.from + (bqMatch ? bqMatch[0].length : 0);
      
      const stripFrom = Math.max(indentStart, from);
      const stripTo = Math.min(prefixEnd, to);
      if (stripTo > stripFrom) {
        ranges.push({
          from: stripFrom,
          to: stripTo
        });
      }
    }
  }
  return ranges;
}

export function isInCodeBlock(state, pos) {
  const tree = syntaxTree(state);
  let node = tree.resolveInner(pos, 1);
  while (node) {
    if (
      node.name === "FencedCode" ||
      node.name === "CodeBlock" ||
      node.name === "CodeText" ||
      node.name === "HTMLBlock"
    ) {
      return true;
    }
    node = node.parent;
  }
  return false;
}
