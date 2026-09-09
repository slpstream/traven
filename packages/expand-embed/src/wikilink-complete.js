// @ts-check

/**
 * @typedef {Object} OpenWikilink
 * @property {number} from — document offset of the opening `[[`
 * @property {''|'!'|'>'} prefix
 * @property {string} query — slug typed so far (before `#`, `^`, or `|`)
 */

/**
 * Find an incomplete `[[…` at `pos` (no closing `]]` yet on the same line).
 * @param {string} doc
 * @param {number} pos
 * @returns {OpenWikilink|null}
 */
export function findOpenWikilink(doc, pos) {
  const text = String(doc || "");
  if (pos < 2) return null;

  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  const slice = text.slice(lineStart, pos);
  const open = slice.lastIndexOf("[[");
  if (open === -1) return null;

  const after = slice.slice(open + 2);
  if (after.includes("]]")) return null;

  const lineEndIdx = text.indexOf("\n", pos);
  const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
  if (text.slice(pos, lineEnd).includes("]]")) return null;

  /** @type {''|'!'|'>'} */
  let prefix = "";
  let rest = after;
  if (rest.startsWith("!")) {
    prefix = "!";
    rest = rest.slice(1);
  } else if (rest.startsWith(">")) {
    prefix = ">";
    rest = rest.slice(1);
  }

  let cut = rest.length;
  for (const ch of ["#", "^", "|"]) {
    const idx = rest.indexOf(ch);
    if (idx !== -1 && idx < cut) cut = idx;
  }

  return {
    from: lineStart + open,
    prefix,
    query: rest.slice(0, cut),
  };
}

/**
 * @param {{ prefix?: string, slug: string, title?: string|null }} opts
 * @returns {string}
 */
export function formatWikilinkCompletion(opts) {
  const slug = String(opts?.slug || "").trim();
  const rawPrefix = opts?.prefix || "";
  const prefix = rawPrefix === "!" || rawPrefix === ">" ? rawPrefix : "";
  const title = String(opts?.title || "").trim();
  if (title) return `[[${prefix}${slug}|${title}]]`;
  return `[[${prefix}${slug}]]`;
}
