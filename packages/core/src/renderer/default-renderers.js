// @ts-check
import { escapeHtml, escapeHtmlAttr } from "./TravenRenderer.js";
import { sanitizeUrl, parseVideoUrl } from "../security.js";
import { parseAttrMap } from "../attr-parser.js";
import { renderMermaidSync } from "../mermaid-parser.js";
import { renderInlineMarkdown } from "../wysiwym.js";

/**
 * Handles rendering of standard and custom syntax nodes.
 * @param {import("@lezer/common").SyntaxNode} node 
 * @param {string} childrenHtml 
 * @param {string} docText 
 * @returns {string}
 */
export function defaultNodeRenderer(node, childrenHtml, docText) {
  const name = node.name;

  // Utilities to get text of a specific child node
  /** @param {string} childName */
  const getChildText = (childName) => {
    const child = node.getChild(childName);
    return child ? docText.slice(child.from, child.to) : "";
  };

  switch (name) {
    case "Document":
      return childrenHtml;
    case "Paragraph":
      return `<p>${childrenHtml}</p>\n`;
    case "ATXHeading1":
      return `<h1>${childrenHtml}</h1>\n`;
    case "ATXHeading2":
      return `<h2>${childrenHtml}</h2>\n`;
    case "ATXHeading3":
      return `<h3>${childrenHtml}</h3>\n`;
    case "ATXHeading4":
      return `<h4>${childrenHtml}</h4>\n`;
    case "ATXHeading5":
      return `<h5>${childrenHtml}</h5>\n`;
    case "ATXHeading6":
      return `<h6>${childrenHtml}</h6>\n`;
    case "HorizontalRule":
      return `<hr>\n`;
    case "Blockquote": {
      const firstParagraphRegex = /^\s*<p>([\s\S]*?)<\/p>/i;
      const pMatch = childrenHtml.match(firstParagraphRegex);
      if (pMatch) {
        const innerHtml = pMatch[0];
        const innerContent = pMatch[1];
        const alertTypeRegex = /^(?:\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|DANGER)\]|<a\b[^>]*>!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|DANGER)<\/a>)(?:\s|<br\/?>)*(.*)/is;
        const alertMatch = innerContent.trim().match(alertTypeRegex);
        if (alertMatch) {
          let type = (alertMatch[1] || alertMatch[2]).toUpperCase();
          if (type === "INFO") type = "NOTE";
          if (type === "DANGER") type = "CAUTION";
          
          const remaining = alertMatch[3].trim();
          const newParagraph = remaining ? `<p>${remaining}</p>` : "";
          const newChildrenHtml = childrenHtml.replace(innerHtml, newParagraph);
          
          return `<div class="traven-alert traven-alert-${type.toLowerCase()}">\n${newChildrenHtml}</div>\n`;
        }
      }
      return `<blockquote>\n${childrenHtml}</blockquote>\n`;
    }
    case "BulletList":
      return `<ul>\n${childrenHtml}</ul>\n`;
    case "OrderedList":
      return `<ol>\n${childrenHtml}</ol>\n`;
    case "ListItem": {
      const isTask = node.getChild("Task") !== null;
      return `<li${isTask ? ' class="task-list-item"' : ''}>${childrenHtml}</li>\n`;
    }
    case "Task": {
      const checked = getChildText("TaskMarker") === "[x]" || getChildText("TaskMarker") === "[X]";
      return `<input type="checkbox" disabled${checked ? " checked" : ""}>${childrenHtml}`;
    }
    case "StrongEmphasis":
      return `<strong>${childrenHtml}</strong>`;
    case "Emphasis":
      return `<em>${childrenHtml}</em>`;
    case "Strikethrough":
      return `<del>${childrenHtml}</del>`;
    case "Highlight":
      return `<mark>${childrenHtml}</mark>`;
    case "Subscript":
      return `<sub>${childrenHtml}</sub>`;
    case "Superscript":
      return `<sup>${childrenHtml}</sup>`;
    case "InlineCode": {
      let codeText = docText.slice(node.from + 1, node.to - 1);
      let isInsideTable = false;
      let curr = node.parent;
      while (curr) {
        if (curr.name === "TableCell") { isInsideTable = true; break; }
        curr = curr.parent;
      }
      if (isInsideTable) {
        codeText = codeText.replace(/\\\|/g, "|");
      }
      return `<code>${escapeHtml(codeText)}</code>`;
    }
    case "FencedCode": {
      const info = getChildText("CodeInfo");
      const codeChild = node.getChild("CodeText");
      const code = codeChild ? escapeHtml(docText.slice(codeChild.from, codeChild.to)) : "";
      
      if (info === "mermaid") {
        const rawCode = codeChild ? docText.slice(codeChild.from, codeChild.to) : "";
        const html = renderMermaidSync(rawCode);
        return `${html}\n`;
      }
      
      const classAttr = info ? ` class="language-${info}"` : "";
      return `<pre><code${classAttr}>${code}</code></pre>\n`;
    }
    case "Link": {
      // In @lezer/markdown, links are composed of LinkMark, URL, LinkTitle
      let url = "";
      let title = "";
      
      const urlNode = node.getChild("URL");
      if (urlNode) {
        url = docText.slice(urlNode.from, urlNode.to);
        if (url.startsWith("<") && url.endsWith(">")) {
          url = url.slice(1, -1);
        }
      }
      
      const titleNode = node.getChild("LinkTitle");
      if (titleNode) title = docText.slice(titleNode.from + 1, titleNode.to - 1); // strip quotes
      
      const titleAttr = title ? ` title="${escapeHtmlAttr(title)}"` : "";
      
      const nodeText = docText.slice(node.from, node.to);
      let endIdx = nodeText.lastIndexOf("](");
      if (endIdx === -1) endIdx = nodeText.lastIndexOf("]");
      const innerText = escapeHtml(nodeText.slice(1, endIdx === -1 ? nodeText.length : endIdx));

      return `<a href="${escapeHtmlAttr(sanitizeUrl(url))}"${titleAttr} target="_blank" rel="noopener noreferrer">${innerText}</a>`;
    }
    case "Image": {
      let url = "";
      const urlNode = node.getChild("URL");
      if (urlNode) {
        url = docText.slice(urlNode.from, urlNode.to);
        if (url.startsWith("<") && url.endsWith(">")) {
          url = url.slice(1, -1);
        }
      }
      
      const nodeText = docText.slice(node.from, node.to);
      let endIdx = nodeText.lastIndexOf("](");
      if (endIdx === -1) endIdx = nodeText.lastIndexOf("]");
      const alt = escapeHtmlAttr(nodeText.slice(2, endIdx === -1 ? nodeText.length : endIdx));

      return `<img src="${escapeHtmlAttr(sanitizeUrl(url))}" alt="${alt}" class="traven-image align-center size-medium">`;
    }
    case "Autolink": {
      const url = docText.slice(node.from + 1, node.to - 1);
      const href = url.startsWith("www.") ? `https://${url}` : url;
      // We also handle mailto:
      const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url);
      const finalHref = isEmail ? `mailto:${url}` : href;
      return `<a href="${escapeHtmlAttr(sanitizeUrl(finalHref))}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    }
    case "BlockMath": {
      const math = docText.slice(node.from + 2, node.to - 2);
      if (typeof window !== "undefined" && /** @type {any} */ (window).katex) {
        return /** @type {any} */ (window).katex.renderToString(math, { displayMode: true, throwOnError: false }) + "\n";
      }
      return `<div class="katex-display-fallback">$$${escapeHtml(math)}$$</div>\n`;
    }
    case "InlineMath": {
      const math = docText.slice(node.from + 1, node.to - 1);
      if (typeof window !== "undefined" && /** @type {any} */ (window).katex) {
        return /** @type {any} */ (window).katex.renderToString(math, { displayMode: false, throwOnError: false });
      }
      return `<span class="katex-inline-fallback">$${escapeHtml(math)}$</span>`;
    }
    case "Table":
      return `<table>\n${childrenHtml}</tbody>\n</table>\n`;
    case "TableHeader":
      return `<thead>\n<tr>\n${childrenHtml}</tr>\n</thead>\n<tbody>\n`;
    case "TableBody":
      return `${childrenHtml}`; // Handled by Table/TableHeader
    case "TableRow":
      return `<tr>\n${childrenHtml}</tr>\n`;
    case "TableCell": {
      // Need to determine alignment if possible, but Lezer Table doesn't expose it easily on the Cell.
      // Usually alignment is handled in the parser and added as a class or style.
      // For now, just basic td/th
      const isHeader = node.parent?.name === "TableHeader";
      const tag = isHeader ? "th" : "td";
      return `<${tag}>${childrenHtml}</${tag}>\n`;
    }
    
    // MDX components
    case "MdxMediaTag": {
      const tagName = getMdxTagName(node, docText).toLowerCase();
      const attrs = parseShortcodeAttrs(docText.slice(node.from, node.to));
      if (tagName === "image") return renderImageHtml(attrs);
      if (tagName === "video") return renderVideoHtml(attrs);
      if (tagName === "audio") return renderAudioHtml(attrs);
      return renderComponentHtml(tagName, attrs, "");
    }
    case "MdxContainerTag": {
      const tagName = getMdxTagName(node, docText);
      const openNode = node.getChild("MdxContainerOpen");
      const bodyNode = node.getChild("MdxContainerBody");
      const openRaw = openNode ? docText.slice(openNode.from, openNode.to) : docText.slice(node.from, node.to);
      const attrs = parseShortcodeAttrs(openRaw);
      if (tagName.toLowerCase() === "figure") {
        const align = escapeHtmlAttr(attrs.align || "center");
        return `<figure class="traven-figure align-${align}">\n${childrenHtml}</figure>\n`;
      }
      const bodyText = bodyNode ? docText.slice(bodyNode.from, bodyNode.to) : "";
      return renderComponentHtml(tagName, attrs, bodyText);
    }
    case "MdxContainerOpen": {
      const tagName = getMdxTagName(node, docText);
      const attrs = parseShortcodeAttrs(docText.slice(node.from, node.to));
      const lower = tagName.toLowerCase();
      if (lower === "figure") {
        const align = escapeHtmlAttr(attrs.align || "center");
        return `<figure class="traven-figure align-${align}">\n`;
      }
      if (lower === "quote" || lower === "blockquote") {
        return `<blockquote class="traven-component-blockquote">\n`;
      }
      if (lower === "pullquote") {
        return `<blockquote class="traven-component-pullquote">\n`;
      }
      const compName = resolveCompName(tagName, attrs);
      let html = `<div class="traven-component traven-component-${escapeHtmlAttr(compName)}">\n`;
      const title = attrs.title || "";
      const collapsible = attrs.collapsible === "true";
      const displayTitle = title || (collapsible ? (compName.charAt(0).toUpperCase() + compName.slice(1)) : "");
      if (displayTitle && !collapsible) {
        html += `<div class="component-header"><span class="component-title">${escapeHtml(displayTitle)}</span></div>\n`;
      }
      return html;
    }
    case "MdxContainerClose": {
      const tagName = getMdxTagName(node, docText).toLowerCase();
      if (tagName === "figure") return `</figure>\n`;
      if (tagName === "quote" || tagName === "blockquote" || tagName === "pullquote") {
        if (tagName === "quote" || tagName === "blockquote") {
          const openNode = findMatchingMdxOpen(node, docText);
          if (openNode) {
            const attrs = parseShortcodeAttrs(docText.slice(openNode.from, openNode.to));
            const cite = renderQuoteCiteHtml(attrs);
            if (cite) return `${cite}</blockquote>\n`;
          }
        }
        return `</blockquote>\n`;
      }
      return `</div>\n`;
    }
    case "HTMLBlock":
      return docText.slice(node.from, node.to) + "\n";
    case "HTMLTag":
      return docText.slice(node.from, node.to);

    // Lezer structural nodes that should be ignored or fallen through
    case "HeaderMark":
    case "QuoteMark":
    case "ListMark":
    case "TaskMarker":
    case "EmphasisMark":
    case "StrikethroughMark":
    case "HighlightMark":
    case "SubscriptMark":
    case "SuperscriptMark":
    case "CodeMark":
    case "CodeInfo":
    case "LinkMark":
    case "URL":
    case "LinkTitle":
    case "TableDelimiter":
    case "MdxMark":
    case "MdxTagName":
    case "MdxAttribute":
    case "MdxAttributeName":
    case "MdxAttributeValue":
    case "MdxContainerBody":
      return ""; // Hide the markdown syntax markers

    default:
      // If it's an unrecognized node with no children, just output its raw text
      if (!node.firstChild) return escapeHtml(docText.slice(node.from, node.to));
      // Otherwise return its rendered children
      return childrenHtml;
  }
}

function parseShortcodeAttrs(raw) {
  return parseAttrMap(raw);
}

/**
 * Pair a multi-line `MdxContainerClose` with its matching `MdxContainerOpen`
 * by walking previous siblings with a same-tag depth counter.
 *
 * @param {import("@lezer/common").SyntaxNode} closeNode
 * @param {string} docText
 * @returns {import("@lezer/common").SyntaxNode | null}
 */
function findMatchingMdxOpen(closeNode, docText) {
  const closeTag = getMdxTagName(closeNode, docText).toLowerCase();
  let depth = 0;
  let sibling = closeNode.prevSibling;
  while (sibling) {
    if (sibling.name === "MdxContainerClose") {
      if (getMdxTagName(sibling, docText).toLowerCase() === closeTag) depth++;
    } else if (sibling.name === "MdxContainerOpen") {
      if (getMdxTagName(sibling, docText).toLowerCase() === closeTag) {
        if (depth === 0) return sibling;
        depth--;
      }
    }
    sibling = sibling.prevSibling;
  }
  return null;
}

/** @param {Record<string, string>} attrs */
function renderQuoteCiteHtml(attrs) {
  const author = attrs.author || "";
  const source = attrs.source || "";
  if (!author && !source) return "";
  let citeText = "— ";
  if (author && source) citeText += `${author}, ${source}`;
  else citeText += author || source;
  return `<cite>${escapeHtml(citeText)}</cite>\n`;
}

/**
 * @param {import("@lezer/common").SyntaxNode} node
 * @param {string} docText
 */
function getMdxTagName(node, docText) {
  const direct = node.getChild("MdxTagName");
  if (direct) return docText.slice(direct.from, direct.to);
  const open = node.getChild("MdxContainerOpen");
  if (open) {
    const nested = open.getChild("MdxTagName");
    if (nested) return docText.slice(nested.from, nested.to);
  }
  return "";
}

/**
 * @param {string} tagName
 * @param {Record<string, string>} attrs
 */
function resolveCompName(tagName, attrs) {
  const tag = (tagName || "").toLowerCase();
  if (attrs.name) return attrs.name === "quote" ? "blockquote" : attrs.name;
  if (tag === "quote" || tag === "blockquote") return "blockquote";
  if (tag === "pullquote") return "pullquote";
  if (tag === "callout") return attrs.type || "info";
  if (tag === "highlight") return "highlight";
  return tag || "blockquote";
}

/** @param {Record<string, string>} attrs */
function renderImageHtml(attrs) {
  const src = escapeHtmlAttr(sanitizeUrl(attrs.src || ""));
  const caption = escapeHtml(attrs.caption || "");
  const alt = escapeHtmlAttr(attrs.alt || attrs.caption || "");
  const align = escapeHtmlAttr(attrs.align || "center");
  const size = escapeHtmlAttr(attrs.size || "medium");
  const customClass = attrs.class ? ` ${escapeHtmlAttr(attrs.class)}` : "";

  if (caption) {
    return `<figure class="traven-image-figure align-${align} size-${size}${customClass}"><img src="${src}" alt="${alt}" class="traven-image"><figcaption class="traven-image-caption">${caption}</figcaption></figure>\n`;
  }
  return `<img src="${src}" alt="${alt}" class="traven-image align-${align} size-${size}${customClass}">\n`;
}

/** @param {Record<string, string>} attrs */
function renderVideoHtml(attrs) {
  const src = escapeHtmlAttr(sanitizeUrl(attrs.src || ""));
  const caption = escapeHtml(attrs.caption || "");
  const align = escapeHtmlAttr(attrs.align || "center");
  const size = escapeHtmlAttr(attrs.size || "medium");
  const customClass = attrs.class ? ` ${escapeHtmlAttr(attrs.class)}` : "";

  const parsed = parseVideoUrl(src);
  let videoHtml = "";
  if (parsed.platform === "youtube") {
    videoHtml = `<iframe src="https://www.youtube.com/embed/${parsed.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (parsed.platform === "vimeo") {
    videoHtml = `<iframe src="https://player.vimeo.com/video/${parsed.id}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    videoHtml = `<video src="${src}" controls class="traven-video"></video>`;
  }

  if (caption) {
    return `<figure class="traven-video-figure align-${align} size-${size}${customClass}"><div class="traven-video-container">${videoHtml}</div><figcaption class="traven-video-caption">${caption}</figcaption></figure>\n`;
  }
  return `<div class="traven-video-container align-${align} size-${size}${customClass}">${videoHtml}</div>\n`;
}

/** @param {Record<string, string>} attrs */
function renderAudioHtml(attrs) {
  const src = escapeHtmlAttr(sanitizeUrl(attrs.src || ""));
  const caption = escapeHtml(attrs.caption || "");
  const align = escapeHtmlAttr(attrs.align || "center");
  const size = escapeHtmlAttr(attrs.size || "medium");
  const customClass = attrs.class ? ` ${escapeHtmlAttr(attrs.class)}` : "";
  const audioHtml = `<audio src="${src}" controls class="traven-audio"></audio>`;

  if (caption) {
    return `<figure class="traven-audio-figure align-${align} size-${size}${customClass}"><div class="traven-audio-container">${audioHtml}</div><figcaption class="traven-audio-caption">${caption}</figcaption></figure>\n`;
  }
  return `<div class="traven-audio-container align-${align} size-${size}${customClass}">${audioHtml}</div>\n`;
}

/**
 * @param {string} tagName
 * @param {Record<string, string>} attrs
 * @param {string} bodyText
 */
function renderComponentHtml(tagName, attrs, bodyText) {
  const compName = resolveCompName(tagName, attrs);
  const contentLines = bodyText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  let bodyHtml = `<div class="component-body">\n`;
  contentLines.forEach(line => {
    bodyHtml += `<p>${renderInlineMarkdown(line)}</p>\n`;
  });
  bodyHtml += `</div>\n`;

  if (compName === "blockquote") {
    let html = `<blockquote class="traven-component-blockquote">\n${bodyHtml}`;
    html += renderQuoteCiteHtml(attrs);
    html += `</blockquote>\n`;
    return html;
  }
  if (compName === "pullquote") {
    return `<blockquote class="traven-component-pullquote">\n${bodyHtml}</blockquote>\n`;
  }
  if (compName === "highlight") {
    const markHtml = renderInlineMarkdown(bodyText.trim().replace(/\r?\n/g, "<br>"));
    return `<mark>${markHtml}</mark>`;
  }

  let html = `<div class="traven-component traven-component-${compName}">\n`;
  const title = attrs.title || "";
  const collapsible = attrs.collapsible === "true";
  const displayTitle = title || (collapsible ? (compName.charAt(0).toUpperCase() + compName.slice(1)) : "");

  if (collapsible) {
    html += `<details open>\n<summary class="component-header"><span class="component-title">${escapeHtml(displayTitle)}</span><span class="component-toggle-icon"></span></summary>\n${bodyHtml}</details>\n`;
  } else {
    if (displayTitle) {
      html += `<div class="component-header"><span class="component-title">${escapeHtml(displayTitle)}</span></div>\n`;
    }
    html += bodyHtml;
  }
  html += `</div>\n`;
  return html;
}
