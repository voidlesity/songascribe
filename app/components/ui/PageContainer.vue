<template>
  <div class="w-full mx-auto p-4 md:p-6" :class="widthClass">
    <header v-if="title || $slots.header" class="mb-4">
      <slot name="header">
        <h1 class="text-2xl font-semibold">{{ title }}</h1>
        <p v-if="description" class="text-sm opacity-60">{{ description }}</p>
      </slot>
    </header>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    width?: "narrow" | "default" | "wide";
  }>(),
  { title: "", description: "", width: "default" },
);

const widthClass = computed(() =>
  props.width === "narrow"
    ? "max-w-3xl"
    : props.width === "wide"
      ? "max-w-6xl"
      : "max-w-5xl",
);
</script>
