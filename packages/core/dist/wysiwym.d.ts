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
/** @type {import("@codemirror/state").StateEffectType<any>} */
export const setSuppression: import("@codemirror/state").StateEffectType<any>;
/** @type {import("@codemirror/state").StateEffectType<any>} */
export const clearSuppression: import("@codemirror/state").StateEffectType<any>;
export const suppressionField: StateField<any>;
/** @type {import("@codemirror/state").StateEffectType<boolean>} */
export const setFocusEffect: import("@codemirror/state").StateEffectType<boolean>;
export const focusField: StateField<boolean>;
export const wysiwymField: StateField<import("@codemirror/view").DecorationSet>;
export function wysiwymPlugin(): (import("@codemirror/state").Extension | StateField<any>)[];
import { StateField } from "@codemirror/state";
