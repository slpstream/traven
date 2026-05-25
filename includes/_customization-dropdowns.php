<?php
/**
 * Traven Editor - Customization Dropdowns
 *
 * This file dynamically discovers skin and toolbar files in the assets
 * directory and generates the HTML for their selection dropdowns.
 */

if (!function_exists('format_customization_name')) {
    function format_customization_name($filename, $type) {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        $prefix = $type . '-';
        if (strpos($name, $prefix) === 0) {
            $display = substr($name, strlen($prefix));
        } else {
            $display = $name;
        }
        $display = str_replace('-', ' ', $display);
        $display = ucwords($display);
        return $display . ' ' . ucfirst($type);
    }
}

// Locate paths relative to the current file
$base_dir = dirname(__DIR__);
$skins_dir = $base_dir . '/assets/skins';
$toolbars_dir = $base_dir . '/assets/toolbars';

// Discover skins
$skins = [];
if (is_dir($skins_dir)) {
    $files = glob($skins_dir . '/*.css');
    if ($files) {
        foreach ($files as $file) {
            $val = pathinfo($file, PATHINFO_FILENAME);
            $label = format_customization_name($file, 'skin');
            $skins[$val] = $label;
        }
        // Sort skins: skin-default first, then alphabetical
        uksort($skins, function($a, $b) {
            if ($a === 'skin-default') return -1;
            if ($b === 'skin-default') return 1;
            return strcasecmp($a, $b);
        });
    }
}

// Discover toolbars
$toolbars = [];
if (is_dir($toolbars_dir)) {
    $files = glob($toolbars_dir . '/*.css');
    if ($files) {
        foreach ($files as $file) {
            $val = pathinfo($file, PATHINFO_FILENAME);
            $label = format_customization_name($file, 'toolbar');
            $toolbars[$val] = $label;
        }
        // Sort toolbars: toolbar-default first, then alphabetical
        uksort($toolbars, function($a, $b) {
            if ($a === 'toolbar-default') return -1;
            if ($b === 'toolbar-default') return 1;
            return strcasecmp($a, $b);
        });
    }
}

// Fallback to defaults if glob failed or directories are empty
if (empty($skins)) {
    $skins = [
        'skin-default' => 'Default Skin',
        'skin-colorful' => 'Colorful Skin',
        'skin-dark' => 'Dark Skin',
    ];
}
if (empty($toolbars)) {
    $toolbars = [
        'toolbar-default' => 'Default Toolbar',
    ];
}

// Generate skin options
$skin_options_html = '';
foreach ($skins as $value => $label) {
    $selected = ($value === 'skin-default') ? ' selected' : '';
    $skin_options_html .= "  <option value=\"{$value}\"{$selected}>{$label}</option>\n";
}

// Generate toolbar options
$toolbar_options_html = '';
foreach ($toolbars as $value => $label) {
    $selected = ($value === 'toolbar-default') ? ' selected' : '';
    $toolbar_options_html .= "  <option value=\"{$value}\"{$selected}>{$label}</option>\n";
}

$customization_dropdowns_html = '
<select id="skin-select" class="nav-btn btn-skin-select" style="padding: 6px 12px; font-family: inherit; font-size: 0.9em; cursor: pointer; margin-right: 8px;">
' . $skin_options_html . '</select>
<select id="toolbar-select" class="nav-btn btn-toolbar-select" style="padding: 6px 12px; font-family: inherit; font-size: 0.9em; cursor: pointer; margin-right: 8px;">
' . $toolbar_options_html . '</select>
';
