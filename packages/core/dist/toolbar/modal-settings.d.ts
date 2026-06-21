/**
 * Opens the Toolbar Settings modal.
 *
 * @param {import("../index.js").TravenEditor} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 * @param {Object} opts
 * @param {Object} opts.toolRegistry - The TOOL_REGISTRY object (passed to break circular import).
 * @param {string[]} opts.integratorToolbar - The integrator's original toolbar array.
 * @param {string} [opts.scope] - localStorage scope key.
 */
export function openSettingsModal(editor: import("../index.js").TravenEditor, triggerBtn: HTMLElement, { toolRegistry, integratorToolbar, scope }: {
    toolRegistry: any;
    integratorToolbar: string[];
    scope?: string;
}): void;
