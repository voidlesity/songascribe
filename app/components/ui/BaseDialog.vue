<template>
  <dialog :class="['modal', { 'modal-open': open }]" @cancel.prevent="close">
    <div class="modal-box" :class="sizeClass" role="dialog" aria-modal="true">
      <button
        v-if="dismissible"
        type="button"
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        aria-label="Close dialog"
        @click="close"
      >
        <Icon name="mdi:close" />
      </button>
      <h2 v-if="title" class="text-lg font-semibold mb-4 pr-8">{{ title }}</h2>
      <slot />
    </div>
    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button :disabled="!dismissible">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl";
    dismissible?: boolean;
  }>(),
  { title: "", size: "md", dismissible: true },
);

const emit = defineEmits<{ close: [] }>();

const sizeClass = computed(() => ({
  "max-w-md": props.size === "sm",
  "max-w-lg": props.size === "md",
  "max-w-2xl": props.size === "lg",
  "max-w-4xl": props.size === "xl",
}));

function close() {
  if (props.dismissible) emit("close");
}
</script>
