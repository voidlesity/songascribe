<template>
  <div class="avatar shrink-0">
    <div class="rounded-md" :class="sizeClass">
      <img v-if="src" :src="src" :alt="alt" class="object-cover" />
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
import type { Track } from "~/composables/useTrackSearch";

const props = withDefaults(
  defineProps<{
    track?: Track | null;
    artworkUrl?: string | null;
    title?: string;
    size?: "sm" | "md";
  }>(),
  { track: null, artworkUrl: null, title: "", size: "md" },
);

const sizes = { sm: "w-9 h-9", md: "w-12 h-12" };
const sizeClass = computed(() => sizes[props.size]);

const src = computed(() => props.artworkUrl ?? props.track?.artworkUrl ?? null);
const alt = computed(() => props.title ?? props.track?.title ?? "");
</script>
