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
      </div>

      <span class="hidden sm:inline text-xs opacity-50">
        {{ fmtDuration(song.lengthMs) }}
      </span>

      <a
        v-if="song.uri"
        :href="song.uri"
        target="_blank"
        class="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-70"
        @click.stop
      >
        <Icon name="mdi:open-in-new" />
      </a>
    </li>
  </ul>

  <p v-else class="text-sm opacity-50 text-center py-3">
    {{ empty ?? "No songs yet" }}
  </p>
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

const props = defineProps<{
  songs: Track[];
  itemName?: string;
  empty?: string;
}>();

const { isPlaying, isCurrentSong, playSong, playMultiple } = usePlayerStore();

function play(song: Track, index: number) {
  if (props.songs.length > 1) {
    playMultiple(props.songs, props.itemName, index);
  } else {
    playSong(song, props.itemName);
  }
}

function fmtDuration(ms?: number) {
  if (!ms || !Number.isFinite(ms)) return "";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
</script>
