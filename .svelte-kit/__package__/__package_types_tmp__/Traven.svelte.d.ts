/** @typedef {typeof __propDef.props}  TravenProps */
/** @typedef {typeof __propDef.events}  TravenEvents */
/** @typedef {typeof __propDef.slots}  TravenSlots */
export default class Traven extends SvelteComponent<{
    defaultValue?: string;
    options?: {};
    onChange?: any;
    getValue?: () => any;
    getInstance?: () => any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
    get getValue(): () => any;
    get getInstance(): () => any;
}
export type TravenProps = typeof __propDef.props;
export type TravenEvents = typeof __propDef.events;
export type TravenSlots = typeof __propDef.slots;
import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: {
        defaultValue?: string;
        options?: {};
        onChange?: any;
        getValue?: () => any;
        getInstance?: () => any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
    exports?: {};
    bindings?: string;
};
export {};
