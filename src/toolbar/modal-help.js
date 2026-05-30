import { openModal } from "./modal-base.js";

/**
 * Renders the Help Cheat Sheet Modal dialog.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openHelpModal(editor, triggerBtn) {
  const helpContent = document.createElement("div");
  helpContent.className = "help-grid";
  helpContent.innerHTML = `
    <div class="help-section-title">Format Utilities</div>
    <div class="help-row"><span class="help-key">Bold</span><span class="help-value">**text** or Ctrl+B</span></div>
    <div class="help-row"><span class="help-key">Italic</span><span class="help-value">*text* or Ctrl+I</span></div>
    <div class="help-row"><span class="help-key">Strikethrough</span><span class="help-value">~~text~~ or Ctrl+Shift+S</span></div>
    <div class="help-row"><span class="help-key">Inline Code</span><span class="help-value">\`code\`</span></div>

    <div class="help-section-title">Block Formats</div>
    <div class="help-row"><span class="help-key">Heading level 1 to 6</span><span class="help-value"># Heading</span></div>
    <div class="help-row"><span class="help-key">Blockquote</span><span class="help-value">&gt; Quote</span></div>
    <div class="help-row"><span class="help-key">Unordered List</span><span class="help-value">- Item</span></div>
    <div class="help-row"><span class="help-key">Ordered List</span><span class="help-value">1. Item</span></div>
    <div class="help-row"><span class="help-key">Code Block</span><span class="help-value">\`\`\`\\ncode\\n\`\`\`</span></div>
    <div class="help-row"><span class="help-key">Horizontal Rule</span><span class="help-value">---</span></div>
    <div class="help-row"><span class="help-key">Interactive Checklist</span><span class="help-value">- [ ] Task</span></div>

    <div class="help-section-title">General Commands</div>
    <div class="help-row"><span class="help-key">Search / Find</span><span class="help-value">Ctrl+F</span></div>
    <div class="help-row"><span class="help-key">Manual Save</span><span class="help-value">Ctrl+S</span></div>
    <div class="help-row"><span class="help-key">Undo / Redo</span><span class="help-value">Ctrl+Z / Ctrl+Y</span></div>
  `;

  openModal({
    title: "Traven Editor Shortcuts & Cheat Sheet",
    body: helpContent,
    triggerElement: triggerBtn,
    buttons: [
      {
        text: "Close",
        type: "primary",
        onClick: (e, overlay) => {
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}
