<template>
  <CatalogAddToItemDialog :track="track" @close="emit('close')" @added="emit('added')" />
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

defineProps<{ track: Track | null }>();
const emit = defineEmits<{ close: []; added: [] }>();
</script>
