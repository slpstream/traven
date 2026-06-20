// @ts-check

const STORAGE_KEY = "traven-snippets";

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
export function getSnippets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Traven: Failed to parse snippets from localStorage", err);
    return [];
  }
}

/**
 * Saves all snippets to localStorage.
 * @param {Snippet[]} snippets 
 */
export function saveSnippets(snippets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  } catch (err) {
    console.warn("Traven: Failed to save snippets to localStorage", err);
  }
}

/**
 * Adds a new snippet.
 * @param {string} name 
 * @param {string} content 
 * @returns {Snippet}
 */
export function addSnippet(name, content) {
  const snippets = getSnippets();
  const id = `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const snippet = { id, name, content };
  snippets.push(snippet);
  saveSnippets(snippets);
  return snippet;
}

/**
 * Updates an existing snippet.
 * @param {string} id 
 * @param {string} name 
 * @param {string} content 
 */
export function updateSnippet(id, name, content) {
  const snippets = getSnippets();
  const index = snippets.findIndex(s => s.id === id);
  if (index !== -1) {
    snippets[index] = { ...snippets[index], name, content };
    saveSnippets(snippets);
  }
}

/**
 * Deletes a snippet by id.
 * @param {string} id 
 */
export function deleteSnippet(id) {
  const snippets = getSnippets();
  const filtered = snippets.filter(s => s.id !== id);
  saveSnippets(filtered);
}
