// @ts-check

/** Trailing punct + whitespace, or punct alone at end of text / paragraph. */
const TRAILING_PUNCT_RE = /^([.,:;!?])(?:\s|$)/;

/**
 * Wire Nutshell-style expand triggers: click toggles a bordered panel
 * inserted immediately after the trigger (next line under the link).
 * Trailing `.` / `,` etc. stay with the trigger (mid-sentence or end of paragraph).
 *
 * Idempotent — safe to call more than once on the same root.
 *
 * @param {ParentNode} [root=document]
 */
export function initExpandEmbed(root = document) {
  const scope = /** @type {ParentNode & { querySelectorAll?: Function }} */ (root);
  if (!scope || typeof scope.querySelectorAll !== "function") return;

  const triggers = scope.querySelectorAll(".traven-expand-trigger");
  for (const trigger of triggers) {
    if (!(trigger instanceof HTMLElement)) continue;
    if (trigger.dataset.travenExpandBound === "1") continue;
    trigger.dataset.travenExpandBound = "1";

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      toggleExpandTrigger(trigger);
    });
  }
}

/**
 * Center the callout arrow under the trigger; clamp to panel edges.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} panel
 */
function positionExpandArrow(trigger, panel) {
  const arrow = panel.querySelector(".traven-expand-panel-arrow");
  if (!(arrow instanceof HTMLElement)) return;

  const t = trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  if (p.width <= 0) return;

  const half = 11; // half of ~22px arrow width
  let left = t.left + t.width / 2 - p.left - half;
  const min = 16;
  const max = Math.max(min, p.width - 16 - half * 2);
  left = Math.min(Math.max(left, min), max);
  arrow.style.left = `${left}px`;
}

/**
 * Next sibling that can hold trailing punctuation (skip inert <template> / hidden panel).
 * @param {ChildNode|null} start
 * @returns {ChildNode|null}
 */
function nextSignificantSibling(start) {
  let n = start;
  while (n) {
    if (n instanceof HTMLElement) {
      if (n.tagName === "TEMPLATE") {
        n = n.nextSibling;
        continue;
      }
      if (n.classList.contains("traven-expand-panel") && n.hidden) {
        n = n.nextSibling;
        continue;
      }
    }
    if (n.nodeType === Node.TEXT_NODE && !(n.nodeValue || "").length) {
      n = n.nextSibling;
      continue;
    }
    return n;
  }
  return null;
}

/**
 * Peel a trailing punctuation char (`.`, `,`, …) into a span after the trigger
 * so the panel does not orphan it. Matches punct + whitespace, or punct at
 * end of the text node (end of paragraph).
 *
 * PHP emits `<button>…</button><template>…</template>. rest` — the punct
 * text sits *after* the template, so we must skip templates when looking.
 *
 * @param {HTMLElement} trigger
 * @returns {HTMLElement|null} existing or new punct span, or null
 */
function ensureTrailingPunctuation(trigger) {
  const immediate = trigger.nextSibling;

  // Already peeled on a previous open.
  if (
    immediate instanceof HTMLElement &&
    immediate.classList.contains("traven-expand-punct")
  ) {
    return immediate;
  }

  // Walk past <template> (and empty text) to the real following content.
  const next = nextSignificantSibling(immediate);

  if (
    next instanceof HTMLElement &&
    next.classList.contains("traven-expand-panel")
  ) {
    return null;
  }

  if (!next || next.nodeType !== Node.TEXT_NODE) return null;

  const value = next.nodeValue || "";
  const match = value.match(TRAILING_PUNCT_RE);
  if (!match) return null;

  const punct = document.createElement("span");
  punct.className = "traven-expand-punct";
  punct.textContent = match[1];
  // Leave the leading whitespace in the text node (resumes after the panel).
  next.nodeValue = value.slice(match[1].length);
  // Keep punct next to the trigger (before the inert template).
  trigger.after(punct);
  return punct;
}

/**
 * @param {HTMLElement} trigger
 */
function toggleExpandTrigger(trigger) {
  const id = trigger.getAttribute("data-traven-expand");
  if (!id) return;

  const panelId = `traven-expand-panel-${id}`;
  let panel = document.getElementById(panelId);
  const isOpen = trigger.getAttribute("aria-expanded") === "true";

  if (isOpen) {
    trigger.setAttribute("aria-expanded", "false");
    if (panel) {
      panel.hidden = true;
    }
    return;
  }

  if (!panel) {
    const template = document.getElementById(id);
    if (!(template instanceof HTMLTemplateElement)) return;

    panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "traven-expand-content traven-expand-panel";
    panel.setAttribute("role", "region");

    const arrow = document.createElement("div");
    arrow.className = "traven-expand-panel-arrow";
    arrow.setAttribute("aria-hidden", "true");
    panel.appendChild(arrow);
    panel.appendChild(template.content.cloneNode(true));
  }

  // Keep trailing punctuation with the trigger; panel goes after it.
  const punct = ensureTrailingPunctuation(trigger);
  const anchor = punct || trigger;
  if (anchor.nextSibling !== panel) {
    anchor.after(panel);
  }

  panel.hidden = false;
  trigger.setAttribute("aria-expanded", "true");

  // Layout must settle before measuring for the arrow.
  requestAnimationFrame(() => {
    positionExpandArrow(trigger, panel);
  });
}

/**
 * Auto-init when loaded as a classic script (optional).
 * Module hosts should call initExpandEmbed() explicitly.
 */
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initExpandEmbed());
  } else {
    initExpandEmbed();
  }
}
