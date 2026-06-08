// @ts-check
import { TOOL_REGISTRY } from "./tools.js";
import { RAIL_ACTIONS } from "./actions.js";

/**
 * Formats a CodeMirror-style keybinding string (e.g. "Mod-Shift-s") into a user-friendly display name (e.g. "Ctrl+Shift+S").
 * @param {string} bindingStr
 * @returns {string}
 */
function formatShortcutForDisplay(bindingStr) {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modName = isMac ? "Cmd" : "Ctrl";
  
  return bindingStr
    .split("-")
    .map(part => {
      if (part === "Mod") return modName;
      if (part === "Shift") return "Shift";
      if (part === "Alt") return "Alt";
      if (part.length === 1) return part.toUpperCase();
      return part;
    })
    .join("+");
}

/**
 * Returns the rail element. Used only in "floating" mode.
 *
 * @param {import("../index.js").TravenEditor} editor
 * @param {Object.<string, string>} [keybindings]
 * @returns {HTMLElement}
 */
export function buildSlimRail(editor, keybindings = {}) {
  const container = document.createElement("div");
  container.className = "traven-slim-rail";
  container.setAttribute("role", "toolbar");
  container.setAttribute("aria-label", "Editor global actions");

  for (const key of RAIL_ACTIONS) {
    const tool = TOOL_REGISTRY[key];
    if (!tool) continue;
    
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `traven-rail-btn btn-${key}`;
    
    // Resolve keybinding shortcut for tooltip display
    const customBinding = keybindings[key];
    const bindingStr = customBinding !== undefined ? customBinding : tool.keybinding;
    const displayShortcut = bindingStr ? formatShortcutForDisplay(bindingStr) : (tool.shortcut || "");
    const titleText = displayShortcut ? `${tool.title} (${displayShortcut})` : tool.title;
    
    btn.setAttribute("title", titleText);
    btn.setAttribute("aria-label", tool.title);
    btn.innerHTML = tool.icon;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      tool.action(editor, btn);
    });
    container.appendChild(btn);
  }

  const statsEl = buildStatsWidget(editor);
  container.appendChild(statsEl);

  // Setup roving tabindex
  const mainItems = Array.from(container.querySelectorAll("button.traven-rail-btn"));
  mainItems.forEach((item) => {
    item.setAttribute("tabindex", "0");
  });

  container.addEventListener("focusin", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target && target.classList.contains("traven-rail-btn")) {
      const items = Array.from(container.querySelectorAll("button.traven-rail-btn"));
      items.forEach((item) => {
        item.setAttribute("tabindex", item === target ? "0" : "-1");
      });
    }
  });

  container.addEventListener("keydown", (e) => {
    const items = Array.from(container.querySelectorAll("button.traven-rail-btn"));
    const currentIndex = items.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
    if (currentIndex === -1) return;

    let nextIndex;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        updateFocus(currentIndex, nextIndex, items);
        break;
      case "ArrowLeft":
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        updateFocus(currentIndex, nextIndex, items);
        break;
      case "Home":
        e.preventDefault();
        updateFocus(currentIndex, 0, items);
        break;
      case "End":
        e.preventDefault();
        updateFocus(currentIndex, items.length - 1, items);
        break;
    }
  });

  /**
   * @param {number} fromIdx
   * @param {number} toIdx
   * @param {Element[]} items
   */
  function updateFocus(fromIdx, toIdx, items) {
    items[fromIdx].setAttribute("tabindex", "-1");
    items[toIdx].setAttribute("tabindex", "0");
    /** @type {HTMLElement} */ (items[toIdx]).focus();
  }

  return container;
}

/**
 * Builds a stats display element and registers an editor listener
 * to keep word/character/reading time counts updated.
 *
 * @param {import("../index.js").TravenEditor} editor
 * @returns {HTMLElement}
 */
export function buildStatsWidget(editor) {
  const el = document.createElement("div");
  el.className = "traven-toolbar-stats";
  
  /**
   * @param {{ words: number, characters: number, readTime: number } | any} stats
   */
  const update = (stats) => {
    const words = stats?.words || 0;
    const chars = stats?.characters || 0;
    const readTime = stats?.readTime || 0;
    el.textContent = `${words} word${words === 1 ? "" : "s"} | ${chars} char${chars === 1 ? "" : "s"} | ${readTime} min read`;
  };
  
  // Set initial state
  update({
    words: editor.getWordCount ? editor.getWordCount() : 0,
    characters: editor.getCharacterCount ? editor.getCharacterCount() : 0,
    readTime: editor.getReadTime ? editor.getReadTime() : 0,
  });
  
  editor.on("statsUpdate", update);
  
  return el;
}
