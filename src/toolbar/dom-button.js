// @ts-check
import { TOOL_REGISTRY } from "./tools.js";

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
 * Appends a button (or dropdown trigger) for `key` into `parent`. Used by
 * the static rail, the bubble, and the gutter popover.
 *
 * @param {DocumentFragment | HTMLElement} parent
 * @param {string} key
 * @param {import("../index.js").TravenEditor} editor
 * @param {Object.<string, string>} [keybindings]
 */
export function buildToolButton(parent, key, editor, keybindings = {}) {
  const tool = TOOL_REGISTRY[key];
  if (!tool) {
    console.warn(`TravenEditor: Tool "${key}" is not registered.`);
    return;
  }

  // Resolve keybinding shortcut for tooltip display
  const customBinding = keybindings[key];
  const bindingStr = customBinding !== undefined ? customBinding : tool.keybinding;
  const displayShortcut = bindingStr ? formatShortcutForDisplay(bindingStr) : (tool.shortcut || "");

  if (tool.type === "dropdown") {
    buildDropdown(parent, key, tool, editor, displayShortcut);
  } else {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `toolbar-btn btn-${key}`;
    
    const titleText = displayShortcut ? `${tool.title} (${displayShortcut})` : tool.title;
    button.setAttribute("title", titleText);
    button.setAttribute("aria-label", tool.title);
    button.innerHTML = tool.icon;

    button.addEventListener("click", (e) => {
      e.preventDefault();
      tool.action(editor, button);
    });

    parent.appendChild(button);
  }
}

/**
 * Builds and appends a dropdown to parent.
 *
 * @param {DocumentFragment | HTMLElement} parent
 * @param {string} key
 * @param {any} tool
 * @param {import("../index.js").TravenEditor} editor
 * @param {string} displayShortcut
 */
function buildDropdown(parent, key, tool, editor, displayShortcut) {
  const dropdownWrapper = document.createElement("div");
  dropdownWrapper.className = "toolbar-dropdown";
  dropdownWrapper.id = `traven-${key}-dropdown`;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = `toolbar-btn btn-${key}`;
  
  const titleText = displayShortcut ? `${tool.title} (${displayShortcut})` : tool.title;
  trigger.setAttribute("title", titleText);
  trigger.setAttribute("aria-label", tool.title);
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");

  trigger.innerHTML = `
    ${tool.icon}
    <svg class="dropdown-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="8" height="8">
      <polyline points="80 96 128 144 176 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>
    </svg>
  `;

  const menu = document.createElement("div");
  menu.className = "toolbar-dropdown-menu";
  menu.setAttribute("role", "menu");

  if (tool.children) {
    tool.children.forEach((child) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "toolbar-dropdown-item";
      item.setAttribute("role", "menuitem");
      item.setAttribute("title", child.title);
      item.setAttribute("aria-label", child.title);
      item.setAttribute("tabindex", "-1");
      item.innerHTML = child.icon;

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        child.action(editor, item);
        dropdownWrapper.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      });

      // Keyboard navigation inside dropdown menu
      item.addEventListener("keydown", (e) => {
        const items = /** @type {HTMLElement[]} */ (Array.from(menu.querySelectorAll(".toolbar-dropdown-item")));
        const currentIndex = items.indexOf(item);

        if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          items[nextIndex].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (currentIndex === 0) {
            trigger.focus();
          } else {
            items[currentIndex - 1].focus();
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          dropdownWrapper.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
          trigger.focus();
        } else if (e.key === "Tab") {
          dropdownWrapper.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });

      menu.appendChild(item);
    });
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdownWrapper.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");

    // Close any other open dropdowns
    document.querySelectorAll(".toolbar-dropdown.is-open").forEach((other) => {
      if (other !== dropdownWrapper) {
        other.classList.remove("is-open");
        const otherTrigger = other.querySelector(".toolbar-btn");
        if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Keyboard navigation on dropdown trigger
  trigger.addEventListener("keydown", (e) => {
    const isOpen = dropdownWrapper.classList.contains("is-open");
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      if (!isOpen) {
        e.preventDefault();
        dropdownWrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");

        // Close other dropdowns
        document.querySelectorAll(".toolbar-dropdown.is-open").forEach((other) => {
          if (other !== dropdownWrapper) {
            other.classList.remove("is-open");
            const otherTrigger = other.querySelector(".toolbar-btn");
            if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
          }
        });
      }

      const items = /** @type {HTMLElement[]} */ (Array.from(menu.querySelectorAll(".toolbar-dropdown-item")));
      if (items.length > 0) {
        e.preventDefault();
        const targetItem = e.key === "ArrowUp" ? items[items.length - 1] : items[0];
        targetItem.focus();
      }
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      dropdownWrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    }
  });

  // Handle clicking outside to close (preserved document-level click listener per dropdown wrapper)
  document.addEventListener("click", (e) => {
    if (!dropdownWrapper.contains(/** @type {Node} */ (e.target))) {
      dropdownWrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  dropdownWrapper.appendChild(trigger);
  dropdownWrapper.appendChild(menu);
  parent.appendChild(dropdownWrapper);
}
