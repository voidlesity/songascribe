<template>
  <div class="flex items-center gap-2 min-w-0 flex-1 md:w-1/3 md:flex-none">
    <TrackArt :track="song" size="sm" />
    <div class="min-w-0 flex-1">
      <div class="font-medium text-sm truncate">
        {{ song.title || "Nothing playing" }}
      </div>
      <div class="text-xs opacity-60 truncate">
        {{ song.author || "Unknown" }}
      </div>
    </div>
    <a
      v-if="song.uri"
      :href="song.uri"
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-ghost btn-xs btn-square hidden sm:inline-flex"
      title="Open source"
      aria-label="Open track source"
    >
      <Icon name="mdi:open-in-new" />
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  song: Track;
}>();
</script>
