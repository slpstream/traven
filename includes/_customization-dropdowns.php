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
$skins_dir = $base_dir . "/assets/skins";
$toolbars_dir = $base_dir . "/assets/toolbars";

// Discover skins
$skins = [];
if (is_dir($skins_dir)) {
    $files = glob($skins_dir . "/*.css");
    if ($files) {
        foreach ($files as $file) {
            $val = pathinfo($file, PATHINFO_FILENAME);
            $label = format_customization_name($file, "skin");
            $skins[$val] = $label;
        }
        // Sort skins: skin-default first, then alphabetical
        uksort($skins, function ($a, $b) {
            if ($a === "skin-default") {
                return -1;
            }
            if ($b === "skin-default") {
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

// Fallback to defaults if glob failed or directories are empty
if (empty($skins)) {
    $skins = [
        "skin-default" => "Default Skin",
        "skin-colorful" => "Colorful Skin",
        "skin-dark" => "Dark Skin",
        "skin-editorial" => "Editorial Skin",
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
    $selected = $value === "skin-default" ? " selected" : "";
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
<select id="skin-select" class="nav-btn btn-skin-select" style="padding: 6px 12px; font-family: inherit; font-size: 0.9em; cursor: pointer; margin-right: 8px;">
' .
    $skin_options_html .
    '</select>
<select id="toolbar-select" class="nav-btn btn-toolbar-select" style="padding: 6px 12px; font-family: inherit; font-size: 0.9em; cursor: pointer; margin-right: 8px;">
' .
    $toolbar_options_html .
    '</select>
<select id="theme-select" class="nav-btn btn-theme-select" style="display: none; padding: 6px 12px; font-family: inherit; font-size: 0.9em; cursor: pointer; margin-right: 8px;">
  <option value="light">Light Editor Theme</option>
  <option value="dark">Dark Editor Theme</option>
</select>
<label class="vim-toggle-container" style="display: inline-flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.85em; font-weight: 600; color: var(--text-secondary); cursor: pointer; user-select: none; margin-right: 8px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: #fafafa; transition: all 0.2s; box-sizing: border-box; height: 35px; vertical-align: middle;">
  <span style="letter-spacing: 0.01em;">Vim Keybindings</span>
  <div class="vim-switch" style="position: relative; width: 28px; height: 16px; background-color: #cbd5e1; border-radius: 10px; transition: background-color 0.2s; flex-shrink: 0;">
    <input type="checkbox" id="vim-checkbox" style="opacity: 0; width: 0; height: 0; position: absolute; margin: 0;">
    <span class="vim-switch-handle" style="position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; background-color: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.15);"></span>
  </div>
</label>
<select id="demo-select" class="nav-btn btn-demo-select" style="padding: 6px 12px; font-family: inherit; font-size: 0.9em; cursor: pointer; margin-right: 8px;">
' .
    $demo_options_html .
    '</select>
<a href="https://github.com/slpstream/traven/tree/main/docs" target="_blank" class="nav-btn" style="margin-right: 8px;">Docs</a>
<a href="https://github.com/slpstream/traven" target="_blank" class="nav-btn">GitHub</a>
<script>
(function() {
  const skinSelect = document.getElementById("skin-select");
  const toolbarSelect = document.getElementById("toolbar-select");
  const themeSelect = document.getElementById("theme-select");
  const vimCheckbox = document.getElementById("vim-checkbox");
  const skinLink = document.getElementById("editor-skin-link");
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

  applySelection(skinSelect, skinLink, "traven-selected-skin", "assets/skins/");
  applySelection(toolbarSelect, toolbarLink, "traven-selected-toolbar", "assets/toolbars/");

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
          handle.style.transform = "translateX(12px)";
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

  document.getElementById("demo-select")?.addEventListener("change", (e) => {
    if (e.target.value) {
      window.location.href = e.target.value;
    }
  });
})();
</script>
';
