/**
 * Appends a button (or dropdown trigger) for `key` into `parent`. Used by
 * the static rail, the bubble, and the gutter popover.
 *
 * @param {DocumentFragment | HTMLElement} parent
 * @param {string} key
 * @param {import("../index.js").TravenEditor} editor
 * @param {Object.<string, string>} [keybindings]
 */
export function buildToolButton(parent: DocumentFragment | HTMLElement, key: string, editor: import("../index.js").TravenEditor, keybindings?: {
    [x: string]: string;
}): void;
