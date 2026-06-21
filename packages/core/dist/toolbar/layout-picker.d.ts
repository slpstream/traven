/**
 * Creates and returns a polished layout preset and size picker component.
 *
 * @param {Object} options
 * @param {string} options.alignId - The ID for the hidden alignment select element.
 * @param {string} options.sizeId - The ID for the hidden size select element.
 * @param {string} [options.initialAlign="center"] - Initial alignment value.
 * @param {string} [options.initialSize="medium"] - Initial size value.
 * @returns {{ element: HTMLElement, alignSelect: HTMLSelectElement, sizeSelect: HTMLSelectElement, syncUI: Function }}
 */
export function createLayoutPicker({ alignId, sizeId, initialAlign, initialSize }: {
    alignId: string;
    sizeId: string;
    initialAlign?: string;
    initialSize?: string;
}): {
    element: HTMLElement;
    alignSelect: HTMLSelectElement;
    sizeSelect: HTMLSelectElement;
    syncUI: Function;
};
