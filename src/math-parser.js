// @ts-check
import { tags } from "@lezer/highlight";

export const MathExtension = {
  defineNodes: [
    { name: "InlineMath" },
    { name: "BlockMath" },
    { name: "MathMark", style: tags.processingInstruction }
  ],
  parseInline: [
    {
      name: "InlineMath",
      before: "Escape",
      parse(cx, next, pos) {
        if (next !== 36 /* '$' */) return -1;

        const isDisplay = cx.char(pos + 1) === 36; // '$$'
        const delimLen = isDisplay ? 2 : 1;

        // For inline math, the character right after the opening '$' must not be a space or newline.
        if (!isDisplay) {
          const nextChar = cx.char(pos + 1);
          if (nextChar === 32 || nextChar === 9 || nextChar === 10 || nextChar === 13) {
            return -1;
          }
        }

        // Search for the matching closing delimiter
        let scan = pos + delimLen;
        let endPos = -1;
        while (scan < cx.end) {
          const ch = cx.char(scan);
          if (isDisplay) {
            if (ch === 36 && cx.char(scan + 1) === 36) {
              // Found closing '$$'
              // Verify it's not escaped
              if (cx.char(scan - 1) !== 92 /* '\\' */) {
                endPos = scan + 2;
                break;
              }
            }
          } else {
            if (ch === 36) {
              // Found closing '$'
              // Make sure it's not display math '$$'
              if (cx.char(scan + 1) === 36) {
                scan += 2;
                continue;
              }
              // Verify it's not escaped and not preceded by space/newline
              const prevChar = cx.char(scan - 1);
              if (prevChar !== 32 && prevChar !== 9 && prevChar !== 10 && prevChar !== 13 && prevChar !== 92) {
                endPos = scan + 1;
                break;
              }
            }
          }
          scan++;
        }

        if (endPos === -1) return -1;

        const nodeName = isDisplay ? "BlockMath" : "InlineMath";
        const children = [
          cx.elt("MathMark", pos, pos + delimLen),
          cx.elt("MathMark", endPos - delimLen, endPos)
        ];

        cx.addElement(cx.elt(nodeName, pos, endPos, children));
        return endPos;
      }
    }
  ]
};

let katexConfig = { enabled: false, js: null, css: null };
let katexPromise = null;

export function configureKatex(options) {
  if (options === true) {
    katexConfig = {
      enabled: true,
      js: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
      css: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
    };
  } else if (typeof options === "string") {
    katexConfig = {
      enabled: true,
      js: options,
      css: options.replace(/\.js$/, ".css")
    };
  } else if (options && typeof options === "object") {
    katexConfig = {
      enabled: true,
      js: options.js || null,
      css: options.css || null
    };
  } else {
    katexConfig = { enabled: false, js: null, css: null };
  }
  // Reset promise so new calls use the updated config
  katexPromise = null;
}

export function ensureKatex() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.katex) return Promise.resolve(window.katex);
  
  if (!katexConfig.enabled) {
    return Promise.resolve(null);
  }

  if (katexPromise) return katexPromise;

  katexPromise = new Promise((resolve) => {
    // 1. Inject KaTeX CSS stylesheet if provided and not present
    if (katexConfig.css && !document.querySelector(`link[href="${katexConfig.css}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = katexConfig.css;
      document.head.appendChild(link);
    }

    // 2. Inject KaTeX script if provided
    if (katexConfig.js) {
      const existingScript = document.querySelector(`script[src="${katexConfig.js}"]`);
      if (existingScript) {
        if (window.katex) {
          resolve(window.katex);
        } else {
          existingScript.addEventListener("load", () => resolve(window.katex));
          existingScript.addEventListener("error", () => resolve(null));
        }
        return;
      }

      const script = document.createElement("script");
      script.src = katexConfig.js;
      script.onload = () => resolve(window.katex);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } else {
      resolve(null);
    }
  });

  return katexPromise;
}

