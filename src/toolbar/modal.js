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
export function openModal({ title, body, buttons = [], triggerElement = null, className = null }) {
  const overlay = document.createElement("div");
  overlay.className = "traven-modal-overlay";
  if (document.querySelector(".cm-wysiwym-dark")) {
    overlay.classList.add("cm-wysiwym-dark");
  }
  overlay.setAttribute("role", "presentation");

  const dialog = document.createElement("div");
  dialog.className = className ? `traven-modal ${className}` : "traven-modal";
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
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]'
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
 * Renders the Image Insertion Modal dialog.
 * Supports two insertion paths:
 *   1. Direct URL input — constructs ![alt](url) markdown.
 *   2. File upload via onUploadImage callback — uploads first, then inserts.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openImageModal(editor, triggerBtn) {
  const uploadHandler = typeof editor.getUploadHandler === "function"
    ? editor.getUploadHandler()
    : null;

  const form = document.createElement("div");

  // Error message container (defined early to allow dropzone drag/drop validation error display)
  const errorEl = document.createElement("div");
  errorEl.className = "traven-modal-error";
  errorEl.style.display = "none";

  let isAdvanced = true;

  // Toggle button at the top
  const toggleRow = document.createElement("div");
  toggleRow.className = "traven-modal-field";
  toggleRow.style.display = "flex";
  toggleRow.style.justify = "flex-end";
  toggleRow.style.marginBottom = "12px";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "traven-modal-toggle-btn";
  toggleBtn.style.background = "none";
  toggleBtn.style.border = "none";
  toggleBtn.style.cursor = "pointer";
  toggleBtn.style.padding = "4px";
  toggleBtn.style.display = "inline-flex";
  toggleBtn.style.alignItems = "center";
  toggleBtn.style.justifyContent = "center";
  toggleBtn.style.borderRadius = "4px";
  toggleBtn.style.width = "28px";
  toggleBtn.style.height = "28px";
  toggleBtn.style.transition = "all 0.15s ease";
  toggleBtn.style.color = "var(--accent, #334155)";
  toggleBtn.title = "Legacy Markdown";

  toggleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" style="width: 18px; height: 18px; pointer-events: none;">
      <rect width="256" height="256" fill="none"/>
      <circle cx="104" cy="80" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="168" cy="176" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="128" y1="80" x2="216" y2="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="40" y1="80" x2="80" y2="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="192" y1="176" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="40" y1="176" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    </svg>
  `;
  toggleRow.appendChild(toggleBtn);
  form.appendChild(toggleRow);

  // Alt text field
  const altField = document.createElement("div");
  altField.className = "traven-modal-field";
  altField.innerHTML = `
    <label class="traven-modal-label" for="traven-image-alt">Alt Text</label>
    <input type="text" id="traven-image-alt" class="traven-modal-input" placeholder="e.g. A sunset over mountains" value="" />
  `;
  form.appendChild(altField);

  // URL field
  const urlField = document.createElement("div");
  urlField.className = "traven-modal-field";
  urlField.innerHTML = `
    <label class="traven-modal-label" for="traven-image-url">Image URL</label>
    <input type="text" id="traven-image-url" class="traven-modal-input" placeholder="e.g. https://example.com/photo.jpg" value="" />
  `;
  form.appendChild(urlField);

  // Optional file picker (only if upload handler is configured)
  let fileInput = null;
  if (uploadHandler) {
    const fileField = document.createElement("div");
    fileField.className = "traven-modal-field";

    const fileLabel = document.createElement("label");
    fileLabel.className = "traven-modal-label";
    fileLabel.textContent = "Or Upload a File";

    const dropzone = document.createElement("div");
    dropzone.className = "traven-modal-dropzone";

    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.id = "traven-image-file";
    fileInput.style.display = "none";

    // Inner prompt element (visible when no file is chosen)
    const promptEl = document.createElement("div");
    promptEl.className = "traven-modal-dropzone-prompt";
    promptEl.innerHTML = `
      <svg class="traven-modal-dropzone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
        <path d="M228,144v64a12,12,0,0,1-12,12H40a12,12,0,0,1-12-12V144a12,12,0,0,1,24,0v52H204V144a12,12,0,0,1,24,0ZM96.49,80.49,116,61V136a12,12,0,0,0,24,0V61l19.51,19.51a12,12,0,0,0,17-17l-40-40a12,12,0,0,0-17,0l-40,40a12,12,0,1,0,17,17Z"/>
      </svg>
      <div class="traven-modal-dropzone-text">Drag & drop image here or click to browse</div>
    `;

    // Preview element (visible when file is chosen)
    const previewEl = document.createElement("div");
    previewEl.className = "traven-modal-dropzone-preview";
    previewEl.style.display = "none";

    const thumbContainer = document.createElement("div");
    thumbContainer.className = "traven-modal-thumb-container";
    thumbContainer.style.position = "relative"; // allow absolute close button positioning

    const thumbImg = document.createElement("img");
    thumbImg.className = "traven-modal-thumb";
    thumbImg.alt = "File preview";
    thumbContainer.appendChild(thumbImg);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "traven-modal-remove-btn";
    removeBtn.setAttribute("aria-label", "Remove file");
    removeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <rect width="256" height="256" fill="none"/>
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
      </svg>
    `;
    thumbContainer.appendChild(removeBtn);

    const fileMeta = document.createElement("div");
    fileMeta.className = "traven-modal-file-meta";

    const fileName = document.createElement("span");
    fileName.className = "traven-modal-file-name";
    fileName.textContent = "No file chosen";

    const fileDetails = document.createElement("span");
    fileDetails.className = "traven-modal-file-details";

    const fileSizeEl = document.createElement("span");
    fileSizeEl.className = "traven-modal-file-size";

    const fileDimsEl = document.createElement("span");
    fileDimsEl.className = "traven-modal-file-dims";

    fileDetails.appendChild(fileSizeEl);
    fileDetails.appendChild(fileDimsEl);

    fileMeta.appendChild(fileName);
    fileMeta.appendChild(fileDetails);

    previewEl.appendChild(thumbContainer);
    previewEl.appendChild(fileMeta);

    dropzone.appendChild(promptEl);
    dropzone.appendChild(previewEl);
    dropzone.appendChild(fileInput);

    // Click on dropzone triggers file dialog, unless clicking the remove button
    dropzone.addEventListener("click", (e) => {
      if (e.target.closest(".traven-modal-remove-btn")) {
        return;
      }
      fileInput.click();
    });

    // Drag-and-drop event listeners
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        if (files[0].type.startsWith("image/")) {
          fileInput.files = files;
          fileInput.dispatchEvent(new Event("change"));
        } else {
          errorEl.textContent = "Only image files are supported.";
          errorEl.style.display = "block";
        }
      }
    });

    // Format bytes to human readable format
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    fileInput.addEventListener("change", () => {
      const urlInput = form.querySelector("#traven-image-url");
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileDimsEl.textContent = "";

        urlInput.value = "";
        urlInput.disabled = true;

        // Generate thumbnail preview
        const objectUrl = URL.createObjectURL(file);
        thumbImg.src = objectUrl;
        
        promptEl.style.display = "none";
        previewEl.style.display = "flex";
        dropzone.classList.add("has-file");
        errorEl.style.display = "none";

        // Revoke object URL when image loads to free memory
        thumbImg.onload = () => {
          fileDimsEl.textContent = ` • ${thumbImg.naturalWidth}×${thumbImg.naturalHeight}`;
          URL.revokeObjectURL(objectUrl);
        };
      } else {
        fileName.textContent = "No file chosen";
        fileSizeEl.textContent = "";
        fileDimsEl.textContent = "";
        urlInput.disabled = false;
        promptEl.style.display = "flex";
        previewEl.style.display = "none";
        dropzone.classList.remove("has-file");
        thumbImg.src = "";
      }
    });

    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.value = "";
      fileInput.dispatchEvent(new Event("change"));
    });

    fileField.appendChild(fileLabel);
    fileField.appendChild(dropzone);
    form.appendChild(fileField);
  }

  // Caption field
  const captionField = document.createElement("div");
  captionField.className = "traven-modal-field";
  captionField.innerHTML = `
    <label class="traven-modal-label" for="traven-image-caption">Caption</label>
    <input type="text" id="traven-image-caption" class="traven-modal-input" placeholder="e.g. Figure 1: The view from above" value="" />
  `;
  form.appendChild(captionField);

  // Group Row for Alignment and Size
  const groupRow = document.createElement("div");
  groupRow.className = "traven-modal-field";
  groupRow.style.display = "flex";
  groupRow.style.gap = "12px";
  groupRow.style.marginBottom = "16px";

  const alignCol = document.createElement("div");
  alignCol.style.flex = "1";
  alignCol.innerHTML = `
    <label class="traven-modal-label" for="traven-image-align">Alignment</label>
    <select id="traven-image-align" class="traven-modal-input">
      <option value="" selected>Default (Center)</option>
      <option value="left">Left</option>
      <option value="right">Right</option>
      <option value="center">Center</option>
      <option value="fullbleed">Full Bleed</option>
    </select>
  `;

  const sizeCol = document.createElement("div");
  sizeCol.style.flex = "1";
  sizeCol.innerHTML = `
    <label class="traven-modal-label" for="traven-image-size">Size</label>
    <select id="traven-image-size" class="traven-modal-input">
      <option value="" selected>Default (Medium)</option>
      <option value="small">Small</option>
      <option value="medium">Medium</option>
      <option value="large">Large</option>
      <option value="full">Full (content width)</option>
    </select>
  `;

  groupRow.appendChild(alignCol);
  groupRow.appendChild(sizeCol);
  form.appendChild(groupRow);

  // CSS Class field
  const classField = document.createElement("div");
  classField.className = "traven-modal-field";
  classField.innerHTML = `
    <label class="traven-modal-label" for="traven-image-class">CSS Class</label>
    <input type="text" id="traven-image-class" class="traven-modal-input" placeholder="e.g. shadow shadow-lg border" value="" />
  `;
  form.appendChild(classField);

  form.appendChild(errorEl);

  // Pre-fill alt text with selection if any
  const view = editor.getView();
  const { from, to } = view.state.selection.main;
  const selectionText = from !== to ? view.state.sliceDoc(from, to) : "";
  if (selectionText) {
    form.querySelector("#traven-image-alt").value = selectionText;
  }

  const captionInput = form.querySelector("#traven-image-caption");
  const alignSelect = form.querySelector("#traven-image-align");
  const sizeSelect = form.querySelector("#traven-image-size");
  const classInput = form.querySelector("#traven-image-class");

  const updateToggleState = () => {
    if (isAdvanced) {
      toggleBtn.style.color = "var(--accent, #334155)";
      toggleBtn.title = "Legacy Markdown";
      captionInput.disabled = false;
      alignSelect.disabled = false;
      sizeSelect.disabled = false;
      classInput.disabled = false;
    } else {
      toggleBtn.style.color = "var(--text-secondary, #64748b)";
      toggleBtn.title = "Advanced Settings";
      captionInput.disabled = true;
      alignSelect.disabled = true;
      sizeSelect.disabled = true;
      classInput.disabled = true;
    }
  };

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    isAdvanced = !isAdvanced;
    updateToggleState();
  });

  // Initial state call
  updateToggleState();

  /**
   * Inserts the image markdown and moves the cursor to the next line
   * so the WYSIWYM decoration renders the image widget immediately.
   */
  const insertImageAndUnfocus = (altText, url) => {
    const v = editor.getView();
    const range = v.state.selection.main;
    
    let insertion = "";
    if (!isAdvanced) {
      insertion = `![${altText}](${url})`;
    } else {
      const captionText = captionInput.value.trim();
      const alignVal = alignSelect.value;
      const sizeVal = sizeSelect.value;
      const classVal = classInput.value.trim();

      const attrParts = [`src="${url}"`];
      if (alignVal) attrParts.push(`align="${alignVal}"`);
      if (sizeVal) attrParts.push(`size="${sizeVal}"`);
      if (altText && altText !== "image") attrParts.push(`alt="${altText}"`);
      if (captionText) attrParts.push(`caption="${captionText}"`);
      if (classVal) attrParts.push(`class="${classVal}"`);

      insertion = `[image ${attrParts.join(" ")}]`;
    }
    
    const insertionText = insertion + "\n";

    v.dispatch({
      changes: { from: range.from, to: range.to, insert: insertionText },
      selection: { anchor: range.from + insertionText.length }
    });
    v.focus();
  };

  openModal({
    title: "Insert Image",
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
        onClick: async (e, overlay) => {
          const altInput = overlay.querySelector("#traven-image-alt");
          const urlInput = overlay.querySelector("#traven-image-url");
          const altText = altInput.value.trim() || "image";
          const urlValue = urlInput.value.trim();
          const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

          // Validate: must have either a URL or a file
          if (!urlValue && !hasFile) {
            errorEl.textContent = "Please enter an image URL or choose a file.";
            errorEl.style.display = "block";
            return;
          }

          if (hasFile && uploadHandler) {
            // File upload path
            const insertBtn = overlay.querySelector(".traven-modal-btn.btn-primary");
            const originalText = insertBtn.textContent;
            insertBtn.textContent = "Uploading…";
            insertBtn.classList.add("is-uploading");
            errorEl.style.display = "none";

            try {
              const finalUrl = await uploadHandler(fileInput.files[0]);
              insertImageAndUnfocus(altText, finalUrl);
              overlay.querySelector(".traven-modal-close").click();
            } catch (err) {
              insertBtn.textContent = originalText;
              insertBtn.classList.remove("is-uploading");
              errorEl.textContent = "Upload failed: " + (err.message || "Unknown error");
              errorEl.style.display = "block";
            }
          } else {
            // Direct URL path
            const url = urlValue || "#";
            insertImageAndUnfocus(altText, url);
            overlay.querySelector(".traven-modal-close").click();
          }
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

// --- Table Editor Helpers ---

/**
 * Parses a GFM markdown table string into structured data.
 *
 * @param {string} tableText - The raw markdown table text.
 * @returns {{ headers: string[], alignments: (string|null)[], rows: string[][] } | null}
 *   Returns parsed data or null if the text is not a valid table.
 */
export function parseMarkdownTable(tableText) {
  const allLines = tableText.split("\n");
  const lines = allLines.filter(l => l.trim());
  if (lines.length < 2) return null;

  // Validate separator row
  if (!/^[|\s:-]+$/.test(lines[1].trim())) return null;

  const parseCells = (line) => {
    let clean = line.trim();
    if (clean.startsWith("|")) clean = clean.slice(1);
    if (clean.endsWith("|")) clean = clean.slice(0, -1);

    const cells = [];
    let currentCell = "";
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (char === "\\" && clean[i + 1] === "|") {
        currentCell += "|";
        i++; // skip the pipe character
      } else if (char === "|") {
        cells.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const headers = parseCells(lines[0]);

  // Parse alignments from separator row
  const sepCells = parseCells(lines[1]);
  const alignments = sepCells.map(sep => {
    const s = sep.trim();
    const left = s.startsWith(":");
    const right = s.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    // Default (left-aligned or no colons) → "left"
    return "left";
  });

  // Parse data rows
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = parseCells(lines[i]);
    // Ensure consistent column count (pad with empty strings)
    while (cells.length < headers.length) cells.push("");
    rows.push(cells.slice(0, headers.length));
  }

  return { headers, alignments, rows };
}

/**
 * Serializes structured table data back into pipe-aligned GFM markdown.
 *
 * @param {string[]} headers - Column header strings.
 * @param {string[][]} rows - Array of row arrays.
 * @param {(string|null)[]} [alignments] - Column alignment values ("left", "center", "right", or null).
 * @returns {string} Pipe-aligned markdown table string.
 */
export function serializeTableToMarkdown(headers, rows, alignments) {
  const colCount = headers.length;
  const safeAlignments = alignments || [];

  // Escape pipe characters in cell content
  const escapeCell = (text) => (text || "").replace(/\|/g, "\\|");

  const escapedHeaders = headers.map(escapeCell);
  const escapedRows = rows.map(row => {
    const cells = [];
    for (let i = 0; i < colCount; i++) {
      cells.push(escapeCell(row[i] || ""));
    }
    return cells;
  });

  // Calculate maximum column widths (minimum 3 for separator dashes)
  const colWidths = [];
  for (let col = 0; col < colCount; col++) {
    let maxW = Math.max(3, escapedHeaders[col].length);
    for (const row of escapedRows) {
      maxW = Math.max(maxW, row[col].length);
    }
    colWidths.push(maxW);
  }

  // Pad cell to column width
  const padCell = (text, colIdx) => text.padEnd(colWidths[colIdx], " ");

  // Build separator row with alignment indicators (dashes match column width + 2 padding spaces)
  const buildSep = (colIdx) => {
    const align = safeAlignments[colIdx] || null;
    const w = colWidths[colIdx] + 2;
    if (align === "center") return ":" + "-".repeat(w - 2) + ":";
    if (align === "right") return "-".repeat(w - 1) + ":";
    if (align === "left") return ":" + "-".repeat(w - 1);
    // null or unspecified → plain dashes
    return "-".repeat(w);
  };

  // Assemble lines
  const headerLine = "| " + escapedHeaders.map((h, i) => padCell(h, i)).join(" | ") + " |";
  const sepLine = "|" + colWidths.map((_, i) => buildSep(i)).join("|") + "|";
  const dataLines = escapedRows.map(
    row => "| " + row.map((c, i) => padCell(c, i)).join(" | ") + " |"
  );

  return [headerLine, sepLine, ...dataLines].join("\n");
}


// --- Table Editor Modal ---

// Small SVG icons for the table toolbar buttons
const TABLE_ICONS = {
  addRow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="40" y="120" width="176" height="40" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="48" width="176" height="40" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="216" x2="152" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="192" x2="128" y2="240" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
  addCol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="-20" y="108" width="176" height="40" rx="8" transform="translate(196 60) rotate(90)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="52" y="108" width="176" height="40" rx="8" transform="translate(268 -12) rotate(90)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="192" y1="128" x2="240" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="216" y1="104" x2="216" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
  deleteRow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
  deleteCol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
};

/**
 * Opens the interactive Table Editor Modal.
 * Follows the openImageModal closure pattern: builds all DOM inline,
 * constructs the buttons array with closures, then calls openModal().
 *
 * @param {Object} options
 * @param {Object} options.editor - The TravenEditor instance.
 * @param {{ headers: string[], alignments: (string|null)[], rows: string[][] } | null} options.tableData
 *   Parsed table data. If null, a default 3×2 empty table is created.
 * @param {number|null} options.docFrom - Document start position of the existing table (null for new).
 * @param {number|null} options.docTo - Document end position of the existing table (null for new).
 * @param {HTMLElement} [options.triggerElement] - The button that triggered the modal.
 */
export function openTableModal({ editor, tableData = null, docFrom = null, docTo = null, triggerElement = null }) {
  // Default 3-column, 2-row empty table when creating a new table
  const data = tableData || {
    headers: ["Header 1", "Header 2", "Header 3"],
    alignments: [null, null, null],
    rows: [
      ["", "", ""],
      ["", "", ""]
    ]
  };

  const isNewTable = docFrom === null;

  // --- Build the modal body ---
  const body = document.createElement("div");

  // Table toolbar strip
  const toolbar = document.createElement("div");
  toolbar.className = "traven-table-toolbar";

  const makeToolBtn = (label, iconKey, onClick) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "traven-table-toolbar-btn";
    btn.innerHTML = TABLE_ICONS[iconKey] + `<span>${label}</span>`;
    btn.setAttribute("aria-label", label);
    btn.addEventListener("click", onClick);
    return btn;
  };

  // Focused cell tracking: { row: number (0 = header, 1+ = data), col: number }
  let focusedCell = { row: 0, col: 0 };

  // Build the editable HTML table from data
  const tableEl = document.createElement("table");
  tableEl.className = "traven-table-editor";

  const buildTable = () => {
    tableEl.innerHTML = "";

    // thead
    const thead = document.createElement("thead");
    const headerTr = document.createElement("tr");
    data.headers.forEach((h, colIdx) => {
      const th = document.createElement("th");
      th.contentEditable = "true";
      th.textContent = h;
      th.dataset.row = "0";
      th.dataset.col = String(colIdx);
      headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);
    tableEl.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    data.rows.forEach((row, rowIdx) => {
      const tr = document.createElement("tr");
      for (let colIdx = 0; colIdx < data.headers.length; colIdx++) {
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.textContent = row[colIdx] || "";
        td.dataset.row = String(rowIdx + 1);  // 0 is header
        td.dataset.col = String(colIdx);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    tableEl.appendChild(tbody);

    updateToolbarState();
  };

  // Sync data model from the editable table DOM
  const syncFromDOM = () => {
    const cells = tableEl.querySelectorAll("th");
    cells.forEach((th, i) => {
      data.headers[i] = th.textContent;
    });
    const trs = tableEl.querySelectorAll("tbody tr");
    data.rows = [];
    trs.forEach((tr) => {
      const row = [];
      tr.querySelectorAll("td").forEach((td) => {
        row.push(td.textContent);
      });
      data.rows.push(row);
    });
  };

  // Track focused cell
  tableEl.addEventListener("focusin", (e) => {
    const cell = e.target.closest("th, td");
    if (cell && cell.dataset.row !== undefined) {
      focusedCell = {
        row: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col)
      };
    }
  });

  // Keyboard navigation within the table
  tableEl.addEventListener("keydown", (e) => {
    const cell = e.target.closest("th, td");
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const colCount = data.headers.length;
    const totalRows = data.rows.length + 1; // +1 for header

    if (e.key === "Tab") {
      e.preventDefault();
      syncFromDOM();

      let nextRow = row;
      let nextCol = col;

      if (e.shiftKey) {
        // Shift+Tab: move backwards
        nextCol--;
        if (nextCol < 0) {
          nextCol = colCount - 1;
          nextRow--;
        }
        if (nextRow < 0) {
          // Wrap: move focus to table toolbar (last button)
          const toolBtns = toolbar.querySelectorAll(".traven-table-toolbar-btn:not(:disabled)");
          if (toolBtns.length > 0) {
            toolBtns[toolBtns.length - 1].focus();
          }
          return;
        }
      } else {
        // Tab: move forward
        nextCol++;
        if (nextCol >= colCount) {
          nextCol = 0;
          nextRow++;
        }
        if (nextRow >= totalRows) {
          // Past last cell: move focus to the footer buttons
          // The modal's focus trap will catch this naturally
          // Find the first footer button
          const modalEl = tableEl.closest(".traven-modal");
          if (modalEl) {
            const footerBtn = modalEl.querySelector(".traven-modal-footer .traven-modal-btn");
            if (footerBtn) footerBtn.focus();
          }
          return;
        }
      }

      focusCellAt(nextRow, nextCol);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      syncFromDOM();
      // Move to cell below (or do nothing at last row)
      if (row < data.rows.length) {
        focusCellAt(row + 1, col);
      }
    }
  });

  const focusCellAt = (row, col) => {
    const selector = row === 0
      ? `th[data-col="${col}"]`
      : `td[data-row="${row}"][data-col="${col}"]`;
    const target = tableEl.querySelector(selector);
    if (target) {
      target.focus();
      // Place cursor at end of cell content
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(target);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  // --- Toolbar actions ---

  const addRowBtn = makeToolBtn("Add Row", "addRow", () => {
    syncFromDOM();
    // Insert after the focused data row, or at the end
    const insertIdx = focusedCell.row >= 1
      ? focusedCell.row   // after the focused data row
      : data.rows.length; // at the end
    const emptyRow = new Array(data.headers.length).fill("");
    data.rows.splice(insertIdx, 0, emptyRow);
    buildTable();
    // Focus the first cell of the new row
    focusCellAt(insertIdx + 1, 0);
  });

  const deleteRowBtn = makeToolBtn("Delete Row", "deleteRow", () => {
    syncFromDOM();
    if (data.rows.length <= 1) return; // Must keep at least 1 data row
    const rowIdx = focusedCell.row >= 1 ? focusedCell.row - 1 : data.rows.length - 1;
    data.rows.splice(rowIdx, 1);
    buildTable();
    // Focus the nearest remaining row
    const newRow = Math.min(rowIdx + 1, data.rows.length);
    focusCellAt(newRow, focusedCell.col);
  });

  const addColBtn = makeToolBtn("Add Column", "addCol", () => {
    syncFromDOM();
    const insertIdx = focusedCell.col + 1;
    data.headers.splice(insertIdx, 0, "");
    if (data.alignments) data.alignments.splice(insertIdx, 0, "left");
    data.rows.forEach(row => row.splice(insertIdx, 0, ""));
    buildTable();
    focusCellAt(focusedCell.row, insertIdx);
  });

  const deleteColBtn = makeToolBtn("Delete Column", "deleteCol", () => {
    syncFromDOM();
    if (data.headers.length <= 1) return; // Must keep at least 1 column
    const colIdx = focusedCell.col;
    data.headers.splice(colIdx, 1);
    if (data.alignments) data.alignments.splice(colIdx, 1);
    data.rows.forEach(row => row.splice(colIdx, 1));
    buildTable();
    const newCol = Math.min(colIdx, data.headers.length - 1);
    focusCellAt(focusedCell.row, newCol);
  });

  const updateToolbarState = () => {
    deleteRowBtn.disabled = data.rows.length <= 1;
    deleteColBtn.disabled = data.headers.length <= 1;
  };

  toolbar.appendChild(addRowBtn);
  toolbar.appendChild(deleteRowBtn);
  toolbar.appendChild(addColBtn);
  toolbar.appendChild(deleteColBtn);

  body.appendChild(toolbar);
  body.appendChild(tableEl);

  // Initial table render
  buildTable();

  // --- Construct buttons array with closures ---
  const buttons = [];

  // "Edit Source" button — only shown when editing an existing table
  if (!isNewTable) {
    buttons.push({
      text: "Edit Source",
      type: "secondary",
      onClick: (e, overlay) => {
        overlay.querySelector(".traven-modal-close").click();
        // Place cursor at the start of the table's raw markdown
        const view = editor.getView();
        view.dispatch({ selection: { anchor: docFrom } });
        view.focus();
      }
    });
  }

  buttons.push({
    text: "Cancel",
    type: "secondary",
    onClick: (e, overlay) => {
      overlay.querySelector(".traven-modal-close").click();
    }
  });

  buttons.push({
    text: "Save",
    type: "primary",
    onClick: (e, overlay) => {
      syncFromDOM();
      const markdown = serializeTableToMarkdown(data.headers, data.rows, data.alignments);

      const view = editor.getView();

      if (isNewTable) {
        // Insert at current cursor position with proper spacing
        const state = view.state;
        const range = state.selection.main;
        const from = range.from;
        const to = range.to;

        const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : "\n";
        const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : "\n";
        let prefixSpacing = "";
        if (charBefore !== "\n") {
          prefixSpacing = "\n\n";
        } else if (secondCharBefore !== "\n") {
          prefixSpacing = "\n";
        }

        const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : "\n";
        let suffixSpacing = "";
        if (charAfter !== "\n") {
          suffixSpacing = "\n";
        }

        const finalInsert = `${prefixSpacing}${markdown}${suffixSpacing}`;
        view.dispatch({
          changes: { from, to, insert: finalInsert },
          selection: { anchor: from + finalInsert.length }
        });
      } else {
        // Replace existing table at docFrom..docTo
        view.dispatch({
          changes: { from: docFrom, to: docTo, insert: markdown },
          selection: { anchor: docFrom + markdown.length }
        });
      }

      view.focus();
      overlay.querySelector(".traven-modal-close").click();
    }
  });

  // --- Open the modal using the shared openModal() ---
  openModal({
    title: isNewTable ? "Insert Table" : "Edit Table",
    body,
    buttons,
    triggerElement,
    className: "traven-modal-table"
  });
}
