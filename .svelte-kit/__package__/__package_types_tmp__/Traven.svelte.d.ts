export default Traven;
type Traven = SvelteComponent<{
    defaultValue?: string;
    options?: {};
    onChange?: any;
    getValue?: () => any;
    getInstance?: () => any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> & {
    $$bindings?: string;
} & {
    getValue: () => any;
    getInstance: () => any;
};
declare const Traven: $$__sveltets_2_IsomorphicComponent<{
    defaultValue?: string;
    options?: {};
    onChange?: any;
    getValue?: () => any;
    getInstance?: () => any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}, {
    getValue: () => any;
    getInstance: () => any;
}, string>;
interface $$__sveltets_2_IsomorphicComponent<Props extends Record<string, any> = any, Events extends Record<string, any> = any, Slots extends Record<string, any> = any, Exports = {}, Bindings = string> {
    new (options: import("svelte").ComponentConstructorOptions<Props>): import("svelte").SvelteComponent<Props, Events, Slots> & {
        $$bindings?: Bindings;
    } & Exports;
    (internal: unknown, props: Props & {
        $$events?: Events;
        $$slots?: Slots;
    }): Exports & {
        $set?: any;
        $on?: any;
    };
    z_$$bindings?: Bindings;
}
