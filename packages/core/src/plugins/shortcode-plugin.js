// @ts-check
import { Decoration, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { highlightDeco, collapseDeco, renderInlineMarkdown } from "../wysiwym.js";
import { openImageModal, openComponentModal, openVideoModal, openAudioModal, openFigureModal } from "../toolbar/modal.js";
import { sanitizeUrl, parseVideoUrl } from "../security.js";
import { viewToEditor } from "../bridge.js";

export class ImageShortcodeWidget extends WidgetType {
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
      this.attrs.class === other.attrs.class
    );
  }

  ignoreEvent() { return false; }
}

export class VideoShortcodeWidget extends WidgetType {
  constructor(attrs, nodeFrom, rawText) {
    super();
    this.attrs = attrs;
    this.nodeFrom = nodeFrom;
    this.rawText = rawText;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-video-shortcode-container";

    if (this.rawText) {
      container.title = this.rawText;
    }

    const src = this.attrs.src || "";
    const caption = this.attrs.caption || "";
    const align = this.attrs.align || "center";
    const size = this.attrs.size || "medium";
    const customClass = this.attrs.class || "";

    container.classList.add(`align-${align}`);
    container.classList.add(`size-${size}`);
    if (customClass) {
      customClass.split(/\s+/).forEach(c => {
        if (c) container.classList.add(c);
      });
    }

    // Platform Badge & Placeholder Card
    const placeholderCard = document.createElement("div");
    placeholderCard.className = "video-placeholder";
    const parsed = parseVideoUrl(src);
    let platformLabel = "Video";
    let iconSvg = `<svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    
    if (parsed.platform === "youtube" || this.attrs._tagName === "youtube") {
      platformLabel = "YouTube";
    } else if (parsed.platform === "vimeo") {
      platformLabel = "Vimeo";
    } else if (parsed.platform === "native") {
      platformLabel = "Video File";
    }

    placeholderCard.innerHTML = `
      <div class="video-placeholder-icon-wrap">
        ${iconSvg}
      </div>
      <div class="video-placeholder-details">
        <span class="video-placeholder-platform">${platformLabel}</span>
        <span class="video-placeholder-url">${src || "No source URL"}</span>
      </div>
    `;

    container.appendChild(placeholderCard);

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
    editIcon.className = "video-edit-icon";
    editIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    container.appendChild(editIcon);

    // Mousedown listener to open Video Modal for editing
    container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openVideoModal({
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
      other instanceof VideoShortcodeWidget &&
      this.nodeFrom === other.nodeFrom &&
      this.rawText === other.rawText &&
      this.attrs.src === other.attrs.src &&
      this.attrs.caption === other.attrs.caption &&
      this.attrs.align === other.attrs.align &&
      this.attrs.size === other.attrs.size &&
      this.attrs.class === other.attrs.class
    );
  }

  ignoreEvent() { return false; }
}

export class AudioShortcodeWidget extends WidgetType {
  constructor(attrs, nodeFrom, rawText) {
    super();
    this.attrs = attrs;
    this.nodeFrom = nodeFrom;
    this.rawText = rawText;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-audio-shortcode-container";

    if (this.rawText) {
      container.title = this.rawText;
    }

    const src = this.attrs.src || "";
    const caption = this.attrs.caption || "";
    const align = this.attrs.align || "center";
    const size = this.attrs.size || "medium";
    const customClass = this.attrs.class || "";

    container.classList.add(`align-${align}`);
    container.classList.add(`size-${size}`);
    if (customClass) {
      customClass.split(/\s+/).forEach(c => {
        if (c) container.classList.add(c);
      });
    }

    // Placeholder Card
    const placeholderCard = document.createElement("div");
    placeholderCard.className = "audio-placeholder";

    let platformLabel = "Audio File";
    let iconSvg = `<svg class="play-icon" width="24" height="24" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="48" y1="96" x2="48" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="32" x2="88" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="64" x2="128" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="168" y1="96" x2="168" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="208" y1="80" x2="208" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;

    placeholderCard.innerHTML = `
      <div class="audio-placeholder-icon-wrap">
        ${iconSvg}
      </div>
      <div class="audio-placeholder-details">
        <span class="audio-placeholder-platform">${platformLabel}</span>
        <span class="audio-placeholder-url">${src || "No source URL"}</span>
      </div>
    `;

    container.appendChild(placeholderCard);

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
    editIcon.className = "audio-edit-icon";
    editIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    container.appendChild(editIcon);

    // Mousedown listener to open Audio Modal for editing
    container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openAudioModal({
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
      other instanceof AudioShortcodeWidget &&
      this.nodeFrom === other.nodeFrom &&
      this.rawText === other.rawText &&
      this.attrs.src === other.attrs.src &&
      this.attrs.caption === other.attrs.caption &&
      this.attrs.align === other.attrs.align &&
      this.attrs.size === other.attrs.size &&
      this.attrs.class === other.attrs.class
    );
  }

  ignoreEvent() { return false; }
}

export class ComponentShortcodeWidget extends WidgetType {
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

