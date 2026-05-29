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
import { parseMarkdownTable, openTableModal, openImageModal } from "./toolbar/modal.js";
import { sanitizeUrl } from "./security.js";
import { ensureKatex } from "./math-parser.js";

// --- Custom Widget Types ---

class MathWidget extends WidgetType {
  constructor(math, isBlock) {
    super();
    this.math = math;
    this.isBlock = isBlock;
  }

  toDOM(view) {
    const wrapper = document.createElement(this.isBlock ? "div" : "span");
    wrapper.className = this.isBlock ? "cm-wysiwym-block-math-widget" : "cm-wysiwym-inline-math-widget";
    wrapper.style.display = this.isBlock ? "block" : "inline-block";

    ensureKatex().then((katex) => {
      if (katex) {
        try {
          katex.render(this.math, wrapper, {
            displayMode: this.isBlock,
            throwOnError: false
          });
        } catch (e) {
          wrapper.textContent = (this.isBlock ? "$$" : "$") + this.math + (this.isBlock ? "$$" : "$");
        }
      } else {
        wrapper.textContent = (this.isBlock ? "$$" : "$") + this.math + (this.isBlock ? "$$" : "$");
      }
    });

    if (!window.katex) {
      wrapper.textContent = (this.isBlock ? "$$" : "$") + this.math + (this.isBlock ? "$$" : "$");
      ensureKatex().then(() => {
        if (view && !view.destroyed) {
          view.requestMeasure();
        }
      });
    }

    return wrapper;
  }

  eq(other) {
    return this.math === other.math && this.isBlock === other.isBlock;
  }
}

class HRWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = "cm-wysiwym-hr-widget";
    return hr;
  }
  eq() { return true; }
}

class CheckboxWidget extends WidgetType {
  constructor(checked, pos) {
    super();
    this.checked = checked;
    this.pos = pos;
  }

  toDOM(view) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = "cm-wysiwym-checkbox";
    input.setAttribute("aria-label", this.checked ? "Completed task" : "Incomplete task");

    input.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (view.state.readOnly) return;

      const marker = view.state.sliceDoc(this.pos, this.pos + 3);
      const isChecked = /[xX]/.test(marker[1]);
      const replacement = isChecked ? "[ ]" : "[x]";

      view.dispatch({
        changes: { from: this.pos, to: this.pos + 3, insert: replacement }
      });
    });

    return input;
  }

  eq(other) {
    return this.checked === other.checked;
  }

  ignoreEvent() { return false; }
}

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-wysiwym-bullet";
    span.innerHTML = "•";
    return span;
  }
  eq() { return true; }
}

class TableWidget extends WidgetType {
  constructor(tableText, tableFrom) {
    super();
    this.tableText = tableText;
    this.tableFrom = tableFrom;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-table-widget";

    // Use the shared parser to get structured data
    const parsed = parseMarkdownTable(this.tableText);
    if (!parsed) {
      container.textContent = this.tableText;
      return container;
    }

    const table = document.createElement("table");

    // Pure function helper to convert basic inline Markdown to HTML inside cells
    const renderInlineMarkdown = (text) => {
      if (!text) return "";
      // Escape HTML characters to prevent XSS
      let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Convert inline elements (images, links, bold, italic, highlight, code)
      html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => `<img src="${sanitizeUrl(src)}" alt="${alt}" style="max-width: 100%; height: auto; display: inline-block;">`);
      html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => `<a href="${sanitizeUrl(url)}" target="_blank">${text}</a>`);
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
      html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
      html = html.replace(/_(.*?)_/g, "<em>$1</em>");
      html = html.replace(/==(.*?)==/g, '<span class="cm-wysiwym-highlight">$1</span>');
      html = html.replace(/`(.*?)`/g, "<code>$1</code>");

