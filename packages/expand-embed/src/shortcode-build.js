// @ts-check

/**
 * Build a wikilink. When `source` is set, `heading` is omitted
 * (same rule as the legacy shortcode builder).
 *
 * @param {'expand'|'embed'|'link'} mode
 * @param {string} slug
 * @param {string|null} [heading]
 * @param {string|null} [text] — visible link/chip label (independent of heading)
 * @param {string|null} [source] — e.g. "summary" or "deck"
 * @returns {string}
 */
export function buildWikilink(
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

  let prefix = "";
  if (mode === "expand") prefix = ">";
  else if (mode === "embed") prefix = "!";

  let out = "[[" + prefix + s;
  if (h) out += "#" + h;
  if (src) out += "^" + src;
  if (t) out += "|" + t;
  out += "]]";
  return out;
}

/** @deprecated Use {@link buildWikilink}. */
export const buildExpandEmbedShortcode = buildWikilink;
