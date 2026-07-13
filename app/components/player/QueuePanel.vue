<template>
  <Transition name="slide-up">
    <div
      v-if="open"
      id="player-queue-panel"
      class="absolute bottom-full left-0 right-0 bg-base-100 border-t border-base-300 shadow-xl max-h-80 flex flex-col"
    >
      <div
        class="flex items-center justify-between px-3 py-2 border-b border-base-300"
      >
        <h3 class="font-semibold text-sm">Queue ({{ queue.length }})</h3>
        <button
          v-if="queue.length > 0"
          type="button"
          class="btn btn-ghost btn-xs"
          @click="$emit('clear')"
        >
          Clear
        </button>
      </div>
      <ul class="list overflow-y-auto flex-1">
        <li
          v-for="(item, index) in queue"
          :key="item.id"
          class="list-row cursor-pointer hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
          :class="{ 'bg-primary/10': index === currentIndex }"
          role="button"
          tabindex="0"
          :aria-current="index === currentIndex ? 'true' : undefined"
          @click="$emit('jump', index)"
          @keydown.enter.prevent="$emit('jump', index)"
          @keydown.space.prevent="$emit('jump', index)"
        >
          <div class="text-xs opacity-50 w-5 text-center">
            <Icon
              v-if="index === currentIndex && isPlaying"
              name="mdi:equalizer"
              class="text-primary"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <TrackArt
            :artwork-url="item.song.artworkUrl"
            :title="item.song.title"
            size="sm"
          />
          <div class="list-col-grow min-w-0">
            <div class="text-sm font-medium truncate">
              {{ item.song.title || "Unknown" }}
            </div>
            <div class="text-xs opacity-60 truncate">
              {{ item.song.author || "Unknown" }}
              <span v-if="item.itemName" class="opacity-50">
                · {{ item.itemName }}
              </span>
            </div>
          </div>
          <span class="text-xs opacity-50 tabular-nums">
            {{ formatTime((item.song.lengthMs || 0) / 1000) }}
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square"
            :aria-label="`Remove ${item.song.title || 'track'} from queue`"
            @click.stop="$emit('remove', index)"
            @keydown.enter.stop
            @keydown.space.stop
          >
            <Icon name="mdi:close" />
          </button>
        </li>
        <li
          v-if="queue.length === 0"
          class="text-center py-6 opacity-50 text-sm"
        >
          Queue is empty
        </li>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { PlayerQueueItem } from "~/composables/usePlayerQueue";
import { formatTime } from "~/utils/time";

defineProps<{
  open: boolean;
  queue: PlayerQueueItem[];
  currentIndex: number;
  isPlaying: boolean;
}>();

defineEmits<{
  clear: [];
  jump: [index: number];
  remove: [index: number];
}>();
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