      return html;
    };


    // Header
    const thead = document.createElement("thead");
    const headerTr = document.createElement("tr");
    parsed.headers.forEach((h, colIdx) => {
      const th = document.createElement("th");
      th.innerHTML = renderInlineMarkdown(h);
      if (parsed.alignments && parsed.alignments[colIdx]) {
        th.style.textAlign = parsed.alignments[colIdx];
      }
      headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    parsed.rows.forEach((row) => {
      const tr = document.createElement("tr");
      for (let j = 0; j < parsed.headers.length; j++) {
        const td = document.createElement("td");
        td.innerHTML = renderInlineMarkdown(row[j] || "");
        if (parsed.alignments && parsed.alignments[j]) {
          td.style.textAlign = parsed.alignments[j];
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Click handler: open the Table Editor Modal
    const tableFrom = this.tableFrom;
    const tableTo = this.tableFrom + this.tableText.length;
    const tableText = this.tableText;
    container.addEventListener("mousedown", (e) => {
      // If user clicked a link, let the browser open it
      if (e.target.closest("a")) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openTableModal({
          editor,
          tableData: parseMarkdownTable(tableText),
          docFrom: tableFrom,
          docTo: tableTo
        });
      }
    });

    return container;
  }

  eq(other) {
    return this.tableText === other.tableText && this.tableFrom === other.tableFrom;
  }

  ignoreEvent() { return false; }
}

class ImageShortcodeWidget extends WidgetType {
  constructor(attrs, nodeFrom, rawText) {
    super();
    this.attrs = attrs;
    this.nodeFrom = nodeFrom;
    this.rawText = rawText;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-image-shortcode-container";

    if (this.rawText) {
      container.title = this.rawText;
    }

    const src = this.attrs.src || "";
    const caption = this.attrs.caption || "";
    const align = this.attrs.align || "center";
    const size = this.attrs.size || "medium";
    const customClass = this.attrs.class || "";
    const alt = this.attrs.alt || "";

    const isUploading = !src || alt.startsWith("Uploading") || caption.startsWith("Uploading");

    if (isUploading) {
      container.className = "cm-wysiwym-image-uploading";
      const fileName = (alt || caption || "file").replace("Uploading ", "").replace("...", "");
      container.innerHTML = `
        <svg class="cm-upload-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px;">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <span style="vertical-align: middle;">Uploading ${fileName}...</span>
      `;
      
      container.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({ selection: { anchor: this.nodeFrom } });
        view.focus();
      });
      return container;
    }

    container.classList.add(`align-${align}`);
    container.classList.add(`size-${size}`);
    if (customClass) {
      customClass.split(/\s+/).forEach(c => {
        if (c) container.classList.add(c);
      });
    }

    const img = document.createElement("img");
    img.src = src || "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' viewBox%3D'0 0 100 100'%3E%3Crect width%3D'100' height%3D'100' fill%3D'%23eee'%2F%3E%3Ctext x%3D'50%25' y%3D'50%25' dominant-baseline%3D'middle' text-anchor%3D'middle' font-family%3D'sans-serif' font-size%3D'10' fill%3D'%23999'%3ENo Image%3C%2Ftext%3E%3C%2Fsvg%3E";
    img.alt = alt || caption || "Image shortcode";
    img.draggable = false;
    
    img.onerror = () => {
      img.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' viewBox%3D'0 0 100 100'%3E%3Crect width%3D'100' height%3D'100' fill%3D'%23fee'%2F%3E%3Ctext x%3D'50%25' y%3D'50%25' dominant-baseline%3D'middle' text-anchor%3D'middle' font-family%3D'sans-serif' font-size%3D'8' fill%3D'%23b00'%3EImage Failed to Load%3C%2Ftext%3E%3C%2Fsvg%3E";
    };

    container.appendChild(img);

    const metaRow = document.createElement("div");
    metaRow.className = "shortcode-meta";

    if (caption) {
      const captionText = document.createElement("span");
      captionText.className = "meta-caption";
      captionText.textContent = caption;
      metaRow.appendChild(captionText);
    }

    if (metaRow.childNodes.length > 0) {
      container.appendChild(metaRow);
    }

    const editIcon = document.createElement("div");
    editIcon.className = "image-edit-icon";
    editIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    container.appendChild(editIcon);

    // Mousedown listener to open Image Modal for editing
    container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openImageModal({
          editor,
          triggerElement: container,
          docFrom: this.nodeFrom,
          docTo: this.nodeFrom + this.rawText.length,
          attrs: this.attrs,
          isAdvancedMode: true
        });
      }
    });

    return container;
  }

  eq(other) {
    return (
      other instanceof ImageShortcodeWidget &&
      this.nodeFrom === other.nodeFrom &&
      this.rawText === other.rawText &&
      this.attrs.src === other.attrs.src &&
      this.attrs.caption === other.attrs.caption &&
      this.attrs.align === other.attrs.align &&
      this.attrs.size === other.attrs.size &&
      this.attrs.alt === other.attrs.alt &&
      this.attrs.class === other.attrs.class
    );
  }

  ignoreEvent() { return false; }
}