    const openEditModal = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openComponentModal({
          editor,
          triggerElement: container,
          docFrom: this.nodeFrom,
          docTo: this.nodeFrom + this.rawText.length,
          attrs: this.attrs,
          bodyText: this.bodyText
        });
      }
    };

    editIcon.addEventListener("mousedown", openEditModal);
    editIcon.addEventListener("click", openEditModal);
    container.addEventListener("mousedown", openEditModal);

    const contentLines = this.bodyText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const bodyContainer = document.createElement("div");
    bodyContainer.className = "component-body";
    contentLines.forEach(line => {
      const p = document.createElement("p");
      p.innerHTML = renderInlineMarkdown(line);
      bodyContainer.appendChild(p);
    });

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
      const title = this.attrs.title || "";
      const collapsible = this.attrs.collapsible === "true";
      const displayTitle = title || (collapsible ? (compName.charAt(0).toUpperCase() + compName.slice(1)) : "");

      if (collapsible) {
        const details = document.createElement("details");
        details.setAttribute("open", "");
        
        const summary = document.createElement("summary");
        summary.className = "component-header";
        
        const titleSpan = document.createElement("span");
        titleSpan.className = "component-title";
        titleSpan.textContent = displayTitle;
        
        summary.appendChild(titleSpan);
        details.appendChild(summary);
        details.appendChild(bodyContainer);
        container.appendChild(details);
        
        summary.addEventListener("mousedown", (e) => {
          e.stopPropagation();
        });
        summary.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      } else {
        if (displayTitle) {
          const header = document.createElement("div");
          header.className = "component-header";
          
          const titleSpan = document.createElement("span");
          titleSpan.className = "component-title";
          titleSpan.textContent = displayTitle;
          
          header.appendChild(titleSpan);
          container.appendChild(header);
        }
        container.appendChild(bodyContainer);
      }
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

export class FigureShortcodeWidget extends WidgetType {
  constructor(attrs, nodeFrom, bodyText, rawText) {
    super();
    this.attrs = attrs;
    this.nodeFrom = nodeFrom;
    this.bodyText = bodyText;
    this.rawText = rawText;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-figure-shortcode";

    if (this.rawText) {
      container.title = this.rawText;
    }

    const caption = this.attrs.caption || "";
    const align = this.attrs.align || "center";
    const size = this.attrs.size || "medium";
    const customClass = this.attrs.class || "";

    container.classList.add(`align-${align}`);
    container.classList.add(`size-${size}`);
    if (customClass) {
      customClass.split(/\s+/).forEach(c => {
        if (c) container.classList.add(c);
      });
    }

    const contentLines = this.bodyText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const bodyContainer = document.createElement("div");
    bodyContainer.className = "component-body";
    contentLines.forEach(line => {
      const p = document.createElement("p");
      p.innerHTML = renderInlineMarkdown(line);
      bodyContainer.appendChild(p);
    });
    container.appendChild(bodyContainer);

    if (caption) {
      const figcaption = document.createElement("div");
      figcaption.className = "figure-caption";
      figcaption.textContent = caption;
      container.appendChild(figcaption);
    }

    const editIcon = document.createElement("div");
    editIcon.className = "figure-edit-icon";
    editIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    container.appendChild(editIcon);

    const openEditModal = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openFigureModal({
          editor,
          triggerElement: container,
          docFrom: this.nodeFrom,
          docTo: this.nodeFrom + this.rawText.length,
          attrs: this.attrs,
          bodyText: this.bodyText
        });
      }
    };

    editIcon.addEventListener("mousedown", openEditModal);
    editIcon.addEventListener("click", openEditModal);
    container.addEventListener("mousedown", openEditModal);

    return container;
  }

  eq(other) {
    return (
      other instanceof FigureShortcodeWidget &&
      this.nodeFrom === other.nodeFrom &&
      this.bodyText === other.bodyText &&
      this.rawText === other.rawText &&
      JSON.stringify(this.attrs) === JSON.stringify(other.attrs)
    );
  }

  ignoreEvent() { return false; }
}

export class ShortcodePlugin extends TravenPlugin {
  name = "shortcode";
  requiredNodes = ["ImageShortcode", "VideoShortcode", "AudioShortcode", "ComponentShortcode"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorHead, suppressed, suppressedFigureRanges } = ctx;

