// @ts-check
import { StateEffect, StateField, RangeSet, Prec } from "@codemirror/state";
import { showTooltip, keymap, EditorView, GutterMarker, gutter } from "@codemirror/view";
import { BUBBLE_ACTIONS, GUTTER_ACTIONS } from "./actions.js";
import { buildToolButton } from "./dom-button.js";

/* ---------- Selection Bubble ---------- */

function focusFirstBubbleButton(viewDom) {
  const tooltip = viewDom.querySelector(".traven-bubble-menu[role='toolbar']");
  if (!tooltip) return;
  const first = tooltip.querySelector("button");
  if (first) first.focus();
}

function wireBubbleKeyboard(dom, editor) {
  dom.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      editor.focus();
      return;
    }
    if (e.key !== "Tab") return;
    const buttons = Array.from(dom.querySelectorAll("button")).filter(
      (btn) => btn.getAttribute("tabindex") !== "-1"
    );
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

function buildBubbleFragment(editor) {
  const frag = document.createDocumentFragment();
  for (const key of BUBBLE_ACTIONS) {
    buildToolButton(frag, key, editor);
  }
  return frag;
}

function makeBubbleTooltip(pos, editor) {
  return {
    pos,
    above: true,
    create: () => {
      const dom = document.createElement("div");
      dom.className = "traven-bubble-menu";
      const isTouch = typeof window !== "undefined" && 
        (window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window);
      if (isTouch) {
        dom.classList.add("is-tablet-bottom-bar");
      }
      dom.setAttribute("role", "toolbar");
      dom.setAttribute("aria-label", "Text formatting");
      const frag = buildBubbleFragment(editor);
      dom.appendChild(frag);
      wireBubbleKeyboard(dom, editor);
      return { dom };
    }
  };
}

/**
 * Selection bubble extension.
 * @param {any} editor
 * @param {{ hotkey?: string }} [options]
 * @returns {any[]}
 */
export function selectionBubbleExtension(editor, options = {}) {
  const hotkey = options.hotkey || "Mod-.";
  
  /** @type {import("@codemirror/state").StateEffectType<number | null>} */
  const setBubblePos = StateEffect.define();
  
  const bubbleField = StateField.define({
    create: () => null,
    update(value, tr) {
      for (const e of tr.effects) {
        if (e.is(setBubblePos)) return e.value;
      }
      if (tr.selection) {
        const sel = tr.state.selection.main;
        return sel.empty ? null : sel.to;
      }
      return value;
    },
    provide: (f) => showTooltip.from(f, (pos) => (pos == null ? null : makeBubbleTooltip(pos, editor))),
  });

  /** @type {import("@codemirror/state").Extension[]} */
  const extensions = [bubbleField];
  if (hotkey !== "Mod-/") {
    extensions.push(
      Prec.high(keymap.of([{
        key: hotkey,
        run: (view) => {
          const sel = view.state.selection.main;
          if (sel.empty) return false;
          view.dispatch({ effects: setBubblePos.of(sel.to) });
          queueMicrotask(() => focusFirstBubbleButton(view.dom));
          return true;
        }
      }]))
    );
  }

  return extensions;
}

/* ---------- Gutter Inserter ---------- */

class PlusMarker extends GutterMarker {
  /**
   * @param {number} lineFrom
   */
  constructor(lineFrom) {
    super();
    this.lineFrom = lineFrom;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "traven-gutter-plus-btn";
    span.textContent = "+";
    span.setAttribute("aria-hidden", "true");
    return span;
  }
}

/**
 * @param {EditorView} view
 * @returns {RangeSet<GutterMarker>}
 */
function gutterMarkers(view) {
  const markers = [];
  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      if (line.length === 0) {
        const marker = new PlusMarker(line.from);
        markers.push(marker.range(line.from));
      }
      if (line.to + 1 > to) break;
      pos = line.to + 1;
    }
  }
  return RangeSet.of(markers);
}

/**
 * @param {any} editor
 * @param {number} lineFrom
 * @param {EditorView} view
 */
function openGutterMenu(editor, lineFrom, view) {
  const existing = document.querySelector(".traven-gutter-menu");
  if (existing) {
    existing.remove();
  }

  const coords = view.coordsAtPos(lineFrom);
  if (!coords) return null;

  const menu = document.createElement("div");
  menu.className = "traven-gutter-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Block insertion");
  menu.tabIndex = -1;

  for (const key of GUTTER_ACTIONS) {
    buildToolButton(menu, key, editor);
  }

  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  const gutterEl = view.dom.querySelector(".cm-gutters");
  let menuLeft = coords.left;
  if (gutterEl) {
    const gutterRect = gutterEl.getBoundingClientRect();
    menuLeft = gutterRect.left;
  }

  menu.style.position = "absolute";
  menu.style.left = `${menuLeft + scrollLeft}px`;
  menu.style.top = `${coords.bottom + scrollTop + 4}px`;
  document.body.appendChild(menu);

  const close = () => {
    menu.remove();
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey, true);
  };
  
  const onDocClick = (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target && target.closest(".traven-gutter-plus-btn")) {
      return;
    }
    if (!menu.contains(target)) {
      close();
    }
  };
  
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      view.focus();
    }
  };

  menu.addEventListener("click", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const button = target.closest("button");
    if (button) {
      if (button.getAttribute("aria-haspopup") === "true") {
        return;
      }
      close();
    }
  });

  setTimeout(() => {
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey, true);
  }, 0);

  view.dispatch({ selection: { anchor: lineFrom } });
  view.focus();

  return menu;
}

/**
 * Gutter inserter extension.
 * @param {any} editor
 * @param {{ hotkey?: string }} [options]
 * @returns {any[]}
 */
export function gutterInserterExtension(editor, options = {}) {
  const hotkey = options.hotkey || "Mod-Shift-Enter";
  return [
    gutter({
      class: "cm-traven-gutter",
      markers: gutterMarkers,
      domEventHandlers: {
        mousedown(view, line, event) {
          const target = /** @type {HTMLElement} */ (event.target);
          if (!target.classList.contains("traven-gutter-plus-btn")) return false;
          event.preventDefault();
          openGutterMenu(editor, line.from, view);
          return true;
        },
        click(view, line, event) {
          const target = /** @type {HTMLElement} */ (event.target);
          if (!target.classList.contains("traven-gutter-plus-btn")) return false;
          event.preventDefault();
          return true;
        }
      }
    }),
    Prec.high(keymap.of([{
      key: hotkey,
      run: (view) => {
        const pos = view.state.selection.main.head;
        openGutterMenu(editor, pos, view);
        return true;
      }
    }])),
  ];
}
