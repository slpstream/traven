<?php
/**
 * Traven Editor - Shared Header Component
 *
 * This file is included at the top of the demo pages.
 * It provides a consistent navigation bar and brand identity.
 */
?>



<header>
  <div class="brand-section">
    <a href="https://traven.dev/" style="display: flex; align-items: center; text-decoration: none;">
      <div class="logo-container">
        <?php readfile('assets/images/traven-wordmark.svg'); ?>
      </div>
    </a>
  </div>
  <div class="nav-links">
    <?php if (isset($header_nav_html)): ?>
      <?php echo $header_nav_html; ?>
    <?php else: ?>
      <a href="https://github.com/slpstream/traven" target="_blank" class="nav-btn">GitHub</a>
    <?php endif; ?>
  </div>
</header>
