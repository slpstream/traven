/**
 * Configure Mermaid diagram rendering.
 *
 * @param {boolean|string|object} options - Configuration options:
 *   - `true`: Enable with default CDN URL (v11.4.0)
 *   - `string`: Custom CDN URL for mermaid.js
 *   - `object`: Configuration object with optional `js` property for custom URL
 *   - `false` / `undefined`: Disable Mermaid
 *
 * @example
 * // Enable with default CDN
 * configureMermaid(true);
 *
 * @example
 * // Enable with custom URL
 * configureMermaid("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
 *
 * @example
 * // Enable with configuration object
 * configureMermaid({ js: "https://my-cdn.com/mermaid.min.js" });
 */
export function configureMermaid(options: boolean | string | object): void;
/**
 * Ensures Mermaid is loaded and initialized.
 * Returns a promise that resolves with the mermaid API or null.
 *
 * @returns {Promise<any|null>} Mermaid API instance or null if disabled/failed
 */
export function ensureMermaid(): Promise<any | null>;
/**
 * Renders mermaid diagram code to HTML string.
 *
 * @param {string} code - Mermaid diagram code
 * @param {object} [options] - Render options
 * @returns {Promise<string>} Rendered HTML or fallback
 */
export function renderMermaid(code: string, options?: object): Promise<string>;
/**
 * Renders mermaid diagram code to HTML string (synchronous fallback version).
 * Use this when you can't await (e.g., in synchronous rendering pipeline).
 *
 * @param {string} code - Mermaid diagram code
 * @returns {string} Rendered HTML or fallback placeholder
 */
export function renderMermaidSync(code: string): string;
/**
 * Initialize mermaid diagrams in the given container element.
 * This should be called after content is inserted into the DOM.
 *
 * @param {HTMLElement} container - Container element to scan for mermaid diagrams
 */
export function initMermaid(container: HTMLElement): Promise<void>;
