// @ts-check

/**
 * @typedef {{ value: string, label: string }} ImageAspectOption
 */

/**
 * Normalize host-provided aspect options. Returns null when absent/empty/invalid.
 * @param {unknown} raw
 * @returns {ImageAspectOption[] | null}
 */
export function normalizeImageAspectOptions(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  /** @type {ImageAspectOption[]} */
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const value = typeof /** @type {any} */ (item).value === "string"
      ? /** @type {any} */ (item).value
      : null;
    const label = typeof /** @type {any} */ (item).label === "string"
      ? /** @type {any} */ (item).label
      : null;
    if (value === null || !label) continue;
    out.push({ value, label });
  }
  return out.length > 0 ? out : null;
}

/**
 * Non-empty aspect class tokens managed by the picker.
 * @param {ImageAspectOption[]} options
 * @returns {Set<string>}
 */
export function managedAspectValues(options) {
  return new Set(options.map((o) => o.value).filter((v) => v !== ""));
}

/**
 * Detect which managed aspect token is present in a class string.
 * @param {string} classStr
 * @param {ImageAspectOption[]} options
 * @returns {string}
 */
export function detectAspectValue(classStr, options) {
  const tokens = String(classStr || "").trim().split(/\s+/).filter(Boolean);
  for (const opt of options) {
    if (opt.value && tokens.includes(opt.value)) return opt.value;
  }
  return "";
}

/**
 * Strip managed aspect tokens from a class string (keeps unrelated classes).
 * @param {string} classStr
 * @param {ImageAspectOption[]} options
 * @returns {string}
 */
export function stripManagedAspectClasses(classStr, options) {
  const managed = managedAspectValues(options);
  return String(classStr || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !managed.has(t))
    .join(" ");
}

/**
 * Merge selected aspect token into a freeform class string.
 * @param {string} classStr
 * @param {string} selectedValue
 * @param {ImageAspectOption[]} options
 * @returns {string}
 */
export function mergeAspectIntoClass(classStr, selectedValue, options) {
  const tokens = stripManagedAspectClasses(classStr, options)
    .split(/\s+/)
    .filter(Boolean);
  if (selectedValue) tokens.push(selectedValue);
  return tokens.join(" ");
}

/**
 * Creates an Aspect pill row for the image modal (host-declared options).
 *
 * @param {Object} opts
 * @param {string} opts.selectId - ID for the hidden select element.
 * @param {ImageAspectOption[]} opts.options - Host-provided aspect choices.
 * @param {string} [opts.initialValue=""] - Initial selected value.
 * @returns {{ element: HTMLElement, aspectSelect: HTMLSelectElement, getValue: () => string, setValue: (v: string) => void, syncUI: Function }}
 */
export function createAspectPicker({ selectId, options, initialValue = "" }) {
  const field = document.createElement("div");
  field.className = "traven-modal-field";
  field.style.display = "flex";
  field.style.flexDirection = "column";
  field.style.gap = "6px";
  field.style.marginBottom = "16px";

  const label = document.createElement("label");
  label.className = "traven-modal-label";
  label.textContent = "Aspect";
  label.htmlFor = selectId;
  field.appendChild(label);

  const hiddenSelect = /** @type {HTMLSelectElement} */ (document.createElement("select"));
  hiddenSelect.id = selectId;
  hiddenSelect.style.display = "none";
  for (const opt of options) {
    const optionEl = document.createElement("option");
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    hiddenSelect.appendChild(optionEl);
  }
  field.appendChild(hiddenSelect);

  const pillsRow = document.createElement("div");
  pillsRow.className = "traven-modal-aspect-row";
  field.appendChild(pillsRow);

  /** @type {HTMLButtonElement[]} */
  const pills = [];
  options.forEach((opt) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "traven-modal-aspect-pill";
    pill.dataset.aspect = opt.value;
    pill.textContent = opt.label;
    pillsRow.appendChild(pill);
    pills.push(pill);
  });

  let currentValue = options.some((o) => o.value === initialValue) ? initialValue : (options[0]?.value ?? "");

  const syncUI = () => {
    hiddenSelect.value = currentValue;
    pills.forEach((pill) => {
      const isActive = pill.dataset.aspect === currentValue;
      if (isActive) pill.classList.add("active");
      else pill.classList.remove("active");
    });
  };

  pills.forEach((pill) => {
    pill.addEventListener("click", (e) => {
      e.preventDefault();
      currentValue = pill.dataset.aspect ?? "";
      syncUI();
    });
  });

  hiddenSelect.addEventListener("change", () => {
    currentValue = hiddenSelect.value;
    syncUI();
  });

  syncUI();

  return {
    element: field,
    aspectSelect: hiddenSelect,
    getValue: () => currentValue,
    setValue: (v) => {
      currentValue = options.some((o) => o.value === v) ? v : (options[0]?.value ?? "");
      syncUI();
    },
    syncUI
  };
}
