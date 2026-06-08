// @ts-check
import { openModal } from "./modal-base.js";
import { createLayoutPicker } from "./layout-picker.js";

/**
 * Renders the Audio Insertion Modal dialog.
 *
 * @param {Object|any} optionsOrEditor - The TravenEditor instance, or options object.
 * @param {HTMLElement|null} [triggerBtn] - The button that triggered the modal.
 */
export function openAudioModal(optionsOrEditor, triggerBtn = null) {
  let editor;
  let triggerElement = null;
  let docFrom = null;
  let docTo = null;
  let attrs = {};

  if (optionsOrEditor && optionsOrEditor.editor) {
    editor = optionsOrEditor.editor;
    triggerElement = optionsOrEditor.triggerElement || null;
    docFrom = optionsOrEditor.docFrom !== undefined ? optionsOrEditor.docFrom : null;
    docTo = optionsOrEditor.docTo !== undefined ? optionsOrEditor.docTo : null;
    attrs = optionsOrEditor.attrs || {};
  } else {
    editor = optionsOrEditor;
    triggerElement = triggerBtn;
  }

  const form = document.createElement("div");

  const errorEl = document.createElement("div");
  errorEl.className = "traven-modal-error";
  errorEl.style.display = "none";

  // URL Field
  const urlField = document.createElement("div");
  urlField.className = "traven-modal-field";
  urlField.innerHTML = `
    <label class="traven-modal-label" for="traven-audio-url">Audio URL (Direct Link or Uploaded File)</label>
    <input type="text" id="traven-audio-url" class="traven-modal-input" placeholder="e.g. https://example.com/audio.mp3" value="" />
    <div id="traven-audio-url-feedback" class="traven-modal-input-feedback" style="font-size: 11px; margin-top: 4px; color: var(--text-secondary, #64748b);"></div>
  `;
  form.appendChild(urlField);

  // Caption Field
  const captionField = document.createElement("div");
  captionField.className = "traven-modal-field";
  captionField.innerHTML = `
    <label class="traven-modal-label" for="traven-audio-caption">Caption</label>
    <input type="text" id="traven-audio-caption" class="traven-modal-input" placeholder="e.g. Figure 1: Demo Audio" value="" />
  `;
  form.appendChild(captionField);

  const initialAlign = attrs.align || "center";
  const initialSize = attrs.size || "medium";

  const layoutPicker = createLayoutPicker({
    alignId: "traven-audio-align",
    sizeId: "traven-audio-size",
    initialAlign,
    initialSize
  });
  form.appendChild(layoutPicker.element);

  // Class Field
  const classField = document.createElement("div");
  classField.className = "traven-modal-field";
  classField.innerHTML = `
    <label class="traven-modal-label" for="traven-audio-class">CSS Class</label>
    <input type="text" id="traven-audio-class" class="traven-modal-input" placeholder="e.g. shadow border" value="" />
  `;
  form.appendChild(classField);

  form.appendChild(errorEl);

  const urlInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-audio-url"));
  const urlFeedback = /** @type {HTMLElement} */ (form.querySelector("#traven-audio-url-feedback"));
  const captionInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-audio-caption"));
  const alignSelect = layoutPicker.alignSelect;
  const sizeSelect = layoutPicker.sizeSelect;
  const classInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-audio-class"));

  // Real-time feedback for URL input
  urlInput.addEventListener("input", () => {
    const src = urlInput.value.trim();
    if (!src) {
      urlFeedback.textContent = "";
      return;
    }
    
    if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(src)) {
      urlFeedback.textContent = "✓ Audio file detected";
      urlFeedback.style.color = "#10b981"; // Green
    } else {
      urlFeedback.textContent = "⚠ Unrecognized audio extension (will compile as standard source)";
      urlFeedback.style.color = "#f59e0b"; // Orange
    }
  });

  // Pre-populate if editing
  if (docFrom !== null) {
    urlInput.value = attrs.src || "";
    captionInput.value = attrs.caption || "";
    classInput.value = attrs.class || "";
    urlInput.dispatchEvent(new Event("input"));
  } else {
    // Fill from selection if available
    const view = editor.getView();
    const { from, to } = view.state.selection.main;
    const selectedText = from !== to ? view.state.sliceDoc(from, to) : "";
    if (selectedText && selectedText.startsWith("http")) {
      urlInput.value = selectedText;
      urlInput.dispatchEvent(new Event("input"));
    }
  }

  const insertAudio = (url) => {
    const v = editor.getView();

    if (!url) {
      // If clearing URL during edit, remove the shortcode entirely
      if (docFrom !== null) {
        const docStr = v.state.doc.toString();
        let idxBefore = docFrom - 1;
        while (idxBefore >= 0 && (docStr[idxBefore] === "\n" || docStr[idxBefore] === "\r" || docStr[idxBefore] === " " || docStr[idxBefore] === "\t")) {
          idxBefore--;
        }
        let idxAfter = docTo;
        while (idxAfter < docStr.length && (docStr[idxAfter] === "\n" || docStr[idxAfter] === "\r" || docStr[idxAfter] === " " || docStr[idxAfter] === "\t")) {
          idxAfter++;
        }
        let replacementNewlines = "";
        if (idxBefore >= 0 && idxAfter < docStr.length) {
          replacementNewlines = "\n\n";
        }
        v.dispatch({
          changes: { from: idxBefore + 1, to: idxAfter, insert: replacementNewlines },
          selection: { anchor: idxBefore + 1 + (replacementNewlines ? 1 : 0) }
        });
      }
      v.focus();
      return;
    }

    const captionVal = captionInput.value.trim();
    const alignVal = alignSelect.value;
    const sizeVal = sizeSelect.value;
    const classVal = classInput.value.trim();

    const attrParts = [`src="${url}"`];
    if (alignVal && alignVal !== "center") {
      attrParts.push(`align="${alignVal}"`);
    }
    if (sizeVal && sizeVal !== "medium") {
      attrParts.push(`size="${sizeVal}"`);
    }
    if (captionVal) {
      attrParts.push(`caption="${captionVal}"`);
    }
    if (classVal) {
      attrParts.push(`class="${classVal}"`);
    }

    const insertion = `[audio ${attrParts.join(" ")}]`;

    if (docFrom !== null) {
      v.dispatch({
        changes: { from: docFrom, to: docTo, insert: insertion }
      });
      const pos = docFrom + insertion.length;
      const docStr = v.state.doc.toString();
      let targetAnchor = pos;
      if (pos < docStr.length && docStr[pos] === "\n") {
        targetAnchor = pos + 1;
      } else {
        v.dispatch({
          changes: { from: pos, insert: "\n" }
        });
        targetAnchor = pos + 1;
      }
      v.dispatch({
        selection: { anchor: targetAnchor }
      });
    } else {
      const range = v.state.selection.main;
      const insertionText = insertion + "\n";
      v.dispatch({
        changes: { from: range.from, to: range.to, insert: insertionText },
        selection: { anchor: range.from + insertionText.length }
      });
    }
    v.focus();
  };

  openModal({
    title: docFrom !== null ? "Edit Audio" : "Insert Audio",
    body: form,
    triggerElement: triggerElement,
    onClose: () => {
      const view = editor.getView();
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
        text: docFrom !== null ? "Save" : "Insert",
        type: "primary",
        onClick: (e, overlay) => {
          const urlValue = urlInput.value.trim();

          if (!urlValue) {
            if (docFrom !== null) {
              insertAudio("");
              overlay.querySelector(".traven-modal-close").click();
              return;
            } else {
              errorEl.textContent = "Please enter an audio URL.";
              errorEl.style.display = "block";
              return;
            }
          }

          insertAudio(urlValue);
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}
