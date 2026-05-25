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
 * Builds the toolbar DOM container and elements based on the provided configuration.
 * Binds DOM action triggers back to the editor instance.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {Array<string>} config - Ordered list of tool keys and separator tokens.
 * @param {Object} [keybindings={}] - Custom keyboard shortcut mappings.
 * @returns {HTMLElement} The toolbar container DOM element.
 */
export function buildToolbar(editor, config, keybindings = {}) {
  const container = document.createElement("div");
  container.className = "traven-toolbar-container";
  container.setAttribute("role", "toolbar");
  container.setAttribute("aria-label", "Editor formatting toolbar");

  config.forEach((key) => {
    if (key === "|") {
      const separator = document.createElement("div");
      separator.className = "toolbar-separator";
      separator.setAttribute("aria-hidden", "true");
      container.appendChild(separator);
      return;
    }

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
            const items = Array.from(menu.querySelectorAll(".toolbar-dropdown-item"));
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

          const items = Array.from(menu.querySelectorAll(".toolbar-dropdown-item"));
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

      // Handle clicking outside to close
      document.addEventListener("click", (e) => {
        if (!dropdownWrapper.contains(e.target)) {
          dropdownWrapper.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });

      dropdownWrapper.appendChild(trigger);
      dropdownWrapper.appendChild(menu);
      container.appendChild(dropdownWrapper);
    } else {
      // Standard button
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

      container.appendChild(button);
    }
  });

  // Setup Roving Tabindex for all main toolbar items
  const mainItems = Array.from(container.querySelectorAll("button.toolbar-btn"));
  mainItems.forEach((item, index) => {
    item.setAttribute("tabindex", index === 0 ? "0" : "-1");
  });

  // Container keydown listener for navigating main toolbar items
  container.addEventListener("keydown", (e) => {
    // Ignore keydown if target is inside a dropdown menu
    if (e.target.classList.contains("toolbar-dropdown-item")) {
      return;
    }

    // Ignore keydown if target is an open dropdown trigger and pressing ArrowDown/ArrowUp
    if (e.target.classList.contains("toolbar-btn") && e.target.getAttribute("aria-haspopup") === "true") {
      const dropdown = e.target.closest(".toolbar-dropdown");
      if (dropdown && dropdown.classList.contains("is-open") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        return;
      }
    }

    const items = Array.from(container.querySelectorAll("button.toolbar-btn"));
    const currentIndex = items.indexOf(document.activeElement);
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

  function updateFocus(fromIdx, toIdx, items) {
    items[fromIdx].setAttribute("tabindex", "-1");
    items[toIdx].setAttribute("tabindex", "0");
    items[toIdx].focus();
  }

  return container;
}
