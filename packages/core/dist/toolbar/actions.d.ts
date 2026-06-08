/**
 * Category 1 (inline / selection-only) + Category 2 (hybrid) actions rendered
 * inside the Selection Bubble.
 */
export const BUBBLE_ACTIONS: string[];
/**
 * Key for the insert-block shortcut button inside the Selection Bubble.
 * Rendered last in the bubble, separated visually by CSS.
 */
export const BUBBLE_INSERT_KEY: "bubble-insert";
/**
 * Category 2 (hybrid) + Category 3 (pure block insertion) actions rendered
 * inside the Gutter `+` popover.
 */
export const GUTTER_ACTIONS: string[];
/**
 * Category 4 (global / document-wide) actions rendered in the slim control
 * rail. Same 7 actions are *always* present in the static rail in
 * "hybrid" mode too — but in that case they live inside the existing
 * `DEFAULT_TOOLBAR` array, not in a dedicated rail.
 */
export const RAIL_ACTIONS: string[];
