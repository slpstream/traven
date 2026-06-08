/**
 * Sanitizes a URL to prevent javascript: or other dangerous protocol injections.
 * Allows safe protocols (http, https, mailto, tel), relative paths, hash anchors, and blog slugs.
 * @param {string} url
 * @returns {string}
 */
export function sanitizeUrl(url: string): string;
/**
 * Parses a video URL to detect if it is YouTube, Vimeo, or a direct video file.
 * @param {string} src
 * @returns {{platform: "youtube" | "vimeo" | "native" | "unknown", id: string|null}}
 */
export function parseVideoUrl(src: string): {
    platform: "youtube" | "vimeo" | "native" | "unknown";
    id: string | null;
};
