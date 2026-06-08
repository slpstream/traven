// @ts-check
import { openModal } from "./modal-base.js";
import { createLayoutPicker } from "./layout-picker.js";

/**
 * Renders the Figure Insertion/Edition Modal dialog.
 * Inserts or updates a [figure caption="…"]…[/figure] shortcode block.
 *
 * @param {Object|any} optionsOrEditor - The TravenEditor instance, or options object.
 * @param {HTMLElement|null} [triggerBtn] - The button that triggered the modal.
 */
export function openFigureModal(optionsOrEditor, triggerBtn = null) {
  let editor;
  let triggerElement = null;
  let docFrom = null;
  let docTo = null;
  let attrs = {};
  let bodyText = "";

  if (optionsOrEditor && optionsOrEditor.editor) {
    editor = optionsOrEditor.editor;
    triggerElement = optionsOrEditor.triggerElement || null;
    docFrom = optionsOrEditor.docFrom !== undefined ? optionsOrEditor.docFrom : null;
    docTo = optionsOrEditor.docTo !== undefined ? optionsOrEditor.docTo : null;
    attrs = optionsOrEditor.attrs || {};
    bodyText = optionsOrEditor.bodyText || "";
  } else {
    editor = optionsOrEditor;
    triggerElement = triggerBtn;
  }

  const view = editor.getView();
  const isEditing = docFrom !== null && docTo !== null;

  const { from, to } = view.state.selection.main;
  const selectionText = from !== to ? view.state.sliceDoc(from, to) : "";
  let initialBody = (bodyText || selectionText || "").replace(/^\r?\n|\r?\n$/g, "");

  const form = document.createElement("div");

  const errorEl = document.createElement("div");
  errorEl.className = "traven-modal-error";
  errorEl.style.display = "none";

  // Body/Content Field (Textarea with Auto-Resize)
  const bodyField = document.createElement("div");
  bodyField.className = "traven-modal-field";
  bodyField.innerHTML = `
    <label class="traven-modal-label" for="traven-figure-body">Figure Content (Markdown, code block, SVG, iframe, table...)</label>
  `;
  const bodyTextarea = document.createElement("textarea");
  bodyTextarea.id = "traven-figure-body";
  bodyTextarea.className = "traven-modal-input";
  bodyTextarea.placeholder = "Paste or type your figure content here (e.g. SVG markup, a table, or a code block)...";
  bodyTextarea.rows = 4;
  bodyTextarea.style.resize = "none";
  bodyTextarea.style.overflow = "hidden";
  bodyTextarea.style.lineHeight = "1.5";
  bodyTextarea.style.fontFamily = "inherit";
  bodyTextarea.style.minHeight = "96px";
  bodyTextarea.style.boxSizing = "border-box";
  bodyTextarea.value = initialBody;

  const autoResize = () => {
    bodyTextarea.style.height = "auto";
    bodyTextarea.style.height = bodyTextarea.scrollHeight + "px";
  };
  bodyTextarea.addEventListener("input", autoResize);
  bodyField.appendChild(bodyTextarea);
  form.appendChild(bodyField);

  // Caption Field
  const captionField = document.createElement("div");
  captionField.className = "traven-modal-field";
  captionField.innerHTML = `
    <label class="traven-modal-label" for="traven-figure-caption">Caption (optional)</label>
    <input type="text" id="traven-figure-caption" class="traven-modal-input" placeholder="e.g. Figure 1: System architecture diagram" value="" />
  `;
  form.appendChild(captionField);

  const initialAlign = attrs.align || "center";
  const initialSize = attrs.size || "medium";

  const layoutPicker = createLayoutPicker({
    alignId: "traven-figure-align",
    sizeId: "traven-figure-size",
    initialAlign,
    initialSize
  });
  form.appendChild(layoutPicker.element);

  // Class Field
  const classField = document.createElement("div");
  classField.className = "traven-modal-field";
  classField.innerHTML = `
    <label class="traven-modal-label" for="traven-figure-class">CSS Class (optional)</label>
    <input type="text" id="traven-figure-class" class="traven-modal-input" placeholder="e.g. border shadow-lg" value="" />
  `;
  form.appendChild(classField);

  form.appendChild(errorEl);

  const captionInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-figure-caption"));
  const alignSelect = layoutPicker.alignSelect;
  const sizeSelect = layoutPicker.sizeSelect;
  const classInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-figure-class"));

  // Pre-populate fields if editing
  if (isEditing) {
    captionInput.value = attrs.caption || "";
    classInput.value = attrs.class || "";
  }

  const dispatchInsert = (insertFrom, insertTo, snippet) => {
    view.dispatch({
      changes: { from: insertFrom, to: insertTo, insert: snippet }
    });
    const pos = insertFrom + snippet.length;
    const docStr = view.state.doc.toString();
    let targetAnchor = pos;
    if (pos < docStr.length && docStr[pos] === "\n") {
      targetAnchor = pos + 1;
    } else {
      view.dispatch({ changes: { from: pos, insert: "\n" } });
      targetAnchor = pos + 1;
    }
    view.dispatch({ selection: { anchor: targetAnchor } });
  };

  openModal({
    title: isEditing ? "Edit Figure" : "Insert Figure",
    body: form,
    triggerElement: triggerElement,
    onClose: () => {
      if (view && typeof view.requestMeasure === "function") {
        view.requestMeasure();
      }
    },
    buttons: [
      {
        text: "Cancel",
        type: "secondary",
        onClick: (e, overlay) => {
          overlay.querySelector(".traven-modal-close").click();
        }
      },
      {
        text: isEditing ? "Save" : "Insert",
        type: "primary",
        onClick: (e, overlay) => {
          const bodyVal = bodyTextarea.value.replace(/^\r?\n|\r?\n$/g, "");
          const captionVal = captionInput.value.trim();
          const alignVal = alignSelect.value;
          const sizeVal = sizeSelect.value;
          const classVal = classInput.value.trim();

          if (!bodyVal) {
            errorEl.textContent = "Figure content is required.";
            errorEl.style.display = "block";
            bodyTextarea.focus();
            return;
          }

          // Build open tag attributes
          const parts = [];
          if (captionVal) parts.push(`caption="${captionVal}"`);
          if (alignVal !== "center") parts.push(`align="${alignVal}"`);
          if (sizeVal !== "medium") parts.push(`size="${sizeVal}"`);
          if (classVal) parts.push(`class="${classVal}"`);

          const openTag = `[figure${parts.length > 0 ? " " + parts.join(" ") : ""}]`;
          const closeTag = `[/figure]`;
          const snippet = `${openTag}\n${bodyVal}\n${closeTag}`;

          if (isEditing) {
            dispatchInsert(docFrom, docTo, snippet);
          } else {
            const insertFrom = selectionText ? from : view.state.selection.main.from;
            const insertTo = selectionText ? to : view.state.selection.main.to;
            dispatchInsert(insertFrom, insertTo, snippet);
          }

          view.focus();
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });

  // Trigger initial auto-resize
  requestAnimationFrame(() => {
    autoResize();
  });
}
