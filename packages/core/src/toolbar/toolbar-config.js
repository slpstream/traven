// @ts-check

/**
 * Tool categories — used as grouping hints by the settings modal UI.
 * The modal only renders tools from these categories that are ALSO
 * present in the integrator's toolbar array.
 */
export const TOOL_CATEGORIES = {
  "Formatting": ["bold", "italic", "strikethrough", "highlight", "subscript", "superscript", "code", "codeblock"],
  "Structure": ["heading", "bulletlist", "numberedlist", "tasklist", "blockquote", "hr", "table"],
  "Media & Links": ["link", "image", "video", "audio", "figure", "component"],
  "Utilities": ["undo", "redo", "search", "fullscreen", "clear", "datetime", "gotoline", "uppercase", "lowercase", "capitalize", "removeformatting", "snippet", "help"]
};

/**
 * Append tool keys to a settings-modal category (idempotent).
 * @param {string} category
 * @param {string[]} keys
 */
export function addToolsToCategory(category, keys) {
  if (!TOOL_CATEGORIES[category]) {
    TOOL_CATEGORIES[category] = [];
  }
  const list = TOOL_CATEGORIES[category];
  for (const key of keys) {
    if (key && !list.includes(key)) list.push(key);
  }
}

/** Tools that cannot be disabled by end-users. */
export const LOCKED_TOOLS = ["settings"];

/**
 * Returns the scoped localStorage key.
 * @param {string} [scope="default"]
 * @returns {string}
 */
function storageKey(scope = "default") {
  return `traven-toolbar-config:${scope}`;
}

/**
 * Load saved enabled-tool keys from localStorage.
 * @param {string} [scope]
 * @returns {string[] | null} - null if no config saved.
 */
export function loadToolbarConfig(scope) {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Save an array of enabled-tool keys to localStorage.
 * @param {string[]} enabledKeys
 * @param {string} [scope]
 */
export function saveToolbarConfig(enabledKeys, scope) {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(enabledKeys));
  } catch (e) {
    console.warn("Traven: Failed to save toolbar config", e);
  }
}

/**
 * Clear saved config (reset to defaults).
 * @param {string} [scope]
 */
export function clearToolbarConfig(scope) {
  try {
    localStorage.removeItem(storageKey(scope));
  } catch (e) { /* ignore */ }
}

/**
 * Returns a filtered toolbar array based on saved user preferences.
 *
 * @param {string[]} integratorToolbar - The original toolbar array from options.
 * @param {string} [scope] - localStorage scope.
 * @returns {string[]} Filtered toolbar preserving original ordering.
 */
export function getEffectiveToolbar(integratorToolbar, scope) {
  const saved = loadToolbarConfig(scope);
  if (!saved) return integratorToolbar;

  const enabledSet = new Set([...saved, ...LOCKED_TOOLS]);
  const filtered = integratorToolbar.filter(key =>
    key === "|" || enabledSet.has(key)
  );

  // Clean up separators: no leading, trailing, or consecutive
  const cleaned = [];
  for (const key of filtered) {
    if (key === "|") {
      if (cleaned.length > 0 && cleaned[cleaned.length - 1] !== "|") {
        cleaned.push(key);
      }
    } else {
      cleaned.push(key);
    }
  }
  // Remove trailing separator
  if (cleaned.length > 0 && cleaned[cleaned.length - 1] === "|") {
    cleaned.pop();
  }

  return cleaned;
}
