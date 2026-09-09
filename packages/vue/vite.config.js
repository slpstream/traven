import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'import.meta': '{}'
  },
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'TravenVue',
      fileName: (format) => `traven-vue.${format}.js`
    },
    rollupOptions: {
      external: ['vue', '@freedomware/traven', 'traven'],
      output: {
        globals: {
          vue: 'Vue',
          '@freedomware/traven': 'Traven',
          traven: 'Traven'
        }
      }
    }
  }
});
