<template>
  <TracksSearch
    :placeholder="placeholder"
    :size="size"
    :autofocus="autofocus"
    @select="emit('select', $event)"
  />
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

withDefaults(
  defineProps<{
    placeholder?: string;
    size?: "sm" | "md" | "lg";
    autofocus?: boolean;
  }>(),
  { placeholder: "Search songs or paste a URL…", size: "md", autofocus: false },
);

const emit = defineEmits<{ select: [track: Track] }>();
</script>
