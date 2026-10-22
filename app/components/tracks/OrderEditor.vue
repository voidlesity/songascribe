<template>
  <div class="space-y-3">
    <div>
      <p class="text-sm font-medium mb-2">Songs</p>
      <TracksSearch placeholder="Search or paste URL…" @select="addTrack" />
    </div>

    <ul v-if="tracks.length" class="list bg-base-200 rounded-box">
      <li
        v-for="(song, index) in tracks"
        :key="`${song.encoded}:${index}`"
        class="list-row p-2 items-start gap-2"
      >
        <TrackArt :track="song" size="sm" />
        <div class="list-col-grow min-w-0 space-y-1">
          <div class="truncate text-sm font-medium">
            {{ song.title || "Unknown" }}
          </div>
          <div class="truncate text-xs opacity-60">
            {{ song.author || "Unknown artist" }}
          </div>
          <label class="input input-xs w-full">
            <Icon name="mdi:comment-text-outline" class="opacity-60" />
            <input
              :value="song.reason ?? ''"
              type="text"
              placeholder="Why this song fits this item"
              @input="updateReason(index, $event)"
            />
          </label>
        </div>
        <div class="join self-start">
          <button
            type="button"
            class="btn btn-ghost btn-xs join-item"
            :disabled="index === 0"
            :aria-label="`Move ${song.title} up`"
            @click="move(index, -1)"
          >
            <Icon name="mdi:arrow-up" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs join-item"
            :disabled="index === tracks.length - 1"
            :aria-label="`Move ${song.title} down`"
            @click="move(index, 1)"
          >
            <Icon name="mdi:arrow-down" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs join-item text-error"
            :aria-label="`Remove ${song.title}`"
            @click="removeTrack(index)"
          >
            <Icon name="mdi:close" />
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="text-sm opacity-60 text-center py-3">
      Add at least one song
    </p>
  </div>
</template>

<script setup lang="ts">
const tracks = defineModel<Track[]>({ required: true });

function addTrack(track: Track) {
  if (tracks.value.some((entry) => entry.encoded === track.encoded)) return;
  tracks.value = [...tracks.value, { ...track, reason: track.reason ?? "" }];
}

function removeTrack(index: number) {
  tracks.value = tracks.value.filter((_, trackIndex) => trackIndex !== index);
}

function updateReason(index: number, event: Event) {
  const { value } = event.target as HTMLInputElement;
  tracks.value = tracks.value.map((track, trackIndex) =>
    trackIndex === index ? { ...track, reason: value } : track,
  );
}

function move(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= tracks.value.length) return;
  const next = [...tracks.value];
  [next[index], next[target]] = [next[target]!, next[index]!];
  tracks.value = next;
}
</script>
