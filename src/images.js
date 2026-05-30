// @ts-check
import { EditorView, WidgetType, Decoration } from "@codemirror/view";
import { RangeSetBuilder, StateField } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { focusField, setFocusEffect } from "./wysiwym.js";
import { viewToEditor } from "./bridge.js";
import { openImageModal } from "./toolbar/modal.js";

// --- Image Preview Widget ---
class ImageWidget extends WidgetType {
  constructor(url, alt, nodeFrom, nodeTo) {
    super();
    this.url = url;
    this.alt = alt;
    this.nodeFrom = nodeFrom;
    this.nodeTo = nodeTo;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-image-widget-container";
    container.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.className = "cm-wysiwym-image-preview";
    img.draggable = false;

    container.appendChild(img);
    
    const captionText = this.alt && this.alt.toLowerCase() !== "image" ? this.alt : "";
    if (captionText) {
      const caption = document.createElement("div");
      caption.className = "cm-wysiwym-image-caption";
      caption.textContent = captionText;
      container.appendChild(caption);
    }

    // Click handler: open the Image Editor Modal
    container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openImageModal({
          editor,
          triggerElement: container,
          docFrom: this.nodeFrom,
          docTo: this.nodeTo,
          attrs: { src: this.url, alt: this.alt },
          isAdvancedMode: false
        });
      }
    });

    return container;
  }

  eq(other) {
    return other instanceof ImageWidget && other.url === this.url && other.alt === this.alt && other.nodeFrom === this.nodeFrom && other.nodeTo === this.nodeTo;
  }

  ignoreEvent() { return false; }
}

// --- Uploading Placeholder Widget ---
class UploadingWidget extends WidgetType {
  constructor(fileName) {
    super();
    this.fileName = fileName;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-image-uploading";
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
      <span style="vertical-align: middle;">Uploading ${this.fileName}...</span>
      <style>
        @keyframes spin { 100% { transform: rotate(360deg); } }
      </style>
    `;
    return container;
  }

  eq(other) {
    return other instanceof UploadingWidget && other.fileName === this.fileName;
  }
}

// --- Image Decoration ViewPlugin ---
function buildImageDecorations(state) {
  const collected = [];
  const hasFocus = state.field(focusField, false);
  const cursorHead = hasFocus ? state.selection.main.head : -1;

  syntaxTree(state).iterate({
    from: 0,
    to: state.doc.length,
    enter(node) {
        if (node.name === "Image") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          if (!isCursorInside) {
            const nodeText = state.sliceDoc(node.from, node.to);
            const match = nodeText.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (match) {
              const alt = match[1];
              const url = match[2];

              const isUploading = !url || alt.startsWith("Uploading") || url.startsWith("Uploading");
              if (isUploading) {
                const fileName = alt.replace("Uploading ", "").replace("...", "") || "file";
                collected.push({
                  from: node.from,
                  to: node.to,
                  deco: Decoration.replace({ widget: new UploadingWidget(fileName), block: true })
                });
              } else {
                collected.push({
                  from: node.from,
                  to: node.to,
                  deco: Decoration.replace({ widget: new ImageWidget(url, alt, node.from, node.to), block: true })
                });
              }
            }
          }
        }
      }
    });

  collected.sort((a, b) => a.from - b.from || b.to - a.to);

  const builder = new RangeSetBuilder();
  for (const { from, to, deco } of collected) {
    builder.add(from, to, deco);
  }
  return builder.finish();
}

export const imageDecorationField = StateField.define({
  create(state) {
    return buildImageDecorations(state);
  },
  update(decorations, tr) {
    const focusChanged = tr.effects.some(e => e.is(setFocusEffect));
    if (tr.docChanged || tr.selection || focusChanged) {
      return buildImageDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f)
});

export const imageDecorationPlugin = () => {
  return [imageDecorationField];
};

async function handleOptimisticUpload(
  file,
  pos,
  view,
  uploadFn
) {
  if (!uploadFn) return;

  const placeholder = `[image alt="Uploading ${file.name}..."]`;

  // 1. Insert placeholder
  view.dispatch({
    changes: { from: pos, insert: placeholder }
  });

  try {
    // 2. Perform async upload
    const finalUrl = await uploadFn(file);

    // 3. Locate placeholder and replace with final URL
    const docString = view.state.doc.toString();
    const offset = docString.indexOf(placeholder);
    if (offset !== -1) {
      view.dispatch({
        changes: {
          from: offset,
          to: offset + placeholder.length,
          insert: `[image src="${finalUrl}" alt="${file.name}" align="center" size="medium"]`
        }
      });
    }
  } catch (error) {
    // 4. Remove placeholder on failure
    const docString = view.state.doc.toString();
    const offset = docString.indexOf(placeholder);
    if (offset !== -1) {
      view.dispatch({
        changes: { from: offset, to: offset + placeholder.length, insert: "" }
      });
    }
    console.error("Image upload failed:", error);
  }
}

export function imageHandlerExtension(
  uploadFn
) {
  return EditorView.domEventHandlers({
    drop(event, view) {
      const files = event.dataTransfer?.files;
      if (files && files.length > 0 && files[0].type.startsWith("image/")) {
        event.preventDefault();
        const coords = { x: event.clientX, y: event.clientY };
        const dropPos = view.posAtCoords(coords) ?? view.state.selection.main.head;
        handleOptimisticUpload(files[0], dropPos, view, uploadFn);
        return true;
      }
      return false;
    },

    paste(event, view) {
      const items = event.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const currentPos = view.state.selection.main.head;
              handleOptimisticUpload(file, currentPos, view, uploadFn);
              return true;
            }
          }
        }
      }
      return false;
    }
  });
}