class ComponentShortcodeWidget extends WidgetType {
  constructor(attrs, nodeFrom, bodyText, rawText) {
    super();
    this.attrs = attrs;
    this.nodeFrom = nodeFrom;
    this.bodyText = bodyText;
    this.rawText = rawText;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-component-shortcode";
    
    if (this.rawText) {
      container.title = this.rawText;
    }

    let compName = this.attrs.name || "";
    if (!compName) {
      if (this.attrs._tagName === "quote" || this.attrs._tagName === "blockquote") {
        compName = "blockquote";
      } else if (this.attrs._tagName === "pullquote") {
        compName = "pullquote";
      } else {
        compName = this.attrs._tagName || "blockquote";
      }
    }
    if (compName === "quote") {
      compName = "blockquote";
    }

    container.classList.add(`component-${compName}`);

    const editIcon = document.createElement("div");
    editIcon.className = "image-edit-icon";
    editIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    container.appendChild(editIcon);

    editIcon.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const openTagLength = this.rawText.indexOf("]") + 1;
      const start = this.nodeFrom + openTagLength;
      const end = start + this.bodyText.length;
      view.dispatch({ selection: { anchor: start, head: end } });
      view.focus();
    });
    editIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const openTagLength = this.rawText.indexOf("]") + 1;
      const start = this.nodeFrom + openTagLength;
      const end = start + this.bodyText.length;
      view.dispatch({ selection: { anchor: start, head: end } });
      view.focus();
    });

    container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ selection: { anchor: this.nodeFrom } });
      view.focus();
    });

    const renderInlineMarkdown = (text) => {
      if (!text) return "";
      let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => `<img src="${sanitizeUrl(src)}" alt="${alt}" style="max-width: 100%; height: auto; display: inline-block;">`);
      html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => `<a href="${sanitizeUrl(url)}" target="_blank">${text}</a>`);
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
      html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
      html = html.replace(/_(.*?)_/g, "<em>$1</em>");
      html = html.replace(/==(.*?)==/g, '<span class="cm-wysiwym-highlight">$1</span>');
      html = html.replace(/`(.*?)`/g, "<code>$1</code>");
      return html;
    };

    const contentLines = this.bodyText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const bodyContainer = document.createElement("div");
    bodyContainer.className = "component-body";
    contentLines.forEach(line => {
      const p = document.createElement("p");
      p.innerHTML = renderInlineMarkdown(line);
      bodyContainer.appendChild(p);
    });

    const header = document.createElement("div");
    header.className = "component-header-badge";
    header.textContent = compName;
    container.appendChild(header);

    if (compName === "blockquote") {
      const bq = document.createElement("blockquote");
      bq.appendChild(bodyContainer);
      
      const author = this.attrs.author || "";
      const source = this.attrs.source || "";
      if (author || source) {
        const cite = document.createElement("cite");
        let citeText = "— ";
        if (author && source) {
          citeText += `${author}, ${source}`;
        } else {
          citeText += author || source;
        }
        cite.textContent = citeText;
        bq.appendChild(cite);
      }
      container.appendChild(bq);
    } else if (compName === "pullquote") {
      const bq = document.createElement("blockquote");
      bq.className = "pullquote-content";
      bq.appendChild(bodyContainer);
      container.appendChild(bq);
    } else {
      container.appendChild(bodyContainer);
    }

    return container;
  }

  eq(other) {
    return (
      other instanceof ComponentShortcodeWidget &&
      this.nodeFrom === other.nodeFrom &&
      this.bodyText === other.bodyText &&
      this.rawText === other.rawText &&
      JSON.stringify(this.attrs) === JSON.stringify(other.attrs)
    );
  }

  ignoreEvent() { return false; }
}

