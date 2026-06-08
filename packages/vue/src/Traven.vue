<template>
  <div ref="container" class="traven-vue-wrapper"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { TravenEditor } from '@freedomware/traven';

const props = defineProps({
  defaultValue: { type: String, default: '' },
  options: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['change']);

const container = ref(null);
let editorInstance = null;

onMounted(() => {
  if (!container.value) return;

  editorInstance = new TravenEditor({
    element: container.value,
    initialValue: props.defaultValue,
    onChange: (value) => {
      emit('change', value);
    },
    ...props.options
  });
});

onBeforeUnmount(() => {
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    editorInstance.destroy();
  }
});

// Expose methods to parent
defineExpose({
  getValue: () => editorInstance?.getValue() || '',
  getInstance: () => editorInstance
});
</script>
