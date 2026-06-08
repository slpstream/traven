<!-- packages/svelte/src/Traven.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { TravenEditor } from 'traven';

  export let defaultValue = '';
  export let options = {};
  export let onChange = undefined;

  let container;
  let editorInstance;

  export const getValue = () => editorInstance?.getValue() || '';
  export const getInstance = () => editorInstance;

  onMount(() => {
    editorInstance = new TravenEditor({
      element: container,
      initialValue: defaultValue,
      onChange: (newVal) => {
        if (onChange) onChange(newVal);
      },
      ...options
    });
  });

  onDestroy(() => {
    if (editorInstance && typeof editorInstance.destroy === 'function') {
      editorInstance.destroy();
    }
  });
</script>

<div bind:this={container} class="traven-svelte-wrapper"></div>
