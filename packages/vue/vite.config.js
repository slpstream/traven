import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'TravenVue',
      fileName: (format) => `traven-vue.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'traven'],
      output: {
        globals: {
          vue: 'Vue',
          traven: 'Traven'
        }
      }
    }
  }
});
