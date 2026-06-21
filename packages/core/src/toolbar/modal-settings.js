// @ts-check
import { openModal } from "./modal-base.js";
import {
  TOOL_CATEGORIES, LOCKED_TOOLS,
  loadToolbarConfig, saveToolbarConfig, clearToolbarConfig
} from "./toolbar-config.js";

/**
 * Opens the Toolbar Settings modal.
 *
 * @param {import("../index.js").TravenEditor} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 * @param {Object} opts
 * @param {Object} opts.toolRegistry - The TOOL_REGISTRY object (passed to break circular import).
 * @param {string[]} opts.integratorToolbar - The integrator's original toolbar array.
 * @param {string} [opts.scope] - localStorage scope key.
 */
export function openSettingsModal(editor, triggerBtn, { toolRegistry, integratorToolbar, scope }) {
  // Determine initially checked items. If no saved config, check which items are actually visible in the DOM.
  const savedConfig = loadToolbarConfig(scope);
  let initiallyChecked;
  if (savedConfig) {
    initiallyChecked = new Set(savedConfig);
  } else {
    initiallyChecked = new Set();
    const toolbarEl = triggerBtn ? triggerBtn.closest(".traven-toolbar-container") : null;
    if (toolbarEl) {
      const wasExpanded = toolbarEl.classList.contains("is-expanded");
      if (!wasExpanded) toolbarEl.classList.add("is-expanded");
      
      integratorToolbar.forEach(key => {
        if (key === "|") return;
        const btn = toolbarEl.querySelector(`.btn-${key}`);
        if (btn && window.getComputedStyle(btn).display !== "none") {
          initiallyChecked.add(key);
        }
      });
      
      if (!wasExpanded) toolbarEl.classList.remove("is-expanded");
    } else {
      initiallyChecked = new Set(integratorToolbar.filter(k => k !== "|"));
    }
  }
  
  // Track state of checkboxes
  const checkboxState = new Map();



  const helpContainer = document.createElement("div");
  helpContainer.className = "help-container";

  // Build tabs navigation
  const tabsNav = document.createElement("div");
  tabsNav.className = "help-tabs";
  tabsNav.setAttribute("role", "tablist");
  
  const tabsContent = document.createElement("div");
  tabsContent.className = "help-tabs-content";

  let firstValidTab = true;

  for (const [categoryName, toolKeys] of Object.entries(TOOL_CATEGORIES)) {
    // Only include tools that are actually present in the integrator's toolbar
    const availableTools = toolKeys.filter(key => integratorToolbar.includes(key));
    if (availableTools.length === 0) continue; // Skip empty tabs

    // Create Tab Button
    const tabBtn = document.createElement("button");
    tabBtn.className = "help-tab-btn";
    tabBtn.textContent = categoryName;
    tabBtn.setAttribute("role", "tab");
    tabBtn.setAttribute("aria-selected", firstValidTab ? "true" : "false");
    if (firstValidTab) tabBtn.classList.add("active");
    tabsNav.appendChild(tabBtn);

    // Create Tab Content
    const tabPane = document.createElement("div");
    tabPane.className = "help-tab-content";
    tabPane.setAttribute("role", "tabpanel");
    if (firstValidTab) tabPane.classList.add("active");

    // Grid for settings items
    const settingsGrid = document.createElement("div");
    settingsGrid.className = "settings-grid";

    availableTools.forEach(toolKey => {
      const toolDef = toolRegistry[toolKey];
      if (!toolDef) return;

      const isLocked = LOCKED_TOOLS.includes(toolKey);
      
      const label = document.createElement("label");
      label.className = "settings-tool-toggle";
      if (isLocked) label.classList.add("is-locked");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = initiallyChecked.has(toolKey) || isLocked;
      checkbox.disabled = isLocked;
      
      // Store state
      checkboxState.set(toolKey, checkbox);

      const iconSpan = document.createElement("span");
      iconSpan.innerHTML = toolDef.icon;

      const textSpan = document.createElement("span");
      // Strip out shortcut text from title if present
      textSpan.textContent = toolDef.title.replace(/\s*\(.*\)$/, "");

      label.appendChild(checkbox);
      label.appendChild(iconSpan);
      label.appendChild(textSpan);
      settingsGrid.appendChild(label);
    });

    tabPane.appendChild(settingsGrid);
    tabsContent.appendChild(tabPane);

    // Tab switching logic
    tabBtn.addEventListener("click", () => {
      tabsNav.querySelectorAll(".help-tab-btn").forEach(btn => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
      });
      tabsContent.querySelectorAll(".help-tab-content").forEach(pane => {
        pane.classList.remove("active");
      });
      tabBtn.classList.add("active");
      tabBtn.setAttribute("aria-selected", "true");
      tabPane.classList.add("active");
    });

    firstValidTab = false;
  }

  helpContainer.appendChild(tabsNav);
  helpContainer.appendChild(tabsContent);

  openModal({
    title: "Toolbar Settings",
    body: helpContainer,
    className: "traven-modal-settings",
    triggerElement: triggerBtn,
    buttons: [
      {
        text: "Reset to Default",
        className: "btn-secondary",
        onClick: (e) => {
          e.preventDefault();
          // Re-check all checkboxes to match integratorToolbar
          const defaultSet = new Set(integratorToolbar.filter(k => k !== "|"));
          checkboxState.forEach((checkbox, key) => {
            checkbox.checked = defaultSet.has(key) || LOCKED_TOOLS.includes(key);
          });
        }
      },
      {
        text: "Save & Apply",
        className: "btn-primary",
        onClick: (e, overlay) => {
          const enabledKeys = [];
          checkboxState.forEach((checkbox, key) => {
            if (checkbox.checked) enabledKeys.push(key);
          });
          
          saveToolbarConfig(enabledKeys, scope);
          editor.rebuildToolbar();
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}
