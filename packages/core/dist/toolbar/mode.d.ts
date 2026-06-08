/**
 * Detects if the current device is a phone-class touch device.
 * @returns {boolean}
 */
export function isTouchPhone(): boolean;
/**
 * Resolves the effective toolbar mode. On phone-class touch devices, always
 * returns "static" regardless of the configured value.
 *
 * @param {{ toolbarMode?: string }} options
 * @returns {"static" | "floating" | "hybrid"}
 */
export function resolveToolbarMode(options: {
    toolbarMode?: string;
}): "static" | "floating" | "hybrid";
