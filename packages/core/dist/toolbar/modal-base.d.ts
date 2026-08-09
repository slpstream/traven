/**
 * Traven generic, accessible modal system.
 * Handles overlay creation, focus trapping, Escape key listener, and focus restoration.
 *
 * @param {Object} options
 * @param {string} options.title - Header title.
 * @param {HTMLElement|string} options.body - Body content.
 * @param {Array<Object>} [options.buttons] - Array of { text, type, onClick } button configs.
 * @param {HTMLElement} [options.triggerElement] - The button element that triggered the modal.
 * @param {string|null} [options.className] - Optional extra class on the dialog element.
 * @param {Function|null} [options.onClose] - Callback when modal is closed.
 * @returns {{ setEscapeSuspended: (suspended: boolean) => void, close: () => void }}
 */
export function openModal({ title, body, buttons, triggerElement, className, onClose }: {
    title: string;
    body: HTMLElement | string;
    buttons?: Array<any>;
    triggerElement?: HTMLElement;
    className?: string | null;
    onClose?: Function | null;
}): {
    setEscapeSuspended: (suspended: boolean) => void;
    close: () => void;
};
