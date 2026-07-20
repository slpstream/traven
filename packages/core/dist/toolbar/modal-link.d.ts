/**
 * @typedef {Object} LinkSuggestion
 * @property {string} title
 * @property {string} url
 * @property {string} [slug]
 */
/**
 * Renders the Link Insertion Modal dialog.
 * When the host provides onSuggestLinks, typing in the URL field shows
 * a debounced suggestion list (title + url/slug). Without a handler,
 * behavior matches the classic text + URL form.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openLinkModal(editor: any, triggerBtn: HTMLElement): void;
export type LinkSuggestion = {
    title: string;
    url: string;
    slug?: string;
};
