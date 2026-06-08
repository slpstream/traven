/**
 * Renders the Insert Component Modal dialog.
 * Inserts a [component name="…"]…[/component] shortcode block at the cursor.
 *
 * @param {Object} optionsOrEditor - The TravenEditor instance, or an options object with { editor, triggerElement, docFrom, docTo, attrs, bodyText }.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal (used only when optionsOrEditor is the editor directly).
 */
export function openComponentModal(optionsOrEditor: any, triggerBtn?: HTMLElement): void;
