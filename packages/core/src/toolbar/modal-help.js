// @ts-check
import { openModal } from "./modal-base.js";

/**
 * Renders the Help Cheat Sheet Modal dialog.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openHelpModal(editor, triggerBtn) {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? "⌘" : "Ctrl+";
  const modShiftKey = isMac ? "⇧⌘" : "Ctrl+Shift+";

  const helpContent = document.createElement("div");
  helpContent.className = "help-container";
  helpContent.innerHTML = `
    <div class="help-tabs">
      <button class="help-tab-btn active" data-tab="markdown">Markdown</button>
      <button class="help-tab-btn" data-tab="shortcodes">Shortcodes</button>
      <button class="help-tab-btn" data-tab="shortcuts">Shortcuts</button>
    </div>
    <div class="help-tab-contents">
      <!-- Markdown Content -->
      <div class="help-tab-content active" id="help-tab-markdown">
        <div class="help-grid">
          <div class="help-section-title">Format Utilities</div>
          <div class="help-row"><span class="help-key">Bold</span><span class="help-value">**text**</span></div>
          <div class="help-row"><span class="help-key">Italic</span><span class="help-value">*text*</span></div>
          <div class="help-row"><span class="help-key">Strikethrough</span><span class="help-value">~~text~~</span></div>
          <div class="help-row"><span class="help-key">Highlight</span><span class="help-value">==text==</span></div>
          <div class="help-row"><span class="help-key">Inline Code</span><span class="help-value">\`code\`</span></div>

          <div class="help-section-title">Links & Media</div>
          <div class="help-row"><span class="help-key">Link</span><span class="help-value">[text](url)</span></div>
          <div class="help-row"><span class="help-key">Image</span><span class="help-value">![alt](url)</span></div>

          <div class="help-section-title">Block Formats</div>
          <div class="help-row"><span class="help-key">Heading 1-6</span><span class="help-value"># Heading</span></div>
          <div class="help-row"><span class="help-key">Blockquote</span><span class="help-value">&gt; Quote</span></div>
          <div class="help-row"><span class="help-key">Unordered List</span><span class="help-value">- Item</span></div>
          <div class="help-row"><span class="help-key">Ordered List</span><span class="help-value">1. Item</span></div>
          <div class="help-row"><span class="help-key">Interactive Checklist</span><span class="help-value">- [ ] Task</span></div>
          <div class="help-row"><span class="help-key">Code Block</span><span class="help-value">\`\`\`\ncode\n\`\`\`</span></div>
          <div class="help-row"><span class="help-key">Horizontal Rule</span><span class="help-value">---</span></div>

          <div class="help-section-title">Math & Diagrams</div>
          <div class="help-row"><span class="help-key">Inline Math</span><span class="help-value">$math$</span></div>
          <div class="help-row"><span class="help-key">Block Math</span><span class="help-value">$$math$$</span></div>
        </div>
      </div>

      <!-- Shortcodes Content -->
      <div class="help-tab-content" id="help-tab-shortcodes" style="display: none;">
        <div class="help-grid">
          <div class="help-section-title">Callouts & Quotes</div>
          <div class="help-row"><span class="help-key">Callout Info</span><span class="help-value">[component name="info" title="Title"]text[/component]</span></div>
          <div class="help-row"><span class="help-key">Callout Warning</span><span class="help-value">[component name="warning" title="Title"]text[/component]</span></div>
          <div class="help-row"><span class="help-key">Collapsible Block</span><span class="help-value">[component name="info" title="Title" collapsible="true"]text[/component]</span></div>
          <div class="help-row"><span class="help-key">Custom Blockquote</span><span class="help-value">[blockquote author="Author" source="Source"]quote[/blockquote]</span></div>
          <div class="help-row"><span class="help-key">Pullquote</span><span class="help-value">[pullquote]text[/pullquote]</span></div>
          <div class="help-row"><span class="help-key">Inline Highlight</span><span class="help-value">[highlight]text[/highlight]</span></div>

          <div class="help-section-title">Media Previews</div>
          <div class="help-row"><span class="help-key">Custom Image</span><span class="help-value">[image src="url" alt="alt" caption="caption" align="center" size="medium"]</span></div>
          <div class="help-row"><span class="help-key">YouTube Video</span><span class="help-value">[youtube id="id"]</span></div>
          <div class="help-row"><span class="help-key">Vimeo Video</span><span class="help-value">[vimeo id="id"]</span></div>
          <div class="help-row"><span class="help-key">HTML5 Video</span><span class="help-value">[video src="url"]</span></div>
          <div class="help-row"><span class="help-key">HTML5 Audio</span><span class="help-value">[audio src="url"]</span></div>
          <div class="help-row"><span class="help-key">Figure Wrapper</span><span class="help-value">[figure]content[/figure]</span></div>
        </div>
      </div>

      <!-- Shortcuts Content -->
      <div class="help-tab-content" id="help-tab-shortcuts" style="display: none;">
        <div class="help-grid">
          <div class="help-section-title">Formatting Shortcuts</div>
          <div class="help-row"><span class="help-key">Bold</span><span class="help-value">${modKey}B</span></div>
          <div class="help-row"><span class="help-key">Italic</span><span class="help-value">${modKey}I</span></div>
          <div class="help-row"><span class="help-key">Strikethrough</span><span class="help-value">${modShiftKey}S</span></div>
          <div class="help-row"><span class="help-key">Highlight</span><span class="help-value">${modShiftKey}H</span></div>
          <div class="help-row"><span class="help-key">Checklist</span><span class="help-value">${modShiftKey}C</span></div>
          <div class="help-row"><span class="help-key">Insert Link</span><span class="help-value">${modKey}K</span></div>

          <div class="help-section-title">Editor Commands</div>
          <div class="help-row"><span class="help-key">Undo</span><span class="help-value">${modKey}Z</span></div>
          <div class="help-row"><span class="help-key">Redo</span><span class="help-value">${modKey}Y</span></div>
          <div class="help-row"><span class="help-key">Find / Replace</span><span class="help-value">${modKey}F</span></div>
          <div class="help-row"><span class="help-key">Go to Line</span><span class="help-value">${modKey}G</span></div>
          <div class="help-row"><span class="help-key">Help / Cheat Sheet</span><span class="help-value">${modKey}/</span></div>
          <div class="help-row"><span class="help-key">Save Document</span><span class="help-value">${modKey}S</span></div>
          <div class="help-row"><span class="help-key">Indent line</span><span class="help-value">Tab</span></div>
          <div class="help-row"><span class="help-key">Outdent line</span><span class="help-value">Shift+Tab</span></div>
        </div>
      </div>
    </div>
  `;

  // Attach tab switching events
  const tabBtns = helpContent.querySelectorAll(".help-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Toggle active button
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Toggle active content
      const tabName = btn.getAttribute("data-tab");
      const contents = helpContent.querySelectorAll(".help-tab-content");
      contents.forEach(el => {
        const content = /** @type {HTMLElement} */ (el);
        if (content.id === `help-tab-${tabName}`) {
          content.style.display = "block";
        } else {
          content.style.display = "none";
        }
      });
    });
  });

  openModal({
    title: "",
    body: helpContent,
    triggerElement: triggerBtn,
    className: "traven-modal-help",
    onClose: () => {
      const view = editor.getView();
      if (view && typeof view.requestMeasure === "function") {
        view.requestMeasure();
      }
    },
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
