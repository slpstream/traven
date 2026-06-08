/**
 * Builds the toolbar DOM container and elements based on the provided configuration.
 * Binds DOM action triggers back to the editor instance.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {Array<string>} config - Ordered list of tool keys and separator tokens.
 * @param {Object} [keybindings={}] - Custom keyboard shortcut mappings.
 * @returns {HTMLElement} The toolbar container DOM element.
 */
export function buildToolbar(editor: any, config: Array<string>, keybindings?: any): HTMLElement;
