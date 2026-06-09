<?php
/**
 * Traven Editor - Customization & Demo Dropdowns
 *
 * This file dynamically discovers skin and toolbar files in the assets
 * directory, discover demo-*.php files in the root directory, and generates
 * the HTML for their selection dropdowns.
 */

if (!function_exists("format_customization_name")) {
    function format_customization_name($filename, $type)
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        $prefix = $type . "-";
        if (strpos($name, $prefix) === 0) {
            $display = substr($name, strlen($prefix));
        } else {
            $display = $name;
        }
        $display = str_replace("-", " ", $display);
        $display = ucwords($display);
        return $display . " " . ucfirst($type);
    }
}

if (!function_exists("format_demo_name")) {
    function format_demo_name($filename)
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        if (strpos($name, "demo-") === 0) {
            $display = substr($name, 5);
        } else {
            $display = $name;
        }
        $display = str_replace("-", " ", $display);
        return ucwords($display) . " Demo";
    }
}

// Locate paths relative to the current file
$base_dir = dirname(__DIR__);
$skins_dir = $base_dir . "/packages/core/assets/skins";
$toolbars_dir = $base_dir . "/packages/core/assets/toolbars";

// Discover skins
$skins = [];
if (is_dir($skins_dir)) {
    $files = glob($skins_dir . "/*.css");
    if ($files) {
        foreach ($files as $file) {
            $val = pathinfo($file, PATHINFO_FILENAME);
            if ($val === "skin-custom") {
                continue;
            }
            $label = format_customization_name($file, "skin");
            $skins[$val] = $label;
        }
        // Sort skins: skin-starter first, then alphabetical
        uksort($skins, function ($a, $b) {
            if ($a === "skin-starter") {
                return -1;
            }
            if ($b === "skin-starter") {
                return 1;
            }
            return strcasecmp($a, $b);
        });
    }
}

// Discover toolbars
$toolbars = [];
if (is_dir($toolbars_dir)) {
    $files = glob($toolbars_dir . "/*.css");
    if ($files) {
        foreach ($files as $file) {
            $val = pathinfo($file, PATHINFO_FILENAME);
            if ($val === "toolbar-floating") {
                continue;
            }
            $label = format_customization_name($file, "toolbar");
            $toolbars[$val] = $label;
        }
        // Sort toolbars: toolbar-default first, then alphabetical
        uksort($toolbars, function ($a, $b) {
            if ($a === "toolbar-default") {
                return -1;
            }
            if ($b === "toolbar-default") {
                return 1;
            }
            return strcasecmp($a, $b);
        });
    }
}

// Discover Demos dynamically
$demos = [];
$demo_files = glob($base_dir . "/demo-*.php");
if ($demo_files) {
    foreach ($demo_files as $file) {
        $val = basename($file);
        $label = format_demo_name($file);
        $demos[$val] = $label;
    }
    // Sort demos alphabetically
    asort($demos);
}

if (!function_exists("format_content_name")) {
    function format_content_name($filename)
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        if (strpos($name, "markdown-") === 0) {
            $name = substr($name, 9);
        }
        $name = str_replace("-", " ", $name);
                // Override: any standalone "php" word should be uppercase "PHP"
                $name = preg_replace_callback('/\bphp\b/i', fn() => 'PHP', $name);
                return ucwords($name);
    }
}

// Generate content options
$content_options_html = "  <option value=\"\">Page Default</option>\n";

// 1. Showcase files in docs/demo/
$demo_md_files = glob($base_dir . "/docs/demo/*.md");
if ($demo_md_files) {
    $content_options_html .= "  <optgroup label=\"Showcase Content\">\n";
    foreach ($demo_md_files as $file) {
        $val = "docs/demo/" . basename($file);
        $label = format_content_name($file);
        $content_options_html .= "    <option value=\"{$val}\">{$label}</option>\n";
    }
    $content_options_html .= "  </optgroup>\n";
}

// 2. Documentation files in docs/
$docs_md_files = glob($base_dir . "/docs/*.md");
if ($docs_md_files) {
    $content_options_html .= "  <optgroup label=\"Documentation (Dogfooding)\">\n";
    foreach ($docs_md_files as $file) {
        $val = "docs/" . basename($file);
        $label = format_content_name($file);
        $content_options_html .= "    <option value=\"{$val}\">{$label}</option>\n";
    }
    $content_options_html .= "  </optgroup>\n";
}


