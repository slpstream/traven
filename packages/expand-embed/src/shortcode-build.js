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
 * @param {string|null} [text] — visible link/chip label (independent of heading)
 * @returns {string}
 */
export function buildExpandEmbedShortcode(mode, slug, heading = null, text = null) {
  const s = String(slug || "").trim();
  const h = heading ? String(heading).trim() : "";
  const t = text ? String(text).trim() : "";
  if (!s) return `[${mode} slug=""]`;

  let out = `[${mode} slug="${escapeAttr(s)}"`;
  if (t) out += ` text="${escapeAttr(t)}"`;
  if (h) out += ` heading="${escapeAttr(h)}"`;
  out += "]";
  return out;
}
