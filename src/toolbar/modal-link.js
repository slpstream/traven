// @ts-check
import { openModal } from "./modal-base.js";

/**
 * Renders the Link Insertion Modal dialog.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openLinkModal(editor, triggerBtn) {
  const form = document.createElement("div");
  form.innerHTML = `
    <div class="traven-modal-field">
      <label class="traven-modal-label" for="traven-link-text">Link Text</label>
      <input type="text" id="traven-link-text" class="traven-modal-input" placeholder="e.g. Google Search" value="" />
    </div>
    <div class="traven-modal-field">
      <label class="traven-modal-label" for="traven-link-url">URL</label>
      <input type="text" id="traven-link-url" class="traven-modal-input" placeholder="e.g. https://google.com" value="" />
    </div>
  `;

  // Pre-fill text with selection if any
  const view = editor.getView();
  const { from, to } = view.state.selection.main;
  const selectionText = from !== to ? view.state.sliceDoc(from, to) : "";
  if (selectionText) {
    const textInputEl = /** @type {HTMLInputElement} */ (form.querySelector("#traven-link-text"));
    if (textInputEl) textInputEl.value = selectionText;
  }

  openModal({
    title: "Insert Link",
    body: form,
    triggerElement: triggerBtn,
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
        text: "Insert",
        type: "primary",
        onClick: (e, overlay) => {
          const textInput = /** @type {HTMLInputElement} */ (overlay.querySelector("#traven-link-text"));
          const urlInput = /** @type {HTMLInputElement} */ (overlay.querySelector("#traven-link-url"));
          const text = textInput.value.trim() || "link";
          const url = urlInput.value.trim() || "#";

          editor.insertSnippet("[", `](${url})`, text);
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}
