# Contributing to Traven

Thank you for your interest in contributing to Traven! This guide will help you get started with the development environment and contribution process.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- [npm](https://www.npmjs.com/) (comes bundled with Node.js)
- [PHP](https://www.php.net/) (for running local integration demos)
- [Git](https://git-scm.com/)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/slpstream/traven.git
cd traven

# Install dependencies
npm install

# Build the assets (dist/traven.js and dist/traven.css)
npm run build

# Start the esbuild watch mode for live development
npm run watch

# Run tests to verify the setup
npm run test
```

### Running the Demos

To view the included integration demos, serve the project files on a local PHP-capable server:

```bash
php -S localhost:8000
```

Then open `http://localhost:8000` in your web browser.

---

## Project Structure

```
traven/
├── assets/             # Theme skins, toolbars, and visual assets
│   ├── css/            # Base styling sheets
│   ├── skins/          # Theme stylesheets (skin-modern.css, skin-academic.css, etc.)
│   ├── toolbars/       # Toolbar layouts (toolbar-default.css, toolbar-expandable.css, etc.)
│   └── images/         # Icons and demo graphics
├── dist/               # Compiled bundle assets (production target files)
│   ├── traven.js       # Main compiled bundle (ES module)
│   └── traven.css      # Main compiled styles
├── docs/               # User and developer documentation
│   └── dev/            # Developer-specific guides (architecture, styling, themes)
├── src/                # Core JavaScript source code
│   ├── index.js        # Main entry point and <traven-editor> Web Component
│   ├── wysiwym.js      # Core WYSIWYM rendering and editor decoration logic
│   ├── toolbar/        # Editor toolbar controls, actions, and modals
│   │   ├── actions.js  # Editor actions and formatting commands
│   │   ├── tools.js    # Built-in toolbar tool definitions
│   │   ├── toolbar.js  # Toolbar state and layout manager
│   │   └── modal-*.js  # Modals for links, tables, images, video, etc.
│   ├── *parser.js      # Parser/compilers for shortcodes (image, video, math, etc.)
│   ├── delimiter-skip.js # CodeMirror syntax delimiter collapsing / skipping logic
│   └── style.css       # Core structural layout CSS
├── tests/              # Vitest suite for unit and integration testing
│   ├── editor.test.js  # Main editor state and synchronizer suite
│   ├── custom-element.test.js # Web component instantiation tests
│   └── floating-toolbar.test.js # Toolbar behavior and popover tests
├── package.json        # Project metadata, scripts, and dependencies
└── vitest.config.js    # Vitest testing configuration
```

### Available Scripts

- `npm run build` — Bundles the JS source and CSS with esbuild into `dist/`
- `npm run watch` — Runs esbuild in watch mode for live updates
- `npm run test` — Runs the test suite via Vitest
- `npm run test:watch` — Runs the test suite in watch mode

---

## Guidelines

### Code Style

- Write clean, modern ES6+ vanilla Javascript.
- Follow the existing code patterns and formatting conventions.
- Keep dependencies to an absolute minimum. We prioritize a zero-peer-dependency, lightweight footprint.
- All styles should be vanilla CSS, leveraging custom variables for flexibility and the theme engine.
- Avoid introducing external frontend frameworks (no Alpine, React, or Vue) inside the core library; Traven must remain framework-agnostic.

### Commits

- Write clear, descriptive commit messages.
- Use the conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `style:`, etc.
- Keep commits focused on a single logical change.

### Pull Requests

- Create a feature branch from `main`.
- Write a clear PR description explaining what changes were made and why.
- Ensure all tests pass (`npm run test`) before submitting.
- Avoid introducing breaking changes to the public API options or core custom element attributes unless thoroughly discussed.
- For UI or editor layout changes, include screenshots/GIFs demonstrating the visual results in the PR description.

---

## Architecture Decisions

- **CodeMirror 6** — Leverages a robust, highly extensible, and accessible editing engine to build a Typora-like experience.
- **Vanilla JS & CSS** — Decoupled from any frontend framework, compiling down to a single lightweight Web Component (`<traven-editor>`) that runs anywhere.
- **Shortcode System** — Standard Markdown is extended using custom shortcode blocks (`[image]`, `[video]`, `[audio]`, `[figure]`, `[component]`) for clean formatting without cluttering raw text.
- **Dynamic Theming** — Theme styles are completely separated into CSS Custom Properties (Variables) inside custom skins (such as `skin-starter.css`, `skin-modern.css`, `skin-academic.css`), allowing integrators to swap skins at runtime.
- **Delimiters Collapsing** — Leverages customized CodeMirror decoration ranges to collapse syntax markup (like `*`, `**`, `_`) when the cursor is not near, offering a clean, distraction-free WYSIWYM canvas.

---

## Need Help?

- Read the detailed guides in the `/docs` and `/docs/dev` directories.
- Open an issue or start a discussion on the [GitHub repository](https://github.com/slpstream/traven).
