// @ts-check
import { openModal, openLinkModal, openImageModal, openHelpModal, openTableModal, openComponentModal, openVideoModal, openAudioModal, openFigureModal } from "./modal.js";

export const TOOL_REGISTRY = {
  undo: {
    key: "undo",
    title: "Undo",
    shortcut: "Ctrl+Z",
    keybinding: "Mod-z",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="24 56 24 104 72 104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M67.59,192A88,88,0,1,0,65.77,65.77L24,104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.undo()
  },
  redo: {
    key: "redo",
    title: "Redo",
    shortcut: "Ctrl+Y",
    keybinding: "Mod-y",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="184 104 232 104 232 56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M188.4,192a88,88,0,1,1,1.83-126.23L232,104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.redo()
  },
  bold: {
    key: "bold",
    title: "Bold",
    shortcut: "Ctrl+B",
    keybinding: "Mod-b",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M185.08,114.46A48,48,0,0,0,148,36H80A12,12,0,0,0,68,48V200a12,12,0,0,0,12,12h80a52,52,0,0,0,25.08-97.54ZM92,60h56a24,24,0,0,1,0,48H92Zm68,128H92V132h68a28,28,0,0,1,0,56Z" fill="currentColor"/></svg>`,
    action: (editor) => editor.insertSnippet("**", "**", "bold text")
  },
  italic: {
    key: "italic",
    title: "Italic",
    shortcut: "Ctrl+I",
    keybinding: "Mod-i",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="152" y1="56" x2="104" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="64" y1="200" x2="144" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="112" y1="56" x2="192" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertSnippet("*", "*", "italic text")
  },
  strikethrough: {
    key: "strikethrough",
    title: "Strikethrough",
    shortcut: "Ctrl+Shift+S",
    keybinding: "Mod-Shift-s",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M76.33,96a25.71,25.71,0,0,1-1.22-8c0-22.09,22-40,52.89-40,23,0,40.24,9.87,48,24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M72,168c0,22.09,25.07,40,56,40s56-17.91,56-40c0-23.77-21.62-33-45.6-40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertSnippet("~~", "~~", "strikethrough")
  },
  highlight: {
    key: "highlight",
    title: "Highlight",
    shortcut: "Ctrl+Shift+H",
    keybinding: "Mod-Shift-h",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="88 128 24 192 96 216 136 176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M184,160l-26.34,26.34a8,8,0,0,1-11.32,0L77.66,117.66a8,8,0,0,1,0-11.32L104,80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M248,112l-50.34,50.34a8,8,0,0,1-11.32,0L101.66,77.66a8,8,0,0,1,0-11.32L152,16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertSnippet("==", "==", "highlighted text")
  },
  code: {
    key: "code",
    title: "Inline Code",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="64 88 16 128 64 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="192 88 240 128 192 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="160" y1="40" x2="96" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertSnippet("`", "`", "code")
  },
  codeblock: {
    key: "codeblock",
    title: "Code Block",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="64 32 32 64 64 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="104 32 136 64 104 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M176,48h24a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V136" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertCodeBlock()
  },
  blockquote: {
    key: "blockquote",
    title: "Quote",
    type: "dropdown",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M108,144H40a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M224,144H156a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    children: [
      {
        title: "Simple",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="96 48 176 128 96 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor) => editor.insertBlockquote()
      },
      {
        title: "Blockquote",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M108,144H40a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M224,144H156a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor, buttonEl) => {
          openComponentModal({ editor, triggerElement: buttonEl, attrs: { name: "blockquote" } });
        }
      },
      {
        title: "Pullquote",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="64" y1="136" x2="192" y2="136" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="24" y1="88" x2="232" y2="88" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="184" x2="152" y2="184" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor, buttonEl) => {
          openComponentModal({ editor, triggerElement: buttonEl, attrs: { name: "pullquote" } });
        }
      }
    ]
  },
  bulletlist: {
    key: "bulletlist",
    title: "Unordered List",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="88" y1="64" x2="216" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="192" x2="216" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="44" cy="64" r="12" fill="currentColor"/><circle cx="44" cy="128" r="12" fill="currentColor"/><circle cx="44" cy="192" r="12" fill="currentColor"/></svg>`,
    action: (editor) => editor.insertList("ul")
  },
  numberedlist: {
    key: "numberedlist",
    title: "Ordered List",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="104" y1="128" x2="216" y2="128" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="64" x2="216" y2="64" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="192" x2="216" y2="192" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="56 104 56 40 40 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M72,208H40l28.68-38.37a15.69,15.69,0,0,0-3.24-22.41,16.78,16.78,0,0,0-23.06,3.15,15.85,15.85,0,0,0-2.38,4.3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertList("ol")
  },
  tasklist: {
    key: "tasklist",
    title: "Checklist",
    shortcut: "Ctrl+Shift+C",
    keybinding: "Mod-Shift-c",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="128" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="64" x2="216" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="192" x2="216" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="40 64 56 80 88 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="40 128 56 144 88 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="40 192 56 208 88 176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertList("task")
  },
  hr: {
    key: "hr",
    title: "Horizontal Rule",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="24" y1="128" x2="232" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertHR()
  },
  table: {
    key: "table",
    title: "Insert Table",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M32,56H224a0,0,0,0,1,0,0V192a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V56A0,0,0,0,1,32,56Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="32" y1="104" x2="224" y2="104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="32" y1="152" x2="224" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="104" x2="88" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openTableModal({ editor, tableData: null, triggerElement: buttonEl });
    }
  },
  datetime: {
    key: "datetime",
    title: "Insert Date/Time",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="40" y1="88" x2="216" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="152" y1="152" x2="104" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="128" x2="128" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.insertDateTime()
  },
  search: {
    key: "search",
    title: "Search",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="116" cy="116" r="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="172" y1="172" x2="224" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.openSearch()
  },
  fullscreen: {
    key: "fullscreen",
    title: "Toggle Fullscreen",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 48 208 48 208 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="88 208 48 208 48 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="208 168 208 208 168 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="48 88 48 48 88 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.toggleFullscreen()
  },
  clear: {
    key: "clear",
    title: "Clear Document",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="96" y1="104" x2="160" y2="168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M112,216,219.31,108.69a16,16,0,0,0,0-22.63L177.94,44.69a16,16,0,0,0-22.63,0L36.69,163.31a16,16,0,0,0,0,22.63L66.75,216H216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      const val = editor.getValue();
      if (!val || val.trim() === "") {
        return;
      }
      openModal({
        title: "",
        body: "Clear all?",
        className: "traven-modal-confirm",
        triggerElement: buttonEl,
        buttons: [
          {
            text: "Cancel",
            type: "secondary",
            onClick: (e, overlay) => {
              overlay.querySelector(".traven-modal-close").click();
            }
          },
          {
            text: "CONFIRM",
            type: "primary",
            onClick: (e, overlay) => {
              editor.clear();
              overlay.querySelector(".traven-modal-close").click();
            }
          }
        ]
      });
    }
  },
  uppercase: {
    key: "uppercase",
    title: "Uppercase Selection",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="none"/>
      <path d="M32 200L72 56l40 144M144 200l40-144 40 144M48 144h48M160 144h48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    </svg>`,
    action: (editor) => editor.toUpperCase()
  },
  lowercase: {
    key: "lowercase",
    title: "Lowercase Selection",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="none"/>
      <circle cx="72" cy="160" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="112" y1="120" x2="112" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="184" cy="160" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="224" y1="120" x2="224" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    </svg>`,
    action: (editor) => editor.toLowerCase()
  },
  capitalize: {
    key: "capitalize",
    title: "Capitalize Words",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="none"/>
      <path d="M32 200L72 56l40 144M48 144h48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <circle cx="184" cy="160" r="40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
      <line x1="224" y1="120" x2="224" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    </svg>`,
    action: (editor) => editor.capitalizeWords()
  },
  removeformatting: {
    key: "removeformatting",
    title: "Remove Formatting",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="48" y1="40" x2="208" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="96" y1="200" x2="160" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="128" x2="128" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="56" x2="128" y2="80.43" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="105.79 56 200 56 200 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="56 88 56 56 62.55 56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => editor.removeFormatting()
  },
  gotoline: {
    key: "gotoline",
    title: "Go to Line",
    shortcut: "Ctrl+G",
    keybinding: "Mod-g",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="128" y1="32" x2="128" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="72 104 128 160 184 104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="40" y1="208" x2="216" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor) => {
      const lineStr = prompt("Enter line number:");
      if (lineStr) {
        const lineNum = parseInt(lineStr, 10);
        if (!isNaN(lineNum)) {
          editor.goToLine(lineNum);
        }
      }
    }
  },
  heading: {
    key: "heading",
    title: "Heading",
    type: "dropdown",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="56" y1="56" x2="56" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="200" y1="128" x2="56" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="200" y1="56" x2="200" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    children: [
      {
        level: 1,
        title: "Heading 1",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="224 208 224 112 200 128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor) => editor.setHeading(1)
      },
      {
        level: 2,
        title: "Heading 2",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M240,208H192l43.17-57.56A24,24,0,1,0,193.37,128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor) => editor.setHeading(2)
      },
      {
        level: 3,
        title: "Heading 3",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M192,112h48l-28,40a28,28,0,1,1-20,47.6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor) => editor.setHeading(3)
      },
      {
        level: 4,
        title: "Heading 4",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="248 184 176 184 232 112 232 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor) => editor.setHeading(4)
      },
      {
        level: 5,
        title: "Heading 5",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M240,112H200l-8,48a27.57,27.57,0,0,1,20-8,28,28,0,0,1,0,56,27.57,27.57,0,0,1-20-8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor) => editor.setHeading(5)
      },
      {
        level: 6,
        title: "Heading 6",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="212" cy="180" r="28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="187.75" y1="166" x2="220" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
        action: (editor) => editor.setHeading(6)
      }
    ]
  },
  image: {
    key: "image",
    title: "Insert Image",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="96" cy="96" r="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M56.69,216,166.34,106.34a8,8,0,0,1,11.32,0L216,144.69" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openImageModal(editor, buttonEl);
    }
  },
  video: {
    key: "video",
    title: "Insert Video",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polygon points="160 128 112 96 112 160 160 128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M24,128c0,29.91,3.07,47.45,5.41,56.47A16,16,0,0,0,39,195.42C72.52,208.35,128,208,128,208s55.48.35,89-12.58a16,16,0,0,0,9.63-10.95c2.34-9,5.41-26.56,5.41-56.47s-3.07-47.45-5.41-56.47a16,16,0,0,0-9.63-11C183.48,47.65,128,48,128,48s-55.48-.35-89,12.58a16,16,0,0,0-9.63,11C27.07,80.54,24,98.09,24,128Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openVideoModal(editor, buttonEl);
    }
  },
  audio: {
    key: "audio",
    title: "Insert Audio",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="48" y1="96" x2="48" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="32" x2="88" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="64" x2="128" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="168" y1="96" x2="168" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="208" y1="80" x2="208" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openAudioModal(editor, buttonEl);
    }
  },
  figure: {
    key: "figure",
    title: "Insert Figure",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="160 80 192 80 192 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="96 176 64 176 64 144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openFigureModal(editor, buttonEl);
    }
  },
  link: {
    key: "link",
    title: "Link",
    shortcut: "Ctrl+K",
    keybinding: "Mod-k",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="96" y1="160" x2="160" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M112,76.11l30.06-30a48,48,0,0,1,67.88,67.88L179.88,144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M76.11,112l-30,30.06a48,48,0,0,0,67.88,67.88L144,179.88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openLinkModal(editor, buttonEl);
    }
  },
  help: {
    key: "help",
    title: "Help",
    shortcut: "Ctrl+/",
    keybinding: "Mod-/",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="128" cy="180" r="12"/><path d="M128,144v-8a28,28,0,1,0-28-28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openHelpModal(editor, buttonEl);
    }
  },
  component: {
    key: "component",
    title: "Insert Component",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="112" y1="48" x2="112" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M144,72h88a8,8,0,0,1,8,8v96a8,8,0,0,1-8,8H144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M112,184H24a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8h88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="48" y1="112" x2="80" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="64" y1="112" x2="64" y2="144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`,
    action: (editor, buttonEl) => {
      openComponentModal(editor, buttonEl);
    }
  },
  "bubble-insert": {
    key: "bubble-insert",
    title: "Insert block below",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="92" cy="60" r="12" fill="currentColor"/><circle cx="164" cy="60" r="12" fill="currentColor"/><circle cx="92" cy="128" r="12" fill="currentColor"/><circle cx="164" cy="128" r="12" fill="currentColor"/><circle cx="92" cy="196" r="12" fill="currentColor"/><circle cx="164" cy="196" r="12" fill="currentColor"/></svg>`,
    action: () => {}
  }
};
