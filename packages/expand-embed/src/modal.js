// @ts-check
import { openModal } from "@freedomware/traven";
import { buildExpandEmbedShortcode } from "./shortcode-build.js";

export { buildExpandEmbedShortcode } from "./shortcode-build.js";

/**
 * Attach debounced typeahead under an input using editor.getSuggestLinks().
 * Picking a row fills the slug field (and optional title readout).
 *
 * @param {Object} editor
 * @param {HTMLInputElement} slugInput
 * @param {HTMLElement} fieldWrap - positioned parent for the suggestion list
 * @param {{ onPick?: (item: { title: string, url: string, slug?: string }) => void, onSlugChange?: (slug: string) => void }} [opts]
 * @returns {{ destroy: () => void }}
 */
function attachSlugTypeahead(editor, slugInput, fieldWrap, opts = {}) {
  const suggestHandler =
    typeof editor.getSuggestLinks === "function" ? editor.getSuggestLinks() : null;

  if (!suggestHandler) {
    // Still notify slug changes so heading picker can load when the host
    // provides onListHeadings but not onSuggestLinks.
    if (typeof opts.onSlugChange === "function") {
      let debounceTimer = null;
      const onInput = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(
          () => opts.onSlugChange(slugInput.value.trim()),
          200,
        );
      };
      slugInput.addEventListener("input", onInput);
      return {
        destroy() {
          if (debounceTimer) clearTimeout(debounceTimer);
          slugInput.removeEventListener("input", onInput);
        },
      };
    }
    return { destroy() {} };
  }

  let suggestList = null;
  let debounceTimer = null;
  let requestId = 0;
  let activeIndex = -1;
  /** @type {Array<{ title: string, url: string, slug?: string }>} */
  let current = [];

  const hide = () => {
    if (suggestList) {
      suggestList.remove();
      suggestList = null;
    }
    activeIndex = -1;
    current = [];
    slugInput.setAttribute("aria-expanded", "false");
  };

  const apply = (item) => {
    const slug = item.slug || "";
    if (slug) slugInput.value = slug;
    if (typeof opts.onPick === "function") opts.onPick(item);
    if (typeof opts.onSlugChange === "function") opts.onSlugChange(slug);
    hide();
    slugInput.focus();
  };

  const render = (items) => {
    hide();
    current = Array.isArray(items)
      ? items.filter((i) => i && (i.slug || i.url))
      : [];
    if (current.length === 0) return;

    suggestList = document.createElement("ul");
    suggestList.className = "traven-link-suggest-list";
    suggestList.setAttribute("role", "listbox");
    suggestList.id = "traven-expand-suggest-list";

    current.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "traven-link-suggest-item";
      li.setAttribute("role", "option");
      li.id = `traven-expand-suggest-${index}`;

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
        apply(item);
      });
      suggestList.appendChild(li);
    });

    fieldWrap.appendChild(suggestList);
    slugInput.setAttribute("aria-expanded", "true");
    slugInput.setAttribute("aria-controls", "traven-expand-suggest-list");
  };

  const setActive = (index) => {
    if (!suggestList) return;
    const items = suggestList.querySelectorAll(".traven-link-suggest-item");
    items.forEach((el) => el.classList.remove("is-active"));
    if (index < 0 || index >= items.length) {
      activeIndex = -1;
      slugInput.removeAttribute("aria-activedescendant");
      return;
    }
    activeIndex = index;
    items[index].classList.add("is-active");
    slugInput.setAttribute("aria-activedescendant", `traven-expand-suggest-${index}`);
    items[index].scrollIntoView({ block: "nearest" });
  };

  slugInput.setAttribute("aria-autocomplete", "list");
  slugInput.setAttribute("aria-expanded", "false");
  slugInput.placeholder = "Type a title or slug…";

  const run = async (query) => {
    const id = ++requestId;
    try {
      const result = await suggestHandler(query);
      if (id !== requestId) return;
      render(Array.isArray(result) ? result : []);
    } catch (err) {
      if (id !== requestId) return;
      hide();
      console.warn("onSuggestLinks failed:", err);
    }
  };

  const onInput = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      run(slugInput.value);
      if (typeof opts.onSlugChange === "function") {
        opts.onSlugChange(slugInput.value.trim());
      }
    }, 200);
  };

  const onKeyDown = (e) => {
    if (!suggestList || current.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIndex < current.length - 1 ? activeIndex + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex <= 0 ? current.length - 1 : activeIndex - 1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      apply(current[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    }
  };

  const onBlur = () => setTimeout(() => hide(), 150);

  slugInput.addEventListener("input", onInput);
  slugInput.addEventListener("keydown", onKeyDown);
  slugInput.addEventListener("blur", onBlur);

  return {
    destroy() {
      if (debounceTimer) clearTimeout(debounceTimer);
      slugInput.removeEventListener("input", onInput);
      slugInput.removeEventListener("keydown", onKeyDown);
      slugInput.removeEventListener("blur", onBlur);
      hide();
    },
  };
}

/**
 * Sentinel select value for source="deck" (Summary).
 * Must not collide with real heading titles.
 */
export const EXPAND_TARGET_DECK = "__deck__";

/**
 * Reset a target <select> to the Whole-post option only.
 * @param {HTMLSelectElement} select
 * @param {boolean} [disabled]
 */
function resetTargetSelect(select, disabled = true) {
  select.innerHTML = "";
  const whole = document.createElement("option");
  whole.value = "";
  whole.textContent = "Whole post";
  select.appendChild(whole);
  select.value = "";
  select.disabled = disabled;
}

/**
 * Populate target select: Whole post | optional Summary (deck) | section headings.
 * @param {HTMLSelectElement} select
 * @param {{ deck?: string|null, headings?: Array<{ title?: string, level?: number }> }} targets
 * @param {string} [preserveValue]
 * @param {boolean} [includeDeck]
 */
function fillTargetSelect(select, targets, preserveValue = "", includeDeck = false) {
  resetTargetSelect(select, false);
  const seen = new Set([""]);
  const deck = includeDeck ? String(targets?.deck || "").trim() : "";
  if (deck) {
    const opt = document.createElement("option");
    opt.value = EXPAND_TARGET_DECK;
    opt.textContent = "Summary";
    select.appendChild(opt);
    seen.add(EXPAND_TARGET_DECK);
  }
  for (const item of targets?.headings || []) {
    const title = String(item?.title || "").trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);
    const opt = document.createElement("option");
    opt.value = title;
    const level = item.level ? Number(item.level) : 0;
    opt.textContent = level > 0 ? `${"\u00A0".repeat((level - 1) * 2)}${title}` : title;
    select.appendChild(opt);
  }
  if (preserveValue && seen.has(preserveValue)) {
    select.value = preserveValue;
  } else {
    select.value = "";
  }
}

