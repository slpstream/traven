// @ts-check
import "../../assets/toolbars/toolbar-floating.css";

/**
 * Load styles helper.
 * Importing this module ensures the floating toolbar CSS is bundled by esbuild.
 */
export function loadStyles() {
  if (typeof document === "undefined") return;
  
  // Check if .traven-slim-rail is already defined in existing stylesheets
  let stylesExist = false;
  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of rules) {
            if (rule.selectorText && rule.selectorText.includes(".traven-slim-rail")) {
              stylesExist = true;
              break;
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheet, ignore
      }
      if (stylesExist) break;
    }
  } catch (e) {
    // Ignore errors reading stylesheets
  }

  if (stylesExist) return;

  if (document.getElementById("traven-floating-styles")) return;
  const link = document.createElement("link");
  link.id = "traven-floating-styles";
  link.rel = "stylesheet";
  link.href = "assets/toolbars/toolbar-floating.css";
  document.head.appendChild(link);
}
