// @ts-check
import { escapeHtml } from "./TravenRenderer.js";
import { sanitizeUrl, parseVideoUrl } from "../security.js";
import { renderMermaidSync } from "../mermaid-parser.js";

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
    case "Blockquote":
      return `<blockquote>\n${childrenHtml}</blockquote>\n`;
    case "BulletList":
      return `<ul>\n${childrenHtml}</ul>\n`;
    case "OrderedList":
      return `<ol>\n${childrenHtml}</ol>\n`;
    case "ListItem":
      return `<li>${childrenHtml}</li>\n`;
    case "Task": {
      const checked = getChildText("TaskMarker") === "[x]" || getChildText("TaskMarker") === "[X]";
      return `<input type="checkbox" disabled${checked ? " checked" : ""}> `;
    }
    case "StrongEmphasis":
      return `<strong>${childrenHtml}</strong>`;
    case "Emphasis":
      return `<em>${childrenHtml}</em>`;
    case "Strikethrough":
      return `<del>${childrenHtml}</del>`;
    case "Highlight":
      return `<mark>${childrenHtml}</mark>`;
    case "InlineCode":
      return `<code>${escapeHtml(docText.slice(node.from + 1, node.to - 1))}</code>`;
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
      if (urlNode) url = docText.slice(urlNode.from, urlNode.to);
      
      const titleNode = node.getChild("LinkTitle");
      if (titleNode) title = docText.slice(titleNode.from + 1, titleNode.to - 1); // strip quotes
      
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      
      // The text content is inside the brackets, not exactly childrenHtml because childrenHtml includes the marks
      // We need just the text. Lezer markdown wraps the text inside `[...]` but it doesn't have a specific container node except its children
      // The easiest way is to let the children render and just strip the `[` and `](url)`.
      // Actually, Lezer's `Link` has `[` `]` `(` `URL` `)` etc as children.
      // We can just filter the children that are not marks.
      let linkText = "";
      let child = node.firstChild;
      while (child) {
        if (child.name !== "LinkMark" && child.name !== "URL" && child.name !== "LinkTitle") {
          // It's the text content of the link
          if (child.name) {
            // Need to recursively render it in case of bold/italic inside link
            // For now, let's just grab the text between the first `[` and `]`
          }
        }
        child = child.nextSibling;
      }
      
      // Let's do a simpler approach: extract the inner content manually
      let startIdx = docText.indexOf("[", node.from) + 1;
      let endIdx = docText.indexOf("](", startIdx);
      if (endIdx === -1) endIdx = docText.lastIndexOf("]", node.to);
      const innerText = escapeHtml(docText.slice(startIdx, endIdx));

      return `<a href="${sanitizeUrl(url)}"${titleAttr} target="_blank" rel="noopener noreferrer">${innerText}</a>`;
    }
    case "Image": {
      let url = "";
      const urlNode = node.getChild("URL");
      if (urlNode) url = docText.slice(urlNode.from, urlNode.to);
      
      let startIdx = docText.indexOf("[", node.from) + 1;
      let endIdx = docText.indexOf("](", startIdx);
      const alt = escapeHtml(docText.slice(startIdx, endIdx));

      return `<img src="${sanitizeUrl(url)}" alt="${alt}" class="traven-image-shortcode align-center size-medium">`;
    }
    case "Autolink": {
      const url = docText.slice(node.from + 1, node.to - 1);
      const href = url.startsWith("www.") ? `https://${url}` : url;
      // We also handle mailto:
      const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url);
      const finalHref = isEmail ? `mailto:${url}` : href;
      return `<a href="${sanitizeUrl(finalHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    }
    case "MathDisplay": {
      const math = docText.slice(node.from + 2, node.to - 2);
      if (typeof window !== "undefined" && window["katex"]) {
        return window["katex"].renderToString(math, { displayMode: true, throwOnError: false }) + "\n";
      }
      return `<div class="katex-display-fallback">$$${escapeHtml(math)}$$</div>\n`;
    }
    case "MathInline": {
      const math = docText.slice(node.from + 1, node.to - 1);
      if (typeof window !== "undefined" && window["katex"]) {
        return window["katex"].renderToString(math, { displayMode: false, throwOnError: false });
      }
      return `<span class="katex-inline-fallback">$${escapeHtml(math)}$</span>`;
    }
    case "Table":
      return `<table>\n${childrenHtml}</table>\n`;
    case "TableHeader":
      return `<thead>\n${childrenHtml}</thead>\n`;
    case "TableBody":
      return `<tbody>\n${childrenHtml}</tbody>\n`;
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
    
    // Shortcodes
    case "ImageShortcode": {
      const attrs = parseShortcodeAttrs(docText.slice(node.from, node.to));
      const src = sanitizeUrl(attrs.src || "");
      const caption = escapeHtml(attrs.caption || "");
      const alt = escapeHtml(attrs.alt || attrs.caption || "");
      const align = attrs.align || "center";
      const size = attrs.size || "medium";
      const customClass = attrs.class ? ` ${attrs.class}` : "";

      if (caption) {
        return `<figure class="traven-image-figure align-${align} size-${size}${customClass}"><img src="${src}" alt="${alt}" class="traven-image-shortcode"><figcaption class="traven-image-caption">${caption}</figcaption></figure>\n`;
      } else {
        return `<img src="${src}" alt="${alt}" class="traven-image-shortcode align-${align} size-${size}${customClass}">\n`;
      }
    }
    case "VideoShortcode": {
      const attrs = parseShortcodeAttrs(docText.slice(node.from, node.to));
      const src = sanitizeUrl(attrs.src || "");
      const caption = escapeHtml(attrs.caption || "");
      const align = attrs.align || "center";
      const size = attrs.size || "medium";
      const customClass = attrs.class ? ` ${attrs.class}` : "";
      
      let parsed = parseVideoUrl(src);
      // Let's assume youtube fallback logic isn't needed here for simplicity or replicate it if needed.
      let videoHtml = "";
      if (parsed.platform === "youtube") {
        videoHtml = `<iframe src="https://www.youtube.com/embed/${parsed.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else if (parsed.platform === "vimeo") {
        videoHtml = `<iframe src="https://player.vimeo.com/video/${parsed.id}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      } else {
        videoHtml = `<video src="${src}" controls class="traven-video-shortcode"></video>`;
      }

      if (caption) {
        return `<figure class="traven-video-figure align-${align} size-${size}${customClass}"><div class="traven-video-container">${videoHtml}</div><figcaption class="traven-video-caption">${caption}</figcaption></figure>\n`;
      } else {
        return `<div class="traven-video-container align-${align} size-${size}${customClass}">${videoHtml}</div>\n`;
      }
    }
    case "ComponentShortcode": {
      const raw = docText.slice(node.from, node.to);
      return `<div class="traven-component-shortcode" data-raw="${escapeHtml(raw)}"></div>\n`; // Placeholder implementation
    }
    case "FigureShortcode": {
      return `<figure class="traven-figure-shortcode align-center">\n${childrenHtml}</figure>\n`;
    }

    // Lezer structural nodes that should be ignored or fallen through
    case "HeaderMark":
    case "QuoteMark":
    case "ListMark":
    case "TaskMarker":
    case "EmphasisMark":
    case "CodeMark":
    case "CodeInfo":
    case "LinkMark":
    case "URL":
    case "LinkTitle":
    case "TableDelimiter":
      return ""; // Hide the markdown syntax markers

    default:
      // If it's an unrecognized node with no children, just output its raw text
      if (!node.firstChild) return escapeHtml(docText.slice(node.from, node.to));
      // Otherwise return its rendered children
      return childrenHtml;
  }
}

/**
 * Parses shortcode attributes from a raw shortcode string.
 * @param {string} raw 
 * @returns {Record<string, string>}
 */
function parseShortcodeAttrs(raw) {
  const attrs = {};
  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/g;
  let m;
  while ((m = attrRegex.exec(raw)) !== null) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] || "";
  }
  return attrs;
}
