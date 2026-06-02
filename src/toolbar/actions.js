// @ts-check

/**
 * Category 1 (inline / selection-only) + Category 2 (hybrid) actions rendered
 * inside the Selection Bubble.
 */
export const BUBBLE_ACTIONS = [
  // Category 1
  "bold", "italic", "strikethrough", "highlight", "code", "link",
  "uppercase", "lowercase", "capitalize", "removeformatting",
  // Category 2
  "heading", "blockquote", "bulletlist", "numberedlist", "tasklist", "codeblock",
];

/**
 * Category 2 (hybrid) + Category 3 (pure block insertion) actions rendered
 * inside the Gutter `+` popover.
 */
export const GUTTER_ACTIONS = [
  // Category 2
  "heading", "blockquote", "bulletlist", "numberedlist", "tasklist", "codeblock",
  // Category 3
  "hr", "table", "image", "video", "audio", "figure", "component", "datetime",
];

/**
 * Category 4 (global / document-wide) actions rendered in the slim control
 * rail. Same 7 actions are *always* present in the static rail in
 * "hybrid" mode too — but in that case they live inside the existing
 * `DEFAULT_TOOLBAR` array, not in a dedicated rail.
 */
export const RAIL_ACTIONS = [
  "undo", "redo", "fullscreen", "search", "clear", "gotoline", "help"
];
