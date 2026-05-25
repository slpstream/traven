/**
 * Traven generic, accessible modal system.
 * Handles overlay creation, focus trapping, Escape key listener, and focus restoration.
 *
 * @param {Object} options
 * @param {string} options.title - Header title.
 * @param {HTMLElement|string} options.body - Body content.
 * @param {Array<Object>} [options.buttons] - Array of { text, type, onClick } button configs.
 * @param {HTMLElement} [options.triggerElement] - The button element that triggered the modal.
 */
export function openModal({ title, body, buttons = [], triggerElement = null }) {
  const overlay = document.createElement("div");
  overlay.className = "traven-modal-overlay";
  overlay.setAttribute("role", "presentation");

  const dialog = document.createElement("div");
  dialog.className = "traven-modal";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "traven-modal-title-id");

  // Header
  const header = document.createElement("div");
  header.className = "traven-modal-header";

  const titleEl = document.createElement("h3");
  titleEl.className = "traven-modal-title";
  titleEl.id = "traven-modal-title-id";
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "traven-modal-close";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
    </svg>
  `;

  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  // Body
  const bodyEl = document.createElement("div");
  bodyEl.className = "traven-modal-body";
  if (body instanceof HTMLElement) {
    bodyEl.appendChild(body);
  } else {
    bodyEl.innerHTML = body;
  }
  dialog.appendChild(bodyEl);

  // Footer / Buttons
  let footer = null;
  if (buttons.length > 0) {
    footer = document.createElement("div");
    footer.className = "traven-modal-footer";

    buttons.forEach((btnConfig) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `traven-modal-btn btn-${btnConfig.type || "secondary"}`;
      btn.textContent = btnConfig.text;
      btn.addEventListener("click", (e) => {
        btnConfig.onClick(e, overlay);
      });
      footer.appendChild(btn);
    });
    dialog.appendChild(footer);
  }

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Trigger browser paint then animate active class
  requestAnimationFrame(() => {
    overlay.classList.add("is-active");
  });

  // Focus Trapping Logic
  const getFocusableElements = () => {
    return Array.from(
      dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("tabindex") !== "-1");
  };

  const focusable = getFocusableElements();
  if (focusable.length > 0) {
    // Focus the first element inside the modal
    focusable[0].focus();
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const focusableEls = getFocusableElements();
      if (focusableEls.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  const closeModal = () => {
    overlay.classList.remove("is-active");
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
      if (triggerElement && typeof triggerElement.focus === "function") {
        triggerElement.focus();
      }
    });
    document.removeEventListener("keydown", handleKeyDown);
  };

  // Wire close triggers
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", handleKeyDown);
}

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
    form.querySelector("#traven-link-text").value = selectionText;
  }

  openModal({
    title: "Insert Link",
    body: form,
    triggerElement: triggerBtn,
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
          const textInput = overlay.querySelector("#traven-link-text");
          const urlInput = overlay.querySelector("#traven-link-url");
          const text = textInput.value.trim() || "link";
          const url = urlInput.value.trim() || "#";

          editor.insertSnippet("[", `](${url})`, text);
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}

/**
 * Renders the Help Cheat Sheet Modal dialog.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openHelpModal(editor, triggerBtn) {
  const helpContent = document.createElement("div");
  helpContent.className = "help-grid";
  helpContent.innerHTML = `
    <div class="help-section-title">Format Utilities</div>
    <div class="help-row"><span class="help-key">Bold</span><span class="help-value">**text** or Ctrl+B</span></div>
    <div class="help-row"><span class="help-key">Italic</span><span class="help-value">*text* or Ctrl+I</span></div>
    <div class="help-row"><span class="help-key">Strikethrough</span><span class="help-value">~~text~~ or Ctrl+Shift+S</span></div>
    <div class="help-row"><span class="help-key">Inline Code</span><span class="help-value">\`code\`</span></div>

    <div class="help-section-title">Block Formats</div>
    <div class="help-row"><span class="help-key">Heading level 1 to 6</span><span class="help-value"># Heading</span></div>
    <div class="help-row"><span class="help-key">Blockquote</span><span class="help-value">&gt; Quote</span></div>
    <div class="help-row"><span class="help-key">Unordered List</span><span class="help-value">- Item</span></div>
    <div class="help-row"><span class="help-key">Ordered List</span><span class="help-value">1. Item</span></div>
    <div class="help-row"><span class="help-key">Code Block</span><span class="help-value">\`\`\`\\ncode\\n\`\`\`</span></div>
    <div class="help-row"><span class="help-key">Horizontal Rule</span><span class="help-value">---</span></div>
    <div class="help-row"><span class="help-key">Interactive Checklist</span><span class="help-value">- [ ] Task</span></div>

    <div class="help-section-title">General Commands</div>
    <div class="help-row"><span class="help-key">Search / Find</span><span class="help-value">Ctrl+F</span></div>
    <div class="help-row"><span class="help-key">Manual Save</span><span class="help-value">Ctrl+S</span></div>
    <div class="help-row"><span class="help-key">Undo / Redo</span><span class="help-value">Ctrl+Z / Ctrl+Y</span></div>
  `;

  openModal({
    title: "Traven Editor Shortcuts & Cheat Sheet",
    body: helpContent,
    triggerElement: triggerBtn,
    buttons: [
      {
        text: "Close",
        type: "primary",
        onClick: (e, overlay) => {
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}