    // 1. Process FigureShortcodes first via regex since they can contain blocks.
    // They are technically parsed as paragraphs by default if not supported by an AST node.
    // But we suppress the inner contents using suppressedFigureRanges.
    const docText = state.doc.toString();
    const figureRegex = /\[figure((?:\s+[^\]]*|=\s*(?:"[^"]*"|'[^']*'|[^\s\]]+)(?:\s+[^\]]*)?)?)\]([\s\S]*?)\[\/figure\]/g;
    let match;
    while ((match = figureRegex.exec(docText)) !== null) {
      const from = match.index;
      const to = from + match[0].length;
      const attrsStr = match[1] || "";
      const bodyText = match[2] || "";

      const isCursorInside = cursorHead > from && cursorHead < to;
      if (!isCursorInside) {
        const attrs = {};
        const attrRegex = /\s*([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=]+))/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const name = attrMatch[1];
          const val = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] || ""));
          attrs[name] = val;
        }
        
        const rawText = match[0];
        const widget = new FigureShortcodeWidget(attrs, from, bodyText, rawText);
        decorations.push({
          from,
          to,
          deco: Decoration.replace({ widget, block: true })
        });
      }
    }

    // 2. Process AST for inline shortcodes
    syntaxTree(state).iterate({
      enter(node) {
        // Skip processing any AST nodes inside replaced figures
        if (suppressedFigureRanges.some(r => node.from >= r.from && node.to <= r.to)) {
          return false;
        }

        if (node.name === "ImageShortcode") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;
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
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget, block: true })
            });
            return false;
          }
        }

        if (node.name === "VideoShortcode") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;
          if (!isCursorInside) {
            const attrs = {};
            const c = node.node.cursor();
            if (c.firstChild()) {
              do {
                if (c.name === "VideoShortcodeAttribute") {
                  const cc = c.node.cursor();
                  let name = "";
                  let val = "";
                  if (cc.firstChild()) {
                    do {
                      if (cc.name === "VideoShortcodeAttributeName") {
                        name = state.sliceDoc(cc.from, cc.to);
                      }
                      if (cc.name === "VideoShortcodeAttributeValue") {
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
            let tagName = "video";
            const tagNode = node.node.getChild("VideoShortcodeTagName");
            if (tagNode) {
              tagName = state.sliceDoc(tagNode.from, tagNode.to);
            }
            attrs._tagName = tagName;
            const widget = new VideoShortcodeWidget(attrs, node.from, rawText);

            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget, block: true })
            });
            return false;
          }
        }

        if (node.name === "AudioShortcode") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;
          if (!isCursorInside) {
            const attrs = {};
            const c = node.node.cursor();
            if (c.firstChild()) {
              do {
                if (c.name === "AudioShortcodeAttribute") {
                  const cc = c.node.cursor();
                  let name = "";
                  let val = "";
                  if (cc.firstChild()) {
                    do {
                      if (cc.name === "AudioShortcodeAttributeName") {
                        name = state.sliceDoc(cc.from, cc.to);
                      }
                      if (cc.name === "AudioShortcodeAttributeValue") {
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
            const widget = new AudioShortcodeWidget(attrs, node.from, rawText);
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget, block: true })
            });
            return false;
          }
        }

        if (node.name === "ComponentShortcode") {
          let tagName = "";
          let openEnd = null;
          let closeStart = null;
          const c = node.node.cursor();
          if (c.firstChild()) {
            do {
              if (c.name === "ComponentShortcodeOpen") {
                openEnd = c.to;
                const cc = c.node.cursor();
                if (cc.firstChild()) {
                  do {
                    if (cc.name === "ComponentShortcodeTagName") {
                      tagName = state.sliceDoc(cc.from, cc.to);
                    }
                  } while (cc.nextSibling());
                }
              }
              if (c.name === "ComponentShortcodeClose") {
                closeStart = c.from;
              }
            } while (c.nextSibling());
          }

          if (tagName === "highlight") {
            const isCursorInside = cursorHead > node.from && cursorHead < node.to;
            const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);
            if (!isCursorInside || isSuppressed) {
              if (openEnd !== null && closeStart !== null) {
                decorations.push({ from: node.from, to: openEnd, deco: collapseDeco });
                decorations.push({ from: closeStart, to: node.to, deco: collapseDeco });
                decorations.push({ from: openEnd, to: closeStart, deco: highlightDeco });
              }
            }
            return false;
          }

          const isCursorInside = cursorHead > node.from && cursorHead < node.to;
          if (!isCursorInside) {
            const attrs = {};
            let bodyText = "";

            const c2 = node.node.cursor();
            if (c2.firstChild()) {
              do {
                if (c2.name === "ComponentShortcodeOpen") {
                  const cc = c2.node.cursor();
                  if (cc.firstChild()) {
                    do {
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
                if (c2.name === "ComponentShortcodeBody") {
                  bodyText = state.sliceDoc(c2.from, c2.to);
                }
              } while (c2.nextSibling());
            }

            attrs._tagName = tagName;

            const rawText = state.sliceDoc(node.from, node.to);
            const widget = new ComponentShortcodeWidget(attrs, node.from, bodyText, rawText);
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget, block: true })
            });
            return false;
          }
        }

      }
    });
  }

  /**
   * @param {import("@lezer/common").SyntaxNode} _node 
   * @param {string} _childrenHtml 
   * @param {any} _ctx 
   */
  renderToHTML(_node, _childrenHtml, _ctx) {
    return null; // Fall through to default renderer
  }
}
