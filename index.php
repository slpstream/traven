<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven — Developer Playground & Demos</title>

  <!-- Google Fonts CDN (Atkinson Hyperlegible Next, Fira Code, Mozilla Headline) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@400..700&family=Mozilla+Headline:wght@700;800;900&display=swap" rel="stylesheet">

  <style>
    :root {
      /* Light Mode Palette based on Traven CSS variables (exact match to website/index.php) */
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #d8d0c8;
      --border-strong: #0f172a;

      --text-main: #0f172a;
      --text-muted: #475569;

      --accent: #cc4a0a;
      --accent-hover: #a83808;
      --accent-glow: rgba(204, 74, 10, 0.08);

      --accent-secondary: #6aaa00;

      --transition-fast: 0.15s ease;
      --transition-normal: 0.25s ease;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Atkinson Hyperlegible Next', sans-serif;
      background-color: var(--bg);
      /* Subtle light mode ambient gradient decoration */
      background-image:
        radial-gradient(circle at 10% 20%, rgba(204, 74, 10, 0.03) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(106, 170, 0, 0.03) 0%, transparent 40%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }

    header {
      width: 100%;
      background-color: var(--card-bg);
      border-bottom: 5px solid var(--accent);
      padding: 24px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
    }

    .brand {
      display: flex;
      align-items: center;
      text-decoration: none;
    }

    .brand-logo {
      display: flex;
      align-items: center;
    }

    .brand-logo svg {
      height: 64px;
      width: auto;
      display: block;
    }

    /* Style the internal SVG path classes from traven-wordmark.svg */
    .brand-logo svg .s0 {
      fill: #64748b !important; /* Main title text in gray matching demo pages */
    }

    .brand-logo svg .s1 {
      fill: var(--bg) !important;
      /* Highlights in background color */
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .nav-link {
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-main);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      transition: color var(--transition-fast);
    }

    .nav-link:hover {
      color: var(--accent);
    }

    .github-button {
      background: #ffffff;
      color: var(--text-main);
      border: 2px solid var(--border-strong);
      padding: 8px 16px;
      border-radius: 0; /* Square corners */
      font-family: 'Mozilla Headline', sans-serif;
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      transition: border-color var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast);
    }

    .github-button:hover {
      border-color: var(--accent);
      color: var(--accent);
      background-color: var(--accent-glow);
    }

    main {
      flex: 1;
      max-width: 960px;
      width: 100%;
      margin: 0 auto;
      padding: 60px 20px 80px 20px;
      display: flex;
      flex-direction: column;
    }

    .hero {
      text-align: left;
      width: 100%;
      margin-bottom: 50px;
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 0; /* Square corners */
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(204, 74, 10, 0.06);
      color: var(--accent);
      border: 2px solid var(--accent);
      margin-bottom: 24px;
      font-family: 'Mozilla Headline', sans-serif;
    }

    .hero h1 {
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 3.2rem;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 0;
      color: var(--text-main);
    }

    .hero-divider {
      width: 80px;
      height: 4px;
      background-color: var(--border-strong);
      margin: 20px 0 24px 0;
    }

    .hero p {
      font-family: 'Atkinson Hyperlegible Next', sans-serif;
      font-size: 1.1rem;
      color: var(--text-muted);
      max-width: 640px;
      margin: 0;
      line-height: 1.55;
    }

    .section-title {
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 1.6rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 20px;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 3px solid var(--border-strong);
      padding-bottom: 12px;
      color: var(--text-main);
    }

    .section-title span {
      color: var(--accent);
    }

    /* Grid layout for demos matching website styling but with tags */
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 30px;
      width: 100%;
      margin-bottom: 60px;
    }

    .demo-card {
      background: var(--card-bg);
      border: none;
      border-left: 6px solid var(--accent);
      border-radius: 0; /* Square corners */
      padding: 35px;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
    }

    .demo-card:hover {
      border-left-color: var(--accent-hover);
      background-color: var(--accent-glow);
    }

    .card-top {
      margin-bottom: 24px;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: 0; /* Square corners */
      background: #f1f5f9;
      border: 2px solid var(--border-strong);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
    }

    .demo-card:hover .card-icon {
      color: #ffffff;
      background: var(--accent);
      border-color: var(--accent);
    }

    .demo-badge {
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 8px;
      border-radius: 0; /* Square corners */
      background: #f1f5f9;
      border: 2px solid var(--border-strong);
      color: var(--text-main);
    }

    .card-title {
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 1.4rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 12px;
      color: var(--text-main);
    }

    .card-desc {
      font-family: 'Atkinson Hyperlegible Next', sans-serif;
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .card-cta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
      transition: gap var(--transition-fast), color var(--transition-fast);
    }

    .demo-card:hover .card-cta {
      color: var(--accent-hover);
      gap: 10px;
    }

    /* Resources section */
    .resources-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      width: 100%;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      header {
        padding: 12px 10px;
      }
      .brand-logo svg {
        height: 40px;
      }
      .demo-grid {
        grid-template-columns: 1fr;
      }
      .hero h1 {
        font-size: 2.5rem;
      }
      .resources-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-card {
      background: var(--card-bg);
      border-radius: 0; /* Square corners */
      padding: 35px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
    }

    .info-card h3 {
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 1.25rem;
      margin-bottom: 16px;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .info-card h3 svg {
      color: var(--accent);
    }

    .info-card p {
      font-family: 'Atkinson Hyperlegible Next', sans-serif;
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .terminal-box {
      background: #0f172a;
      border: 2px solid var(--border-strong);
      border-radius: 0; /* Square corners */
      padding: 16px;
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      color: #34d399;
      position: relative;
      overflow-x: auto;
    }

    .terminal-box::before {
      content: '$ ';
      color: #64748b;
    }

    .doc-links {
      list-style: none;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .doc-item-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      color: var(--text-main);
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px;
      background: #ffffff;
      border: 2px solid var(--border-strong);
      border-radius: 0; /* Square corners */
      transition: border-color var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast);
    }

    .doc-item-link:hover {
      border-color: var(--accent);
      color: var(--accent);
      background-color: var(--accent-glow);
    }

    .doc-item-link svg {
      color: var(--accent);
      flex-shrink: 0;
    }

    footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
      font-family: 'Mozilla Headline', sans-serif;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-top: 5px solid var(--accent);
      background-color: #fafafa;
      width: 100%;
      margin-top: 40px;
    }

    .opensource-logo {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .opensource-logo svg {
      height: 40px;
      width: auto;
      display: block;
      opacity: 0.75;
      transition: opacity var(--transition-fast);
    }

    .opensource-logo svg:hover {
      opacity: 1;
    }
  </style>
</head>
<body>

  <header>
    <a href="index.php" class="brand">
      <div class="brand-logo">
        <?php readfile("packages/core/assets/images/traven-wordmark.svg"); ?>
      </div>
    </a>
    <div class="header-nav">
      <a href="https://github.com/slpstream/traven/tree/main/docs" class="nav-link">Docs</a>
      <a href="https://github.com/slpstream/traven" target="_blank" class="github-button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
        GitHub
      </a>
    </div>
  </header>

  <main>
    <div class="hero">
      <span class="badge">Developer Sandbox</span>
      <h1>Traven Integration Playground</h1>
      <div class="hero-divider"></div>
      <p>Use this playground to explore, test, and adapt Traven Editor's various styling, metadata management, and presentation configuration modes.</p>
    </div>


    <h2 class="section-title"><span>5</span> Customizable Demos</h2>
    <div class="demo-grid">
      <!-- Card: Unified -->
      <a href="demo-unified.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <path d="M9 21V9"></path>
              </svg>
            </div>
          </div>
          <div class="card-title">Unified Editing Demo</div>
          <div class="card-desc">WYSIWYM/Markdown editor with live HTML preview.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>

      <!-- Card: Toolbar Controls -->
      <a href="demo-toolbars.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="3" rx="1"></rect>
                <rect x="3" y="10.5" width="18" height="3" rx="1"></rect>
                <rect x="3" y="18" width="18" height="3" rx="1"></rect>
              </svg>
            </div>
          </div>
          <div class="card-title">Toolbar Controls Demo</div>
          <div class="card-desc">Toggle three toolbar formats independently.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>

      <!-- Card: Inline YAML -->
      <a href="demo-inline.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
          </div>
          <div class="card-title">Inline YAML Demo</div>
          <div class="card-desc">Bidirectional synced editing of body and frontmatter.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>

      <!-- Card: Form-Managed Metadata -->
      <a href="demo-form.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </div>
          </div>
          <div class="card-title">Form-Managed Metadata Demo</div>
          <div class="card-desc">YAML/Markdown split: form fields above, editor below.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>

      <!-- Card: Hybrid -->
      <a href="demo-hybrid.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="12" y1="9" x2="12" y2="21"></line>
              </svg>
            </div>
          </div>
          <div class="card-title">Hybrid Editing Demo</div>
          <div class="card-desc">YAML/Markdown split with bidirectional synced editing.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>
    </div>


    <h2 class="section-title"><span>2</span> Standalone Demos</h2>
    <div class="demo-grid">
      <!-- Card: Distraction-Free Write -->
      <a href="demo-editorial.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
          </div>
          <div class="card-title">Distraction-Free Write Demo</div>
          <div class="card-desc">Distraction-free writing surface with live HTML preview.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>

      <!-- Card: Dynamic Typography -->
      <a href="demo-typography.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7V4h16v3M9 20h6M12 4v16"></path>
              </svg>
            </div>
          </div>
          <div class="card-title">Dynamic Typography Demo</div>
          <div class="card-desc">Live typeface hotswapping for Display, Body, and Mono.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>
    </div>


    <h2 class="section-title"><span>3</span> Base Demos</h2>
    <div class="demo-grid">
      <!-- Card: Custom -->
      <a href="demo-custom.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </div>
          </div>
          <div class="card-title">Custom Demo</div>
          <div class="card-desc">Out-of-the-box demo: toggle toolbar, swap skins.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>

      <!-- Card: Minimal -->
      <a href="demo-minimal.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </div>
          </div>
          <div class="card-title">Minimal Demo</div>
          <div class="card-desc">Minimalist, barebones embed example.</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>

      <!-- Card: Quickstart -->
      <a href="demo-quickstart.php" class="demo-card">
        <div class="card-top">
          <div class="card-meta">
            <div class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="card-title">Quickstart Demo</div>
          <div class="card-desc">Minimum code to embed Traven (from quickstart.md).</div>
        </div>
        <div class="card-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>
    </div>



    <div class="resources-grid">
      <div class="info-card">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          Running Local Dev Server
        </h3>
        <p>PHP is required to render these demo files. Launch a lightweight, built-in development server in the repository root:</p>
        <div class="terminal-box">php -S localhost:8000</div>
      </div>

    </div>
  </main>

  <footer>
    <div class="opensource-logo">
      <?php readfile("packages/core/assets/images/opensource-light.svg"); ?>
    </div>
    <div>&copy; 2026 SLPStream / Freedomware. Open source MIT licensed.</div>
  </footer>

</body>
</html>
