<template>
  <div class="flex flex-col items-center gap-0.5 md:flex-1">
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square hidden sm:inline-flex"
        :class="{ 'text-primary': shuffle }"
        :aria-pressed="shuffle"
        title="Shuffle"
        @click="$emit('toggle-shuffle')"
      >
        <Icon name="mdi:shuffle" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square"
        :disabled="!hasQueue"
        title="Previous track"
        aria-label="Previous track"
        @click="$emit('previous')"
      >
        <Icon name="mdi:skip-previous" size="1.25rem" />
      </button>
      <button
        type="button"
        class="btn btn-primary btn-sm btn-circle"
        :disabled="!hasCurrentSong"
        :title="isPlaying ? 'Pause' : 'Play'"
        :aria-label="isPlaying ? 'Pause' : 'Play'"
        @click="$emit('toggle-play')"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else-if="isPlaying" name="mdi:pause" size="1.25rem" />
        <Icon v-else name="mdi:play" size="1.25rem" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square"
        :disabled="!hasQueue"
        title="Next track"
        aria-label="Next track"
        @click="$emit('next')"
      >
        <Icon name="mdi:skip-next" size="1.25rem" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square hidden sm:inline-flex"
        :class="{
          'text-primary': repeat === 'all',
          'text-secondary': repeat === 'one',
        }"
        :title="repeatLabel"
        :aria-label="repeatLabel"
        @click="$emit('cycle-repeat')"
      >
        <Icon :name="repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat'" />
      </button>
    </div>
    <div
      class="hidden sm:flex items-center gap-1.5 text-[10px] opacity-60 tabular-nums"
      aria-live="off"
    >
      <span>{{ formatTime(currentTime) }}</span>
      <span>/</span>
      <span>{{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTime } from "~/utils/time";

const props = defineProps<{
  isPlaying: boolean;
  isLoading: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  hasQueue: boolean;
  hasCurrentSong: boolean;
  currentTime: number;
  duration: number;
}>();

defineEmits<{
  "toggle-shuffle": [];
  previous: [];
  "toggle-play": [];
  next: [];
  "cycle-repeat": [];
}>();

const repeatLabel = computed(() => {
  if (props.repeat === "all") return "Repeat all";
  if (props.repeat === "one") return "Repeat one";
  return "Repeat off";
});
</script>
