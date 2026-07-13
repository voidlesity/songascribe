<template>
  <button
    type="button"
    class="btn btn-ghost btn-sm btn-square relative"
    :class="{ 'text-primary': open }"
    :aria-expanded="open"
    aria-controls="player-queue-panel"
    title="Toggle queue"
    aria-label="Toggle queue"
    @click="$emit('toggle')"
  >
    <Icon name="mdi:playlist-music" />
    <span
      v-if="count > 0"
      class="badge badge-primary badge-xs absolute -top-0.5 -right-0.5"
    >
      {{ count }}
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
  open: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>
