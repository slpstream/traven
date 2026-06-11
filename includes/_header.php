<?php
/**
 * Traven Editor - Shared Header Component
 *
 * This file is included at the top of the demo pages.
 * It provides a consistent navigation bar and brand identity.
 */
?>



<header style="border-bottom: 5px solid var(--accent);">
  <div class="brand-section">
    <a href="index.php" style="display: flex; align-items: center; text-decoration: none;">
      <div class="logo-container">
        <?php readfile('packages/core/assets/images/traven-wordmark.svg'); ?>
      </div>
    </a>
  </div>
  <div class="nav-links">
    <?php if (isset($header_nav_html)): ?>
      <?php echo $header_nav_html; ?>
    <?php else: ?>
      <a href="http://traven.dev/docs/" class="nav-btn">Docs</a>
      <a href="https://github.com/slpstream/traven" target="_blank" class="nav-btn">GitHub</a>
    <?php endif; ?>
  </div>
</header>

<!-- Toast Notification element -->
<div id="save-toast" class="save-toast">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
  <span>Saved</span>
</div>

<script>
  (function() {
    var toastTimeout = null;
    window.showSaveToast = function() {
      var toast = document.getElementById('save-toast');
      if (toast) {
        toast.classList.add('is-show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function() {
          toast.classList.remove('is-show');
        }, 2000);
      }
    };
  })();
</script>
