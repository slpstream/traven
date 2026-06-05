// @ts-check

let mermaidConfig = { enabled: false, js: null };
let mermaidPromise = null;

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
export function configureMermaid(options) {
  if (options === true) {
    mermaidConfig = {
      enabled: true,
      js: "https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.esm.min.mjs",
    };
  } else if (typeof options === "string") {
    mermaidConfig = {
      enabled: true,
      js: options,
    };
  } else if (options && typeof options === "object") {
    mermaidConfig = {
      enabled: true,
      js: options.js || null,
    };
  } else {
    mermaidConfig = { enabled: false, js: null };
  }
  // Reset promise so new calls use the updated config
  mermaidPromise = null;
}

/**
 * Ensures Mermaid is loaded and initialized.
 * Returns a promise that resolves with the mermaid API or null.
 *
 * @returns {Promise<any|null>} Mermaid API instance or null if disabled/failed
 */
export async function ensureMermaid() {
  if (typeof window === "undefined") return null;
  if (window["mermaid"]) return window["mermaid"];

  if (!mermaidConfig.enabled) {
    return null;
  }

  if (mermaidPromise) return mermaidPromise;

  mermaidPromise = (async () => {
    // 1. Try dynamic import if the URL is an ES module
    if (mermaidConfig.js) {
      const isEsm = mermaidConfig.js.endsWith(".mjs") || 
                    mermaidConfig.js.includes("esm") || 
                    mermaidConfig.js.includes("/esm/");
      if (isEsm) {
        try {
          // Dynamic import allows us to load the ESM bundle and grab its default export
          const module = await import(/* @vite-ignore */ mermaidConfig.js);
          if (module && (module.default || module.mermaid)) {
            window["mermaid"] = module.default || module.mermaid;
            return window["mermaid"];
          }
        } catch (e) {
          console.warn("Failed to dynamically import Mermaid as ESM, falling back to script tag injection:", e);
        }
      }
    }

    // 2. Fallback: Standard UMD script injection
    return new Promise((resolve) => {
      if (mermaidConfig.js) {
        const existingScript = document.querySelector(
          `script[src="${mermaidConfig.js}"]`
        );
        if (existingScript) {
          if (window["mermaid"]) {
            resolve(window["mermaid"]);
          } else {
            existingScript.addEventListener("load", () => resolve(window["mermaid"]));
            existingScript.addEventListener("error", () => resolve(null));
          }
          return;
        }

        const script = document.createElement("script");
        script.src = mermaidConfig.js;
        script.onload = () => resolve(window["mermaid"]);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      } else {
        resolve(null);
      }
    });
  })();

  return mermaidPromise;
}

/**
 * Renders mermaid diagram code to HTML string.
 *
 * @param {string} code - Mermaid diagram code
 * @param {object} [options] - Render options
 * @returns {Promise<string>} Rendered HTML or fallback
 */
export async function renderMermaid(code, options = {}) {
  const mermaid = await ensureMermaid();

  if (!mermaid) {
    // Fallback: return code block with mermaid class
    return `<div class="mermaid-fallback"><pre class="language-mermaid"><code>${escapeHtml(code)}</code></pre></div>`;
  }

  try {
    // Initialize mermaid with default config
    mermaid.initialize({
      startOnLoad: false,
      theme: options.theme || "default",
      securityLevel: options.securityLevel || "loose",
      ...options,
    });

    // Use mermaid's render API to get SVG
    const { svg } = await mermaid.render(
      `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      code,
    );
    return `<div class="mermaid">${svg}</div>`;
  } catch (error) {
    console.warn("Mermaid render error:", error);
    return `<div class="mermaid-error"><pre class="language-mermaid"><code>${escapeHtml(code)}</code></pre><p class="mermaid-error-message">Failed to render diagram: ${escapeHtml(error.message)}</p></div>`;
  }
}

/**
 * Renders mermaid diagram code to HTML string (synchronous fallback version).
 * Use this when you can't await (e.g., in synchronous rendering pipeline).
 *
 * @param {string} code - Mermaid diagram code
 * @returns {string} Rendered HTML or fallback placeholder
 */
export function renderMermaidSync(code) {
  // If Mermaid is configured/enabled, output the .mermaid class so that
  // initMermaid can pick it up once the script finishes loading.
  if (mermaidConfig.enabled) {
    return `<div class="mermaid">${escapeHtml(code)}</div>`;
  }

  // Standard fallback if Mermaid is completely disabled
  return `<div class="mermaid-fallback"><pre class="language-mermaid"><code>${escapeHtml(code)}</code></pre></div>`;
}

/**
 * Initialize mermaid diagrams in the given container element.
 * This should be called after content is inserted into the DOM.
 *
 * @param {HTMLElement} container - Container element to scan for mermaid diagrams
 */
export async function initMermaid(container) {
  const mermaid = await ensureMermaid();

  if (!mermaid) return;

  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });

    // Find all .mermaid elements that haven't been rendered yet
    const elements = container.querySelectorAll(
      ".mermaid:not([data-processed])",
    );

    for (const el of elements) {
      el.setAttribute("data-processed", "true");
      const code = el.textContent || "";
      if (code.trim()) {
        try {
          const { svg } = await mermaid.render(
            `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            code,
          );
          el.innerHTML = svg;
        } catch (error) {
          console.warn("Mermaid render error:", error);
          el.innerHTML = `<pre class="language-mermaid"><code>${escapeHtml(code)}</code></pre><p class="mermaid-error-message">Failed to render diagram: ${escapeHtml(error.message)}</p>`;
        }
      }
    }
  } catch (error) {
    console.warn("Mermaid init error:", error);
  }
}

/**
 * Escape HTML special characters.
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
