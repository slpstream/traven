export function renderInlineMarkdown(text: any): any;
/**
 * Check if cursor is within the given range
 * @param {import("@codemirror/state").EditorState} state
 * @param {number} from
 * @param {number} to
 * @returns {boolean}
 */
export function cursorInRange(state: import("@codemirror/state").EditorState, from: number, to: number): boolean;
/**
 * Check if any selection overlaps with the given range
 * @param {import("@codemirror/state").EditorState} state
 * @param {number} from
 * @param {number} to
 * @returns {boolean}
 */
export function selectionOverlapsRange(state: import("@codemirror/state").EditorState, from: number, to: number): boolean;
export function getActiveFigureRanges(state: any, cursorHead: any): {
    from: number;
    to: number;
}[];
export function getListPrefixAt(state: any, pos: any): {
    type: string;
    from: any;
    prefixLen: number;
    taskMarker: {
        from: number;
        to: number;
    };
};
export function getListStrippingRanges(state: any, from: any, to: any): {
    from: number;
    to: number;
}[];
export function isInCodeBlock(state: any, pos: any): boolean;
export const collapseDeco: Decoration;
export const boldDeco: Decoration;
export const italicDeco: Decoration;
export const strikethroughDeco: Decoration;
export const codeDeco: Decoration;
export const highlightDeco: Decoration;
export const linkDeco: Decoration;
export const frontmatterLineDeco: Decoration;
export const frontmatterActiveLineDeco: Decoration;
export const blockquoteLineDeco: Decoration;
export const codeBlockLineDeco: Decoration;
export const codeBlockLineFirstDeco: Decoration;
export const codeBlockLineLastDeco: Decoration;
export const codeBlockLineSingleDeco: Decoration;
export const tableRowLineDeco: Decoration;
export const collapsedFenceLineDeco: Decoration;
/** @type {import("@codemirror/state").StateEffectType<any>} */
export const setSuppression: import("@codemirror/state").StateEffectType<any>;
/** @type {import("@codemirror/state").StateEffectType<any>} */
export const clearSuppression: import("@codemirror/state").StateEffectType<any>;
export const suppressionField: StateField<any>;
/** @type {import("@codemirror/state").StateEffectType<boolean>} */
export const setFocusEffect: import("@codemirror/state").StateEffectType<boolean>;
export const focusField: StateField<boolean>;
export function wysiwymPlugin(): (import("@codemirror/state").Extension | StateField<any>)[];
import { Decoration } from "@codemirror/view";
import { StateField } from "@codemirror/state";
