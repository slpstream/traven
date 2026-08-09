/**
 * @typedef {{ value: string, label: string }} ImageAspectOption
 */
/**
 * Normalize host-provided aspect options. Returns null when absent/empty/invalid.
 * @param {unknown} raw
 * @returns {ImageAspectOption[] | null}
 */
export function normalizeImageAspectOptions(raw: unknown): ImageAspectOption[] | null;
/**
 * Non-empty aspect class tokens managed by the picker.
 * @param {ImageAspectOption[]} options
 * @returns {Set<string>}
 */
export function managedAspectValues(options: ImageAspectOption[]): Set<string>;
/**
 * Detect which managed aspect token is present in a class string.
 * @param {string} classStr
 * @param {ImageAspectOption[]} options
 * @returns {string}
 */
export function detectAspectValue(classStr: string, options: ImageAspectOption[]): string;
/**
 * Strip managed aspect tokens from a class string (keeps unrelated classes).
 * @param {string} classStr
 * @param {ImageAspectOption[]} options
 * @returns {string}
 */
export function stripManagedAspectClasses(classStr: string, options: ImageAspectOption[]): string;
/**
 * Merge selected aspect token into a freeform class string.
 * @param {string} classStr
 * @param {string} selectedValue
 * @param {ImageAspectOption[]} options
 * @returns {string}
 */
export function mergeAspectIntoClass(classStr: string, selectedValue: string, options: ImageAspectOption[]): string;
/**
 * Creates an Aspect pill row for the image modal (host-declared options).
 *
 * @param {Object} opts
 * @param {string} opts.selectId - ID for the hidden select element.
 * @param {ImageAspectOption[]} opts.options - Host-provided aspect choices.
 * @param {string} [opts.initialValue=""] - Initial selected value.
 * @returns {{ element: HTMLElement, aspectSelect: HTMLSelectElement, getValue: () => string, setValue: (v: string) => void, syncUI: Function }}
 */
export function createAspectPicker({ selectId, options, initialValue }: {
    selectId: string;
    options: ImageAspectOption[];
    initialValue?: string;
}): {
    element: HTMLElement;
    aspectSelect: HTMLSelectElement;
    getValue: () => string;
    setValue: (v: string) => void;
    syncUI: Function;
};
export type ImageAspectOption = {
    value: string;
    label: string;
};
