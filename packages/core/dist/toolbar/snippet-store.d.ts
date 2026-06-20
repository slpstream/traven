/**
 * @typedef {Object} Snippet
 * @property {string} id
 * @property {string} name
 * @property {string} content
 */
/**
 * Returns all saved snippets.
 * @returns {Snippet[]}
 */
export function getSnippets(): Snippet[];
/**
 * Saves all snippets to localStorage.
 * @param {Snippet[]} snippets
 */
export function saveSnippets(snippets: Snippet[]): void;
/**
 * Adds a new snippet.
 * @param {string} name
 * @param {string} content
 * @returns {Snippet}
 */
export function addSnippet(name: string, content: string): Snippet;
/**
 * Updates an existing snippet.
 * @param {string} id
 * @param {string} name
 * @param {string} content
 */
export function updateSnippet(id: string, name: string, content: string): void;
/**
 * Deletes a snippet by id.
 * @param {string} id
 */
export function deleteSnippet(id: string): void;
export type Snippet = {
    id: string;
    name: string;
    content: string;
};
