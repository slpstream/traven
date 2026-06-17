<p align="center">
  <img src="https://raw.githubusercontent.com/slpstream/traven/main/packages/core/assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>Official Vue Wrapper for Traven Editor</strong><br>A rich-text Markdown editor you can drop into any Vue application.
</p>

<p align="center">
  <a href="https://github.com/slpstream/traven/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@freedomware/traven-vue"><img src="https://img.shields.io/npm/v/@freedomware/traven-vue?color=orange" alt="NPM Version"></a>
</p>

---

## Installation

```bash
npm install @freedomware/traven @freedomware/traven-vue
```

Note: `@freedomware/traven` is a peer dependency and must be installed alongside the Vue wrapper.

---

## Usage

Import the `TravenEditor` component and the required styles:

```vue
<script setup>
import { ref } from 'vue';
import { TravenEditor } from '@freedomware/traven-vue';
import '@freedomware/traven/dist/traven.css';

const content = ref('# Hello Traven');
</script>

<template>
  <div class="editor-container">
    <TravenEditor
      v-model="content"
      :toolbar="true"
      placeholder="Start writing..."
    />
  </div>
</template>
```

---

## Documentation & Support

For full customization, configuration, and options, visit the main [Traven Documentation](https://traven.dev/docs/) and [GitHub Repository](https://github.com/slpstream/traven).

## License

Open-source, licensed under the [MIT License](https://github.com/slpstream/traven/blob/main/LICENSE).
