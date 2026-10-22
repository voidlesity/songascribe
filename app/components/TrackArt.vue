<template>
  <div class="avatar shrink-0">
    <div class="rounded-md" :class="sizeClass">
      <img
        v-if="track.artworkUrl"
        :src="track.artworkUrl"
        :alt="track.title"
        class="object-cover"
      />
      <div
        v-else
        class="bg-base-300 w-full h-full flex items-center justify-center"
      >
        <Icon name="mdi:music-note" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    track: Pick<Track, "artworkUrl" | "title">;
    size?: "sm" | "md";
  }>(),
  { size: "md" },
);

const sizeClass = computed(() =>
  props.size === "sm" ? "w-9 h-9" : "w-12 h-12",
);
</script>
