/**
 * Returns the rail element. Used only in "floating" mode.
 *
 * @param {import("../index.js").TravenEditor} editor
 * @param {Object.<string, string>} [keybindings]
 * @returns {HTMLElement}
 */
export function buildSlimRail(editor: import("../index.js").TravenEditor, keybindings?: {
    [x: string]: string;
}): HTMLElement;
/**
 * Builds a stats display element and registers an editor listener
 * to keep word/character/reading time counts updated.
 *
 * @param {import("../index.js").TravenEditor} editor
 * @returns {HTMLElement}
 */
export function buildStatsWidget(editor: import("../index.js").TravenEditor): HTMLElement;
