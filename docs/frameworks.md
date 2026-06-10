# Using Traven with Frontend Frameworks

Traven is framework-agnostic by design, but comes with wrappers for React, Vue, and Svelte to make integration seamless. These wrappers provide native component APIs while ensuring the core editor remains zero-dependency.

Developers can just run `npm install @freedomware/traven-react` and drop the editor right into their apps. 

Meanwhile, anyone using raw HTML or PHP can just paste a single `cdn.jsdelivr.net` `<script>` tag from Traven's README into their code, and it will effortlessly pull the exact same core bundle.

## React 

#### `@freedomware/traven-react`

The React wrapper provides a `Traven` component that integrates smoothly with React's lifecycle and handles Strict Mode cleanly.

### Installation

```bash
npm install @freedomware/traven-react @freedomware/traven
```

### Usage

The wrapper is implemented as an **uncontrolled component**. Use `defaultValue` for the initial content to prevent cursor jumping issues common with uncontrolled WYSIWYM editors. Use a `ref` to interact with the underlying editor instance.

```jsx
import React, { useRef } from 'react';
import { Traven } from '@freedomware/traven-react';

// Optional: Import core Traven CSS
import '@freedomware/traven/assets/skins/skin-starter.css';

export default function App() {
  const editorRef = useRef(null);

  const handleSubmit = () => {
    // Access the current markdown content via ref
    const markdown = editorRef.current.getValue();
    console.log("Submitted content:", markdown);
  };

  return (
    <div>
      <Traven
        ref={editorRef}
        defaultValue="# Hello World\n\nStart typing..."
        onChange={(val) => console.log("Content changed:", val)}
        options={{
          theme: 'light',
          toolbarMode: 'floating'
        }}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

## Vue 

#### `@freedomware/traven-vue`

The Vue wrapper provides a standard component that integrates cleanly with the Vue 3 Composition API.

### Installation

```bash
npm install @freedomware/traven-vue @freedomware/traven
```

### Usage

Similar to React, the Vue wrapper is uncontrolled. You pass a `defaultValue` and listen to the `@change` event, or use a template ref to access the editor instance.

```vue
<template>
  <div>
    <Traven 
      ref="editor"
      :defaultValue="initialContent"
      :options="editorOptions"
      @change="handleUpdate"
    />
    <button @click="save">Save</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Traven } from '@freedomware/traven-vue';
import '@freedomware/traven/assets/skins/skin-starter.css';

const editor = ref(null);
const initialContent = '# Hello Vue\n\nStart typing...';

const editorOptions = {
  theme: 'light',
  toolbarMode: 'floating'
};

function handleUpdate(val) {
  console.log('Typing...', val);
}

function save() {
  // Access current content on demand
  const markdown = editor.value.getValue();
  console.log('Saved:', markdown);
}
</script>
```

## Svelte 

#### `@freedomware/traven-svelte`

The Svelte wrapper provides a native Svelte component for rendering Traven.

### Installation

```bash
npm install @freedomware/traven-svelte @freedomware/traven
```

### Usage

Pass `defaultValue` and bind to the component instance to call `getValue()` when needed.

```svelte
<script>
  import { Traven } from '@freedomware/traven-svelte';
  import '@freedomware/traven/assets/skins/skin-starter.css';

  let editor;
  let initialContent = '# Hello Svelte\n\nStart typing...';

  function handleSubmit() {
    // Extract the latest markdown content
    const markdown = editor.getValue();
    console.log("Submit:", markdown);
  }
</script>

<div>
  <Traven
    bind:this={editor}
    defaultValue={initialContent}
    options={{ theme: 'light', toolbarMode: 'floating' }}
  />
  <button on:click={handleSubmit}>Submit</button>
</div>
```

## No Framework?

Even easier! Traven is a single-line **drop-in for PHP/Python projects**

Other editors (like Quill, TipTap, ProseMirror) all implicitly assume you are in a Node/React/Webpack world. Traven does not assume that.
 
To hit the ground running, here are some examples to cut and paste:
* [Traven working inside a Laravel Blade template](laravel-snippet.md)
* [Traven in a Django form](django-snippet.md)
* [Traven embedded in a plain PHP page](plain-php-snippet.md)

Replace a `<textarea>` with a full rich-text-editor in five seconds. One line is all it takes:
[Quick Start Guide](quickstart.md)







