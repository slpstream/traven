/**
 * Selection bubble extension.
 * @param {any} editor
 * @param {{ hotkey?: string, appearDelay?: number }} [options]
 * @returns {any[]}
 */
export function selectionBubbleExtension(editor: any, options?: {
    hotkey?: string;
    appearDelay?: number;
}): any[];
/**
 * Gutter inserter extension.
 * @param {any} editor
 * @param {{ hotkey?: string }} [options]
 * @returns {any[]}
 */
export function gutterInserterExtension(editor: any, options?: {
    hotkey?: string;
}): any[];
