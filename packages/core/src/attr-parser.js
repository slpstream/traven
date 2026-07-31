// @ts-check

/**
 * @typedef {Object} AttrPair
 * @property {number} index - Start position of the attribute in attrStr
 * @property {number} lastIndex - End position of the attribute in attrStr
 * @property {string} name - Attribute name
 * @property {number} nameStart - Start position of name in attrStr
 * @property {number} nameEnd - End position of name in attrStr
 * @property {string} value - Attribute value
 * @property {number} valStart - Start position of value in attrStr
 * @property {number} valEnd - End position of value in attrStr
 */

const BOUNDARY_REGEX = /^\s*(?:[a-zA-Z0-9_-]+\s*=|\s*\]|\s*$)/;

/**
 * Parse attribute key-value pairs from shortcode attribute string in linear O(N) time.
 * @param {string} attrStr
 * @returns {AttrPair[]}
 */
export function parseAttrPairs(attrStr) {
  /** @type {AttrPair[]} */
  const results = [];
  if (!attrStr) return results;

  const len = attrStr.length;
  let i = 0;

  while (i < len) {
    // 1. Skip whitespace
    while (i < len && /\s/.test(attrStr[i])) {
      i++;
    }
    if (i >= len) break;

    const matchStart = i;

    // 2. Parse key: [a-zA-Z0-9_-]+
    const nameStart = i;
    while (i < len && /[a-zA-Z0-9_-]/.test(attrStr[i])) {
      i++;
    }
    if (i === nameStart) {
      // Not a valid key start character, advance one char to avoid infinite loop
      i++;
      continue;
    }
    const nameEnd = i;
    const name = attrStr.slice(nameStart, nameEnd);

    // 3. Skip whitespace before '='
    while (i < len && /\s/.test(attrStr[i])) {
      i++;
    }

    // Expect '='
    if (i >= len || attrStr[i] !== '=') {
      // Attribute without '=' value, skip
      continue;
    }
    i++; // consume '='

    // Skip whitespace after '='
    while (i < len && /\s/.test(attrStr[i])) {
      i++;
    }

    if (i >= len) {
      results.push({
        index: matchStart,
        lastIndex: len,
        name,
        nameStart,
        nameEnd,
        value: "",
        valStart: len,
        valEnd: len
      });
      break;
    }

    // 4. Parse value
    let value = "";
    let valStart = i;
    let valEnd = i;
    let lastIndex = i;

    const quote = attrStr[i];
    if (quote === '"' || quote === "'") {
      valStart = i + 1;
      i++; // consume opening quote
      const contentStart = i;
      let closingFound = false;

      while (i < len) {
        if (attrStr[i] === '\\' && i + 1 < len) {
          i += 2;
          continue;
        }

        if (attrStr[i] === quote) {
          const remainder = attrStr.slice(i + 1);
          if (BOUNDARY_REGEX.test(remainder)) {
            valEnd = i;
            closingFound = true;
            i++; // consume closing quote
            lastIndex = i;
            break;
          }
        }
        i++;
      }

      if (!closingFound) {
        valEnd = len;
        lastIndex = len;
      }

      const rawVal = attrStr.slice(contentStart, valEnd);
      value = rawVal.replace(/\\"/g, '"').replace(/\\'/g, "'");
    } else {
      valStart = i;
      while (i < len && !/\s/.test(attrStr[i]) && attrStr[i] !== ']') {
        i++;
      }
      valEnd = i;
      lastIndex = i;
      value = attrStr.slice(valStart, valEnd);
    }

    results.push({
      index: matchStart,
      lastIndex,
      name,
      nameStart,
      nameEnd,
      value,
      valStart,
      valEnd
    });
  }

  return results;
}

/**
 * Parse attribute key-value map from string in linear O(N) time.
 * @param {string} attrStr
 * @returns {Record<string, string>}
 */
export function parseAttrMap(attrStr) {
  /** @type {Record<string, string>} */
  const map = {};
  const pairs = parseAttrPairs(attrStr);
  for (const pair of pairs) {
    map[pair.name] = pair.value;
  }
  return map;
}
