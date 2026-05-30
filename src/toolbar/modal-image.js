// @ts-check
import { openModal } from "./modal-base.js";

/**
 * Renders the Image Insertion Modal dialog.
 * Supports two insertion paths:
 *   1. Direct URL input — constructs ![alt](url) markdown.
 *   2. File upload via onUploadImage callback — uploads first, then inserts.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openImageModal(optionsOrEditor, triggerBtn = null) {
  let editor;
  let triggerElement = null;
  let docFrom = null;
  let docTo = null;
  let attrs = {};
  let isAdvancedMode = true;

  if (optionsOrEditor && optionsOrEditor.editor) {
    editor = optionsOrEditor.editor;
    triggerElement = optionsOrEditor.triggerElement || null;
    docFrom = optionsOrEditor.docFrom !== undefined ? optionsOrEditor.docFrom : null;
    docTo = optionsOrEditor.docTo !== undefined ? optionsOrEditor.docTo : null;
    attrs = optionsOrEditor.attrs || {};
    isAdvancedMode = optionsOrEditor.isAdvancedMode !== undefined ? optionsOrEditor.isAdvancedMode : true;
  } else {
    editor = optionsOrEditor;
    triggerElement = triggerBtn;
  }

  const uploadHandler = typeof editor.getUploadHandler === "function"
    ? editor.getUploadHandler()
    : null;

  const form = document.createElement("div");

  // Error message container (defined early to allow dropzone drag/drop validation error display)
  const errorEl = document.createElement("div");
  errorEl.className = "traven-modal-error";
  errorEl.style.display = "none";

  let isAdvanced = isAdvancedMode;
  let updatePreview = null;

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
    thumbContainer.style.position = "relative";

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

    updatePreview = () => {
      const urlInput = form.querySelector("#traven-image-url");
      const urlValue = urlInput.value.trim();
      const hasFile = fileInput.files && fileInput.files.length > 0;

      if (hasFile) {
        const file = fileInput.files[0];
        fileName.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileDimsEl.textContent = "";
        fileDetails.style.display = "";
        fileSizeEl.style.wordBreak = "";

        urlInput.disabled = true;

        const objectUrl = URL.createObjectURL(file);
        thumbImg.src = objectUrl;

        promptEl.style.display = "none";
        previewEl.style.display = "flex";
        dropzone.classList.add("has-file");
        errorEl.style.display = "none";

        thumbImg.onload = () => {
          fileDimsEl.textContent = ` • ${thumbImg.naturalWidth}×${thumbImg.naturalHeight}`;
          if (objectUrl.startsWith("blob:")) {
            URL.revokeObjectURL(objectUrl);
          }
        };
      } else if (urlValue) {
        const basename = urlValue.substring(urlValue.lastIndexOf("/") + 1) || "image";
        fileName.textContent = basename;
        fileDetails.style.display = "block";
        fileSizeEl.style.wordBreak = "break-all";
        fileSizeEl.textContent = urlValue;
        fileDimsEl.innerHTML = "";

        urlInput.disabled = false;
        thumbImg.src = urlValue;

        promptEl.style.display = "none";
        previewEl.style.display = "flex";
        dropzone.classList.add("has-file");
        errorEl.style.display = "none";

        thumbImg.onload = () => {
          fileDimsEl.innerHTML = `<br>${thumbImg.naturalWidth}×${thumbImg.naturalHeight}`;
        };
        thumbImg.onerror = () => {
          fileDimsEl.innerHTML = "";
        };
      } else {
        fileName.textContent = "No file chosen";
        fileSizeEl.textContent = "";
        fileDimsEl.textContent = "";
        fileDetails.style.display = "";
        fileSizeEl.style.wordBreak = "";
        urlInput.disabled = false;
        promptEl.style.display = "flex";
        previewEl.style.display = "none";
        dropzone.classList.remove("has-file");
        thumbImg.src = "";
      }

      const hasPreview = !!(hasFile || urlValue);
      if (hasPreview) {
        urlField.style.display = "none";
        if (fileLabel) fileLabel.style.display = "none";
      } else {
        urlField.style.display = "";
        if (fileLabel) fileLabel.style.display = "";
      }
    };

    fileInput.addEventListener("change", () => {
      const urlInput = form.querySelector("#traven-image-url");
      if (fileInput.files && fileInput.files.length > 0) {
        urlInput.value = "";
      }
      updatePreview();
    });

    removeBtn.addEventListener("click", (e) => {
      const urlInput = form.querySelector("#traven-image-url");
      e.preventDefault();
      e.stopPropagation();
      fileInput.value = "";
      urlInput.value = "";
      updatePreview();
    });

    fileField.appendChild(fileLabel);
    fileField.appendChild(dropzone);
    form.appendChild(fileField);
  }

  // Toggle button immediately below the dropzone
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
  toggleBtn.style.padding = "4px 8px";
  toggleBtn.style.display = "inline-flex";
  toggleBtn.style.alignItems = "center";
  toggleBtn.style.justifyContent = "center";
  toggleBtn.style.borderRadius = "6px";
  toggleBtn.style.width = "auto";
  toggleBtn.style.height = "28px";
  toggleBtn.style.gap = "8px";
  toggleBtn.style.transition = "all 0.15s ease";
  toggleBtn.style.color = "var(--accent, #334155)";
  toggleBtn.title = "Legacy Markdown";

  toggleBtn.addEventListener("mouseenter", () => {
    const isDark = document.querySelector(".cm-wysiwym-dark");
    toggleBtn.style.backgroundColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
  });
  toggleBtn.addEventListener("mouseleave", () => {
    toggleBtn.style.backgroundColor = "transparent";
  });

  toggleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" style="width: 18px; height: 18px; pointer-events: none; flex-shrink: 0;">
      <rect width="256" height="256" fill="none"/>
      <circle cx="104" cy="80" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="168" cy="176" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="128" y1="80" x2="216" y2="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="40" y1="80" x2="80" y2="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="192" y1="176" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="40" y1="176" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    </svg>
    <div class="traven-modal-switch-track" style="position: relative; width: 36px; height: 20px; border-radius: 10px; background-color: #cbd5e1; transition: background-color 0.2s ease, border-color 0.2s ease; pointer-events: none; flex-shrink: 0; border: 1px solid transparent;">
      <div class="traven-modal-switch-thumb" style="position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background-color: #ffffff; transition: transform 0.2s ease; transform: translateX(0); pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.15);"></div>
    </div>
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

  // Caption field
  const captionField = document.createElement("div");
  captionField.className = "traven-modal-field";
  captionField.innerHTML = `
    <label class="traven-modal-label" for="traven-image-caption">Caption</label>
    <input type="text" id="traven-image-caption" class="traven-modal-input" placeholder="e.g. Figure 1: The view from above" value="" />
  `;
  form.appendChild(captionField);

  // Group Row for Alignment and Size (using layout preset selector and size pills)
  const groupRow = document.createElement("div");
  groupRow.className = "traven-modal-field";
  groupRow.style.display = "flex";
  groupRow.style.flexDirection = "column";
  groupRow.style.gap = "12px";
  groupRow.style.marginBottom = "16px";

  // Hidden selects for testing compatibility
  const hiddenAlignSelect = document.createElement("select");
  hiddenAlignSelect.id = "traven-image-align";
  hiddenAlignSelect.style.display = "none";
  hiddenAlignSelect.innerHTML = `
    <option value="left">Left</option>
    <option value="center">Center</option>
    <option value="right">Right</option>
    <option value="fullbleed">Full Bleed</option>
  `;
  groupRow.appendChild(hiddenAlignSelect);

  const hiddenSizeSelect = document.createElement("select");
  hiddenSizeSelect.id = "traven-image-size";
  hiddenSizeSelect.style.display = "none";
  hiddenSizeSelect.innerHTML = `
    <option value="small">Small</option>
    <option value="medium">Medium</option>
    <option value="large">Large</option>
    <option value="full">Full</option>
  `;
  groupRow.appendChild(hiddenSizeSelect);

  // Layout preset column
  const layoutCol = document.createElement("div");
  layoutCol.style.position = "relative";
  layoutCol.style.display = "flex";
  layoutCol.style.flexDirection = "column";
  layoutCol.style.gap = "6px";

  const layoutLabel = document.createElement("label");
  layoutLabel.className = "traven-modal-label";
  layoutLabel.textContent = "Layout";
  layoutCol.appendChild(layoutLabel);

  const presetsRow = document.createElement("div");
  presetsRow.className = "traven-modal-presets-row";
  layoutCol.appendChild(presetsRow);

  // Size pill column (no label, positioned dynamically under layout preset)
  const sizeCol = document.createElement("div");
  sizeCol.className = "traven-modal-size-col";
  sizeCol.style.position = "relative";
  sizeCol.style.height = "42px";
  sizeCol.style.marginTop = "6px";

  const sizeRow = document.createElement("div");
  sizeRow.className = "traven-modal-size-row";
  sizeRow.style.position = "absolute";
  sizeRow.style.transform = "translateX(-50%)";
  sizeRow.style.transition = "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
  sizeCol.appendChild(sizeRow);
  layoutCol.appendChild(sizeCol);

  groupRow.appendChild(layoutCol);
  form.appendChild(groupRow);

  const presetsData = [
    {
      name: "left",
      tooltip: "Float Left",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><rect x="2" y="4" width="8" height="8" rx="1"/><line x1="13" y1="5" x2="22" y2="5" /><line x1="13" y1="9" x2="22" y2="9" /><line x1="2" y1="15" x2="22" y2="15" /><line x1="2" y1="19" x2="22" y2="19" /></svg>`
    },
    {
      name: "center",
      tooltip: "Centered",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><rect x="6" y="6" width="12" height="8" rx="1"/><line x1="2" y1="2" x2="22" y2="2" /><line x1="2" y1="18" x2="22" y2="18" /><line x1="2" y1="22" x2="22" y2="22" /></svg>`
    },
    {
      name: "right",
      tooltip: "Float Right",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><rect x="14" y="4" width="8" height="8" rx="1"/><line x1="2" y1="5" x2="11" y2="5" /><line x1="2" y1="9" x2="11" y2="9" /><line x1="2" y1="15" x2="22" y2="15" /><line x1="2" y1="19" x2="22" y2="19" /></svg>`
    },
    {
      name: "full",
      tooltip: "Full Width",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><rect x="2" y="6" width="20" height="10" rx="1"/><line x1="2" y1="2" x2="22" y2="2" /><line x1="2" y1="20" x2="22" y2="20" /></svg>`
    },
    {
      name: "fullbleed",
      tooltip: "Full Bleed",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><line x1="5" y1="2" x2="5" y2="22" stroke-dasharray="2 2" stroke-width="1" /><line x1="19" y1="2" x2="19" y2="22" stroke-dasharray="2 2" stroke-width="1" /><rect x="1" y="6" width="22" height="10" rx="1" /><line x1="7" y1="2" x2="17" y2="2" /><line x1="7" y1="20" x2="17" y2="20" /></svg>`
    }
  ];

  const presetButtons = [];
  presetsData.forEach(data => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "traven-modal-preset-btn";
    btn.dataset.preset = data.name;
    btn.title = data.tooltip;
    btn.innerHTML = data.svg;
    presetsRow.appendChild(btn);
    presetButtons.push(btn);
  });

  const sizesData = [
    { name: "small", label: "S", class: "size-s" },
    { name: "medium", label: "M", class: "size-m" },
    { name: "large", label: "L", class: "size-l" }
  ];

  const sizePills = [];
  sizesData.forEach(data => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = `traven-modal-size-pill ${data.class}`;
    pill.dataset.size = data.name;
    pill.textContent = data.label;
    sizeRow.appendChild(pill);
    sizePills.push(pill);
  });

  // CSS Class field
  const classField = document.createElement("div");
  classField.className = "traven-modal-field";
  classField.innerHTML = `
    <label class="traven-modal-label" for="traven-image-class">CSS Class</label>
    <input type="text" id="traven-image-class" class="traven-modal-input" placeholder="e.g. shadow shadow-lg border" value="" />
  `;
  form.appendChild(classField);

  form.appendChild(errorEl);

  const altInput = form.querySelector("#traven-image-alt");
  const urlInput = form.querySelector("#traven-image-url");
  const captionInput = form.querySelector("#traven-image-caption");
  const alignSelect = form.querySelector("#traven-image-align");
  const sizeSelect = form.querySelector("#traven-image-size");
  const classInput = form.querySelector("#traven-image-class");

  if (docFrom !== null) {
    altInput.value = attrs.alt || "";
    urlInput.value = attrs.src || "";
    captionInput.value = attrs.caption || "";
    alignSelect.value = attrs.align || "center";
    sizeSelect.value = attrs.size || "medium";
    classInput.value = attrs.class || "";
  } else {
    // Pre-fill alt text with selection if any
    const view = editor.getView();
    const { from, to } = view.state.selection.main;
    const selectionText = from !== to ? view.state.sliceDoc(from, to) : "";
    if (selectionText) {
      altInput.value = selectionText;
    }
    alignSelect.value = "center";
    sizeSelect.value = "medium";
  }

  // Preset selection sync logic
  const getPresetName = (align, size) => {
    if (align === "left") return "left";
    if (align === "right") return "right";
    if (align === "fullbleed") return "fullbleed";
    if (size === "full") return "full";
    return "center"; // default preset
  };

  let currentPreset = getPresetName(alignSelect.value, sizeSelect.value);
  let currentSize = sizeSelect.value || "medium";
  if (currentSize === "full" && (currentPreset === "left" || currentPreset === "right" || currentPreset === "center")) {
    currentSize = "medium";
  }

  const syncUI = () => {
    // 1. Update preset buttons active states
    presetButtons.forEach(btn => {
      const isActive = btn.dataset.preset === currentPreset;
      if (isActive) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // 2. Determine size visibility and options
    if (currentPreset === "full" || currentPreset === "fullbleed") {
      sizeCol.style.display = "none";
    } else {
      sizeCol.style.display = "block";
      // Update sizes availability
      sizePills.forEach(pill => {
        const sizeName = pill.dataset.size;
        if (sizeName === "large" && currentPreset !== "center") {
          pill.style.display = "none";
        } else {
          pill.style.display = "";
        }

        const isActive = sizeName === currentSize;
        if (isActive) {
          pill.classList.add("active");
        } else {
          pill.classList.remove("active");
        }
      });

      // Align sizeRow centered under active layout preset icon
      const activeBtn = presetButtons.find(btn => btn.dataset.preset === currentPreset);
      if (activeBtn) {
        requestAnimationFrame(() => {
          const center = activeBtn.offsetLeft + activeBtn.offsetWidth / 2;
          sizeRow.style.left = center + "px";
        });
      }
    }

    // 3. Update hidden select values
    if (currentPreset === "full") {
      alignSelect.value = "center";
      sizeSelect.value = "full";
    } else if (currentPreset === "fullbleed") {
      alignSelect.value = "fullbleed";
      sizeSelect.value = "full";
    } else {
      alignSelect.value = currentPreset;
      sizeSelect.value = currentSize;
    }
  };

  // Add click listeners to preset buttons
  presetButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const presetName = btn.dataset.preset;
      currentPreset = presetName;
      if (presetName === "full" || presetName === "fullbleed") {
        currentSize = "full";
      } else {
        if (currentSize === "full") {
          currentSize = "medium";
        } else if (presetName !== "center" && currentSize === "large") {
          currentSize = "medium";
        }
      }
      syncUI();
    });
  });

  // Add click listeners to size pills
  sizePills.forEach(pill => {
    pill.addEventListener("click", (e) => {
      e.preventDefault();
      currentSize = pill.dataset.size;
      syncUI();
    });
  });

  // Add change listeners to hidden selects (for test programmatic changes)
  alignSelect.addEventListener("change", () => {
    currentPreset = getPresetName(alignSelect.value, sizeSelect.value);
    syncUI();
  });
  sizeSelect.addEventListener("change", () => {
    currentPreset = getPresetName(alignSelect.value, sizeSelect.value);
    currentSize = sizeSelect.value;
    syncUI();
  });

  // Run initial sync
  syncUI();

  if (updatePreview) {
    updatePreview();
    urlInput.addEventListener("input", updatePreview);
  }

  const updateToggleState = () => {
    const track = toggleBtn.querySelector(".traven-modal-switch-track");
    const thumb = toggleBtn.querySelector(".traven-modal-switch-thumb");

    if (isAdvanced) {
      toggleBtn.style.color = "var(--accent, #334155)";
      toggleBtn.title = "Legacy Markdown";
      if (track) track.style.backgroundColor = "#000000";
      if (thumb) thumb.style.transform = "translateX(18px)";

      captionField.style.display = "";
      groupRow.style.display = "flex";
      classField.style.display = "";

      captionInput.disabled = false;
      alignSelect.disabled = false;
      sizeSelect.disabled = false;
      classInput.disabled = false;
    } else {
      toggleBtn.style.color = "var(--text-secondary, #64748b)";
      toggleBtn.title = "Advanced Settings";
      if (track) track.style.backgroundColor = "#cbd5e1";
      if (thumb) thumb.style.transform = "translateX(0)";

      captionField.style.display = "none";
      groupRow.style.display = "none";
      classField.style.display = "none";

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

    if (!url) {
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

    let insertion = "";
    if (!isAdvanced) {
      insertion = `![${altText}](${url})`;
    } else {
      const captionText = captionInput.value.trim();
      const alignVal = alignSelect.value;
      const sizeVal = sizeSelect.value;
      const classVal = classInput.value.trim();

      const attrParts = [`src="${url}"`];

      const hasAlign = attrs && attrs.hasOwnProperty("align");
      const hasSize = attrs && attrs.hasOwnProperty("size");

      if (alignVal && (alignVal !== "center" || hasAlign)) {
        attrParts.push(`align="${alignVal}"`);
      }
      if (sizeVal && (sizeVal !== "medium" || hasSize)) {
        attrParts.push(`size="${sizeVal}"`);
      }

      if (altText && altText !== "image") attrParts.push(`alt="${altText}"`);
      if (captionText) attrParts.push(`caption="${captionText}"`);
      if (classVal) attrParts.push(`class="${classVal}"`);

      insertion = `[image ${attrParts.join(" ")}]`;
    }

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
    title: docFrom !== null ? "Edit Image" : "Insert Image",
    body: form,
    triggerElement: triggerElement,
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
        onClick: async (e, overlay) => {
          const altInput = overlay.querySelector("#traven-image-alt");
          const urlInput = overlay.querySelector("#traven-image-url");
          const altText = altInput.value.trim() || "image";
          const urlValue = urlInput.value.trim();
          const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

          // Validate: must have either a URL or a file
          if (!urlValue && !hasFile) {
            if (docFrom !== null) {
              insertImageAndUnfocus("", "");
              overlay.querySelector(".traven-modal-close").click();
              return;
            } else {
              errorEl.textContent = "Please enter an image URL or choose a file.";
              errorEl.style.display = "block";
              return;
            }
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
