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
 * When `source` is set, `heading` is omitted (callers must not pass both meaningfully).
 * @param {'expand'|'embed'} mode
 * @param {string} slug
 * @param {string|null} [heading]
 * @param {string|null} [text] — visible link/chip label (independent of heading)
 * @param {string|null} [source] — e.g. "summary" or "deck" for frontmatter nutshell
 * @returns {string}
 */
export function buildExpandEmbedShortcode(
  mode,
  slug,
  heading = null,
  text = null,
  source = null
) {
  const s = String(slug || "").trim();
  const src = source ? String(source).trim() : "";
  const h = !src && heading ? String(heading).trim() : "";
  const t = text ? String(text).trim() : "";
  if (!s) return `[${mode} slug=""]`;

  let out = `[${mode} slug="${escapeAttr(s)}"`;
  if (t) out += ` text="${escapeAttr(t)}"`;
  if (src) out += ` source="${escapeAttr(src)}"`;
  else if (h) out += ` heading="${escapeAttr(h)}"`;
  out += "]";
  return out;
}
