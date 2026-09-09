// @ts-check
import { syntaxTree } from "@freedomware/traven";
import { findOpenWikilink, formatWikilinkCompletion } from "./wikilink-complete.js";

export { findOpenWikilink, formatWikilinkCompletion };

/**
 * True when `pos` sits inside inline or fenced code.
 * @param {import("@codemirror/state").EditorState} state
 * @param {number} pos
 * @returns {boolean}
 */
export function isInCodeContext(state, pos) {
  if (!state) return false;
  let inCode = false;
  syntaxTree(state).iterate({
    from: pos,
    to: pos,
    enter(node) {
      const name = node.name;
      if (
        name === "InlineCode" ||
        name === "FencedCode" ||
        name === "CodeBlock" ||
        name === "CodeText"
      ) {
        inCode = true;
        return false;
      }
    },
  });
  return inCode;
}

/**
 * True when `pos` is inside a completed Wikilink syntax node.
 * @param {import("@codemirror/state").EditorState} state
 * @param {number} pos
 * @returns {boolean}
 */
export function isInsideWikilinkNode(state, pos) {
  if (!state) return false;
  let inside = false;
  syntaxTree(state).iterate({
    from: pos,
    to: pos,
    enter(node) {
      if (node.name === "Wikilink" && pos > node.from && pos < node.to) {
        inside = true;
        return false;
      }
    },
  });
  return inside;
}

/**
 * Attach live `[[` typeahead to a mounted Traven editor.
 * Uses the EditorView instance (no second @codemirror copy).
 *
 * @param {Object} editor
 * @returns {{ destroy: () => void }}
 */
export function attachWikilinkAutocomplete(editor) {
  const suggestHandler =
    typeof editor.getSuggestLinks === "function" ? editor.getSuggestLinks() : null;
  if (!suggestHandler) {
    return { destroy() {} };
  }

  const view = typeof editor.getView === "function" ? editor.getView() : null;
  if (!view || !view.dom) {
    return { destroy() {} };
  }

  let suggestList = null;
  let debounceTimer = null;
  let requestId = 0;
  let activeIndex = -1;
  /** @type {Array<{ title: string, url: string, slug?: string }>} */
  let current = [];
  /** @type {import("./wikilink-complete.js").OpenWikilink|null} */
  let open = null;

  const hide = () => {
    if (suggestList) {
      suggestList.remove();
      suggestList = null;
    }
    activeIndex = -1;
    current = [];
    open = null;
  };

  const apply = (item) => {
    if (!open) return;
    const slug = String(item.slug || "").trim();
    if (!slug) return;
    const insertion = formatWikilinkCompletion({
      prefix: open.prefix,
      slug,
      title: item.title || null,
    });
    const to = view.state.selection.main.head;
    view.dispatch({
      changes: { from: open.from, to, insert: insertion },
      selection: { anchor: open.from + insertion.length },
    });
    view.focus();
    hide();
  };

  const positionList = () => {
    if (!suggestList || !open) return;
    const coords = view.coordsAtPos(view.state.selection.main.head);
    if (!coords) return;
    suggestList.style.top = `${coords.bottom + 4}px`;
    suggestList.style.left = `${coords.left}px`;
  };

  const render = (items) => {
    if (suggestList) {
      suggestList.remove();
      suggestList = null;
    }
    activeIndex = -1;
    current = Array.isArray(items)
      ? items.filter((i) => i && (i.slug || i.title))
      : [];
    if (current.length === 0 || !open) return;

    suggestList = document.createElement("ul");
    suggestList.className = "traven-link-suggest-list is-fixed";
    suggestList.setAttribute("role", "listbox");
    suggestList.id = "traven-wikilink-suggest-list";

    current.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "traven-link-suggest-item";
      li.setAttribute("role", "option");
      li.id = `traven-wikilink-suggest-${index}`;

      const titleEl = document.createElement("span");
      titleEl.className = "traven-link-suggest-title";
      titleEl.textContent = item.title || item.slug || item.url;

      const metaEl = document.createElement("span");
      metaEl.className = "traven-link-suggest-meta";
      metaEl.textContent = item.slug || item.url || "";

      li.appendChild(titleEl);
      li.appendChild(metaEl);
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        apply(item);
      });
      suggestList.appendChild(li);
    });

    document.body.appendChild(suggestList);
    positionList();
  };

  const setActive = (index) => {
    if (!suggestList) return;
    const items = suggestList.querySelectorAll(".traven-link-suggest-item");
    items.forEach((el) => el.classList.remove("is-active"));
    if (index < 0 || index >= items.length) {
      activeIndex = -1;
      return;
    }
    activeIndex = index;
    items[index].classList.add("is-active");
    items[index].scrollIntoView({ block: "nearest" });
  };

  const run = async (found) => {
    const id = ++requestId;
    try {
      const result = await suggestHandler(found.query);
      if (id !== requestId) return;
      if (!open || open.from !== found.from) return;
      render(Array.isArray(result) ? result : []);
    } catch (err) {
      if (id !== requestId) return;
      hide();
      console.warn("onSuggestLinks failed:", err);
    }
  };

  const maybeSuggest = () => {
    const state = view.state;
    const pos = state.selection.main.head;
    if (isInCodeContext(state, pos) || isInsideWikilinkNode(state, pos)) {
      hide();
      return;
    }
    const found = findOpenWikilink(state.doc.toString(), pos);
    if (!found) {
      hide();
      return;
    }
    open = found;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => run(found), 200);
  };

  const onKeyDown = (e) => {
    if (!suggestList || current.length === 0) {
      if (e.key === "Escape" && suggestList) {
        e.preventDefault();
        hide();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setActive(activeIndex < current.length - 1 ? activeIndex + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setActive(activeIndex <= 0 ? current.length - 1 : activeIndex - 1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      apply(current[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    }
  };

  const onDocClick = (e) => {
    if (suggestList && !suggestList.contains(/** @type {Node} */ (e.target))) {
      hide();
    }
  };

  const onChange = () => maybeSuggest();

  view.dom.addEventListener("keydown", onKeyDown);
  view.dom.addEventListener("keyup", maybeSuggest);
  document.addEventListener("mousedown", onDocClick);
  if (typeof editor.on === "function") {
    editor.on("change", onChange);
  }

  return {
    destroy() {
      if (debounceTimer) clearTimeout(debounceTimer);
      view.dom.removeEventListener("keydown", onKeyDown);
      view.dom.removeEventListener("keyup", maybeSuggest);
      document.removeEventListener("mousedown", onDocClick);
      hide();
    },
  };
}
