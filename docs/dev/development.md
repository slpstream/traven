# Development

This page covers the development workflow for compiling, building, testing, and running Traven Editor locally.

## Development Tasks

Install development packages to test and build modifications:

```bash
# Install bundler dependencies
npm install

# Run bundling build (produces dist/traven.js and dist/traven.css)
npm run build

# Run tests
npm run test

# Start esbuild watch mode for live development
npm run watch
```

## Running the Demos

To view the included integration demos, serve the project files on a local PHP-capable server (e.g. `php -S localhost:8000`).

## CDN Development Version (`@main`)

For quickly testing changes, prototyping, or sharing intermediate progress without building or hosting files locally, you can load the code directly from the `main` branch:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/slpstream/traven@main/dist/traven.js"></script>
```

> [!WARNING]
> The `@main` branch target is for contributors and development environments only. Because it points directly to the latest commits, a bad push could break the editor experience. Never use `@main` in production deployments or user-facing Quick Starts.

