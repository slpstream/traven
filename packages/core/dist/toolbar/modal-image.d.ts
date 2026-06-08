/**
 * Renders the Image Insertion Modal dialog.
 * Supports two insertion paths:
 *   1. Direct URL input — constructs ![alt](url) markdown.
 *   2. File upload via onUploadImage callback — uploads first, then inserts.
 *
 * @param {Object|any} optionsOrEditor - The TravenEditor instance, or options object.
 * @param {HTMLElement|null} [triggerBtn] - The button that triggered the modal.
 */
export function openImageModal(optionsOrEditor: any | any, triggerBtn?: HTMLElement | null): void;
