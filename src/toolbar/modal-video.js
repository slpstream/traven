// @ts-check
import { openModal } from "./modal-base.js";
import { parseVideoUrl } from "../security.js";

/**
 * Renders the Video Insertion Modal dialog.
 *
 * @param {Object|any} optionsOrEditor - The TravenEditor instance, or options object.
 * @param {HTMLElement|null} [triggerBtn] - The button that triggered the modal.
 */
export function openVideoModal(optionsOrEditor, triggerBtn = null) {
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
    <label class="traven-modal-label" for="traven-video-url">Video URL (YouTube, Vimeo, or Direct Link)</label>
    <input type="text" id="traven-video-url" class="traven-modal-input" placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ" value="" />
    <div id="traven-video-url-feedback" class="traven-modal-input-feedback" style="font-size: 11px; margin-top: 4px; color: var(--text-secondary, #64748b);"></div>
  `;
  form.appendChild(urlField);

  // Caption Field
  const captionField = document.createElement("div");
  captionField.className = "traven-modal-field";
  captionField.innerHTML = `
    <label class="traven-modal-label" for="traven-video-caption">Caption</label>
    <input type="text" id="traven-video-caption" class="traven-modal-input" placeholder="e.g. Figure 1: Demo Video" value="" />
  `;
  form.appendChild(captionField);

  // Layout Align Dropdown
  const alignField = document.createElement("div");
  alignField.className = "traven-modal-field";
  alignField.innerHTML = `
    <label class="traven-modal-label" for="traven-video-align">Alignment</label>
    <select id="traven-video-align" class="traven-modal-select">
      <option value="left">Left</option>
      <option value="center" selected>Center</option>
      <option value="right">Right</option>
    </select>
  `;
  form.appendChild(alignField);

  // Layout Size Dropdown
  const sizeField = document.createElement("div");
  sizeField.className = "traven-modal-field";
  sizeField.innerHTML = `
    <label class="traven-modal-label" for="traven-video-size">Size</label>
    <select id="traven-video-size" class="traven-modal-select">
      <option value="small">Small</option>
      <option value="medium" selected>Medium</option>
      <option value="large">Large</option>
      <option value="full">Full Width</option>
    </select>
  `;
  form.appendChild(sizeField);

  // Class Field
  const classField = document.createElement("div");
  classField.className = "traven-modal-field";
  classField.innerHTML = `
    <label class="traven-modal-label" for="traven-video-class">CSS Class</label>
    <input type="text" id="traven-video-class" class="traven-modal-input" placeholder="e.g. shadow border" value="" />
  `;
  form.appendChild(classField);

  form.appendChild(errorEl);

  const urlInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-video-url"));
  const urlFeedback = /** @type {HTMLElement} */ (form.querySelector("#traven-video-url-feedback"));
  const captionInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-video-caption"));
  const alignSelect = /** @type {HTMLSelectElement} */ (form.querySelector("#traven-video-align"));
  const sizeSelect = /** @type {HTMLSelectElement} */ (form.querySelector("#traven-video-size"));
  const classInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-video-class"));

  // Real-time feedback for URL input
  urlInput.addEventListener("input", () => {
    const src = urlInput.value.trim();
    if (!src) {
      urlFeedback.textContent = "";
      return;
    }
    const parsed = parseVideoUrl(src);
    if (parsed.platform === "youtube") {
      urlFeedback.textContent = "✓ YouTube video detected";
      urlFeedback.style.color = "#ef4444"; // YouTube Red
    } else if (parsed.platform === "vimeo") {
      urlFeedback.textContent = "✓ Vimeo video detected";
      urlFeedback.style.color = "#06b6d4"; // Vimeo Cyan
    } else if (parsed.platform === "native") {
      urlFeedback.textContent = "✓ Direct video file detected";
      urlFeedback.style.color = "#10b981"; // Green
    } else {
      urlFeedback.textContent = "⚠ Unrecognized URL format (will fall back to native video tag)";
      urlFeedback.style.color = "#f59e0b"; // Orange
    }
  });

  // Pre-populate if editing
  if (docFrom !== null) {
    urlInput.value = attrs.src || "";
    captionInput.value = attrs.caption || "";
    alignSelect.value = attrs.align || "center";
    sizeSelect.value = attrs.size || "medium";
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

  const insertVideo = (url) => {
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

    const insertion = `[video ${attrParts.join(" ")}]`;

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
    title: docFrom !== null ? "Edit Video" : "Insert Video",
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
              insertVideo("");
              overlay.querySelector(".traven-modal-close").click();
              return;
            } else {
              errorEl.textContent = "Please enter a video URL.";
              errorEl.style.display = "block";
              return;
            }
          }

          insertVideo(urlValue);
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}
