// @ts-check

/**
 * Creates and returns a polished layout preset and size picker component.
 *
 * @param {Object} options
 * @param {string} options.alignId - The ID for the hidden alignment select element.
 * @param {string} options.sizeId - The ID for the hidden size select element.
 * @param {string} [options.initialAlign="center"] - Initial alignment value.
 * @param {string} [options.initialSize="medium"] - Initial size value.
 * @returns {{ element: HTMLElement, alignSelect: HTMLSelectElement, sizeSelect: HTMLSelectElement, syncUI: Function }}
 */
export function createLayoutPicker({ alignId, sizeId, initialAlign = "center", initialSize = "medium" }) {
  // Group Row for Alignment and Size (using layout preset selector and size pills)
  const groupRow = document.createElement("div");
  groupRow.className = "traven-modal-field";
  groupRow.style.display = "flex";
  groupRow.style.flexDirection = "column";
  groupRow.style.gap = "12px";
  groupRow.style.marginBottom = "16px";

  // Hidden selects for testing compatibility
  const hiddenAlignSelect = /** @type {HTMLSelectElement} */ (document.createElement("select"));
  hiddenAlignSelect.id = alignId;
  hiddenAlignSelect.style.display = "none";
  hiddenAlignSelect.innerHTML = `
    <option value="left">Left</option>
    <option value="center">Center</option>
    <option value="right">Right</option>
    <option value="fullbleed">Full Bleed</option>
  `;
  groupRow.appendChild(hiddenAlignSelect);

  const hiddenSizeSelect = /** @type {HTMLSelectElement} */ (document.createElement("select"));
  hiddenSizeSelect.id = sizeId;
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

  const getPresetName = (align, size) => {
    if (align === "left") return "left";
    if (align === "right") return "right";
    if (align === "fullbleed") return "fullbleed";
    if (size === "full") return "full";
    return "center"; // default preset
  };

  let currentPreset = getPresetName(initialAlign, initialSize);
  let currentSize = initialSize || "medium";
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
      hiddenAlignSelect.value = "center";
      hiddenSizeSelect.value = "full";
    } else if (currentPreset === "fullbleed") {
      hiddenAlignSelect.value = "fullbleed";
      hiddenSizeSelect.value = "full";
    } else {
      hiddenAlignSelect.value = currentPreset;
      hiddenSizeSelect.value = currentSize;
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
  hiddenAlignSelect.addEventListener("change", () => {
    currentPreset = getPresetName(hiddenAlignSelect.value, hiddenSizeSelect.value);
    syncUI();
  });
  hiddenSizeSelect.addEventListener("change", () => {
    currentPreset = getPresetName(hiddenAlignSelect.value, hiddenSizeSelect.value);
    currentSize = hiddenSizeSelect.value;
    syncUI();
  });

  // Run initial sync
  syncUI();

  return {
    element: groupRow,
    alignSelect: hiddenAlignSelect,
    sizeSelect: hiddenSizeSelect,
    syncUI
  };
}
