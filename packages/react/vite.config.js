import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'import.meta': '{}'
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.jsx'),
      name: 'TravenReact',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'traven'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          traven: 'Traven'
        }
      }
    }
  }
});
