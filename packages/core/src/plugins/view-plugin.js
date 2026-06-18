// @ts-check
import { Facet, RangeSetBuilder, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { suppressionField, focusField, setFocusEffect, cursorInRange, selectionOverlapsRange } from "../wysiwym.js";

/**
 * Facet to register plugins with the view plugin
 */
export const TravenPluginsFacet = Facet.define({
  combine: (values) => values.flat(),
});

/**
 * @param {import("@codemirror/state").EditorState} state 
 * @param {import("./TravenPlugin.js").TravenPlugin[]} plugins 
 * @returns {import("@codemirror/view").DecorationSet}
 */
function buildDecorations(state, plugins) {
  const builder = new RangeSetBuilder();
  const decorations = [];

  if (plugins.length > 0) {
    const hasFocus = state.field(focusField, false);
    const cursorHead = hasFocus ? state.selection.main.head : -1;
    const cursorLine = hasFocus ? state.doc.lineAt(state.selection.main.head).number : -1;
    const suppressed = state.field(suppressionField, false) || null;

    /** @type {import("./TravenPlugin.js").DecorationContext} */
    const ctx = {
      state,
      decorations,
      selectionOverlapsRange: (from, to) => selectionOverlapsRange(state, from, to),
      cursorInRange: (from, to) => cursorInRange(state, from, to),
      hasFocus,
      cursorHead,
      cursorLine,
      suppressed,
    };

    const sortedPlugins = [...plugins].sort((a, b) => a.decorationPriority - b.decorationPriority);

    for (const plugin of sortedPlugins) {
      try {
        plugin.buildDecorations(ctx);
      } catch (e) {
        console.error(`Plugin ${plugin.name} failed to build decorations:`, e);
      }
    }
  }

  // Strict RangeSetBuilder Sorting
  decorations.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    const aSide = a.deco.startSide || 0;
    const bSide = b.deco.startSide || 0;
    if (aSide !== bSide) return aSide - bSide;
    return b.to - a.to;
  });

  for (const d of decorations) {
    builder.add(d.from, d.to, d.deco);
  }

  return /** @type {any} */ (builder.finish());
}

export const travenViewPlugin = StateField.define({
  create(state) {
    return buildDecorations(state, state.facet(TravenPluginsFacet));
  },
  update(decorations, tr) {
    const focusChanged = tr.effects.some(e => e.is(setFocusEffect));
    if (tr.docChanged || tr.selection || focusChanged) {
      return buildDecorations(tr.state, tr.state.facet(TravenPluginsFacet));
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f)
});

