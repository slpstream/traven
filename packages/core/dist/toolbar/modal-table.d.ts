/**
 * Parses a GFM markdown table string into structured data.
 *
 * @param {string} tableText - The raw markdown table text.
 * @returns {{ headers: string[], alignments: (string|null)[], rows: string[][] } | null}
 *   Returns parsed data or null if the text is not a valid table.
 */
export function parseMarkdownTable(tableText: string): {
    headers: string[];
    alignments: (string | null)[];
    rows: string[][];
} | null;
/**
 * Serializes structured table data back into pipe-aligned GFM markdown.
 *
 * @param {string[]} headers - Column header strings.
 * @param {string[][]} rows - Array of row arrays.
 * @param {(string|null)[]} [alignments] - Column alignment values ("left", "center", "right", or null).
 * @returns {string} Pipe-aligned markdown table string.
 */
export function serializeTableToMarkdown(headers: string[], rows: string[][], alignments?: (string | null)[]): string;
/**
 * Opens the interactive Table Editor Modal.
 * Follows the openImageModal closure pattern: builds all DOM inline,
 * constructs the buttons array with closures, then calls openModal().
 *
 * @param {Object} options
 * @param {Object} options.editor - The TravenEditor instance.
 * @param {{ headers: string[], alignments: (string|null)[], rows: string[][] } | null} [options.tableData]
 *   Parsed table data. If null, a default 3×2 empty table is created.
 * @param {number|null} [options.docFrom] - Document start position of the existing table (null for new).
 * @param {number|null} [options.docTo] - Document end position of the existing table (null for new).
 * @param {HTMLElement} [options.triggerElement] - The button that triggered the modal.
 */
export function openTableModal({ editor, tableData, docFrom, docTo, triggerElement }: {
    editor: any;
    tableData?: {
        headers: string[];
        alignments: (string | null)[];
        rows: string[][];
    } | null;
    docFrom?: number | null;
    docTo?: number | null;
    triggerElement?: HTMLElement;
}): void;
