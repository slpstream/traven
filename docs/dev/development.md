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
