// src/runtime.js
var TRAILING_PUNCT_RE = /^([.,:;!?])(?:\s|$)/;
function initExpandEmbed(root = document) {
  const scope = (
    /** @type {ParentNode & { querySelectorAll?: Function }} */
    root
  );
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
function positionExpandArrow(trigger, panel) {
  const arrow = panel.querySelector(".traven-expand-panel-arrow");
  if (!(arrow instanceof HTMLElement)) return;
  const t = trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  if (p.width <= 0) return;
  const half = 11;
  let left = t.left + t.width / 2 - p.left - half;
  const min = 16;
  const max = Math.max(min, p.width - 16 - half * 2);
  left = Math.min(Math.max(left, min), max);
  arrow.style.left = `${left}px`;
}
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
function ensureTrailingPunctuation(trigger) {
  const immediate = trigger.nextSibling;
  if (immediate instanceof HTMLElement && immediate.classList.contains("traven-expand-punct")) {
    return immediate;
  }
  const next = nextSignificantSibling(immediate);
  if (next instanceof HTMLElement && next.classList.contains("traven-expand-panel")) {
    return null;
  }
  if (!next || next.nodeType !== Node.TEXT_NODE) return null;
  const value = next.nodeValue || "";
  const match = value.match(TRAILING_PUNCT_RE);
  if (!match) return null;
  const punct = document.createElement("span");
  punct.className = "traven-expand-punct";
  punct.textContent = match[1];
  next.nodeValue = value.slice(match[1].length);
  trigger.after(punct);
  return punct;
}
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
  const punct = ensureTrailingPunctuation(trigger);
  const anchor = punct || trigger;
  if (anchor.nextSibling !== panel) {
    anchor.after(panel);
  }
  panel.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => {
    positionExpandArrow(trigger, panel);
  });
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initExpandEmbed());
  } else {
    initExpandEmbed();
  }
}
export {
  initExpandEmbed
};
