<template>
  <ul v-if="songs.length" class="list">
    <li
      v-for="(song, index) in songs"
      :key="song.encoded || index"
      class="list-row p-2 rounded-md hover:bg-base-200/60 cursor-pointer group"
      :class="{ 'bg-primary/10': isCurrentSong(song) }"
      @click="play(song, index)"
    >
      <div class="relative">
        <TrackArt :track="song" size="sm" />
        <div
          class="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          :class="{ 'opacity-100': isCurrentSong(song) && isPlaying }"
        >
          <Icon
            :name="
              isCurrentSong(song) && isPlaying ? 'mdi:equalizer' : 'mdi:play'
            "
            class="text-white"
          />
        </div>
      </div>

      <div class="list-col-grow min-w-0">
        <div
          class="truncate text-sm font-medium"
          :class="{ 'text-primary': isCurrentSong(song) }"
        >
          {{ song.title || "Unknown track" }}
        </div>
        <div class="truncate text-xs opacity-60">
          {{ song.author || "Unknown artist" }}
        </div>
        <div v-if="song.reason?.trim()" class="text-xs opacity-80 mt-0.5">
          {{ song.reason }}
        </div>
      </div>

      <span class="hidden sm:inline text-xs opacity-50">
        {{ song.lengthMs ? formatTime(song.lengthMs / 1000) : "" }}
      </span>

      <div v-if="reorderable" class="join" @click.stop>
        <button
          type="button"
          class="btn btn-ghost btn-xs join-item"
          :disabled="reordering || index === 0"
          :aria-label="`Move ${song.title} up`"
          @click="emit('move', index, -1)"
        >
          <Icon name="mdi:arrow-up" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs join-item"
          :disabled="reordering || index === songs.length - 1"
          :aria-label="`Move ${song.title} down`"
          @click="emit('move', index, 1)"
        >
          <Icon name="mdi:arrow-down" />
        </button>
      </div>

      <a
        v-if="song.uri"
        :href="song.uri"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-ghost btn-xs btn-square opacity-70 sm:opacity-0 sm:group-hover:opacity-70"
        @click.stop
      >
        <Icon name="mdi:open-in-new" />
      </a>
    </li>
  </ul>

  <p v-else class="text-sm opacity-50 text-center py-3">No songs yet</p>
</template>

<script setup lang="ts">
const props = defineProps<{
  songs: Track[];
  itemName: string;
  itemId: number;
  categoryName: string;
  categoryId: number;
  reorderable?: boolean;
  reordering?: boolean;
}>();

const emit = defineEmits<{ move: [index: number, direction: -1 | 1] }>();
const { isPlaying, isCurrentSong, playSong, playMultiple } = usePlayerStore();

const contextLabel = computed(
  () => `${props.categoryName} · ${props.itemName}`,
);
const contextId = computed(
  () => `category:${props.categoryId}:item:${props.itemId}`,
);

function play(song: Track, index: number) {
  if (props.songs.length > 1) {
    playMultiple(props.songs, contextLabel.value, index, contextId.value);
  } else {
    playSong(song, contextLabel.value, contextId.value);
  }
}
</script>
