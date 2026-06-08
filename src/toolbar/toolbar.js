// @ts-check
import { TOOL_REGISTRY } from "./tools.js";
import { buildToolButton } from "./dom-button.js";

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
  const toolbarId = `traven-toolbar-${Math.random().toString(36).substring(2, 9)}`;
  container.id = toolbarId;

  config.forEach((key) => {
    if (key === "|") {
      const separator = document.createElement("div");
      separator.className = "toolbar-separator";
      separator.setAttribute("aria-hidden", "true");
      container.appendChild(separator);
      return;
    }

    buildToolButton(container, key, /** @type {any} */ (editor), keybindings);
  });

  // Append Expand/Collapse toggle button (with both compact/6-dots and expanded/3-dots icons)
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "toolbar-btn btn-expand-toggle";
  toggleBtn.setAttribute("title", "Toggle Expand Toolbar");
  toggleBtn.setAttribute("aria-label", "Toggle Expand Toolbar");
  toggleBtn.setAttribute("aria-controls", toolbarId);
  toggleBtn.innerHTML = `
    <svg class="icon-collapsed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="none"/>
      <circle cx="92" cy="60" r="16" fill="currentColor"/>
      <circle cx="164" cy="60" r="16" fill="currentColor"/>
      <circle cx="92" cy="128" r="16" fill="currentColor"/>
      <circle cx="164" cy="128" r="16" fill="currentColor"/>
      <circle cx="92" cy="196" r="16" fill="currentColor"/>
      <circle cx="164" cy="196" r="16" fill="currentColor"/>
    </svg>
    <svg class="icon-expanded" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="none"/>
      <circle cx="128" cy="60" r="16" fill="currentColor"/>
      <circle cx="128" cy="128" r="16" fill="currentColor"/>
      <circle cx="128" cy="196" r="16" fill="currentColor"/>
    </svg>
  `;

  // Restore toolbar expansion state from localStorage
  let isExpanded = false;
  try {
    isExpanded = localStorage.getItem("traven-toolbar-expanded") === "true";
  } catch (err) {
    console.warn("TravenEditor: Failed to read from localStorage", err);
  }
  if (isExpanded) {
    container.classList.add("is-expanded");
  }
  toggleBtn.setAttribute("aria-expanded", isExpanded ? "true" : "false");

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const currentlyExpanded = container.classList.toggle("is-expanded");
    toggleBtn.setAttribute("aria-expanded", currentlyExpanded ? "true" : "false");
    try {
      localStorage.setItem("traven-toolbar-expanded", currentlyExpanded ? "true" : "false");
    } catch (err) {
      console.warn("TravenEditor: Failed to write to localStorage", err);
    }

    // If collapsing and focus was on a button that gets hidden, focus the toggle button instead
    let newFocusEl = null;
    if (!currentlyExpanded) {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLElement && container.contains(activeEl) && activeEl !== toggleBtn && !isButtonVisible(activeEl)) {
        toggleBtn.focus();
        newFocusEl = toggleBtn;
      }
    }
    updateRovingTabindex(container, newFocusEl || document.activeElement);

    if (editor && typeof editor.getView === "function") {
      const view = editor.getView();
      if (view) {
        view.requestMeasure();
      }
    }
  });

  container.appendChild(toggleBtn);

  /**
   * Checks if a toolbar button is visible.
   * @param {HTMLElement} btn
   * @returns {boolean}
   */
  function isButtonVisible(btn) {
    // In a real browser, offsetParent is non-null for visible elements.
    // In headless/test environments (like JSDOM), offsetParent might be null for all elements,
    // so we fallback to checking if the computed style display is not 'none'.
    if (!btn.ownerDocument.body.contains(btn)) {
      return false; // Not in DOM yet
    }
    
    // If the browser supports offsetParent and at least one element has a non-null offsetParent,
    // we can trust offsetParent. Otherwise, we fallback to computed style.
    const hasLayout = /** @type {HTMLElement[]} */ (Array.from(container.querySelectorAll(".toolbar-btn"))).some(el => el.offsetParent !== null);
    if (hasLayout) {
      return btn.offsetParent !== null;
    }
    
    return window.getComputedStyle(btn).display !== 'none';
  }

  /**
   * Updates roving tabindex. Sets target element (or first visible button) to 0, rest to -1.
   * @param {HTMLElement} container
   * @param {Element|null} [activeEl]
   */
  function updateRovingTabindex(container, activeEl = null) {
    const items = Array.from(container.querySelectorAll("button.toolbar-btn"));
    const visibleItems = items.filter(isButtonVisible);
    
    let targetEl = activeEl;
    if (!targetEl || !visibleItems.includes(/** @type {any} */ (targetEl))) {
      targetEl = visibleItems[0] || items[0] || null;
    }

    items.forEach((item) => {
      item.setAttribute("tabindex", item === targetEl ? "0" : "-1");
    });
  }

  // Setup initial roving tabindex
  updateRovingTabindex(container);

  // Dynamically manage tabindex of all buttons upon focus
  container.addEventListener("focusin", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target && target.classList && target.classList.contains("toolbar-btn")) {
      updateRovingTabindex(container, target);
    }
  });

  // Container keydown listener for navigating main toolbar items
  container.addEventListener("keydown", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (!target) return;

    // Ignore keydown if target is inside a dropdown menu
    if (target.classList && target.classList.contains("toolbar-dropdown-item")) {
      return;
    }

    // Ignore keydown if target is an open dropdown trigger and pressing ArrowDown/ArrowUp
    if (target.classList && target.classList.contains("toolbar-btn") && target.getAttribute("aria-haspopup") === "true") {
      const dropdown = target.closest(".toolbar-dropdown");
      if (dropdown && dropdown.classList.contains("is-open") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        return;
      }
    }

    // Filter to only visible buttons
    const items = Array.from(container.querySelectorAll("button.toolbar-btn")).filter(isButtonVisible);
    const currentIndex = items.indexOf(/** @type {any} */ (document.activeElement));
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
