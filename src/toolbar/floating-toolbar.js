// @ts-check
import { StateEffect, StateField, RangeSet, Prec } from "@codemirror/state";
import { showTooltip, keymap, EditorView, GutterMarker, gutter, ViewPlugin, Decoration, highlightActiveLineGutter } from "@codemirror/view";
import { BUBBLE_ACTIONS, BUBBLE_INSERT_KEY, GUTTER_ACTIONS } from "./actions.js";
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

function buildBubbleFragment(editor, view, clearBubble) {
  const frag = document.createDocumentFragment();
  for (const key of BUBBLE_ACTIONS) {
    buildToolButton(frag, key, editor);
  }

  // Insert button
  buildToolButton(frag, BUBBLE_INSERT_KEY, editor);
  const lastChild = frag.lastChild;
  if (lastChild) {
    lastChild.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      _openGutterFromBubble(editor, view, clearBubble);
    });
  }

  return frag;
}

/**
 * Dismisses the bubble, clears the selection, then opens the Gutter
 * Insertion Menu anchored to the line immediately after the selection.
 *
 * @param {any} editor
 * @param {EditorView} view
 * @param {import("@codemirror/state").StateEffectType<void>} clearBubble
 */
function _openGutterFromBubble(editor, view, clearBubble) {
  const sel = view.state.selection.main;
  const anchorLine = view.state.doc.lineAt(sel.to);
  const insertPos = anchorLine.to;

  // Count how many newlines exist immediately after the selection's line
  let existingNewlines = 0;
  let pos = insertPos;
  while (pos < view.state.doc.length && view.state.sliceDoc(pos, pos + 1) === "\n") {
    existingNewlines++;
    pos++;
  }

  // Ensure 4 newlines (or 3 if at the end of the document) to guarantee a blank line
  // above and below the newly inserted block.
  const isAtEnd = pos === view.state.doc.length;
  const targetNewlines = isAtEnd ? 3 : 4;
  const newlinesNeeded = Math.max(0, targetNewlines - existingNewlines);

  const insertText = "\n".repeat(newlinesNeeded);
  const finalCursorPos = insertPos + 2;

  // Dismiss bubble + insert newlines + position cursor inside the spacing area
  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert: insertText },
    selection: { anchor: finalCursorPos },
    effects: clearBubble.of(undefined)
  });

  // Open the gutter menu at the resolved position.
  queueMicrotask(() => {
    openGutterMenu(editor, finalCursorPos, view);
  });
}

function makeBubbleTooltip(from, to, editor, clearBubble) {
  return {
    pos: from,
    end: to,
    above: true,
    create: (view) => {
      const dom = document.createElement("div");
      dom.className = "traven-bubble-menu";
      const isTouch = typeof window !== "undefined" &&
        (window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window);
      if (isTouch) {
        dom.classList.add("is-tablet-bottom-bar");
      }
      dom.setAttribute("role", "toolbar");
      dom.setAttribute("aria-label", "Text formatting");
      const frag = buildBubbleFragment(editor, view, clearBubble);
      dom.appendChild(frag);
      wireBubbleKeyboard(dom, editor);

      const arrow = document.createElement("div");
      arrow.className = "traven-bubble-arrow";
      dom.appendChild(arrow);

      return { dom };
    }
  };
}

/**
 * @param {{ appearDelay?: number, setBubblePos: import("@codemirror/state").StateEffectType<{from:number,to:number}|null>, clearBubble: import("@codemirror/state").StateEffectType<void> }} opts
 */
