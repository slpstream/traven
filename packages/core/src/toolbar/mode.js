// @ts-check

const PHONE_VIEWPORT_PX = 768;

/**
 * Detects if the current device is a phone-class touch device.
 * @returns {boolean}
 */
export function isTouchPhone() {
  if (typeof window === "undefined") return false;
  const coarse = typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const noHover = typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none)").matches;
  const small = (window.innerWidth || 0) <= PHONE_VIEWPORT_PX;
  if (!coarse && !noHover) return false;
  return small;
}

/**
 * Resolves the effective toolbar mode. On phone-class touch devices, always
 * returns "static" regardless of the configured value.
 *
 * @param {{ toolbarMode?: string }} options
 * @returns {"static" | "floating" | "hybrid"}
 */
export function resolveToolbarMode(options) {
  const requested = options.toolbarMode || "static";
  if (isTouchPhone() && requested !== "static") {
    return "static";
  }
  return /** @type {any} */ (requested);
}
