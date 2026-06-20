// @ts-check
import { escapeHtml, escapeHtmlAttr } from "./TravenRenderer.js";
import { sanitizeUrl, parseVideoUrl } from "../security.js";
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
    case "Blockquote":
      return `<blockquote>\n${childrenHtml}</blockquote>\n`;
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
      
      let startIdx = docText.indexOf("[", node.from) + 1;
      let endIdx = docText.indexOf("](", startIdx);
      const alt = escapeHtmlAttr(docText.slice(startIdx, endIdx));

      return `<img src="${escapeHtmlAttr(sanitizeUrl(url))}" alt="${alt}" class="traven-image-shortcode align-center size-medium">`;
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
    
    // Shortcodes
    case "ImageShortcode": {
      const attrs = parseShortcodeAttrs(docText.slice(node.from, node.to));
      const src = escapeHtmlAttr(sanitizeUrl(attrs.src || ""));
      const caption = escapeHtml(attrs.caption || "");
      const alt = escapeHtmlAttr(attrs.alt || attrs.caption || "");
      const align = escapeHtmlAttr(attrs.align || "center");
      const size = escapeHtmlAttr(attrs.size || "medium");
      const customClass = attrs.class ? ` ${escapeHtmlAttr(attrs.class)}` : "";

      if (caption) {
        return `<figure class="traven-image-figure align-${align} size-${size}${customClass}"><img src="${src}" alt="${alt}" class="traven-image-shortcode"><figcaption class="traven-image-caption">${caption}</figcaption></figure>\n`;
      } else {
        return `<img src="${src}" alt="${alt}" class="traven-image-shortcode align-${align} size-${size}${customClass}">\n`;
      }
    }
    case "VideoShortcode": {
      const attrs = parseShortcodeAttrs(docText.slice(node.from, node.to));
      const src = escapeHtmlAttr(sanitizeUrl(attrs.src || ""));
      const caption = escapeHtml(attrs.caption || "");
      const align = escapeHtmlAttr(attrs.align || "center");
      const size = escapeHtmlAttr(attrs.size || "medium");
      const customClass = attrs.class ? ` ${escapeHtmlAttr(attrs.class)}` : "";
      
      const tagNameChild = node.getChild("VideoShortcodeTagName");
      const tagName = tagNameChild ? docText.slice(tagNameChild.from, tagNameChild.to).toLowerCase() : "video";
      
      let parsed = parseVideoUrl(src);
      
      if (parsed.platform === "unknown" && tagName === "youtube") {
        parsed = { platform: "youtube", id: src };
      } else if (parsed.platform === "unknown" && tagName === "vimeo") {
        parsed = { platform: "vimeo", id: src };
      }

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
    case "AudioShortcode": {
      const attrs = parseShortcodeAttrs(docText.slice(node.from, node.to));
      const src = escapeHtmlAttr(sanitizeUrl(attrs.src || ""));
      const caption = escapeHtml(attrs.caption || "");
      const align = escapeHtmlAttr(attrs.align || "center");
      const size = escapeHtmlAttr(attrs.size || "medium");
      const customClass = attrs.class ? ` ${escapeHtmlAttr(attrs.class)}` : "";
      
      const audioHtml = `<audio src="${src}" controls class="traven-audio-shortcode"></audio>`;
      
      if (caption) {
        return `<figure class="traven-audio-figure align-${align} size-${size}${customClass}"><div class="traven-audio-container">${audioHtml}</div><figcaption class="traven-audio-caption">${caption}</figcaption></figure>\n`;
      } else {
        return `<div class="traven-audio-container align-${align} size-${size}${customClass}">${audioHtml}</div>\n`;
      }
    }
    case "ComponentShortcode": {
      const openNode = node.getChild("ComponentShortcodeOpen");
      const bodyNode = node.getChild("ComponentShortcodeBody");
      
      const openRaw = openNode ? docText.slice(openNode.from, openNode.to) : "";
      const attrs = parseShortcodeAttrs(openRaw);
      
      const tagNameChild = openNode ? openNode.getChild("ComponentShortcodeTagName") : null;
      const tagName = tagNameChild ? docText.slice(tagNameChild.from, tagNameChild.to).toLowerCase() : "";
      
      let compName = attrs.name || "";
      if (!compName) {
        if (tagName === "quote" || tagName === "blockquote") {
          compName = "blockquote";
        } else if (tagName === "pullquote") {
          compName = "pullquote";
        } else {
          compName = tagName || "blockquote";
        }
      }
      if (compName === "quote") {
        compName = "blockquote";
      }

      const bodyText = bodyNode ? docText.slice(bodyNode.from, bodyNode.to) : "";
      const contentLines = bodyText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      let bodyHtml = `<div class="component-body">\n`;
      contentLines.forEach(line => {
        bodyHtml += `<p>${renderInlineMarkdown(line)}</p>\n`;
      });
      bodyHtml += `</div>\n`;

      let html = "";
      
      if (compName === "blockquote") {
        html += `<blockquote class="traven-component-blockquote">\n${bodyHtml}`;
        const author = attrs.author || "";
        const source = attrs.source || "";
        if (author || source) {
          let citeText = "— ";
          if (author && source) { citeText += `${author}, ${source}`; }
          else { citeText += author || source; }
          html += `<cite>${escapeHtml(citeText)}</cite>\n`;
        }
        html += `</blockquote>\n`;
      } else if (compName === "pullquote") {
        html += `<blockquote class="traven-component-pullquote">\n${bodyHtml}</blockquote>\n`;
      } else if (compName === "highlight") {
        let markHtml = renderInlineMarkdown(bodyText.trim().replace(/\r?\n/g, "<br>"));
        return `<mark>${markHtml}</mark>`;
      } else {
        html += `<div class="traven-component traven-component-${compName}">\n`;
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
      }
      return html;
    }
    case "FigureShortcode": {
      return `<figure class="traven-figure-shortcode align-center">\n${childrenHtml}</figure>\n`;
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

function parseShortcodeAttrs(raw) {
  /** @type {Record<string, string>} */
  const attrs = {};
  // The regex uses a lookahead to allow unescaped (and escaped) quotes inside the attribute values,
  // matched lazily up to the next attribute definition key="..." or the shortcode end bracket ].
  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([\s\S]*?)"(?=\s+[a-zA-Z0-9_-]+\s*=|\s*\])|'([\s\S]*?)'(?=\s+[a-zA-Z0-9_-]+\s*=|\s*\])|([^\s\]]+))/g;
  let m;
  while ((m = attrRegex.exec(raw)) !== null) {
    let val = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] || "";
    // Unescape backslash-escaped quotes if present
    val = val.replace(/\\"/g, '"').replace(/\\'/g, "'");
    attrs[m[1]] = val;
  }
  return attrs;
}
