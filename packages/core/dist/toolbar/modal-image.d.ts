/**
 * Renders the Image Insertion Modal dialog.
 * Supports three insertion paths:
 *   1. Direct URL input — constructs ![alt](url) markdown or [image] shortcode.
 *   2. File upload via onUploadImage callback — uploads first, then inserts.
 *   3. Host media library via onPickImage — fills URL (+ optional alt/caption).
 *
 * @param {Object|any} optionsOrEditor - The TravenEditor instance, or options object.
 * @param {HTMLElement|null} [triggerBtn] - The button that triggered the modal.
 */
export function openImageModal(optionsOrEditor: any | any, triggerBtn?: HTMLElement | null): void;
