/**
 * Append tool keys to a settings-modal category (idempotent).
 * @param {string} category
 * @param {string[]} keys
 */
export function addToolsToCategory(category: string, keys: string[]): void;
/**
 * Load saved enabled-tool keys from localStorage.
 * @param {string} [scope]
 * @returns {string[] | null} - null if no config saved.
 */
export function loadToolbarConfig(scope?: string): string[] | null;
/**
 * Save an array of enabled-tool keys to localStorage.
 * @param {string[]} enabledKeys
 * @param {string} [scope]
 */
export function saveToolbarConfig(enabledKeys: string[], scope?: string): void;
/**
 * Clear saved config (reset to defaults).
 * @param {string} [scope]
 */
export function clearToolbarConfig(scope?: string): void;
/**
 * Returns a filtered toolbar array based on saved user preferences.
 *
 * @param {string[]} integratorToolbar - The original toolbar array from options.
 * @param {string} [scope] - localStorage scope.
 * @returns {string[]} Filtered toolbar preserving original ordering.
 */
export function getEffectiveToolbar(integratorToolbar: string[], scope?: string): string[];
/**
 * Tool categories — used as grouping hints by the settings modal UI.
 * The modal only renders tools from these categories that are ALSO
 * present in the integrator's toolbar array.
 */
export const TOOL_CATEGORIES: {
    Formatting: string[];
    Structure: string[];
    "Media & Links": string[];
    Utilities: string[];
};
/** Tools that cannot be disabled by end-users. */
export const LOCKED_TOOLS: string[];