// --- Decoration Tokens ---

const collapseDeco = Decoration.replace({});

// Inline styled decorations
const boldDeco = Decoration.mark({ class: "cm-wysiwym-bold" });
const italicDeco = Decoration.mark({ class: "cm-wysiwym-italic" });
const codeDeco = Decoration.mark({ class: "cm-wysiwym-inline-code" });
const strikethroughDeco = Decoration.mark({ class: "cm-wysiwym-strikethrough" });
const highlightDeco = Decoration.mark({ class: "cm-wysiwym-highlight" });
const linkDeco = Decoration.mark({ class: "cm-wysiwym-link-anchor" });

// Block/Frontmatter styled decorations
const frontmatterLineDeco = Decoration.line({ class: "cm-wysiwym-frontmatter" });
const frontmatterActiveLineDeco = Decoration.line({ class: "cm-wysiwym-frontmatter-active" });

// Heading line styles
const h1LineDeco = Decoration.line({ class: "cm-wysiwym-h1" });
const h2LineDeco = Decoration.line({ class: "cm-wysiwym-h2" });
const h3LineDeco = Decoration.line({ class: "cm-wysiwym-h3" });
const h4LineDeco = Decoration.line({ class: "cm-wysiwym-h4" });
const h5LineDeco = Decoration.line({ class: "cm-wysiwym-h5" });
const h6LineDeco = Decoration.line({ class: "cm-wysiwym-h6" });

// Blockquote line style
const blockquoteLineDeco = Decoration.line({ class: "cm-wysiwym-blockquote" });

// Block code line styles
const codeBlockLineDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line" });
const codeBlockLineFirstDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-first" });
const codeBlockLineLastDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-last" });
const codeBlockLineSingleDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-first cm-wysiwym-codeblock-line-last" });

// Table line styles
const tableRowLineDeco = Decoration.line({ class: "cm-wysiwym-table-row" });

// Collapsed fenced code line style
const collapsedFenceLineDeco = Decoration.line({ class: "cm-wysiwym-collapsed-fence" });


// --- Suppression StateField ---
export const setSuppression = StateEffect.define();
export const clearSuppression = StateEffect.define();

export const suppressionField = StateField.define({
  create() {
    return null;
  },
  update(value, tr) {
    if (tr.docChanged) return null;
    for (const effect of tr.effects) {
      if (effect.is(setSuppression)) {
        // Normalize to array for backwards compatibility
        const val = effect.value;
        return Array.isArray(val) ? val : [val];
      }
      if (effect.is(clearSuppression)) return null;
    }
    return value;
  }
});

// --- Focus StateField ---
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

// --- Helper to get heading decoration ---
function getHeadingDeco(level) {
  switch (level) {
    case 1: return h1LineDeco;
    case 2: return h2LineDeco;
    case 3: return h3LineDeco;
    case 4: return h4LineDeco;
    case 5: return h5LineDeco;
    default: return h6LineDeco;
  }
}