// Fallback to defaults if glob failed or directories are empty
if (empty($skins)) {
    $skins = [
        "skin-starter" => "Starter Skin",
        "skin-colorful" => "Colorful Skin",
        "skin-dark" => "Dark Skin",
        "skin-editorial" => "Editorial Skin",
        "skin-light" => "Light Skin",
        "skin-modern" => "Modern Skin",
    ];
}
if (empty($toolbars)) {
    $toolbars = [
        "toolbar-default" => "Default Toolbar",
    ];
}
if (empty($demos)) {
    $demos = [
        "demo-inline.php" => "Inline Demo",
        "demo-form.php" => "Form Demo",
        "demo-hybrid.php" => "Hybrid Demo",
        "demo-unified.php" => "Unified Demo",
        "demo-editorial.php" => "Editorial Demo",
    ];
}

// Generate skin options
$skin_options_html = "";
foreach ($skins as $value => $label) {
    $selected = $value === "skin-starter" ? " selected" : "";
    $skin_options_html .= "  <option value=\"{$value}\"{$selected}>{$label}</option>\n";
}

// Generate toolbar options
$toolbar_options_html = "";
foreach ($toolbars as $value => $label) {
    $selected = $value === "toolbar-default" ? " selected" : "";
    $toolbar_options_html .= "  <option value=\"{$value}\"{$selected}>{$label}</option>\n";
}

// Generate demo options
$demo_options_html = "";
$current_page = basename($_SERVER["PHP_SELF"]);
foreach ($demos as $value => $label) {
    $selected = $value === $current_page ? " selected" : "";
    $demo_options_html .= "  <option value=\"{$value}\"{$selected}>{$label}</option>\n";
}

$customization_dropdowns_html =
    '
<select id="skin-select" class="nav-btn btn-skin-select" style="padding: 5px 10px; font-family: inherit; font-size: 0.72em; cursor: pointer; margin-right: 8px;">
' .
    $skin_options_html .
    '</select>
<select id="toolbar-select" class="nav-btn btn-toolbar-select" style="padding: 5px 10px; font-family: inherit; font-size: 0.72em; cursor: pointer; margin-right: 8px;">
' .
    $toolbar_options_html .
    '</select>
<select id="theme-select" class="nav-btn btn-theme-select" style="display: none; padding: 5px 10px; font-family: inherit; font-size: 0.72em; cursor: pointer; margin-right: 8px;">
  <option value="light">Light Editor Theme</option>
  <option value="dark">Dark Editor Theme</option>
</select>
<select id="content-select" class="nav-btn btn-content-select" style="padding: 5px 10px; font-family: inherit; font-size: 0.72em; cursor: pointer; margin-right: 8px;">
' .
    $content_options_html .
    '</select>
<select id="demo-select" class="nav-btn btn-demo-select" style="padding: 5px 10px; font-family: inherit; font-size: 0.72em; cursor: pointer; margin-right: 8px;">
' .
    $demo_options_html .
    '</select>
<label class="vim-toggle-container" style="display: inline-flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.68em; font-weight: 600; color: var(--text-secondary); cursor: pointer; user-select: none; margin-right: 8px; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border-color); background-color: #fafafa; transition: all 0.2s; box-sizing: border-box; height: 28px; vertical-align: middle;">
  <span style="letter-spacing: 0.01em;">Vim</span>
  <div class="vim-switch" style="position: relative; width: 22px; height: 12px; background-color: #cbd5e1; border-radius: 10px; transition: background-color 0.2s; flex-shrink: 0;">
    <input type="checkbox" id="vim-checkbox" style="opacity: 0; width: 0; height: 0; position: absolute; margin: 0;">
    <span class="vim-switch-handle" style="position: absolute; top: 1px; left: 1px; width: 10px; height: 10px; background-color: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.15);"></span>
  </div>
