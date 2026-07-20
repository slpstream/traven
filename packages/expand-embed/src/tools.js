// @ts-check
import { openExpandEmbedModal } from "./modal.js";

/** Acorn — homage to Nicky Case's Nutshell (collapsed expandables). */
const ICON_EXPAND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M216,112v16c0,53-88,88-88,112,0-24-88-59-88-112V112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M80,56h96a48,48,0,0,1,48,48v0a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8v0A48,48,0,0,1,80,56Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M128,56V48a32,32,0,0,1,32-32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;

/** Arrows-out — always-visible embed / open outward. */
const ICON_EMBED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="160 48 208 48 208 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="152" y1="104" x2="208" y2="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="96 208 48 208 48 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="152" x2="48" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="208 160 208 208 160 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="152" y1="152" x2="208" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="48 96 48 48 96 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="104" x2="48" y2="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;

/**
 * Toolbar tool definitions for Expand / Embed.
 * Register with Traven `registerTools(expandEmbedTools)` or `extraTools: expandEmbedTools`,
 * and list keys in `toolbar` (not in core DEFAULT_TOOLBAR).
 */
export const expandEmbedTools = {
  expand: {
    key: "expand",
    title: "Expand",
    icon: ICON_EXPAND,
    action: (editor, buttonEl) => openExpandEmbedModal(editor, buttonEl, "expand"),
  },
  embed: {
    key: "embed",
    title: "Embed",
    icon: ICON_EMBED,
    action: (editor, buttonEl) => openExpandEmbedModal(editor, buttonEl, "embed"),
  },
};

/** Recommended toolbar slice to append after media tools. */
export const EXPAND_EMBED_TOOLBAR = ["expand", "embed"];
