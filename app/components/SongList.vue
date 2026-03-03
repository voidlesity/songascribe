<template>
  <div class="space-y-1.5">
    <div
      v-for="(song, index) in songs"
      :key="song.encoded || index"
      class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 transition-colors group cursor-pointer"
      :class="{
        'bg-primary/10': isCurrentSong(song) && isPlaying,
      }"
      @click="onSongClick(song, index)"
    >
      <!-- Album Art with Play Overlay -->
      <div class="relative shrink-0">
        <div class="avatar">
          <div class="w-10 h-10 rounded-lg">
            <img
              v-if="song.info?.artworkUrl"
              :src="song.info.artworkUrl"
              :alt="song.info?.title"
              class="object-cover"
            />
            <div
              v-else
              class="bg-base-300 w-full h-full flex items-center justify-center"
            >
              <Icon name="ic:round-library-music" size="1.2rem" />
            </div>
          </div>
        </div>
        <!-- Play/Pause overlay -->
        <div
          class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          :class="{ 'opacity-100': isCurrentSong(song) && isPlaying }"
        >
          <Icon
            v-if="isCurrentSong(song) && isPlaying"
            name="ic:round-graphic-eq"
            size="1.2rem"
            class="text-primary"
          />
          <Icon
            v-else
            name="ic:round-play-arrow"
            size="1.2rem"
            class="text-white"
          />
        </div>
      </div>

      <!-- Song Info -->
      <div class="flex-1 min-w-0">
        <div
          class="font-medium text-sm truncate"
          :class="{ 'text-primary': isCurrentSong(song) }"
        >
          {{ song.info?.title || "Unknown track" }}
        </div>
        <div class="text-xs opacity-60 truncate">
          {{ song.info?.author || "Unknown artist" }}
        </div>
      </div>

      <!-- Duration -->
      <div class="text-xs opacity-50 shrink-0 hidden sm:block">
        {{ formatDuration(song.info?.length) }}
      </div>

      <!-- External Link -->
      <a
        v-if="song.info?.uri"
        :href="song.info.uri"
        target="_blank"
        class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-70 shrink-0"
        title="Open in source"
        @click.stop
      >
        <Icon name="ic:round-open-in-new" size="0.875rem" />
      </a>
    </div>

    <!-- Empty State -->
    <div v-if="songs.length === 0" class="text-center py-4 opacity-50 text-sm">
      No songs added yet
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  songs: {
    type: Array,
    required: true,
    default: () => [],
  },
  itemName: {
    type: String,
    default: "",
  },
});

const { isPlaying, isCurrentSong, playSong, playMultiple } = usePlayerStore();

function onSongClick(song, index) {
  if (props.songs.length > 1) {
    playMultiple(props.songs, props.itemName, index);
  } else {
    playSong(song, props.itemName);
  }
}

function formatDuration(lengthMs) {
  if (!lengthMs || isNaN(lengthMs)) return "";
  const totalSeconds = Math.floor(lengthMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
</script>