</label>
<a href="https://github.com/slpstream/traven" target="_blank" class="nav-btn">GitHub</a>
<script>
(function() {
  const skinSelect = document.getElementById("skin-select");
  const toolbarSelect = document.getElementById("toolbar-select");
  const themeSelect = document.getElementById("theme-select");
  const vimCheckbox = document.getElementById("vim-checkbox");
  const toolbarLink = document.getElementById("editor-toolbar-link");

  function applySelection(selectEl, linkEl, storageKey, pathPrefix) {
    if (!selectEl) return;

    // 1. Load saved selection from LocalStorage
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue && Array.from(selectEl.options).some(opt => opt.value === savedValue)) {
      selectEl.value = savedValue;
      if (linkEl) {
        linkEl.href = pathPrefix + savedValue + ".css";
      }
    }

    // 2. Listen for changes to save and apply
    selectEl.addEventListener("change", (e) => {
      const selectedValue = e.target.value;
      localStorage.setItem(storageKey, selectedValue);
      if (linkEl) {
        linkEl.href = pathPrefix + selectedValue + ".css";
      }
    });
  }

  function applySkinSelection(selectEl, storageKey, pathPrefix) {
    if (!selectEl) return;

    function updateSkin(value) {
      let linkEl = document.getElementById("editor-skin-link");
      if (value === "skin-starter") {
        if (linkEl) {
          linkEl.remove();
        }
      } else {
        if (!linkEl) {
          linkEl = document.createElement("link");
          linkEl.id = "editor-skin-link";
          linkEl.rel = "stylesheet";

          const coreStyles = document.getElementById("traven-core-styles");
          if (coreStyles) {
            coreStyles.after(linkEl);
          } else {
            document.head.appendChild(linkEl);
          }
        }
        linkEl.href = pathPrefix + value + ".css";
      }
    }

    // 1. Load saved selection from LocalStorage
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue && Array.from(selectEl.options).some(opt => opt.value === savedValue)) {
      selectEl.value = savedValue;
      updateSkin(savedValue);
    } else {
      updateSkin(selectEl.value);
    }

    // 2. Listen for changes to save and apply
    selectEl.addEventListener("change", (e) => {
      const selectedValue = e.target.value;
      localStorage.setItem(storageKey, selectedValue);
      updateSkin(selectedValue);
    });
  }

  applySkinSelection(skinSelect, "traven-selected-skin", "packages/core/assets/skins/");
  applySelection(toolbarSelect, toolbarLink, "traven-selected-toolbar", "packages/core/assets/toolbars/");

  // Handle Theme Selection
  const savedTheme = localStorage.getItem("traven-selected-theme") || "light";
  if (themeSelect) {
    themeSelect.value = savedTheme;

    const syncPreviewTheme = (theme) => {
      const preview = document.getElementById("html-preview");
      if (preview) {
        if (theme === "dark") {
          preview.classList.add("cm-wysiwym-dark");
        } else {
          preview.classList.remove("cm-wysiwym-dark");
        }
      }
    };

    // Defer to guarantee preview element is fully in DOM
    setTimeout(() => syncPreviewTheme(savedTheme), 0);

    themeSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      localStorage.setItem("traven-selected-theme", val);
      syncPreviewTheme(val);
      if (window.editor && typeof window.editor.setTheme === "function") {
        window.editor.setTheme(val);
      }
    });
  }

  // Handle Vim Selection
  const savedVim = localStorage.getItem("traven-selected-vim") === "true";
  if (vimCheckbox) {
    vimCheckbox.checked = savedVim;

    const updateSwitchUI = (checked) => {
      const container = vimCheckbox.closest(".vim-toggle-container");
      const switchBg = container?.querySelector(".vim-switch");
      const handle = container?.querySelector(".vim-switch-handle");
      if (switchBg && handle) {
        if (checked) {
          switchBg.style.backgroundColor = "var(--accent)";
          handle.style.transform = "translateX(10px)";
        } else {
          switchBg.style.backgroundColor = "#cbd5e1";
          handle.style.transform = "translateX(0)";
        }
      }
    };

    updateSwitchUI(savedVim);

    vimCheckbox.addEventListener("change", (e) => {
      const val = e.target.checked;
      localStorage.setItem("traven-selected-vim", val ? "true" : "false");
      updateSwitchUI(val);
      if (window.editor && typeof window.editor.setVimMode === "function") {
        window.editor.setVimMode(val);
      }
    });
  }

  // Handle Content Swapping
  const contentSelect = document.getElementById("content-select");
  if (contentSelect) {
    let originalContent = null;

    contentSelect.addEventListener("change", async (e) => {
      const val = e.target.value;
      const editor = window.editor;
      const webComponentEl = document.querySelector("traven-editor");

      if (originalContent === null) {
        if (editor) {
          originalContent = editor.getValue();
        } else if (webComponentEl) {
          originalContent = webComponentEl.value;
        }
      }

      let newContent;
      if (!val) {
        newContent = originalContent;
      } else {
        try {
          const res = await fetch(val);
          if (!res.ok) throw new Error("Failed to fetch content file");
          newContent = await res.text();

          // Strip YAML frontmatter if present
          if (newContent.startsWith("---\n") || newContent.startsWith("---\r\n")) {
            const endIdx = newContent.indexOf("\n---\n", 4);
            const rEndIdx = newContent.indexOf("\r\n---\r\n", 4);
            if (endIdx !== -1) {
              newContent = newContent.substring(endIdx + 5);
            } else if (rEndIdx !== -1) {
              newContent = newContent.substring(rEndIdx + 7);
            }
          }
        } catch (err) {
          console.error(err);
          return;
        }
      }

      if (editor && typeof editor.setValue === "function") {
        editor.setValue(newContent);
      } else if (webComponentEl) {
        webComponentEl.value = newContent;
      }
    });
  }

  document.getElementById("demo-select")?.addEventListener("change", (e) => {
    if (e.target.value) {
      window.location.href = e.target.value;
    }
  });
})();
</script>
';