/**
 * Populate heading-only select (onListHeadings fallback); preserve prior value if still present.
 * @param {HTMLSelectElement} select
 * @param {Array<{ title?: string, level?: number }>} headings
 * @param {string} [preserveValue]
 */
function fillHeadingSelect(select, headings, preserveValue = "") {
  fillTargetSelect(select, { headings }, preserveValue, false);
}

/**
 * Map select value → { heading, source } for shortcode-build.
 * @param {string} value
 * @returns {{ heading: string|null, source: string|null }}
 */
function targetValueToAttrs(value) {
  const v = String(value || "").trim();
  if (!v) return { heading: null, source: null };
  if (v === EXPAND_TARGET_DECK) return { heading: null, source: "deck" };
  return { heading: v, source: null };
}

/**
 * Open Insert Expand or Insert Embed modal.
 *
 * @param {Object} editor
 * @param {HTMLElement|null} triggerBtn
 * @param {'expand'|'embed'} mode
 */
export function openExpandEmbedModal(editor, triggerBtn, mode = "expand") {
  const isEmbed = mode === "embed";
  const form = document.createElement("div");

  const textField = document.createElement("div");
  textField.className = "traven-modal-field";
  textField.innerHTML = `
    <label class="traven-modal-label" for="traven-expand-text">Link Text</label>
    <input type="text" id="traven-expand-text" class="traven-modal-input" placeholder="Visible link label" value="" autocomplete="off" />
  `;
  form.appendChild(textField);

  const slugField = document.createElement("div");
  slugField.className = "traven-modal-field";
  slugField.style.position = "relative";
  slugField.innerHTML = `
    <label class="traven-modal-label" for="traven-expand-slug">Post / page</label>
    <input type="text" id="traven-expand-slug" class="traven-modal-input" placeholder="slug" value="" autocomplete="off" />
  `;
  form.appendChild(slugField);

  const listExpandTargetsHandler =
    typeof editor.getListExpandTargets === "function"
      ? editor.getListExpandTargets()
      : null;
  const listHeadingsHandler =
    typeof editor.getListHeadings === "function" ? editor.getListHeadings() : null;
  const useExpandTargets = typeof listExpandTargetsHandler === "function";
  const useHeadingSelect =
    useExpandTargets || typeof listHeadingsHandler === "function";
  const targetLabel = useExpandTargets ? "Target" : "Heading (optional)";

  const headingField = document.createElement("div");
  headingField.className = "traven-modal-field";
  if (useHeadingSelect) {
    headingField.innerHTML = `
      <label class="traven-modal-label" for="traven-expand-heading">${targetLabel}</label>
      <select id="traven-expand-heading" class="traven-modal-input" disabled>
        <option value="">Whole post</option>
      </select>
    `;
  } else {
    headingField.innerHTML = `
      <label class="traven-modal-label" for="traven-expand-heading">Heading (optional)</label>
      <input type="text" id="traven-expand-heading" class="traven-modal-input" placeholder="Section heading — leave blank for whole post" value="" autocomplete="off" />
    `;
  }
  form.appendChild(headingField);

  const hint = document.createElement("p");
  hint.className = "traven-expand-modal-hint";
  hint.style.margin = "0";
  hint.style.fontSize = "0.8em";
  hint.style.color = "var(--text-secondary, #64748b)";
  if (useExpandTargets) {
    hint.textContent = isEmbed
      ? "Embed always shows the target in place. Target: whole post, Summary (deck), or a section. Link Text labels the editor chip."
      : "Expand stays collapsed until the reader opens it (Nutshell-style). Target: whole post, Summary (deck), or a section. Link Text is the clickable label.";
  } else {
    hint.textContent = isEmbed
      ? "Embed always shows the target content in place. Heading selects a section; Link Text labels the editor chip."
      : "Expand stays collapsed until the reader opens it (Nutshell-style). Heading selects a section; Link Text is the clickable label.";
  }
  form.appendChild(hint);

  /** @type {HTMLInputElement} */
  const textInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-expand-text"));
  /** @type {HTMLInputElement} */
  const slugInput = /** @type {HTMLInputElement} */ (form.querySelector("#traven-expand-slug"));
  /** @type {HTMLInputElement|HTMLSelectElement} */
  const headingControl = /** @type {HTMLInputElement|HTMLSelectElement} */ (
    form.querySelector("#traven-expand-heading")
  );

  // Pre-fill Link Text from selection (same pattern as Insert Link).
  const view = typeof editor.getView === "function" ? editor.getView() : null;
  if (view && view.state && view.state.selection) {
    const { from, to } = view.state.selection.main;
    const selectionText = from !== to ? view.state.sliceDoc(from, to) : "";
    if (selectionText) {
      textInput.value = selectionText;
    }
  }

  let targetRequestId = 0;
  const refreshTargets = async (slug) => {
    if (!useHeadingSelect) return;
    const select = /** @type {HTMLSelectElement} */ (headingControl);
    const s = String(slug || "").trim();
    if (!s) {
      resetTargetSelect(select, true);
      return;
    }
    const preserve = select.value;
    const id = ++targetRequestId;
    select.disabled = true;
    try {
      if (useExpandTargets) {
        const result = await listExpandTargetsHandler(s);
        if (id !== targetRequestId) return;
        const targets =
          result && typeof result === "object" && !Array.isArray(result)
            ? {
                deck: result.deck ?? null,
                headings: Array.isArray(result.headings) ? result.headings : [],
              }
            : { deck: null, headings: [] };
        fillTargetSelect(select, targets, preserve, true);
      } else {
        const result = await listHeadingsHandler(s);
        if (id !== targetRequestId) return;
        fillHeadingSelect(select, Array.isArray(result) ? result : [], preserve);
      }
    } catch (err) {
      if (id !== targetRequestId) return;
      resetTargetSelect(select, false);
      console.warn(
        useExpandTargets ? "onListExpandTargets failed:" : "onListHeadings failed:",
        err,
      );
    }
  };

  const typeahead = attachSlugTypeahead(editor, slugInput, slugField, {
    onPick: (item) => {
      if (!textInput.value.trim() && item.title) {
        textInput.value = item.title;
      }
    },
    onSlugChange: (slug) => {
      refreshTargets(slug);
    },
  });

  openModal({
    title: isEmbed ? "Insert Embed" : "Insert Expand",
    body: form,
    triggerElement: triggerBtn,
    className: "traven-modal-expand-embed",
    onClose: () => {
      typeahead.destroy();
      const v = editor.getView && editor.getView();
      if (v && typeof v.requestMeasure === "function") {
        v.requestMeasure();
      }
    },
    buttons: [
      {
        text: "Cancel",
        type: "secondary",
        onClick: (_e, overlay) => {
          overlay.querySelector(".traven-modal-close").click();
        },
      },
      {
        text: "Insert",
        type: "primary",
        onClick: (_e, overlay) => {
          const slug = slugInput.value.trim();
          if (!slug) {
            slugInput.focus();
            slugInput.classList.add("traven-modal-input-error");
            return;
          }
          const rawTarget = headingControl.value.trim();
          const { heading, source } = useExpandTargets
            ? targetValueToAttrs(rawTarget)
            : { heading: rawTarget || null, source: null };
          const linkText = textInput.value.trim() || null;
          const md = buildExpandEmbedShortcode(mode, slug, heading, linkText, source);
          if (typeof editor.replaceSelection === "function") {
            editor.replaceSelection(md);
          } else if (typeof editor.insertSnippet === "function") {
            editor.insertSnippet("", "", md);
          }
          overlay.querySelector(".traven-modal-close").click();
        },
      },
    ],
  });

  requestAnimationFrame(() => {
    if (textInput.value.trim()) slugInput.focus();
    else textInput.focus();
  });
}
