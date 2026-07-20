// @ts-check
import { openModal } from "./modal-base.js";

/**
 * @typedef {Object} LinkSuggestion
 * @property {string} title
 * @property {string} url
 * @property {string} [slug]
 */

/**
 * Renders the Link Insertion Modal dialog.
 * When the host provides onSuggestLinks, typing in the URL field shows
 * a debounced suggestion list (title + url/slug). Without a handler,
 * behavior matches the classic text + URL form.
 *
 * @param {Object} editor - The TravenEditor instance.
 * @param {HTMLElement} triggerBtn - The button that triggered the modal.
 */
export function openLinkModal(editor, triggerBtn) {
  const suggestHandler =
    typeof editor.getSuggestLinks === "function" ? editor.getSuggestLinks() : null;

  const form = document.createElement("div");

  const textField = document.createElement("div");
  textField.className = "traven-modal-field";
  textField.innerHTML = `
    <label class="traven-modal-label" for="traven-link-text">Link Text</label>
    <input type="text" id="traven-link-text" class="traven-modal-input" placeholder="e.g. Google Search" value="" autocomplete="off" />
  `;
  form.appendChild(textField);

  const urlField = document.createElement("div");
  urlField.className = "traven-modal-field";
  urlField.style.position = "relative";
  urlField.innerHTML = `
    <label class="traven-modal-label" for="traven-link-url">URL</label>
    <input type="text" id="traven-link-url" class="traven-modal-input" placeholder="e.g. https://google.com" value="" autocomplete="off" />
  `;
  form.appendChild(urlField);

  /** @type {HTMLInputElement} */
  const textInputEl = /** @type {HTMLInputElement} */ (form.querySelector("#traven-link-text"));
  /** @type {HTMLInputElement} */
  const urlInputEl = /** @type {HTMLInputElement} */ (form.querySelector("#traven-link-url"));

  // Pre-fill text with selection if any
  const view = editor.getView();
  const { from, to } = view.state.selection.main;
  const selectionText = from !== to ? view.state.sliceDoc(from, to) : "";
  if (selectionText) {
    textInputEl.value = selectionText;
  }

  let suggestList = null;
  let debounceTimer = null;
  let requestId = 0;
  let activeIndex = -1;
  /** @type {LinkSuggestion[]} */
  let currentSuggestions = [];
  /** @type {(() => void) | null} */
  let removePositionListeners = null;

  const clearPositionListeners = () => {
    if (removePositionListeners) {
      removePositionListeners();
      removePositionListeners = null;
    }
  };

  const positionSuggestList = () => {
    if (!suggestList) return;
    const rect = urlInputEl.getBoundingClientRect();
    suggestList.style.top = `${rect.bottom + 4}px`;
    suggestList.style.left = `${rect.left}px`;
    suggestList.style.width = `${rect.width}px`;
  };

  const hideSuggestions = () => {
    clearPositionListeners();
    if (suggestList) {
      suggestList.remove();
      suggestList = null;
    }
    activeIndex = -1;
    currentSuggestions = [];
    urlInputEl.setAttribute("aria-expanded", "false");
    urlInputEl.removeAttribute("aria-activedescendant");
    urlInputEl.removeAttribute("aria-controls");
  };

  const applySuggestion = (/** @type {LinkSuggestion} */ item) => {
    urlInputEl.value = item.url || "";
    if (!textInputEl.value.trim() && item.title) {
      textInputEl.value = item.title;
    }
    hideSuggestions();
    urlInputEl.focus();
  };

  const renderSuggestions = (/** @type {LinkSuggestion[]} */ items) => {
    hideSuggestions();
    currentSuggestions = Array.isArray(items) ? items.filter((i) => i && i.url) : [];
    if (currentSuggestions.length === 0) return;

    suggestList = document.createElement("ul");
    suggestList.className = "traven-link-suggest-list is-fixed";
    suggestList.setAttribute("role", "listbox");
    suggestList.id = "traven-link-suggest-list";

    currentSuggestions.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "traven-link-suggest-item";
      li.setAttribute("role", "option");
      li.setAttribute("id", `traven-link-suggest-${index}`);

      const titleEl = document.createElement("span");
      titleEl.className = "traven-link-suggest-title";
      titleEl.textContent = item.title || item.slug || item.url;

      const metaEl = document.createElement("span");
      metaEl.className = "traven-link-suggest-meta";
      metaEl.textContent = item.slug || item.url;

      li.appendChild(titleEl);
      li.appendChild(metaEl);

      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        applySuggestion(item);
      });

      suggestList.appendChild(li);
    });

    // Portal to body so overflow:hidden on .traven-modal cannot clip the list
    document.body.appendChild(suggestList);
    positionSuggestList();

    const onReposition = () => positionSuggestList();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    removePositionListeners = () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };

    urlInputEl.setAttribute("aria-expanded", "true");
    urlInputEl.setAttribute("aria-controls", "traven-link-suggest-list");
  };

  const setActiveIndex = (index) => {
    if (!suggestList) return;
    const items = suggestList.querySelectorAll(".traven-link-suggest-item");
    items.forEach((el) => el.classList.remove("is-active"));
    if (index < 0 || index >= items.length) {
      activeIndex = -1;
      urlInputEl.removeAttribute("aria-activedescendant");
      return;
    }
    activeIndex = index;
    items[index].classList.add("is-active");
    urlInputEl.setAttribute("aria-activedescendant", `traven-link-suggest-${index}`);
    items[index].scrollIntoView({ block: "nearest" });
  };

  if (suggestHandler) {
    urlInputEl.setAttribute("aria-autocomplete", "list");
    urlInputEl.setAttribute("aria-expanded", "false");
    urlInputEl.placeholder = "Type to search site pages, or paste a URL";

    const runSuggest = async (query) => {
      const id = ++requestId;
      try {
        const result = await suggestHandler(query);
        if (id !== requestId) return;
        renderSuggestions(Array.isArray(result) ? result : []);
      } catch (err) {
        if (id !== requestId) return;
        hideSuggestions();
        console.warn("onSuggestLinks failed:", err);
      }
    };

    urlInputEl.addEventListener("input", () => {
      const query = urlInputEl.value;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        runSuggest(query);
      }, 200);
    });

    urlInputEl.addEventListener("keydown", (e) => {
      if (!suggestList || currentSuggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(activeIndex < currentSuggestions.length - 1 ? activeIndex + 1 : 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(activeIndex <= 0 ? currentSuggestions.length - 1 : activeIndex - 1);
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        applySuggestion(currentSuggestions[activeIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        hideSuggestions();
      }
    });

    urlInputEl.addEventListener("blur", () => {
      // Delay so mousedown on a suggestion can fire first
      setTimeout(() => hideSuggestions(), 150);
    });
  }

  openModal({
    title: "Insert Link",
    body: form,
    triggerElement: triggerBtn,
    onClose: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      hideSuggestions();
      const view = editor.getView();
      if (view && typeof view.requestMeasure === "function") {
        view.requestMeasure();
      }
    },
    buttons: [
      {
        text: "Cancel",
        type: "secondary",
        onClick: (e, overlay) => {
          overlay.querySelector(".traven-modal-close").click();
        }
      },
      {
        text: "Insert",
        type: "primary",
        onClick: (e, overlay) => {
          const textInput = /** @type {HTMLInputElement} */ (overlay.querySelector("#traven-link-text"));
          const urlInput = /** @type {HTMLInputElement} */ (overlay.querySelector("#traven-link-url"));
          const text = textInput.value.trim() || "link";
          const url = urlInput.value.trim() || "#";

          editor.insertSnippet("[", `](${url})`, text);
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
}