function bubblePointerController({ appearDelay, setBubblePos, clearBubble }) {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.dom = view.contentDOM;
      this.appearDelay = appearDelay;
      /** @type {number | null} */
      this.showTimer = null;
      /** @type {number | null} */
      this.lastPointerId = null;
      /** @type {{ from: number, to: number } | null} */
      this.lastShownRange = null;
      /** @type {number | null} */
      this._clearRaf = null;

      // Bind once so we can remove them on destroy.
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp   = this._onPointerUp.bind(this);

      this.dom.addEventListener("pointerdown", this._onPointerDown, true);
      this.dom.addEventListener("pointermove", this._onPointerMove, true);
      this.dom.addEventListener("pointerup",   this._onPointerUp,   true);
    }

    destroy() {
      this.dom.removeEventListener("pointerdown", this._onPointerDown, true);
      this.dom.removeEventListener("pointermove", this._onPointerMove, true);
      this.dom.removeEventListener("pointerup",   this._onPointerUp,   true);
      this._cancelTimer();
      if (this._clearRaf != null) {
        cancelAnimationFrame(this._clearRaf);
        this._clearRaf = null;
      }
    }

    update(update) {
      // If the user typed, clicked an empty area, or otherwise collapsed the
      // selection, hide the bubble immediately. This is the only place we
      // react to selection state without a pointer event.
      //
      // We use requestAnimationFrame instead of Promise.resolve() to defer
      // the clearBubble dispatch. Microtasks (Promise) fire before the
      // browser finishes processing focus events, which can cause a race
      // condition: when a bubble button formats text, insertSnippet calls
      // view.focus() synchronously, but microtask clearBubble dispatches
      // can interfere with CM6's focus tracking and leave focusField stuck
      // at false — permanently suppressing delimiter display. rAF ensures
      // we dispatch only after all focus events have fully settled.
      if (update.selectionSet) {
        const sel = update.state.selection.main;
        if (sel.empty) {
          this._cancelTimer();
          this._deferredClear();
        }
      }
      if (update.docChanged) {
        this._cancelTimer();
        this._deferredClear();
      }
    }

    _deferredClear() {
      if (this._clearRaf != null) return; // already scheduled
      this._clearRaf = requestAnimationFrame(() => {
        this._clearRaf = null;
        this._dispatch(clearBubble.of(undefined));
      });
    }

    _onPointerDown(_e) {
      // Pressing the mouse down starts (or restarts) a drag selection.
      // Hide any currently-shown bubble and clear any pending show.
      this._cancelTimer();
      this._dispatch(clearBubble.of(undefined));
    }

    _onPointerMove(e) {
      // Only react to moves while a button is held (i.e. during a drag).
      if (e.buttons === 0) return;
      // The selection is in flux; keep the bubble hidden.
      this._dispatch(clearBubble.of(undefined));
      this._cancelTimer();
    }

    _onPointerUp(_e) {
      // Pointer released. If there's a real selection, schedule a show
      // after the appear delay. If selection is empty (e.g. simple click),
      // do nothing — update() will clear shortly anyway.
      const sel = this.view.state.selection.main;
      if (sel.empty) return;
      this._scheduleShow(sel.from, sel.to);
    }

    _scheduleShow(from, to) {
      this._cancelTimer();
      this.showTimer = window.setTimeout(() => {
        this.showTimer = null;
        // Re-check selection at fire time; user may have moved again.
        const cur = this.view.state.selection.main;
        if (cur.empty || cur.from !== from || cur.to !== to) return;
        if (cur.from === cur.to) return;
        this.lastShownRange = { from: cur.from, to: cur.to };
        this._dispatch(setBubblePos.of({ from: cur.from, to: cur.to }));
      }, Math.max(0, this.appearDelay ?? 200));
    }

    _cancelTimer() {
      if (this.showTimer != null) {
        clearTimeout(this.showTimer);
        this.showTimer = null;
      }
    }

    _dispatch(effect) {
      // No-op during teardown when the view is gone.
      if (!this.view || this.view.destroyed) return;
      this.view.dispatch({ effects: effect });
    }
  }, { decorations: v => Decoration.none });
}

/**
 * Selection bubble extension.
 * @param {any} editor
 * @param {{ hotkey?: string, appearDelay?: number }} [options]
 * @returns {any[]}
 */
export function selectionBubbleExtension(editor, options = {}) {
  const hotkey = options.hotkey || "Mod-.";
  const appearDelay = options.appearDelay ?? 200;

  /** @type {import("@codemirror/state").StateEffectType<{ from: number, to: number } | null>} */
  const setBubblePos = StateEffect.define();
  const clearBubble = StateEffect.define();

  const bubbleField = StateField.define({
    create: () => null,
    update(value, tr) {
      for (const e of tr.effects) {
        if (e.is(setBubblePos)) return e.value;
        if (e.is(clearBubble)) return null;
      }
      return value;
    },
    provide: (f) => showTooltip.from(f, (val) => (val == null ? null : makeBubbleTooltip(val.from, val.to, editor, clearBubble))),
  });

  const pointerController = bubblePointerController({
    appearDelay, setBubblePos, clearBubble,
  });

  /** @type {import("@codemirror/state").Extension[]} */
  const extensions = [bubbleField, pointerController];
  if (hotkey !== "Mod-/") {
    extensions.push(
      Prec.high(keymap.of([{
        key: hotkey,
        run: (view) => {
          const sel = view.state.selection.main;
          if (sel.empty) return false;
          view.dispatch({ effects: setBubblePos.of({ from: sel.from, to: sel.to }) });
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
    highlightActiveLineGutter(),
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
