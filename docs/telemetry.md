# Privacy & Telemetry Policy

Traven is designed with a strict, privacy-first philosophy.

* **No Telemetry:** Traven does not phone home, collect usage statistics, or log any user data.
* **No Analytics:** There are no tracking scripts, no Google Analytics, and no marketing pixels included in the library.
* **No Cookies:** Traven does not set, read, or require any cookies.

By default, the core editor skins (like `skin-light.css` and `skin-starter.css`) load absolutely nothing from external servers and work out-of-the-box using standard system fonts. Some alternative themes (like `skin-colorful.css`) or the pre-built distribution bundle (`dist/traven.css`) may include a default `@import` rule fetching accessible typography from the Google Fonts CDN for ease of deployment.

---

## Going 100% Offline (Self-Hosting Fonts)

If you are deploying Traven in a strictly firewalled, offline, or high-privacy environment, you can easily self-host fonts by providing your own font files and updating the skin's `@import` rule.

### Step 1: Create Your Own Font Files
Create a `fonts/` directory in your project with the binary font files (`.woff2`) and a stylesheet that defines `@font-face` rules for the font families your skin uses (e.g., Atkinson Hyperlegible Next, Fira Code, Mozilla Headline).

### Step 2: Load Your Local Fonts
In the `<head>` of your website or app pages where the editor is used, link your custom stylesheet:
```html
<link rel="stylesheet" href="path/to/your/fonts/fonts.css">
```

### Step 3: Update the Skin's Import Rule
Open the skin's `.css` file (e.g., `skin-light.css`, `skin-dark.css`, `skin-colorful.css`) and replace the `@import url(...Google Fonts...)` line at the top with:
```css
@import url('/path/to/your/fonts/fonts.css');
```

Now, Traven will render using your locally hosted font files, and no external calls will be made to Google Fonts.

---

## Why Google Fonts?

Google Fonts loading is **enabled by default** for `skin-light.css`, `skin-dark.css`, and `skin-colorful.css` — they import Atkinson Hyperlegible Next and Fira Code from the Google Fonts CDN via an `@import` at the top of the file. The `skin-starter.css` uses only system fonts and makes no external requests.

This default behavior prioritizes **ease of deployment and visual consistency** — developers get accessible, beautiful typography out of the box without needing to configure server assets or copy local binary files. The `skin-editorial.css` and `skin-modern.css` also import their own specialty fonts from Google Fonts.

Since these settings are contained entirely within modular CSS theme files, they are completely customizable. You can easily switch to a fully offline setup at any time by providing your own font files and updating the theme's `@import` rule as described in the "Going 100% Offline" section above.

---

## Sample themes

Traven supports customizable layout skins. Each skin handles asset loading depending on developer preferences:

### Light Skin (`skin-light.css`)
This is the light theme skin.
* **Default Behavior:** It imports Atkinson Hyperlegible Next and Fira Code from the Google Fonts CDN via an `@import` at the top of the file.
* **Self-Hosting Option:** To make this theme 100% offline-ready, replace the Google Fonts `@import` at the top of `skin-light.css` with `@import url('/path/to/your/local-fonts.css');` (and provide your own binary files).

### Colorful Skin (`skin-colorful.css`)
This is a sample alternative theme skin.
* **Default Behavior:** It imports Atkinson Hyperlegible Next and Fira Code from the Google Fonts CDN for quick visual polish out-of-the-box.
* **Self-Hosting Option:** To make this theme 100% offline-ready, replace the Google Fonts import at the top of `skin-colorful.css` with `@import url('/path/to/your/local-fonts.css');` (and provide your own binary files).

### Dark Skin (`skin-dark.css`)
This is a premium dark theme skin.
* **Default Behavior:** It imports Atkinson Hyperlegible Next and Fira Code from the Google Fonts CDN via an `@import` at the top of the file.
* **Self-Hosting Option:** To make this theme 100% offline-ready, replace the Google Fonts `@import` at the top of `skin-dark.css` with `@import url('/path/to/your/local-fonts.css');` (and provide your own binary files).

### Starter Skin (`skin-starter.css`)
This is a barebones starter theme skin.
* **No Network Footprint:** It does not link or import any external fonts or styles.
* **Fallback Behavior:** It uses your local system font stack by default (rendering Georgia/Times for the body, and system monospace for code blocks).
* **Self-Hosting Option:** To use custom fonts with this theme, provide your own font files and stylesheet (e.g., `@import url('/path/to/your/fonts/fonts.css');` at the top of `skin-starter.css` or link it in your HTML).

### Custom Skin (`skin-custom.css`)
This is a parameterized custom font theme.
* **No Network Footprint:** The CSS stylesheet itself is completely static and makes no external calls.
* **Fully Host-Configurable:** Font families are mapped using CSS variables. The hosting application has full control over how fonts are loaded (e.g., Google Fonts, self-hosted font assets, or local system fallbacks).
* **Self-Hosting / Privacy Option:** When no JavaScript overrides are present, the theme falls back to local system fonts (mirroring `skin-starter.css` behavior). Developers can configure dynamic font loaders to point directly to self-hosted assets to keep the layout 100% offline.
