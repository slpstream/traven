// @ts-check
/**
 * Sanitizes a URL to prevent javascript: or other dangerous protocol injections.
 * Allows safe protocols (http, https, mailto, tel), relative paths, hash anchors, and blog slugs.
 * @param {string} url
 * @returns {string}
 */
export function sanitizeUrl(url) {
  if (!url) return "";

  let decoded = url;

  // 1. Decode HTML entities (in case of obfuscation like j&#97;vascript:)
  if (typeof document !== "undefined") {
    const tempEl = document.createElement("textarea");
    tempEl.innerHTML = url;
    decoded = tempEl.value;
  }

  // 2. Decode percent-encoding (up to 3 passes for nested percent encoding)
  let prevDecoded = "";
  let iterations = 0;
  while (decoded !== prevDecoded && iterations < 3) {
    prevDecoded = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch (e) {
      break;
    }
    iterations++;
  }

  // 3. Strip whitespace, control characters, and invisible formatting characters
  const normalized = decoded
    .replace(/[\s\x00-\x1F\x7F-\x9F\u2000-\u200D\uFEFF]/g, "")
    .toLowerCase();

  // 4. Block dangerous protocols
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:")
  ) {
    return "about:blank";
  }

  return url;
}

/**
 * Parses a video URL to detect if it is YouTube, Vimeo, or a direct video file.
 * @param {string} src
 * @returns {{platform: "youtube" | "vimeo" | "native" | "unknown", id: string|null}}
 */
export function parseVideoUrl(src) {
  if (!src) return { platform: "unknown", id: null };

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/v/ID
  const ytMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { platform: "youtube", id: ytMatch[1] };

  // Vimeo: vimeo.com/ID, player.vimeo.com/video/ID
  const vimeoMatch = src.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return { platform: "vimeo", id: vimeoMatch[1] };

  // Direct video file extensions: .mp4, .webm, .ogg
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(src)) return { platform: "native", id: null };

  return { platform: "unknown", id: null };
}

