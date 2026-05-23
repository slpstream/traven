# Privacy & Telemetry Policy

Traven is designed with a strict, privacy-first philosophy.

* **No Telemetry:** Traven does not phone home, collect usage statistics, or log any user data.
* **No Analytics:** There are no tracking scripts, no Google Analytics, and no marketing pixels included in the library.
* **No Cookies:** Traven does not set, read, or require any cookies.

By default, the core editor theme (`skin-default.css`) loads absolutely nothing from external servers and works out-of-the-box using standard system fonts. Some alternative themes (like `skin-colorful.css`) or the pre-built distribution bundle (`dist/traven.css`) may include a default `@import` rule fetching accessible typography from the Google Fonts CDN for ease of deployment.

---

## Going 100% Offline (Self-Hosting Fonts)

If you are deploying Traven in a strictly firewalled, offline, or high-privacy environment, but still want to use alternative themes which use external fonts, you can easily disable the calls to Google Fonts.

For demo themes like the sample `skin-colorful.css`, all the required font files are already included in the Traven repository. Follow these simple steps to make your editor completely self-contained:

### Step 1: Copy the Font Folder
Copy the **`assets/fonts/`** folder (which contains both the raw font files and the `fonts.css` configuration file) from the Traven project into your own website or application's public assets folder.

### Step 2: Load the Fonts in Your HTML
In the `<head>` of your website or app pages where the editor is used, load your local `fonts.css`:
```html
<link rel="stylesheet" href="path/to/your/assets/fonts/fonts.css">
```

### Step 3: Tell the Editor to Use Your Local Fonts
If you are using a theme or pre-built stylesheet that fetches fonts from the internet:
1. Open the stylesheet file (e.g., **`dist/traven.css`** or the active theme's `.css` file).
2. Remove or comment out the very first line starting with `@import`:
   ```css
   /* Delete or comment out this line: */
   @import "https://fonts.googleapis.com/...";
   ```
3. Save the file.

Now, Traven will render using your locally hosted font files, and no external calls will be made to Google Fonts.

---

## Why Google Fonts?

Google Fonts loading is **disabled** by default. If you use Traven with its standard skin, no Google Fonts are loaded and no connections will be made to Google servers at any time.

For secondary or alternative skins, external CDN imports are used to prioritize **ease of deployment and testing**. It allows developers to quickly preview different design aesthetics (like the Colorful theme) without needing to configure server assets or copy local binary files beforehand. 

However, because these settings are contained entirely within modular CSS theme files, they are completely customizable. You can easily switch to a fully offline setup at any time by copying the preloaded font files and updating the theme's import rule as described above.

---

## Sample themes

Traven supports customizable layout skins. Each skin handles asset loading depending on developer preferences:

### Default Skin (`skin-default.css`)
This is the default theme skin.
* **No Network Footprint:** It does not link or import any external fonts or styles.
* **Fallback Behavior:** It uses your local system font stack by default (rendering `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` for the body, and `monospace` for code blocks).
* **Self-Hosting Option:** You can still load custom self-hosted fonts alongside this theme by manually linking `assets/fonts/fonts.css` in your HTML.

### Colorful Skin (`skin-colorful.css`)
This is a sample alternative theme skin.
* **Default Behavior:** It imports Atkinson Hyperlegible Next and Fira Code from the Google Fonts CDN for quick visual polish out-of-the-box.
* **Self-Hosting Option:** To make this theme 100% offline-ready, change the Google Fonts import at the top of `skin-colorful.css` to import your local stylesheet instead:
  ```css
  @import url('../fonts/fonts.css');
  ```

### Dark Skin (`skin-dark.css`)
This is a premium dark theme skin.
* **No Network Footprint:** It does not link or import any external fonts or styles.
* **Fallback Behavior:** It uses your local system font stack by default (rendering `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` for the body, and `monospace` for code blocks).
* **Self-Hosting Option:** You can still load custom self-hosted fonts alongside this theme by manually linking `assets/fonts/fonts.css` in your HTML.
