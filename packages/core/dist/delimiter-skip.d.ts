/**
 * Multi-jump delimiter skip: loops to traverse multiple adjacent collapsed
 * delimiter boundaries in a single arrow keypress (handles nested syntax
 * like **_text_**, ~~**text**~~, etc.)
 */
export function skipDelimiter(view: any, direction: any): boolean;
export function delimiterSkipKeymap(): import("@codemirror/state").Extension;