// --- Decoration Builder ---
function buildWysiwymDecorations(state) {
  const collected = [];
  const hasFocus = state.field(focusField, false);
  const cursorHead = hasFocus ? state.selection.main.head : -1;
  const cursorLine = hasFocus ? state.doc.lineAt(state.selection.main.head).number : -1;
  const suppressed = state.field(suppressionField, false) || null;

  // Track lines that already have line decorations applied to avoid duplicate line class definitions
  const decoratedLines = new Set();

  syntaxTree(state).iterate({
    from: 0,
    to: state.doc.length,
      enter(node) {
        // 1. Bold (StrongEmphasis)
        if (node.name === "StrongEmphasis") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 2 and last 2 characters)
            collected.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            collected.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 2, to: node.to - 2, deco: boldDeco });
          }
        }

        // 2. Italic (Emphasis)
        if (node.name === "Emphasis") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 1 and last 1 characters)
            collected.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            collected.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 1, to: node.to - 1, deco: italicDeco });
          }
        }

        // 2.5 Strikethrough (Strikethrough)
        if (node.name === "Strikethrough") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 2 and last 2 characters '~~')
            collected.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            collected.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 2, to: node.to - 2, deco: strikethroughDeco });
          }
        }

        // 2.6 Highlight (Highlight)
        if (node.name === "Highlight") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 2 and last 2 characters '==')
            collected.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            collected.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 2, to: node.to - 2, deco: highlightDeco });
          }
        }

        // 3. Inline Code (InlineCode)
        if (node.name === "InlineCode") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          
          if (!isCursorInside) {
            // Collapse delimiters (backticks)
            collected.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            collected.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 1, to: node.to - 1, deco: codeDeco });
          }
        }

        // 3.1. Inline Math (InlineMath)
        if (node.name === "InlineMath") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            const mathText = state.sliceDoc(node.from + 1, node.to - 1);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new MathWidget(mathText, false) })
            });
            return false;
          }
        }

        // 3.2. Block Math (BlockMath)
        if (node.name === "BlockMath") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            const mathText = state.sliceDoc(node.from + 2, node.to - 2);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new MathWidget(mathText, true), block: true })
            });
            return false;
          }
        }


        // 3.5. Links [text](url) / [text](url "title")
        if (node.name === "Link") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            // Walk child nodes to find content boundaries, collapse markers/URL/title
            const c = node.node.cursor();
            let firstMarkEnd = null;
            let secondMarkStart = null;
            let linkTitle = null;
            let markCount = 0;

            if (c.firstChild()) {
              do {
                if (c.name === "LinkMark") {
                  markCount++;
                  if (markCount === 1) firstMarkEnd = c.to;   // end of "["
                  if (markCount === 2) secondMarkStart = c.from; // start of "]"
                  // Collapse all bracket/paren markers
                  collected.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
                if (c.name === "URL") {
                  collected.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
                if (c.name === "LinkTitle") {
                  // Extract title text (strip surrounding quotes)
                  const raw = state.sliceDoc(c.from, c.to);
                  linkTitle = raw.replace(/^["'(]|["')]$/g, "");
                  collected.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
              } while (c.nextSibling());
            }

            // Style the visible link text (between "[" and "]")
            if (firstMarkEnd !== null && secondMarkStart !== null && secondMarkStart > firstMarkEnd) {
              const deco = linkTitle
                ? Decoration.mark({ class: "cm-wysiwym-link-anchor", attributes: { title: linkTitle } })
                : linkDeco;
              collected.push({ from: firstMarkEnd, to: secondMarkStart, deco });
            }
          }
        }

        // 3.6. Autolinks <https://url> (which is mapped to "Autolink" in CommonMark)
        if (node.name === "Autolink") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            // Collapse the < and > angle brackets (first and last characters)
            collected.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            collected.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            // Style the URL text between the brackets
            collected.push({ from: node.from + 1, to: node.to - 1, deco: linkDeco });
          }
        }
        // Naked GFM Autolinks (which are mapped directly to "URL" under GFM parser extension)
        if (node.name === "URL") {
          const parent = node.node.parent;
          const isNaked = parent && parent.name !== "Link" && parent.name !== "Image" && parent.name !== "Autolink";
          if (isNaked) {
            const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
            if (!isCursorInside) {
              collected.push({ from: node.from, to: node.to, deco: linkDeco });
            }
          }
        }
        // 3.7. Custom ImageShortcode [image src="..." ...]
        if (node.name === "ImageShortcode") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            const attrs = {};
            const c = node.node.cursor();
            if (c.firstChild()) {
              do {
                if (c.name === "ShortcodeAttribute") {
                  const cc = c.node.cursor();
                  let name = "";
                  let val = "";
                  if (cc.firstChild()) {
                    do {
                      if (cc.name === "ShortcodeAttributeName") {
                        name = state.sliceDoc(cc.from, cc.to);
                      }
                      if (cc.name === "ShortcodeAttributeValue") {
                        val = state.sliceDoc(cc.from, cc.to);
                        val = val.replace(/^["']|["']$/g, "");
                      }
                    } while (cc.nextSibling());
                  }
                  if (name) {
                    attrs[name] = val;
                  }
                }
              } while (c.nextSibling());
            }

            const rawText = state.sliceDoc(node.from, node.to);
            const widget = new ImageShortcodeWidget(attrs, node.from, rawText);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget, block: true })
            });
            return false;
          }
        }
        // 3.8. Custom ComponentShortcode [component name="..." ...]
        if (node.name === "ComponentShortcode") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            const attrs = {};
            let bodyText = "";
            let tagName = "";

            const c = node.node.cursor();
            if (c.firstChild()) {
              do {
                if (c.name === "ComponentShortcodeOpen") {
                  const cc = c.node.cursor();
                  if (cc.firstChild()) {
                    do {
                      if (cc.name === "ComponentShortcodeTagName") {
                        tagName = state.sliceDoc(cc.from, cc.to);
                      }
                      if (cc.name === "ComponentShortcodeAttribute") {
                        const ccc = cc.node.cursor();
                        let name = "";
                        let val = "";
                        if (ccc.firstChild()) {
                          do {
                            if (ccc.name === "ComponentShortcodeAttributeName") {
                              name = state.sliceDoc(ccc.from, ccc.to) || "name";
                            }
                            if (ccc.name === "ComponentShortcodeAttributeValue") {
                              val = state.sliceDoc(ccc.from, ccc.to);
                              val = val.replace(/^["']|["']$/g, "");
                            }
                          } while (ccc.nextSibling());
                        }
                        if (name) {
                          attrs[name] = val;
                        }
                      }
                    } while (cc.nextSibling());
                  }
                }
                if (c.name === "ComponentShortcodeBody") {
                  bodyText = state.sliceDoc(c.from, c.to);
                }
              } while (c.nextSibling());
            }

            attrs._tagName = tagName;

            const rawText = state.sliceDoc(node.from, node.to);
            const widget = new ComponentShortcodeWidget(attrs, node.from, bodyText, rawText);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget, block: true })
            });
            return false;
          }
        }
        // 4. Headings (ATXHeading1-6, SetextHeading1-2, etc.)
        const headingMatch = node.name.match(/Heading([1-6])$/);
        if (headingMatch) {
          const level = parseInt(headingMatch[1]) || 1;
          const line = state.doc.lineAt(node.from);
          if (!decoratedLines.has(line.number)) {
            collected.push({ from: line.from, to: line.from, deco: getHeadingDeco(level) });
            decoratedLines.add(line.number);
          }
        }

        // 5. HeaderMark (e.g. '# ', '## ') - inside ATXHeading
        if (node.name === "HeaderMark") {
          const parent = node.node.parent;
          if (parent) {
            const parentLine = state.doc.lineAt(parent.from);
            const isCursorOnLine = cursorLine === parentLine.number;
            if (!isCursorOnLine) {
              let collapseTo = node.to;
              // Also collapse any space immediately following the hashes
              while (collapseTo < state.doc.length && state.sliceDoc(collapseTo, collapseTo + 1) === " ") {
                collapseTo++;
              }
              collected.push({ from: node.from, to: collapseTo, deco: collapseDeco });
            }
          }
        }

        // 6. Blockquote
        if (node.name === "Blockquote") {
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(node.to).number;
          for (let i = startLine; i <= endLine; i++) {
            if (!decoratedLines.has(i)) {
              const line = state.doc.line(i);
              collected.push({ from: line.from, to: line.from, deco: blockquoteLineDeco });
              decoratedLines.add(i);
            }
          }
        }

        // 7. QuoteMark ('>') inside Blockquote
        if (node.name === "QuoteMark") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            collected.push({ from: node.from, to: node.to, deco: collapseDeco });
          }
        }

        // 8. Horizontal Rule
        if (node.name === "HorizontalRule") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            // Replace with custom HR Widget
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new HRWidget(), block: true })
            });
          }
        }

        // 8.5. Task List Checkboxes (interactive)
        if (node.name === "TaskMarker") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            const markerText = state.sliceDoc(node.from, node.to);
            const isChecked = /\[[xX]\]/.test(markerText);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({
                widget: new CheckboxWidget(isChecked, node.from)
              })
            });
          }
        }

        // 8.6. Bullet List Markers (replace '-' / '*' / '+' with a bullet point when cursor is off the line)
        if (node.name === "ListMark") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            const listInfo = getListPrefixAt(state, line.from);
            if (listInfo && listInfo.type === "ul" && listInfo.from === node.from) {
              collected.push({
                from: node.from,
                to: node.to,
                deco: Decoration.replace({
                  widget: new BulletWidget()
                })
              });
            }
          }
        }

        // 9. YAML Frontmatter
        if (node.name === "Frontmatter") {
          let frontmatterTo = node.to;
          // Exclude any trailing newline to prevent line merging and incorrect endLine resolution
          if (frontmatterTo > node.from && state.sliceDoc(frontmatterTo - 1, frontmatterTo) === "\n") {
            frontmatterTo--;
            if (frontmatterTo > node.from && state.sliceDoc(frontmatterTo - 1, frontmatterTo) === "\r") {
              frontmatterTo--;
            }
          }

          const isCursorInside = cursorHead >= node.from && cursorHead <= frontmatterTo;
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(frontmatterTo).number;

          for (let i = startLine; i <= endLine; i++) {
            // If the cursor is outside, do not decorate the first and last lines (delimiters are collapsed)
            if (!isCursorInside && (i === startLine || i === endLine)) {
              continue;
            }
            if (!decoratedLines.has(i)) {
              const line = state.doc.line(i);
              collected.push({
                from: line.from,
                to: line.from,
                deco: isCursorInside ? frontmatterActiveLineDeco : frontmatterLineDeco
              });
              decoratedLines.add(i);
            }
          }

          // If the cursor is outside, collapse the '---' delimiters (first 3 and last 3 characters)
          if (!isCursorInside) {
            collected.push({ from: node.from, to: node.from + 3, deco: collapseDeco });
            collected.push({ from: frontmatterTo - 3, to: frontmatterTo, deco: collapseDeco });
          }
        }

        // 9.5 GFM Table
        if (node.name === "Table") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            // Replace the entire table with a rendered HTML table widget
            const tableText = state.doc.sliceString(node.from, node.to);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new TableWidget(tableText, node.from), block: true })
            });
          } else {
            // When editing: apply subtle background tint to table lines
            const startLine = state.doc.lineAt(node.from).number;
            const endLine = state.doc.lineAt(node.to).number;
            for (let i = startLine; i <= endLine; i++) {
              if (!decoratedLines.has(i)) {
                const line = state.doc.line(i);
                collected.push({ from: line.from, to: line.from, deco: tableRowLineDeco });
                decoratedLines.add(i);
              }
            }
          }
        }

        // 10. Fenced Code / Code Block
        if (node.name === "FencedCode" || node.name === "CodeBlock") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(node.to).number;

          for (let i = startLine; i <= endLine; i++) {
            // If the cursor is outside, do not decorate the first and last lines (fences are collapsed)
            if (!isCursorInside && node.name === "FencedCode" && (i === startLine || i === endLine)) {
              continue;
            }
            if (!decoratedLines.has(i)) {
              const line = state.doc.line(i);
              let deco = codeBlockLineDeco;
              
              if (node.name === "FencedCode") {
                const contentStartLine = startLine + 1;
                const contentEndLine = endLine - 1;
                
                if (contentStartLine > contentEndLine) {
                  continue;
                }
                
                if (isCursorInside) {
                  if (startLine === endLine) {
                    deco = codeBlockLineSingleDeco;
                  } else if (i === startLine) {
                    deco = codeBlockLineFirstDeco;
                  } else if (i === endLine) {
                    deco = codeBlockLineLastDeco;
                  }
                } else {
                  if (contentStartLine === contentEndLine) {
                    deco = codeBlockLineSingleDeco;
                  } else if (i === contentStartLine) {
                    deco = codeBlockLineFirstDeco;
                  } else if (i === contentEndLine) {
                    deco = codeBlockLineLastDeco;
                  }
                }
              } else {
                if (startLine === endLine) {
                  deco = codeBlockLineSingleDeco;
                } else if (i === startLine) {
                  deco = codeBlockLineFirstDeco;
                } else if (i === endLine) {
                  deco = codeBlockLineLastDeco;
                }
              }
              
              collected.push({
                from: line.from,
                to: line.from,
                deco: deco
              });
              decoratedLines.add(i);
            }
          }

          if (!isCursorInside && node.name === "FencedCode") {
            const startLineObj = state.doc.line(startLine);
            const endLineObj = state.doc.line(endLine);
            collected.push({ from: startLineObj.from, to: startLineObj.to, deco: collapseDeco });
            collected.push({ from: endLineObj.from, to: endLineObj.to, deco: collapseDeco });
            if (!decoratedLines.has(startLine)) {
              collected.push({ from: startLineObj.from, to: startLineObj.from, deco: collapsedFenceLineDeco });
              decoratedLines.add(startLine);
            }
            if (!decoratedLines.has(endLine)) {
              collected.push({ from: endLineObj.from, to: endLineObj.from, deco: collapsedFenceLineDeco });
              decoratedLines.add(endLine);
            }
          }
        }
      }
    });

  // --- Strict RangeSetBuilder Sorting (collect-sort-build) ---
  // 1. Sort by start position ascending.
  // 2. If start positions are equal, sort by decoration startSide ascending (critical to place line decorations first).
  // 3. If startSide is also equal, sort by end position descending (larger range/outer node first).
  collected.sort((a, b) => {
    if (a.from !== b.from) {
      return a.from - b.from;
    }
    const aSide = a.deco.startSide || 0;
    const bSide = b.deco.startSide || 0;
    if (aSide !== bSide) {
      return aSide - bSide;
    }
    return b.to - a.to;
  });

  const builder = new RangeSetBuilder();
  for (const { from, to, deco } of collected) {
    // RangeSetBuilder requires strict document ordering.
    // Double check that we don't try to add past ranges if there are any overlaps
    builder.add(from, to, deco);
  }

  return builder.finish();
}

export const wysiwymField = StateField.define({
  create(state) {
    return buildWysiwymDecorations(state);
  },
  update(decorations, tr) {
    const focusChanged = tr.effects.some(e => e.is(setFocusEffect));
    if (tr.docChanged || tr.selection || focusChanged) {
      return buildWysiwymDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f)
});

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
    wysiwymField,
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
