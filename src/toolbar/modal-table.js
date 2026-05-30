import { openModal } from "./modal-base.js";

// Small SVG icons for the table toolbar buttons
const TABLE_ICONS = {
  addRow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="40" y="120" width="176" height="40" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="48" width="176" height="40" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="216" x2="152" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="192" x2="128" y2="240" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
  addCol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="-20" y="108" width="176" height="40" rx="8" transform="translate(196 60) rotate(90)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="52" y="108" width="176" height="40" rx="8" transform="translate(268 -12) rotate(90)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="192" y1="128" x2="240" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="216" y1="104" x2="216" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
  deleteRow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
  deleteCol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
};

/**
 * Parses a GFM markdown table string into structured data.
 *
 * @param {string} tableText - The raw markdown table text.
 * @returns {{ headers: string[], alignments: (string|null)[], rows: string[][] } | null}
 *   Returns parsed data or null if the text is not a valid table.
 */
export function parseMarkdownTable(tableText) {
  const allLines = tableText.split("\n");
  const lines = allLines.filter(l => l.trim());
  if (lines.length < 2) return null;

  // Validate separator row
  if (!/^[|\s:-]+$/.test(lines[1].trim())) return null;

  const parseCells = (line) => {
    let clean = line.trim();
    if (clean.startsWith("|")) clean = clean.slice(1);
    if (clean.endsWith("|")) clean = clean.slice(0, -1);

    const cells = [];
    let currentCell = "";
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (char === "\\" && clean[i + 1] === "|") {
        currentCell += "|";
        i++; // skip the pipe character
      } else if (char === "|") {
        cells.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const headers = parseCells(lines[0]);

  // Parse alignments from separator row
  const sepCells = parseCells(lines[1]);
  const alignments = sepCells.map(sep => {
    const s = sep.trim();
    const left = s.startsWith(":");
    const right = s.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    // Default (left-aligned or no colons) → "left"
    return "left";
  });

  // Parse data rows
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = parseCells(lines[i]);
    // Ensure consistent column count (pad with empty strings)
    while (cells.length < headers.length) cells.push("");
    rows.push(cells.slice(0, headers.length));
  }

  return { headers, alignments, rows };
}

/**
 * Serializes structured table data back into pipe-aligned GFM markdown.
 *
 * @param {string[]} headers - Column header strings.
 * @param {string[][]} rows - Array of row arrays.
 * @param {(string|null)[]} [alignments] - Column alignment values ("left", "center", "right", or null).
 * @returns {string} Pipe-aligned markdown table string.
 */
export function serializeTableToMarkdown(headers, rows, alignments) {
  const colCount = headers.length;
  const safeAlignments = alignments || [];

  // Escape pipe characters in cell content
  const escapeCell = (text) => (text || "").replace(/\|/g, "\\|");

  const escapedHeaders = headers.map(escapeCell);
  const escapedRows = rows.map(row => {
    const cells = [];
    for (let i = 0; i < colCount; i++) {
      cells.push(escapeCell(row[i] || ""));
    }
    return cells;
  });

  // Calculate maximum column widths (minimum 3 for separator dashes)
  const colWidths = [];
  for (let col = 0; col < colCount; col++) {
    let maxW = Math.max(3, escapedHeaders[col].length);
    for (const row of escapedRows) {
      maxW = Math.max(maxW, row[col].length);
    }
    colWidths.push(maxW);
  }

  // Pad cell to column width
  const padCell = (text, colIdx) => text.padEnd(colWidths[colIdx], " ");

  // Build separator row with alignment indicators (dashes match column width + 2 padding spaces)
  const buildSep = (colIdx) => {
    const align = safeAlignments[colIdx] || null;
    const w = colWidths[colIdx] + 2;
    if (align === "center") return ":" + "-".repeat(w - 2) + ":";
    if (align === "right") return "-".repeat(w - 1) + ":";
    if (align === "left") return ":" + "-".repeat(w - 1);
    // null or unspecified → plain dashes
    return "-".repeat(w);
  };

  // Assemble lines
  const headerLine = "| " + escapedHeaders.map((h, i) => padCell(h, i)).join(" | ") + " |";
  const sepLine = "|" + colWidths.map((_, i) => buildSep(i)).join("|") + "|";
  const dataLines = escapedRows.map(
    row => "| " + row.map((c, i) => padCell(c, i)).join(" | ") + " |"
  );

  return [headerLine, sepLine, ...dataLines].join("\n");
}

/**
 * Opens the interactive Table Editor Modal.
 * Follows the openImageModal closure pattern: builds all DOM inline,
 * constructs the buttons array with closures, then calls openModal().
 *
 * @param {Object} options
 * @param {Object} options.editor - The TravenEditor instance.
 * @param {{ headers: string[], alignments: (string|null)[], rows: string[][] } | null} options.tableData
 *   Parsed table data. If null, a default 3×2 empty table is created.
 * @param {number|null} options.docFrom - Document start position of the existing table (null for new).
 * @param {number|null} options.docTo - Document end position of the existing table (null for new).
 * @param {HTMLElement} [options.triggerElement] - The button that triggered the modal.
 */
export function openTableModal({ editor, tableData = null, docFrom = null, docTo = null, triggerElement = null }) {
  // Default 3-column, 2-row empty table when creating a new table
  const data = tableData || {
    headers: ["Header 1", "Header 2", "Header 3"],
    alignments: [null, null, null],
    rows: [
      ["", "", ""],
      ["", "", ""]
    ]
  };

  const isNewTable = docFrom === null;

  // --- Build the modal body ---
  const body = document.createElement("div");

  // Table toolbar strip
  const toolbar = document.createElement("div");
  toolbar.className = "traven-table-toolbar";

  const makeToolBtn = (label, iconKey, onClick) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "traven-table-toolbar-btn";
    btn.innerHTML = TABLE_ICONS[iconKey] + `<span>${label}</span>`;
    btn.setAttribute("aria-label", label);
    btn.addEventListener("click", onClick);
    return btn;
  };

  // Focused cell tracking: { row: number (0 = header, 1+ = data), col: number }
  let focusedCell = { row: 0, col: 0 };

  // Build the editable HTML table from data
  const tableEl = document.createElement("table");
  tableEl.className = "traven-table-editor";

  const buildTable = () => {
    tableEl.innerHTML = "";

    // thead
    const thead = document.createElement("thead");
    const headerTr = document.createElement("tr");
    data.headers.forEach((h, colIdx) => {
      const th = document.createElement("th");
      th.contentEditable = "true";
      th.textContent = h;
      th.dataset.row = "0";
      th.dataset.col = String(colIdx);
      headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);
    tableEl.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    data.rows.forEach((row, rowIdx) => {
      const tr = document.createElement("tr");
      for (let colIdx = 0; colIdx < data.headers.length; colIdx++) {
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.textContent = row[colIdx] || "";
        td.dataset.row = String(rowIdx + 1); // 0 is header
        td.dataset.col = String(colIdx);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    tableEl.appendChild(tbody);

    updateToolbarState();
  };

  // Sync data model from the editable table DOM
  const syncFromDOM = () => {
    const cells = tableEl.querySelectorAll("th");
    cells.forEach((th, i) => {
      data.headers[i] = th.textContent;
    });
    const trs = tableEl.querySelectorAll("tbody tr");
    data.rows = [];
    trs.forEach((tr) => {
      const row = [];
      tr.querySelectorAll("td").forEach((td) => {
        row.push(td.textContent);
      });
      data.rows.push(row);
    });
  };

  // Track focused cell
  tableEl.addEventListener("focusin", (e) => {
    const cell = e.target.closest("th, td");
    if (cell && cell.dataset.row !== undefined) {
      focusedCell = {
        row: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col)
      };
    }
  });

  // Keyboard navigation within the table
  tableEl.addEventListener("keydown", (e) => {
    const cell = e.target.closest("th, td");
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const colCount = data.headers.length;
    const totalRows = data.rows.length + 1; // +1 for header

    if (e.key === "Tab") {
      e.preventDefault();
      syncFromDOM();

      let nextRow = row;
      let nextCol = col;

      if (e.shiftKey) {
        // Shift+Tab: move backwards
        nextCol--;
        if (nextCol < 0) {
          nextCol = colCount - 1;
          nextRow--;
        }
        if (nextRow < 0) {
          // Wrap: move focus to table toolbar (last button)
          const toolBtns = toolbar.querySelectorAll(".traven-table-toolbar-btn:not(:disabled)");
          if (toolBtns.length > 0) {
            toolBtns[toolBtns.length - 1].focus();
          }
          return;
        }
      } else {
        // Tab: move forward
        nextCol++;
        if (nextCol >= colCount) {
          nextCol = 0;
          nextRow++;
        }
        if (nextRow >= totalRows) {
          // Past last cell: move focus to the footer buttons
          const modalEl = tableEl.closest(".traven-modal");
          if (modalEl) {
            const footerBtn = modalEl.querySelector(".traven-modal-footer .traven-modal-btn");
            if (footerBtn) footerBtn.focus();
          }
          return;
        }
      }

      focusCellAt(nextRow, nextCol);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      syncFromDOM();
      // Move to cell below (or do nothing at last row)
      if (row < data.rows.length) {
        focusCellAt(row + 1, col);
      }
    }
  });

  const focusCellAt = (row, col) => {
    const selector = row === 0
      ? `th[data-col="${col}"]`
      : `td[data-row="${row}"][data-col="${col}"]`;
    const target = tableEl.querySelector(selector);
    if (target) {
      target.focus();
      // Place cursor at end of cell content
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(target);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  // --- Toolbar actions ---

  const addRowBtn = makeToolBtn("Add Row", "addRow", () => {
    syncFromDOM();
    // Insert after the focused data row, or at the end
    const insertIdx = focusedCell.row >= 1
      ? focusedCell.row   // after the focused data row
      : data.rows.length; // at the end
    const emptyRow = new Array(data.headers.length).fill("");
    data.rows.splice(insertIdx, 0, emptyRow);
    buildTable();
    // Focus the first cell of the new row
    focusCellAt(insertIdx + 1, 0);
  });

  const deleteRowBtn = makeToolBtn("Delete Row", "deleteRow", () => {
    syncFromDOM();
    if (data.rows.length <= 1) return; // Must keep at least 1 data row
    const rowIdx = focusedCell.row >= 1 ? focusedCell.row - 1 : data.rows.length - 1;
    data.rows.splice(rowIdx, 1);
    buildTable();
    // Focus the nearest remaining row
    const newRow = Math.min(rowIdx + 1, data.rows.length);
    focusCellAt(newRow, focusedCell.col);
  });

  const addColBtn = makeToolBtn("Add Column", "addCol", () => {
    syncFromDOM();
    const insertIdx = focusedCell.col + 1;
    data.headers.splice(insertIdx, 0, "");
    if (data.alignments) data.alignments.splice(insertIdx, 0, "left");
    data.rows.forEach(row => row.splice(insertIdx, 0, ""));
    buildTable();
    focusCellAt(focusedCell.row, insertIdx);
  });

  const deleteColBtn = makeToolBtn("Delete Column", "deleteCol", () => {
    syncFromDOM();
    if (data.headers.length <= 1) return; // Must keep at least 1 column
    const colIdx = focusedCell.col;
    data.headers.splice(colIdx, 1);
    if (data.alignments) data.alignments.splice(colIdx, 1);
    data.rows.forEach(row => row.splice(colIdx, 1));
    buildTable();
    const newCol = Math.min(colIdx, data.headers.length - 1);
    focusCellAt(focusedCell.row, newCol);
  });

  const updateToolbarState = () => {
    deleteRowBtn.disabled = data.rows.length <= 1;
    deleteColBtn.disabled = data.headers.length <= 1;
  };

  toolbar.appendChild(addRowBtn);
  toolbar.appendChild(deleteRowBtn);
  toolbar.appendChild(addColBtn);
  toolbar.appendChild(deleteColBtn);

  body.appendChild(toolbar);
  body.appendChild(tableEl);

  // Initial table render
  buildTable();

  // --- Construct buttons array with closures ---
  const buttons = [];

  // "Edit Source" button — only shown when editing an existing table
  if (!isNewTable) {
    buttons.push({
      text: "Edit Source",
      type: "secondary",
      onClick: (e, overlay) => {
        overlay.querySelector(".traven-modal-close").click();
        // Place cursor at the start of the table's raw markdown
        const view = editor.getView();
        view.dispatch({ selection: { anchor: docFrom } });
        view.focus();
      }
    });
  }

  buttons.push({
    text: "Cancel",
    type: "secondary",
    onClick: (e, overlay) => {
      overlay.querySelector(".traven-modal-close").click();
    }
  });

  buttons.push({
    text: "Save",
    type: "primary",
    onClick: (e, overlay) => {
      syncFromDOM();
      const markdown = serializeTableToMarkdown(data.headers, data.rows, data.alignments);

      const view = editor.getView();

      if (isNewTable) {
        // Insert at current cursor position with proper spacing
        const state = view.state;
        const range = state.selection.main;
        const from = range.from;
        const to = range.to;

        const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : "\n";
        const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : "\n";
        let prefixSpacing = "";
        if (charBefore !== "\n") {
          prefixSpacing = "\n\n";
        } else if (secondCharBefore !== "\n") {
          prefixSpacing = "\n";
        }

        const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : "\n";
        let suffixSpacing = "";
        if (charAfter !== "\n") {
          suffixSpacing = "\n";
        }

        const finalInsert = `${prefixSpacing}${markdown}${suffixSpacing}`;
        view.dispatch({
          changes: { from, to, insert: finalInsert },
          selection: { anchor: from + finalInsert.length }
        });
      } else {
        // Replace existing table at docFrom..docTo
        view.dispatch({
          changes: { from: docFrom, to: docTo, insert: markdown },
          selection: { anchor: docFrom + markdown.length }
        });
      }

      view.focus();
      overlay.querySelector(".traven-modal-close").click();
    }
  });

  // --- Open the modal using the shared openModal() ---
  openModal({
    title: isNewTable ? "Insert Table" : "Edit Table",
    body,
    buttons,
    triggerElement,
    className: "traven-modal-table"
  });
}
