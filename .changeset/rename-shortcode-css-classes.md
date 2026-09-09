---
"@freedomware/traven": minor
---

Rename leftover `shortcode` CSS classes on MDX widgets and preview HTML: `.cm-wysiwym-image-container`, `.cm-wysiwym-video-container`, `.cm-wysiwym-audio-container`, `.cm-wysiwym-component`, `.cm-wysiwym-figure`, `.widget-meta`, `.traven-image`, `.traven-video`, `.traven-audio`, `.traven-figure`. Markdown `![alt](src)` still uses `.cm-wysiwym-image-widget-container`. Skin authors must update selectors; JS widget class names (`ImageShortcodeWidget`, `ShortcodePlugin`) are unchanged.
