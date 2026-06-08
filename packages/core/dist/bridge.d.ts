/**
 * Shared bridge module to break circular dependencies between index.js and wysiwym.js.
 * Maps CM6 EditorView instances back to their owning TravenEditor instance.
 */
export const viewToEditor: WeakMap<WeakKey, any>;
