// @ts-check

/**
 * Escape a value for use inside a double-quoted shortcode attribute.
 * @param {string} value
 * @returns {string}
 */
export function escapeAttr(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

/**
 * Build [expand]/[embed] shortcode markdown.
 * @param {'expand'|'embed'} mode
 * @param {string} slug
 * @param {string|null} [heading]
 * @returns {string}
 */
export function buildExpandEmbedShortcode(mode, slug, heading = null) {
  const s = String(slug || "").trim();
  const h = heading ? String(heading).trim() : "";
  if (!s) return `[${mode} slug=""]`;
  if (h) return `[${mode} slug="${escapeAttr(s)}" heading="${escapeAttr(h)}"]`;
  return `[${mode} slug="${escapeAttr(s)}"]`;
}
